# TheGirlSavedByGrace — site source

Faithful rebuild of the original single-file site as readable, editable source
files. Same design, same copy, no framework, no build step.

## Files

- `index.html` — all page content and structure. Copy lives here; edit text directly.
- `styles.css` — all styling. Design tokens at the top (`--bg`, `--ink`, `--accent`).
- `main.js` — interactions: scroll progress bar, smooth scroll, the canvas globe,
  and the waitlist form. Configuration lives at the bottom of the file:
  - `FORMSPREE_ENDPOINT` — paste the Formspree form endpoint to make signups real.
  - `CF_BEACON_TOKEN` — paste the Cloudflare Web Analytics token to enable analytics.
- `assets/logos/` — the nine backer logo images used in the "Backed and supported by" row.
- `assets/favicon.svg` — the site favicon.

## The waitlist form

Submits to Formspree with `fetch`. Requires a valid email and the "I confirm I am
13 or older" checkbox. Includes a honeypot field for bots. Shows honest loading,
success, and error states. Until `FORMSPREE_ENDPOINT` is set to a real form ID,
submitting shows "Signup is not connected yet" instead of faking a success.

## The globe

`main.js` contains a canvas globe ported from the original site: rotating
wireframe sphere, stylized continent shapes, terracotta markers for the 18 listed
countries (hover shows the country name), drag to spin with inertia.

## Deploy

This is a static site. Push these files to the branch GitHub Pages serves and the
site updates. No build step.
