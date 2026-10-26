# St Matthew's Pharmacy — website

Static site. Plain HTML, one shared stylesheet, one shared JS file. No build step,
no dependencies, no framework. Host it anywhere that serves files.

```
index.html            Home — hero slider, welcome, hours, services, testimonials, about, blog
services.html         All 12 services
pharmacy-first.html   The 7 NHS conditions + FAQ
travel-clinic.html    Travel vaccines, yellow fever, antimalarials, Hajj/Umrah, prices
prescriptions.html    EPS nomination, repeats, free collection & delivery
about.html            The story, values, regulatory details
contact.html          Booking form, details, Google map
thanks.html           Form confirmation page
css/style.css         All styling
js/main.js            Nav, slider, accordions, opening-hours logic
images/logo.svg       The interlocking-crosses logo (also used as favicon)
netlify.toml          Netlify config
```

---

## ⚠️ Fill these in before going live

Everything below is a placeholder. Search for the marker in brackets to find every instance.

| What | Placeholder | Where |
|---|---|---|
| **GPhC registration number** | `XXXXXXXXX` | Footer on all 9 pages, plus `about.html` details panel |
| **Company number** | `XXXXXXXX` | Footer on all 9 pages, plus `about.html` details panel |
| **Superintendent pharmacist** | `[Name], MPharm` | Footer on all 9 pages, plus `about.html` details panel |
| **Vaccine prices** | `£XX` | `travel-clinic.html` price table |

✅ **Phone number is done** — `0116 360 2000` (`tel:+441163602000`) is live across all pages.

### Other things that need a real decision

- **Testimonials** (`index.html`) are written samples, there to show the layout. Replace
  them with real reviews before launch — invented customer quotes on a regulated
  healthcare site are a genuine problem, not just a cosmetic one.
- **Vaccine prices** (`travel-clinic.html`) are `£XX` placeholders and there's a visible
  warning banner above the table telling visitors to ring. Delete that banner once the
  real prices are in.
- **Yellow fever** (`travel-clinic.html`) has a notice saying NaTHNaC registration is
  pending. Only remove it once you're actually a registered yellow fever centre —
  you can't give the vaccine or issue certificates until then.
- **Social links** in the footer all point at `#`. Add real URLs or delete the icons.
- **Legal pages** (Privacy, Terms, Cookies, Complaints) are linked in the footer but
  point at `#`. You'll need these — a privacy policy is not optional given the form
  collects personal data.
- **Blog posts** on the homepage link to existing service pages rather than real articles.

---

## Service images (AI-generated)

The 12 service photos (service cards + homepage + hero) are wired to local files
at `images/services/<name>.png`. Generate them by running the script in the
sibling `../image-generator/` folder (`node generate-images.js` — see that
folder's README). That folder holds your OpenAI key and is **never** uploaded to
Netlify. Until you run it, those slots fall back to a green gradient rather than
showing broken images. Incidental shots (shop interior, blog thumbnails) are
still Unsplash placeholders and are the best candidates for real photos.

## Images

Every other photo is a placeholder from Unsplash, loaded from their CDN. Each one is marked
in the HTML with a comment saying what belongs there:

```html
<!-- IMAGE SLOT: pharmacy interior / shelves -->
```

To swap in your own: drop the file in `images/` and change the `src`. Keep the
`loading="lazy"` attribute on anything below the fold. Each image sits on a green
gradient, and `js/main.js` hides any image that fails to load — so a missing photo
degrades to the gradient instead of a broken-image icon.

Roughly 16:10 for service cards, 4:3 for the split sections, and wide/landscape for
hero slides.

---

## Deploying to Netlify

**Drag and drop:** go to [app.netlify.com/drop](https://app.netlify.com/drop) and drag
this folder in. That's the whole process.

**From Git:** connect the repo. Build command: leave empty. Publish directory: `/`
(or `stmatthews-pharmacy` if the site sits in a subfolder of the repo).

### The booking form

`contact.html` uses **Netlify Forms** — it works with no backend once deployed, but
only on Netlify. The form is marked `data-netlify="true"`, includes the required
hidden `form-name` input, and has a honeypot field for spam.

After the first deploy, go to **Forms** in the Netlify dashboard and add an email
notification to `info@stmatthewspharmacy.co.uk` — otherwise submissions pile up in
the dashboard and nobody sees them.

Note the form deliberately tells people not to send medical details through it. Keep
that. If you later want proper online booking with time slots, that needs a real
booking system (Charac, Pharmadoctor, Calendly and similar all integrate fine).

Locally the form won't submit anywhere — that's expected.

---

## Local preview

No build step, so you can open `index.html` directly in a browser. The Google map and
the Unsplash images need an internet connection.

If you want it over HTTP instead of `file://`:

```powershell
# from this folder
python -m http.server 8000     # if you have Python
npx serve .                    # if you have Node
```

---

## Brand

| | |
|---|---|
| Matte black | `#0E0E0E` |
| Accent green | `#7ED321` |
| White | `#FFFFFF` |
| Font | Montserrat (400/500/600/700/800), loaded from Google Fonts |

Colours are CSS variables at the top of `css/style.css` — change them in one place and
the whole site follows.

The logo is `images/logo.svg`: two rounded crosses, green and white, woven so the green
arm passes over the white one at the top intersection and under it at the bottom. It's a
single file used at every size including the favicon, and it's built from `<use>`
references, so editing one cross definition updates both instances.

---

## Notes

- Opening hours live in **two** places: the visible HTML on each page, and the
  `SCHEDULE` array in `js/main.js` that drives the "Open now / Closed now" pill and
  highlights today's row. **Change both** if your hours change.
- Bank holidays aren't handled — the pill will say "Open now" on Christmas Day.
- Accessibility: skip links, visible focus rings, ARIA on the slider and dropdowns,
  one `<h1>` per page, and `prefers-reduced-motion` stops the slider auto-rotating.
- No cookies, no analytics, no trackers. If you add analytics you'll need a cookie
  banner and a cookie policy to go with it.
