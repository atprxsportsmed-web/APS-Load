# 18 Golf Performance Club website

A single-page, dependency-free marketing site built from the 18 Golf pitch deck:
the problem and solution, the facility, the 18 Method, the team, every pricing
option (membership, add-ons, programs), an FAQ, and
a membership inquiry form.

Open `index.html` in a browser, or deploy the `website/` folder to any static host
(Vercel, Netlify, GitHub Pages).

## Connect the inquiry form

At the top of the `<script>` in `index.html`:

- `FORM_ENDPOINT`: a URL that accepts a JSON POST, such as a Formspree form
  (`https://formspree.io/f/xxxxxxx`). Each inquiry is sent there.
- `CONTACT_EMAIL`: shown to visitors if no endpoint is set, so they can email
  their inquiry themselves.

With neither set, the form still validates and shows the visitor a copyable
summary of their inquiry.

## Placeholders to confirm before launch

- Sample 18 Profile numbers in the hero are illustrative and labelled as such.
- Strength coach, head pro and GM names are not yet listed.
- Rehab, junior, team and club-partnership pricing shows "on inquiry".
- No opening date is shown yet. The 25 founding slots come from the deck.
