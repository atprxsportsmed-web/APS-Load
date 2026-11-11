# 18 Golf Performance Club website

The member-facing marketing site for 18 Golf Performance Club, served at
18golf.atprxsportsmed.com. One page: philosophy, facility, digital strength
(Tonal 2), the 18 Method, team, membership ($500/month all in, 3-month minimum,
5% off 6-month and 10% off 12-month terms, limited to 133 members),
training-only packages, FAQ, and a founding-member waitlist / contact form.

No investor information, financials or payments belong on this site.

Open `index.html` in a browser, or deploy the `website/` folder to any static host
(Vercel, Netlify, GitHub Pages).

## Inquiry form

Inquiries are sent to Formspree (`FORM_ENDPOINT` at the top of the `<script>`
in `index.html`), which emails each one to the club. After a successful send the
visitor sees an "Inquiry received" confirmation box with a thank-you message. If
the send fails, an error appears next to the Send button and their entries are kept.

## Placeholders to confirm

- Opening is shown as a target (fall 2027), not a date.
- Strength coach, PGA professional and general manager are not named yet.
- Junior pricing shows "Contact us".
- 18 Profile, 18 Method and 18 Index are working names; no trademark symbols are used.
