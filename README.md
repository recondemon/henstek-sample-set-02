# HensTek Sample Set 02 — Side A

A fictional listening bar and record shop, built as three independent working examples. **Night Shift** is the shared direction: ink black, warm ivory, vermilion, editorial serif type and a record-label emblem.

[Explore Set 02](https://recondemon.github.io/henstek-sample-set-02/) · [HensTek sample gallery](https://henstek.dev/samples#sample-set-02) · [Discuss a build](https://henstek.dev/start?sample=set-02)

| Reference | Working example | Source and demo |
| --- | --- | --- |
| **SA-02 / Web** | Listening-room site: filter the programme, preview a booking, download a demo ticket and save records | [Website guide](samples/website/README.md) · [Live website](https://recondemon.github.io/henstek-sample-set-02/web/) |
| **SA-02 / Mobile** | Side A Pocket: native iPhone discovery, tickets, saved crate and portable backups | [iPhone guide](samples/mobile/README.md) |
| **SA-02 / Desktop** | The Door: guest list, capacity checks, arrivals, search, editing, import/export and previous-revision recovery | [Desktop guide](samples/desktop/README.md) · [Browser preview](https://recondemon.github.io/henstek-sample-set-02/desktop/) |

![Side A website](screenshots/website.png)

## Run the browser samples

Node.js 22.12 or newer is required; checks use Node 24.

```sh
git clone https://github.com/recondemon/henstek-sample-set-02.git
cd henstek-sample-set-02
npm ci
npm run dev
```

Open `http://127.0.0.1:4332`. The server builds and serves `docs/`; it does not watch for changes. Run `npm run build` after editing source. Browser samples need no API keys, accounts or runtime packages. See the platform guides for Xcode and Electron setup.

## Choose functionality and styling independently

Functional references: `set-02-website`, `set-02-iphone`, `set-02-desktop`. Visual references: `sa-02-web`, `sa-02-mobile`, `sa-02-desktop`.

For example: **“SA-02 / Mobile tickets with CF-01 / Web styling.”** [Prepare that mixed brief](https://henstek.dev/start?sample=set-02-iphone&style=cf-01-web). Set 01 is [Cedar & Fern](https://github.com/recondemon/henstek-sample-set-01). Record the source commit, requested functionality and visual reference when agreeing a commissioned scope.

A set number identifies a business scenario and design, not a software version. Alternate designs belong to later numbered repositories; improvements to this set keep the SA-02 labels.

## What is real, and what is illustrative

The interfaces, validation, local persistence and exports work. All people, businesses, releases, programme dates and prices are fictional. The venue and record imagery illustrate that fictional business. No music is streamed, no payments are taken and no actual seats are reserved.

Each app works independently. Website bookings are one browser-local preview; Pocket tickets live on that device; desktop bookings live in that app or browser. They do **not** synchronize or share accounts. Backups are specific to each app, not cross-platform exchange files. Production booking inventory, authentication, payments, notifications and store distribution need their own implementation and review.

Native verification covers iPhone Simulator and Apple silicon macOS. There is no App Store listing, signed desktop installer or claim of Windows/Android testing.

## Reuse

Code and included sample assets are [MIT licensed](LICENSE). Keep the notice when redistributing; third-party dependencies retain their own licenses. HensTek branding does not imply endorsement. Replace the fictional business identity and content for a real deployment. [Customer walkthrough](CUSTOMER-WALKTHROUGH.md) · [Verification](VERIFICATION.md) · [Contributing](CONTRIBUTING.md) · [Security](SECURITY.md).

## Checks

```sh
npm run build
npm test
npm run test:mobile
```

Node tests cover booking rules, import validation, aggregate capacity, native storage recovery, IPC origin checks and published asset paths. Swift checks cover archive validation, persistence and damaged-file preservation. GitHub Actions builds the iPhone simulator target as well.

Source lives in `samples/`, gallery source in `public/`, fictional backups in `fixtures/`, actual captures in `screenshots/`, and generated GitHub Pages output in `docs/`. Edit source and rebuild; do not hand-edit `docs/`.
