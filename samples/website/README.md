# SA-02 / Web — Side A

From the repository root, run `npm ci` and `npm run dev`, then open `/web/` on the printed local URL. Run `npm run build` after edits.

Working features: session filters, party-size limits, totals computed from the catalogue, one saved local demo booking, JSON ticket download, cancellation, and a saved record crate. Sessions and releases are fictional; prices are illustrative USD. The venue images depict the fictional concept, not a client location.

Edit `catalog.mjs` for programme and releases, `index.html` for content, `styles.css` for Night Shift styling and `app.js` for interactions. The SVG emblem is editable source; optimized venue images are in `assets/`.

Storage keys are `side-a-web-ticket-v1` and `side-a-web-crate-v1`. No data leaves the browser. Storage errors are shown; corrupt data is preserved and writes blocked. There is no ticket import; downloaded tickets are portable review copies. Clear only this sample’s keys if intentionally resetting after preserving any needed data. No real bookings, music playback, checkout or customer accounts are present.
