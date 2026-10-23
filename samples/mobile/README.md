# SA-02 / Mobile — Side A Pocket

A native SwiftUI iPhone sample. Requires macOS and Xcode with an iOS simulator; deployment target is iOS 17. No external Swift packages or account setup are needed for the simulator.

Open `SideAPocket.xcodeproj`, select the SideAPocket target and an iPhone simulator, then Run. A physical-device build needs your own signing configuration. This sample is not published to the App Store.

Discover shows the fictional programme. My tickets contains a seeded example and supports local bookings/cancellation. My crate saves fictional releases. Each session allows one ticket per archive, with a maximum of six guests bounded by that session’s availability. Export/import on My tickets provides a versioned JSON backup. Import asks before replacing local data.

Files live under the app’s Application Support `SideAPocket` directory: `pocket.json` and `pocket.previous.json`. Saves preserve the previous valid revision and use atomic writes. Invalid saved data blocks writes so it is not silently replaced. For recovery, stop the app, preserve both files, validate the previous export and restore it as `pocket.json`, then relaunch. These sample backups are plaintext; use fictional data.

The native archive is distinct from the website’s ticket download and desktop guest-list archive. The three apps do not synchronize.

From the root:

```sh
npm run test:mobile
xcodebuild -project samples/mobile/SideAPocket.xcodeproj -scheme SideAPocket -sdk iphonesimulator -configuration Debug -derivedDataPath build/mobile CODE_SIGNING_ALLOWED=NO build
```

The screenshot is captured from the native iPhone Simulator. Android and iPad editions are not included.
