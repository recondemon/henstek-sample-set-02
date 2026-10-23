# SA-02 / Desktop — The Door

An Electron guest-list sample with the same renderer available as a browser preview. Requires Node 22.12 or newer.

```sh
npm ci
npm start
```

Run these commands from `samples/desktop`. On Apple silicon macOS, `npm run pack` writes an unsigned local app under the repository’s `build/desktop/`. Source can be adapted for other platforms; this release only verifies native macOS. There is no signed/notarized public installer.

Select a session, search names/notes, filter status, add/edit a booking, move it between sessions, and check in or undo arrival. Aggregate capacity includes expected and arrived guests, excludes canceled bookings, and is checked before saving. Parties must contain 1–6 guests. No real venue inventory or customer accounts are connected.

Native data is stored in Electron’s user-data directory for **Side A Desk**, normally `~/Library/Application Support/Side A Desk/` on macOS. Files: `guests.json`, `guests.previous.json` and a transient `guests.pending.json`. Writes are queued, preserve the previous file, and replace the primary file through rename. Keep a separate exported backup. If parsing fails, writes are blocked and the original file preserved. Close the app, copy both files elsewhere, validate the previous export, then restore it as `guests.json` and relaunch. Do not use Reset demo to recover data you want to keep.

The browser preview uses `side-a-desk-v1` and `side-a-desk-previous-v1` in local storage. Browser and native stores do not synchronize. Import validates a version-1 JSON archive under 500 KB, then asks before replacing the list. Export and reset controls are disabled if recovery is needed. These backups are plaintext: use fictional information only.

The renderer uses no Node access. Context isolation and sandboxing are enabled, permissions and external navigation are denied, IPC checks the main-frame origin, and the custom protocol serves an exact asset allowlist. Dependency versions are pinned. Production permissions, authentication, payments, encrypted storage and multi-user concurrency require a separate scope.
