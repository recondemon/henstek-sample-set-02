# Sample Set 02 verification

Checked 23 October 2026. These are bounded sample checks, not a production security or accessibility certification.

## Automated checks

- Node 24 build and model tests: computed ticket totals, limits, archive validation, aggregate capacity, previous-revision persistence, damaged-file preservation, native IPC page boundary and public asset paths.
- Swift model checks: valid round trip, duplicate/session/name/party validation, file persistence, previous copy and damaged-file preservation.
- Xcode Debug simulator build, including the Side A icon and venue asset.
- Electron 45 Apple silicon macOS package; dependency audit reports no known vulnerabilities at the time checked.

## Interface checks

- Website at 1440 pixels and 390 pixels: hero imagery, responsive layout with no horizontal document overflow, session filtering, create ticket, correct three-person total, reload persistence, cancellation and saved record crate.
- Desktop browser preview: session selection, guest search, check-in counts, editing, reload persistence and reset confirmation. No console errors observed in the exercised flow.
- Native desktop: startup, custom-protocol assets, local-file storage indicator, guest check-in and updated counts.
- Native iPhone Simulator: Discover, My tickets and My crate; creation of a second ticket with three-person pricing, save toggle, cancellation confirmation, JSON export to Files, JSON import confirmation and restoration of the canceled ticket. Relaunch succeeded after the app-icon update.
- HensTek inquiry tests cover both directions of cross-set functionality/style choices and retain Set 01 behavior.

Public previews are actual browser or iPhone Simulator captures. The desktop gallery image uses the browser renderer; its native app is tested separately.

## Poster and ledger redesign

The October 23 revision replaces the dark split hero with a cream record-store masthead and full-width venue image, turns sessions into music posters, opens the iPhone app in its ticket wallet, and replaces the desktop sidebar with a light ledger and separate session docket. Updated screenshots are actual captures. Rechecked the web booking total and cancellation, desktop check-in/undo and editor, native iPhone booking and all three tabs, and native desktop startup with retained local data. Model and build checks continue to pass.

## Limits and recovery

No App Store submission, physical-device pass, Android/iPad implementation, Windows/Linux native test or signed/notarized desktop distribution is included. VoiceOver and a full WCAG audit have not been completed. Only fictional local data is used; there is no shared backend, real booking, streaming, payment, email or notification integration.

Website, iPhone and desktop backups are independent formats. Native storage refuses to overwrite damaged data and retains a previous valid revision. See the platform READMEs for manual recovery and limitations. Browser storage and plaintext local exports are sample mechanisms, not a production data-security design.
