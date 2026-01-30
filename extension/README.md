# Home Maintenance Reminder Extension

This folder contains a Chrome extension that shows a daily reminder at 9 AM and opens the Home Maintenance web app.

Files:
- `manifest.json` - extension manifest (MV3)
- `background.js` - alarm and notification handler
- `popup.html` - popup UI
- `popup.js` - popup scripts
- `icon16.png`, `icon48.png`, `icon128.png` - icon placeholders (replace with real PNGs)

Local installation (Developer mode):
1. Open Chrome and go to `chrome://extensions/`.
2. Enable "Developer mode" (top-right).
3. Click "Load unpacked" and select the `extension` folder from this repo.
4. Grant notification permission if prompted.

Testing the extension:
- Click the extension icon and use the "Test Reminder" button in the popup.
- The extension creates a daily alarm scheduled for 9 AM local time.

Packaging:
- A zip archive `Reminder-extension.zip` (created alongside the repo root) contains the extension files for distribution.

Publishing to Chrome Web Store:
- You will need a Google Developer account and a one-time $5 developer registration fee.
- Follow the Chrome Web Store publishing flow and upload the zip.

Notes:
- This extension uses Chrome's `alarms` and `notifications` APIs; it works best in Chrome on desktop. Android extension support is limited.
- Replace the placeholder icons with real PNG files (16x16, 48x48, 128x128).
- The extension opens the local `index.html` via a tab URL; when publishing, update the URL to your GitHub Pages URL (e.g., `https://mails4rditz.github.io/Reminder/`).
 - The extension opens the hosted app URL defined in `background.js` (`APP_URL`). By default it is set to `https://mails4rditz.github.io/Reminder/`. If you host the web app elsewhere, update `APP_URL` in `extension/background.js`.
