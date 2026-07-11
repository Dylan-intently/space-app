# Orbit — a little space app

## Setup (one step)
Open `js/config.js` and replace `YOUR_NASA_API_KEY` with your free key from
https://api.nasa.gov (instant, no approval wait). That's it — everything else
works with no key.

## Pages
- `index.html` — home hub, live ISS altitude teaser
- `mars.html` — swipeable feed of the latest Curiosity + Perseverance photos
- `apod.html` — Astronomy Picture of the Day, with save (heart, stored locally
  in the browser), download, and share
- `iss.html` — live ISS globe with trajectory line, telemetry, crew currently
  in orbit, and today's near-Earth objects sorted by miss distance

## Hosting on GitHub Pages
Push this folder to a repo, then in Settings → Pages, set the source to the
main branch root. No build step — it's plain HTML/CSS/JS.

## Notes for editing
- All shared styling lives in `css/style.css` (colors are CSS variables at
  the top — tweak `--violet` / `--blue` to shift the accent).
- The bottom nav is the `.island-nav` block, duplicated at the bottom of each
  HTML file — update all four if you add a page.
- Saved APOD images are stored in `localStorage` under `orbit_saved_apod`,
  so they're per-browser, not synced anywhere.
- The ISS trajectory line samples 19 points ±72 minutes from now using
  wheretheiss.at's timestamp param — it's a real propagated path, not a fake
  arc.
- Mars photos use the `latest_photos` endpoint, so the feed refreshes with
  whatever each rover most recently sent down.
