NFC scanner

This app includes a simple NFC scanner component using `react-native-nfc-manager`.

Important notes
- Expo Go does NOT include native NFC support by default. To use NFC you must either:
  - Eject to the bare workflow (run `expo prebuild` / `eas build`) and install the native module, or
  - Build a custom development client that includes `react-native-nfc-manager` (recommended if you want to stay on managed workflow).

Installation (recommended - custom dev client / bare):

1. In the `mobile` folder, install dependencies:

	npm install

2. If staying in the managed workflow, create a custom dev client with EAS and include `react-native-nfc-manager` in plugins. Example commands are below.

3. If using the bare workflow, run:

	npx pod-install ios

4. Android: ensure NFC is enabled on the device and your AndroidManifest includes NFC permissions (the library handles this when linked).

Usage

- Open the app on a real device (NFC is not available in simulators/emulators).
- Tap "Start scan" and bring an NFC tag near the device. The app will show raw JSON and parsed NDEF text when available.

Limitations and troubleshooting
- iOS requires NFC entitlement (Near Field Communication Tag Reading). If you build with a custom dev client or the bare workflow, enable the capability in Xcode.
- Expo Go will not work out-of-the-box for NFC. Use a custom dev client or production build.
- Test on physical hardware with NFC support.

Files
- `components/NFCScanner.js` — the NFC scan UI & logic.
- `App.js` — mounts the scanner.

Quick: build a custom dev client with EAS

1. Install EAS CLI (if you haven't):

	npm install -g eas-cli

2. Log in and configure project credentials (only needed first time):

	eas login
	eas build:configure

3. Build a development client (Android example):

	eas build --profile development --platform android

	For iOS (requires Apple account and proper signing):

	eas build --profile development --platform ios

4. Install the produced build on your device. For Android you'll get an .apk you can install. For iOS you'll need TestFlight or a local install with Xcode/Apple signing.

Platform checklist

- iOS: enable "Near Field Communication Tag Reading" capability in Xcode for the built app.
- Android: NFC must be enabled on the device. The native module will add required manifest entries when linked.

