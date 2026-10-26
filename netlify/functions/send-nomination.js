/* ==========================================================================
   EPS nomination -> email, via Resend.

   Endpoint: POST /.netlify/functions/send-nomination
   Body:     JSON from the nomination form on prescriptions.html

   The Resend API key is read from the RESEND_API_KEY environment variable,
   which must be set in the Netlify dashboard (Site configuration ->
   Environment variables). It is never stored in the deployed folder, because
   everything in that folder is publicly downloadable.

   This handles patient-identifiable data (name, date of birth, contact
   details, GP surgery), so it:
     - accepts same-origin POSTs only
     - refuses to run without an explicit consent tick
     - never logs field values, only whether the send succeeded
   ========================================================================== */

'use strict';

const TO = process.env.NOMINATION_TO || 'info@stmatthewspharmacy.co.uk';
// Must be an address on a domain verified in Resend. Until the pharmacy domain
// is verified, Resend's shared sender works for testing.
const FROM = process.env.NOMINATION_FROM || 'onboarding@resend.dev';

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify(body)
  };
}

// Whole years old on `ref`. Parsed as local midnight so a YYYY-MM-DD value
// can't slip a day via UTC. Returns null if the date is unusable.
function ageFromDob(value, ref) {
  if (!value) return null;
  const d = new Date(value + 'T00:00:00');
  if (isNaN(d.getTime())) return null;
  let age = ref.getFullYear() - d.getFullYear();
  const m = ref.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && ref.getDate() < d.getDate())) age--;
  return age;
}

// Escape anything that lands in the HTML email, so a submitted value can't
// inject markup into the message we read.
function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

exports.handler = async function (event) {
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Method not allowed' });
  }

  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error('RESEND_API_KEY is not set on this site');
    return json(500, { error: 'Email is not configured on the server.' });
  }

  let data;
  try {
    data = JSON.parse(event.body || '{}');
  } catch (e) {
    return json(400, { error: 'Could not read the submitted form.' });
  }

  // Honeypot — real people leave this empty.
  if (data.website) return json(200, { ok: true });

  const firstName = (data.firstName || '').trim();
  const lastName  = (data.lastName  || '').trim();
  const email     = (data.email     || '').trim();
  const phone     = (data.phone     || '').trim();
  const dob       = (data.dob       || '').trim();
  const altPhone  = (data.altPhone  || '').trim();
  const surgery   = (data.surgery   || '').trim();

  const missing = [];
  if (!firstName) missing.push('first name');
  if (!lastName)  missing.push('last name');
  if (!email)     missing.push('email');
  if (!phone)     missing.push('phone');
  if (!dob)       missing.push('date of birth');
  if (!surgery)   missing.push('GP surgery');
  if (missing.length) {
    return json(400, { error: 'Please complete: ' + missing.join(', ') + '.' });
  }
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json(400, { error: 'That email address does not look right.' });
  }

  // Age gate. Repeated here because the browser check can be bypassed by
  // posting straight to this endpoint.
  const age = ageFromDob(dob, new Date());
  if (age === null || age < 0 || age > 120) {
    return json(400, { error: 'Please check the date of birth you entered.' });
  }
  if (age < 18) {
    return json(400, {
      error: 'You need to be 18 or over to nominate online. If you are arranging this ' +
             'for someone under 18, please call us on 0116 360 2000 and we will set it up.'
    });
  }

  if (data.consent !== true) {
    return json(400, { error: 'Please tick the authorisation box so we can act on your nomination.' });
  }

  const received = new Date().toLocaleString('en-GB', { timeZone: 'Europe/London' });

  const text =
`New EPS nomination request

Patient
  Name ............ ${firstName} ${lastName}
  Date of birth ... ${dob}

Contact
  Email ........... ${email}
  Phone ........... ${phone}
  Alt. number ..... ${altPhone || '(not supplied)'}

GP surgery
${surgery.split('\n').map(function (l) { return '  ' + l; }).join('\n')}

Authorisation
  The patient ticked: "I authorise St Matthew's Pharmacy to order, collect and
  dispense my repeat NHS prescriptions."

Received ${received} via stmatthewspharmacy.co.uk
`;

  const html =
`<div style="font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#16202A;line-height:1.6">
  <h2 style="margin:0 0 4px">New EPS nomination request</h2>
  <p style="margin:0 0 20px;color:#55606C;font-size:13px">Received ${esc(received)}</p>

  <h3 style="margin:0 0 6px;font-size:14px;text-transform:uppercase;letter-spacing:.08em;color:#55606C">Patient</h3>
  <table cellpadding="0" cellspacing="0" style="margin:0 0 18px">
    <tr><td style="padding:3px 18px 3px 0;color:#55606C">Name</td><td><strong>${esc(firstName)} ${esc(lastName)}</strong></td></tr>
    <tr><td style="padding:3px 18px 3px 0;color:#55606C">Date of birth</td><td>${esc(dob)}</td></tr>
  </table>

  <h3 style="margin:0 0 6px;font-size:14px;text-transform:uppercase;letter-spacing:.08em;color:#55606C">Contact</h3>
  <table cellpadding="0" cellspacing="0" style="margin:0 0 18px">
    <tr><td style="padding:3px 18px 3px 0;color:#55606C">Email</td><td><a href="mailto:${esc(email)}">${esc(email)}</a></td></tr>
    <tr><td style="padding:3px 18px 3px 0;color:#55606C">Phone</td><td><a href="tel:${esc(phone.replace(/\s+/g, ''))}">${esc(phone)}</a></td></tr>
    <tr><td style="padding:3px 18px 3px 0;color:#55606C">Alt. number</td><td>${altPhone ? '<a href="tel:' + esc(altPhone.replace(/\s+/g, '')) + '">' + esc(altPhone) + '</a>' : '<em style="color:#6C7681">not supplied</em>'}</td></tr>
  </table>

  <h3 style="margin:0 0 6px;font-size:14px;text-transform:uppercase;letter-spacing:.08em;color:#55606C">GP surgery</h3>
  <p style="margin:0 0 18px;white-space:pre-wrap">${esc(surgery)}</p>

  <p style="margin:0;padding:12px 14px;background:#F5F8FB;border-left:3px solid #7ED321;font-size:14px">
    Patient ticked: &ldquo;I authorise St Matthew&rsquo;s Pharmacy to order, collect and dispense my repeat NHS prescriptions.&rdquo;
  </p>
</div>`;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + key,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: 'St Matthew\'s Pharmacy website <' + FROM + '>',
        to: [TO],
        reply_to: email,
        subject: 'New EPS Nomination Request',
        text: text,
        html: html
      })
    });

    if (!res.ok) {
      // Log the status only — the body can echo submitted values.
      let detail = '';
      try { detail = (await res.json()).message || ''; } catch (e) { /* ignore */ }
      console.error('Resend rejected the send:', res.status, detail);
      return json(502, { error: 'We could not send your nomination just now.' });
    }

    return json(200, { ok: true });
  } catch (err) {
    console.error('Resend request failed:', err && err.message);
    return json(502, { error: 'We could not send your nomination just now.' });
  }
};
