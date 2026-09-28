# TheGirlSavedByGrace site

Public site for TheGirlSavedByGrace, served with GitHub Pages at
https://rosariom123.github.io/grace/

## What is here

`index.html` is the whole site: a single-file page (built with Meta AI) for the
faith-integrated teen therapy platform waitlist. Warm editorial design, one
serif typeface throughout, interactive globe, backer logos, tier comparison,
and the waitlist form.

## Waitlist backend

The Join button is wired to a real signup backend by a plain-JavaScript layer at
the end of `index.html` (the page markup and bundle above it are untouched).
It enforces a valid email, requires the "I confirm I am 13 or older" checkbox,
includes a honeypot field, shows a short privacy note, and POSTs signups to
Formspree. The page's own "You are in" confirmation only appears after the
backend confirms receipt. An optional Cloudflare Web Analytics beacon counts
visitors and never sees email addresses.

Owner setup, all inside that script:

1. Create a free form at https://formspree.io and paste the endpoint ID into
   `FORMSPREE_FORM_ID`.
2. Paste the Cloudflare Web Analytics token into `CF_BEACON_TOKEN` to enable
   visitor analytics.
3. Put a contact address in `CONTACT_EMAIL` to show it in the privacy note.

## Branches

- `main` is what the public link serves.
- `fix/waitlist-backend` holds the wired version for preview before it goes live.
- `preview/rebuild` was an earlier clean-source rebuild experiment and is
  superseded; the original page is kept as is.

## Deploy

Push to `main`. GitHub Pages rebuilds and the live link updates in about a
minute or two. Preview branches never affect the live site.
