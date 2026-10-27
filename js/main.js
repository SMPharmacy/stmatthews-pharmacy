/* ==========================================================================
   St Matthew's Pharmacy — shared behaviour
   Vanilla JS, no dependencies. Every block is defensive: a page that lacks
   a given component simply skips it, so one file serves all seven pages.
   ========================================================================== */
(function () {
  'use strict';

  var mqDesktop = window.matchMedia('(min-width: 1271px)');
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* ----------------------------------------------------------------------
     Mobile navigation
     ---------------------------------------------------------------------- */
  function initNav() {
    var burger = document.querySelector('.burger');
    var menu = document.querySelector('.nav-menu');
    if (!burger || !menu) return;

    var header = document.querySelector('.site-header');

    function setNav(open) {
      // Anchor the panel to the header's real bottom edge. The header is
      // sticky, so it sits lower at the top of the page (below the services
      // strip and topbar) than it does once scrolled — a fixed CSS value would
      // be wrong in one of those two states.
      if (open && header) {
        menu.style.top = Math.round(header.getBoundingClientRect().bottom) + 'px';
      }
      burger.setAttribute('aria-expanded', String(open));
      menu.classList.toggle('open', open);
      document.body.classList.toggle('nav-open', open);
    }

    burger.addEventListener('click', function () {
      setNav(burger.getAttribute('aria-expanded') !== 'true');
    });

    /* Dropdown triggers: click to toggle on every viewport (keyboard-friendly),
       with hover layered on for pointer users at desktop widths only. */
    document.querySelectorAll('.nav-item.has-drop').forEach(function (item) {
      var trigger = item.querySelector('.nav-link');
      if (!trigger) return;

      trigger.addEventListener('click', function (e) {
        e.preventDefault();
        var isOpen = item.classList.contains('open');
        closeAllDrops();
        if (!isOpen) openDrop(item);
      });

      item.addEventListener('mouseenter', function () {
        if (mqDesktop.matches) openDrop(item);
      });
      item.addEventListener('mouseleave', function () {
        if (mqDesktop.matches) closeDrop(item);
      });
    });

    function openDrop(item) {
      item.classList.add('open');
      var t = item.querySelector('.nav-link');
      if (t) t.setAttribute('aria-expanded', 'true');
    }
    function closeDrop(item) {
      item.classList.remove('open');
      var t = item.querySelector('.nav-link');
      if (t) t.setAttribute('aria-expanded', 'false');
    }
    function closeAllDrops() {
      document.querySelectorAll('.nav-item.open').forEach(closeDrop);
    }

    // Click-away and Escape both dismiss any open menu.
    document.addEventListener('click', function (e) {
      if (!e.target.closest('.nav-item')) closeAllDrops();
      if (!e.target.closest('.site-header') && menu.classList.contains('open')) setNav(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key !== 'Escape') return;
      closeAllDrops();
      if (menu.classList.contains('open')) {
        setNav(false);
        burger.focus();
      }
    });

    // Leaving mobile width must not strand the panel in its open state, and the
    // inline top we set for the mobile panel must not linger on desktop.
    mqDesktop.addEventListener('change', function (e) {
      if (e.matches) { setNav(false); closeAllDrops(); menu.style.top = ''; }
    });
  }

  /* ----------------------------------------------------------------------
     Hero slider
     ---------------------------------------------------------------------- */
  function initSlider() {
    var hero = document.querySelector('.hero');
    if (!hero) return;

    var slides = Array.prototype.slice.call(hero.querySelectorAll('.slide'));
    var dots = Array.prototype.slice.call(hero.querySelectorAll('.dot'));
    if (slides.length < 2) return;

    var index = 0;
    var timer = null;
    var DELAY = 6000;

    // Whether to play a hero video at all, and which one. Poster still only when
    // the visitor prefers reduced motion, has data-saver on, or is on a slow
    // connection. Phones (< 768px) get the small portrait clip.
    var conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    var saveData = !!(conn && conn.saveData);
    var slowConn = !!(conn && ['slow-2g', '2g', '3g'].indexOf(conn.effectiveType) !== -1);
    var allowVideo = !reduceMotion.matches && !saveData && !slowConn;
    var useMobileVideo = window.matchMedia('(max-width: 767px)').matches;

    function show(next) {
      index = (next + slides.length) % slides.length;
      slides.forEach(function (s, i) {
        var active = i === index;
        s.classList.toggle('active', active);
        // Keep off-screen slides out of the a11y tree, tab order and contrast checks.
        s.setAttribute('aria-hidden', String(!active));
        if (active) { s.removeAttribute('inert'); } else { s.setAttribute('inert', ''); }
        var vid = s.querySelector('video[data-hero-video]');
        if (vid) {
          if (active && allowVideo) {
            // Inject the <source> only now — nothing is fetched until a slide is
            // shown, and phones get the small portrait clip, not the full one.
            if (!vid.dataset.loaded) {
              var chosen = useMobileVideo ? (vid.dataset.srcMobile || vid.dataset.src) : vid.dataset.src;
              if (chosen) {
                var src = document.createElement('source');
                src.src = chosen; src.type = 'video/mp4';
                vid.appendChild(src); vid.dataset.loaded = '1'; vid.load();
              }
            }
            var pr = vid.play(); if (pr && pr.catch) { pr.catch(function () {}); }
          } else { vid.pause(); }
        }
      });
      dots.forEach(function (d, i) {
        d.classList.toggle('active', i === index);
        d.setAttribute('aria-selected', String(i === index));
      });
    }

    function start() {
      if (reduceMotion.matches) return;   // respect the OS setting
      stop();
      timer = setInterval(function () { show(index + 1); }, DELAY);
    }
    function stop() {
      if (timer) { clearInterval(timer); timer = null; }
    }

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () { show(i); start(); });
    });
    var prev = hero.querySelector('.hero-prev');
    var next = hero.querySelector('.hero-next');
    if (prev) prev.addEventListener('click', function () { show(index - 1); start(); });
    if (next) next.addEventListener('click', function () { show(index + 1); start(); });

    // Pause while the user is reading or interacting.
    hero.addEventListener('mouseenter', stop);
    hero.addEventListener('mouseleave', start);
    hero.addEventListener('focusin', stop);
    hero.addEventListener('focusout', start);

    hero.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { show(index - 1); start(); }
      if (e.key === 'ArrowRight') { show(index + 1); start(); }
    });

    // Touch swipe
    var x0 = null;
    hero.addEventListener('touchstart', function (e) { x0 = e.touches[0].clientX; stop(); }, { passive: true });
    hero.addEventListener('touchend', function (e) {
      if (x0 === null) return;
      var dx = e.changedTouches[0].clientX - x0;
      if (Math.abs(dx) > 45) show(dx < 0 ? index + 1 : index - 1);
      x0 = null;
      start();
    }, { passive: true });

    // Don't burn cycles animating a backgrounded tab.
    document.addEventListener('visibilitychange', function () {
      document.hidden ? stop() : start();
    });

    show(0);
    start();
  }

  /* ----------------------------------------------------------------------
     Accordions
     ---------------------------------------------------------------------- */
  function initAccordions() {
    document.querySelectorAll('.acc-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var panel = document.getElementById(btn.getAttribute('aria-controls'));
        if (!panel) return;
        var open = btn.getAttribute('aria-expanded') === 'true';
        btn.setAttribute('aria-expanded', String(!open));
        panel.classList.toggle('open', !open);
      });
    });
  }

  /* ----------------------------------------------------------------------
     Opening hours — mark today, and show a live open/closed pill
     ---------------------------------------------------------------------- */

  // Index 0 = Sunday, matching Date.getDay(). null = closed all day.
  var SCHEDULE = [
    null,           // Sun
    [540, 1080],    // Mon  09:00–18:00
    [540, 1080],    // Tue
    [540, 1080],    // Wed
    [540, 1080],    // Thu
    [540, 1080],    // Fri
    [540, 780]      // Sat  09:00–13:00
  ];

  function initHours() {
    // Use Europe/London wall-clock time so the pill always matches the opening
    // hours box regardless of the visitor's own time zone (handles GMT/BST).
    var now = new Date();
    var parts = {};
    try {
      new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Europe/London', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false
      }).formatToParts(now).forEach(function (p) { parts[p.type] = p.value; });
    } catch (e) { parts = {}; }
    var DAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
    var day = (parts.weekday in DAYS) ? DAYS[parts.weekday] : now.getDay();
    var hr = parseInt(parts.hour, 10);
    if (hr === 24) hr = 0;
    if (isNaN(hr)) hr = now.getHours();
    var min = parseInt(parts.minute, 10);
    if (isNaN(min)) min = now.getMinutes();
    var mins = hr * 60 + min;

    // Highlight today's row in any hours list on the page.
    document.querySelectorAll('.hours').forEach(function (list) {
      var row = list.querySelector('[data-day="' + day + '"]');
      if (row) row.classList.add('today');
    });

    var today = SCHEDULE[day];
    var isOpen = !!today && mins >= today[0] && mins < today[1];

    document.querySelectorAll('.status').forEach(function (pill) {
      pill.classList.toggle('open', isOpen);
      pill.classList.toggle('shut', !isOpen);
      pill.textContent = isOpen ? 'Open now' : 'Closed now';
    });
  }

  /* ----------------------------------------------------------------------
     Reveal on scroll
     ---------------------------------------------------------------------- */
  function initReveal() {
    var items = document.querySelectorAll('.reveal');
    if (!items.length) return;

    function showAll() {
      items.forEach(function (el) { el.classList.add('in'); });
    }

    // Without IntersectionObserver (or with reduced motion) just show everything.
    if (!('IntersectionObserver' in window) || reduceMotion.matches) {
      showAll();
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('in');
        io.unobserve(entry.target);   // one-shot
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    items.forEach(function (el) { io.observe(el); });

    // Safety net: this is a decorative animation guarding real content, so it must
    // never be the reason something stays unreadable. If the observer hasn't run by
    // now (no frames being produced, an exotic browser, a bug), reveal everything.
    setTimeout(function () {
      if (!document.querySelector('.reveal.in')) {
        io.disconnect();
        showAll();
      }
    }, 3000);
  }

  /* ----------------------------------------------------------------------
     Image fallback
     Placeholder photos are remote. If one fails, hide the <img> so the
     parent's gradient shows through instead of a broken-image icon.
     ---------------------------------------------------------------------- */
  function initImageFallback() {
    document.querySelectorAll('.card-media img, .split-media img, .slide-bg img').forEach(function (img) {
      img.addEventListener('error', function () { img.style.display = 'none'; });
      // Cached failures can fire before this listener attaches.
      if (img.complete && img.naturalWidth === 0) img.style.display = 'none';
    });
  }

  /* ----------------------------------------------------------------------
     Cal.com — loaded on demand only

     Nothing is requested from app.cal.com until the visitor actively asks to
     book, so no third-party request and no Cal cookie can occur before that
     interaction. This covers both the inline calendars (click-to-load) and the
     "Book now" popup buttons (script fetched on first click).
     ---------------------------------------------------------------------- */
  var CAL_SRC = 'https://app.cal.com/embed/embed.js';
  var calPromise = null;

  function loadCal() {
    if (calPromise) return calPromise;

    calPromise = new Promise(function (resolve, reject) {
      // Cal's own queueing stub, minus its script injection — we inject the
      // script ourselves so we get a real onload to await.
      (function (C, L) {
        var p = function (a, ar) { a.q.push(ar); };
        C.Cal = C.Cal || function () {
          var cal = C.Cal, ar = arguments;
          if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; cal.loaded = true; }
          if (ar[0] === L) {
            var api = function () { p(api, arguments); };
            var namespace = ar[1];
            api.q = api.q || [];
            if (typeof namespace === 'string') {
              cal.ns[namespace] = cal.ns[namespace] || api;
              p(cal.ns[namespace], ar);
              p(cal, ['initNamespace', namespace]);
            } else { p(cal, ar); }
            return;
          }
          p(cal, ar);
        };
      })(window, 'init');

      var s = document.createElement('script');
      s.src = CAL_SRC;
      s.async = true;
      s.onload = function () {
        // Real booking conversion: fires when a visitor completes a booking in
        // the Cal.com widget. No-op until GA is loaded (i.e. after consent).
        try {
          window.Cal('on', {
            action: 'bookingSuccessful',
            callback: function () { trackEvent('book_consultation', { method: 'cal.com' }); }
          });
        } catch (e) { /* Cal API shape changed — booking still works, just untracked */ }
        resolve();
      };
      s.onerror = function () { reject(new Error('Cal.com could not be reached')); };
      document.head.appendChild(s);
    });

    return calPromise;
  }

  var BRAND_UI = {
    hideEventTypeDetails: false,
    layout: 'month_view',
    cssVarsPerTheme: { light: { 'cal-brand': '#7ED321' }, dark: { 'cal-brand': '#7ED321' } }
  };

  function initCalDeferred() {
    /* ---- inline calendars: load on click ---- */
    document.querySelectorAll('.cal-defer').forEach(function (box) {
      var btn = box.querySelector('.cal-defer-btn');
      var target = box.querySelector('.cal-embed');
      // Deliberately NOT data-cal-link / data-cal-namespace: Cal's embed.js
      // claims any element carrying those and replaces its contents, which
      // would wipe out this wrapper's note, button and embed target.
      var ns = box.getAttribute('data-book-namespace');
      var calLink = box.getAttribute('data-book-link');
      if (!btn || !target || !ns || !calLink) return;

      function startLoad() {
        if (btn.disabled) return;
        btn.disabled = true;
        btn.textContent = 'Loading your booking calendar…';
        target.hidden = false;

        // Hide the prompt as soon as the calendar itself appears.
        var seen = false;
        function calendarUp() {
          if (seen) return;
          seen = true;
          box.classList.add('is-loaded');   // hides note + button via CSS
        }
        var mo = new MutationObserver(function () {
          if (target.querySelector('iframe')) { calendarUp(); mo.disconnect(); }
        });
        mo.observe(target, { childList: true, subtree: true });

        var loading = loadCal();

        // Queue the Cal calls straight away — embed.js replays whatever is in
        // the queue when it arrives. Waiting for onload first would leave the
        // queue empty and the script would do nothing.
        window.Cal('init', ns, { origin: 'https://app.cal.com' });
        window.Cal.config = window.Cal.config || {};
        window.Cal.config.forwardQueryParams = true;
        window.Cal.ns[ns]('inline', {
          elementOrSelector: '#' + target.id,
          config: { layout: 'month_view', useSlotsViewOnSmallScreen: 'true' },
          calLink: calLink
        });
        window.Cal.ns[ns]('ui', BRAND_UI);

        loading.then(function () {
          setTimeout(function () {
            if (target.querySelector('iframe')) { calendarUp(); mo.disconnect(); }
          }, 1500);
        }).catch(function () {
          mo.disconnect();
          target.hidden = true;
          btn.disabled = false;
          btn.textContent = 'Book now';
          // Bring the button back so the visitor can retry, even on auto pages.
          box.classList.remove('is-loaded');
          var msg = box.querySelector('.cal-defer-error');
          if (!msg) {
            msg = document.createElement('p');
            msg.className = 'cal-defer-error';
            box.appendChild(msg);
          }
          msg.textContent =
            'Sorry — the booking calendar could not load. Please call us on 0116 360 2000.';
        });
      }

      btn.addEventListener('click', startLoad);

      // The Book Online page exists purely to take a booking, so arriving there
      // is itself the request for that service — a second click adds nothing.
      // Section embeds on content pages keep the click gate.
      if (box.hasAttribute('data-book-auto')) {
        box.classList.add('is-loaded');
        startLoad();
      }
    });

    /* ---- popup buttons: fetch the script on first click, then replay it ----
       Capture phase, because Cal binds its own document-level listener once
       loaded; we intercept the very first click before that exists. */
    document.addEventListener('click', function (e) {
      var trigger = e.target.closest ? e.target.closest('[data-cal-link]') : null;
      if (!trigger || trigger.classList.contains('cal-defer-btn')) return;
      if (trigger.dataset.calReady === 'true') return;   // Cal handles it now

      e.preventDefault();
      e.stopPropagation();

      var original = trigger.textContent;
      trigger.textContent = 'Loading…';

      var loading = loadCal();
      // Queue before the script lands, same reason as the inline embeds.
      window.Cal('init', { origin: 'https://app.cal.com' });
      window.Cal('ui', BRAND_UI);

      loading.then(function () {
        // Mark every popup trigger as live, then replay this click for Cal.
        document.querySelectorAll('[data-cal-link]').forEach(function (el) {
          if (!el.classList.contains('cal-defer-btn')) el.dataset.calReady = 'true';
        });
        trigger.textContent = original;
        setTimeout(function () { trigger.click(); }, 120);
      }).catch(function () {
        trigger.textContent = original;
        window.alert('Sorry — the booking calendar could not load. Please call us on 0116 360 2000.');
      });
    }, true);
  }

  /* ----------------------------------------------------------------------
     Google Analytics (GA4) — loaded ONLY after analytics consent

     Paste your GA4 Measurement ID below (looks like 'G-XXXXXXXXXX'). While it
     is empty, nothing whatsoever is loaded — the site behaves exactly as before.
     Once set, gtag.js is injected the moment the visitor opts in to analytics
     (and never before), with IP anonymisation on and Google ad-signals off.
     ---------------------------------------------------------------------- */
  var GA_MEASUREMENT_ID = '';   // <-- paste GA4 ID here, e.g. 'G-XXXXXXXXXX'
  var gaLoaded = false;

  function loadAnalytics() {
    if (gaLoaded || !GA_MEASUREMENT_ID) return;   // no ID → nothing loads
    gaLoaded = true;
    window['ga-disable-' + GA_MEASUREMENT_ID] = false;

    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_MEASUREMENT_ID;
    document.head.appendChild(s);

    window.dataLayer = window.dataLayer || [];
    window.gtag = window.gtag || function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('config', GA_MEASUREMENT_ID, { anonymize_ip: true, allow_google_signals: false });
  }

  // Send a GA event. Safe no-op until analytics has loaded (i.e. before consent
  // or when no Measurement ID is set), so it can be called from anywhere.
  function trackEvent(name, params) {
    if (window.gtag && gaLoaded) window.gtag('event', name, params || {});
  }

  /* ----------------------------------------------------------------------
     Cookie consent (UK GDPR / PECR)

     Non-essential cookies are opt-in and are NOT set until the visitor makes a
     positive choice — no implied consent, no pre-ticked boxes. A one-click
     "Reject optional" sits alongside "Accept all" so refusing is exactly as
     easy as agreeing, which is what the ICO expects.

     The stored decision drives window.stmConsent. To add analytics later, load
     it inside applyConsent() where marked — that way it can never fire before
     consent, and it stops if consent is withdrawn.
     ---------------------------------------------------------------------- */
  var CONSENT_KEY = 'stm-cookie-consent';

  function readConsent() {
    try {
      var raw = localStorage.getItem(CONSENT_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }   // private mode / storage blocked
  }

  // Google Consent Mode v2. Advertising storage (ad_storage / ad_user_data /
  // ad_personalization) is granted only when the visitor opts in to advertising;
  // analytics_storage follows the analytics choice. Denied by default (set in the
  // <head> on every page), so the Google Ads tag sets no ad cookies until consent.
  function updateGoogleConsent(data) {
    var ad = (data && data.marketing) ? 'granted' : 'denied';
    var an = (data && data.analytics) ? 'granted' : 'denied';
    if (typeof window.gtag === 'function') {
      window.gtag('consent', 'update', {
        'ad_storage': ad,
        'ad_user_data': ad,
        'ad_personalization': ad,
        'analytics_storage': an
      });
    }
  }

  function saveConsent(analytics, marketing) {
    var data = { necessary: true, analytics: !!analytics, marketing: !!marketing, ts: new Date().toISOString(), v: 2 };
    try { localStorage.setItem(CONSENT_KEY, JSON.stringify(data)); } catch (e) { /* ignore */ }
    applyConsent(data);
    return data;
  }

  function applyConsent(data) {
    window.stmConsent = data;
    updateGoogleConsent(data);
    if (data && data.analytics) {
      // Gated behind consent by construction — GA only loads from here.
      loadAnalytics();
      document.dispatchEvent(new CustomEvent('stm:analytics-consent'));
    } else if (GA_MEASUREMENT_ID) {
      // No consent, or consent withdrawn: make sure GA sends nothing, even if it
      // was loaded earlier in this page's life.
      window['ga-disable-' + GA_MEASUREMENT_ID] = true;
    }
  }

  function initCookieConsent() {
    var existing = readConsent();
    applyConsent(existing);

    // ---- build the banner ------------------------------------------------
    var banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.setAttribute('role', 'region');
    banner.setAttribute('aria-label', 'Cookie notice');
    banner.innerHTML =
      '<div class="wrap">' +
        '<p>We use cookies to make this site work and to process your bookings. ' +
        'We would also like to set optional analytics and advertising cookies to help us ' +
        'improve the site and measure our Google Ads, but only if you agree. ' +
        'Read our <a href="cookie-policy.html">Cookie Policy</a>.</p>' +
        '<div class="cookie-actions">' +
          '<button type="button" class="btn btn-primary btn-sm" data-cookie="accept">Accept all</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" data-cookie="reject">Reject optional</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" data-cookie="manage">Manage preferences</button>' +
        '</div>' +
      '</div>';

    // ---- build the preferences modal ------------------------------------
    var modal = document.createElement('div');
    modal.className = 'cookie-modal';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'cookie-modal-title');
    modal.innerHTML =
      '<div class="cookie-modal-backdrop" data-cookie="close"></div>' +
      '<div class="cookie-modal-panel">' +
        '<h2 id="cookie-modal-title">Cookie preferences</h2>' +
        '<p>Choose which cookies we may set. Strictly necessary cookies cannot be ' +
        'turned off because the site will not work without them.</p>' +
        '<div class="cookie-cat">' +
          '<div><h3>Strictly necessary</h3><p>Remember your cookie choice, and let the ' +
          'Cal.com booking widget complete an appointment. Always active.</p></div>' +
          '<span class="locked">Always on</span>' +
        '</div>' +
        '<div class="cookie-cat">' +
          '<div><h3>Analytics</h3><p>Help us understand how the site is used so we can ' +
          'improve it. Off by default. We do not run any analytics at present.</p></div>' +
          '<label class="switch">' +
            '<input type="checkbox" id="cookie-analytics" aria-label="Allow analytics cookies">' +
            '<span class="track"></span><span class="thumb"></span>' +
          '</label>' +
        '</div>' +
        '<div class="cookie-cat">' +
          '<div><h3>Advertising</h3><p>Let Google Ads set cookies to measure the ' +
          'effectiveness of our advertising and show you more relevant ads. Off by default.</p></div>' +
          '<label class="switch">' +
            '<input type="checkbox" id="cookie-marketing" aria-label="Allow advertising cookies">' +
            '<span class="track"></span><span class="thumb"></span>' +
          '</label>' +
        '</div>' +
        '<div class="cookie-modal-actions">' +
          '<button type="button" class="btn btn-primary btn-sm" data-cookie="save">Save preferences</button>' +
          '<button type="button" class="btn btn-ghost btn-sm" data-cookie="close">Cancel</button>' +
        '</div>' +
      '</div>';

    document.body.appendChild(banner);
    document.body.appendChild(modal);

    var toggle = modal.querySelector('#cookie-analytics');
    var marketingToggle = modal.querySelector('#cookie-marketing');
    var lastFocus = null;

    function showBanner() {
      requestAnimationFrame(function () { banner.classList.add('show'); });
    }
    function hideBanner() { banner.classList.remove('show'); }

    function openModal() {
      lastFocus = document.activeElement;
      var saved = readConsent() || {};
      toggle.checked = !!saved.analytics;            // reflect saved choices
      marketingToggle.checked = !!saved.marketing;
      modal.classList.add('show');
      toggle.focus();
    }
    function closeModal() {
      modal.classList.remove('show');
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    document.addEventListener('click', function (e) {
      var t = e.target.closest('[data-cookie]');
      if (t) {
        var action = t.getAttribute('data-cookie');
        if (action === 'accept') { saveConsent(true, true);   hideBanner(); closeModal(); }
        if (action === 'reject') { saveConsent(false, false); hideBanner(); closeModal(); }
        if (action === 'manage') { openModal(); }
        if (action === 'save')   { saveConsent(toggle.checked, marketingToggle.checked); hideBanner(); closeModal(); }
        if (action === 'close')  { closeModal(); }
        return;
      }
      // "Cookie settings" link on the Cookie Policy page reopens the panel
      if (e.target.closest('[data-cookie-reopen]')) { openModal(); }
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && modal.classList.contains('show')) closeModal();
    });

    // Only prompt when no decision has been recorded yet.
    if (!existing) showBanner();
  }

  /* ----------------------------------------------------------------------
     EPS nomination form

     Posts JSON to the Netlify function, which emails the pharmacy via Resend.
     Validated here for a fast response and again in the function, since
     client-side checks can always be bypassed.
     ---------------------------------------------------------------------- */
  /* Whole years old on `ref`. Parsed as local midnight so a YYYY-MM-DD value
     can't slip a day via UTC. Returns null if the date is unusable. */
  function ageFromDob(value, ref) {
    if (!value) return null;
    var d = new Date(value + 'T00:00:00');
    if (isNaN(d.getTime())) return null;
    var age = ref.getFullYear() - d.getFullYear();
    var m = ref.getMonth() - d.getMonth();
    if (m < 0 || (m === 0 && ref.getDate() < d.getDate())) age--;
    return age;
  }

  function initEpsForm() {
    var form = document.getElementById('eps-form');
    if (!form) return;

    // Stop future dates being picked at all; the 18 rule is explained on submit
    // rather than silently greyed out, so the patient knows why.
    var today = new Date();
    form.dob.max = today.toISOString().slice(0, 10);

    var errorBox = document.getElementById('eps-error');
    var successBox = document.getElementById('eps-success');
    var submitBtn = form.querySelector('button[type="submit"]');

    function showError(msg) {
      errorBox.textContent = msg;
      errorBox.hidden = false;
      errorBox.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }
    function clearError() {
      errorBox.hidden = true;
      errorBox.textContent = '';
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      clearError();

      var data = {
        firstName: form.firstName.value.trim(),
        lastName:  form.lastName.value.trim(),
        email:     form.email.value.trim(),
        phone:     form.phone.value.trim(),
        dob:       form.dob.value.trim(),
        altPhone:  form.altPhone.value.trim(),
        surgery:   form.surgery.value.trim(),
        consent:   form.consent.checked,
        website:   form.website.value            // honeypot
      };

      var missing = [];
      if (!data.firstName) missing.push('first name');
      if (!data.lastName)  missing.push('last name');
      if (!data.email)     missing.push('email');
      if (!data.phone)     missing.push('phone');
      if (!data.dob)       missing.push('date of birth');
      if (!data.surgery)   missing.push('GP surgery');
      if (missing.length) return showError('Please complete: ' + missing.join(', ') + '.');

      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(data.email)) {
        return showError('That email address does not look right.');
      }

      var age = ageFromDob(data.dob, new Date());
      if (age === null) {
        return showError('Please enter your date of birth as a valid date.');
      }
      if (age < 0) {
        return showError('That date of birth is in the future — please check it.');
      }
      if (age > 120) {
        return showError('Please check the date of birth you entered.');
      }
      if (age < 18) {
        return showError(
          'You need to be 18 or over to nominate online. If you are arranging this ' +
          'for someone under 18, please call us on 0116 360 2000 and we will set it up.'
        );
      }

      if (!data.consent) {
        return showError('Please tick the authorisation box so we can act on your nomination.');
      }

      submitBtn.disabled = true;
      var originalLabel = submitBtn.textContent;
      submitBtn.textContent = 'Sending…';

      fetch('/.netlify/functions/send-nomination', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      }).then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (body) {
          return { ok: res.ok, body: body };
        });
      }).then(function (r) {
        if (!r.ok) throw new Error(r.body.error || 'Something went wrong.');
        form.hidden = true;
        successBox.hidden = false;
        successBox.scrollIntoView({ block: 'center', behavior: 'smooth' });
      }).catch(function (err) {
        submitBtn.disabled = false;
        submitBtn.textContent = originalLabel;
        showError(
          (err && err.message ? err.message : 'Something went wrong.') +
          ' You can also call us on 0116 360 2000.'
        );
      });
    });
  }

  /* ----------------------------------------------------------------------
     Booking-intent analytics — a click on any "Book" call to action. This is
     the funnel step before the real booking conversion (Cal bookingSuccessful),
     so you can see clicks -> completed bookings. No-op until consent + GA ID.
     ---------------------------------------------------------------------- */
  function initBookingAnalytics() {
    document.addEventListener('click', function (e) {
      var el = e.target.closest && e.target.closest('[data-cal-link], a[href="booking.html"]');
      if (el) trackEvent('book_intent', { label: (el.textContent || '').trim().slice(0, 60) });
    });
  }

  /* ----------------------------------------------------------------------
     Sticky header shrink — add a class once the page is scrolled so CSS can
     slim the bar down. rAF-throttled, passive listener; no layout thrash.
     ---------------------------------------------------------------------- */
  function initHeaderShrink() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    var ticking = false;
    function update() { header.classList.toggle('scrolled', window.scrollY > 30); ticking = false; }
    window.addEventListener('scroll', function () {
      if (!ticking) { window.requestAnimationFrame(update); ticking = true; }
    }, { passive: true });
    update();
  }

  /* ----------------------------------------------------------------------
     Footer year
     ---------------------------------------------------------------------- */
  function initYear() {
    document.querySelectorAll('.js-year').forEach(function (el) {
      el.textContent = String(new Date().getFullYear());
    });
  }

  /* ---------------------------------------------------------------------- */
  function init() {
    initNav();
    initSlider();
    initAccordions();
    initHours();
    initReveal();
    initImageFallback();
    initCalDeferred();
    initEpsForm();
    initBookingAnalytics();
    initHeaderShrink();
    initCookieConsent();
    initYear();
  }

  document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', init)
    : init();
})();
