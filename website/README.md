# 18 Golf Performance Club website

A single-page, dependency-free marketing site built from the 18 Golf pitch deck:
the problem and solution, the facility, the 18 Method, the team, every pricing
option (membership, add-ons, programs), an FAQ, and
a membership inquiry form.

Open `index.html` in a browser, or deploy the `website/` folder to any static host
(Vercel, Netlify, GitHub Pages).

## Inquiry form

Inquiries are sent to Formspree (`FORM_ENDPOINT` at the top of the `<script>`
in `index.html`), which emails each one to the club. After a successful send the
visitor sees an "Inquiry received" confirmation box with a thank-you message. If
the send fails, an error appears next to the Send button and their entries are kept.

## Placeholders to confirm before launch

- Sample 18 Profile numbers in the hero are illustrative and labelled as such.
- Strength coach, head pro and GM names are not yet listed.
- Rehab, junior, team and club-partnership pricing shows "on inquiry".
- No opening date is shown yet. The 25 founding slots come from the deck.
