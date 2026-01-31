Load the extension for testing (quick guide)

• Important: Load the `extension/` folder (not the repository root) in Chrome when using "Load unpacked".

Steps (Chrome):
1. Open chrome://extensions
2. Toggle **Developer mode** (top-right)
3. Click **Load unpacked**
4. Select the folder: `/Users/u229898/Lab/HomeMaintence/extension`

Notes & tips:
- If you see a service worker registration error, open the extension's Service worker console (click "background page / service worker (link)" in chrome://extensions) and inspect logs — you'll see the start-up logs `Service worker initializing: background.js` and any errors from `importScripts`.
- Use the Options page to configure remote URL or pick a PDF and click **Force parse now**.
- If Chrome reports you loaded the wrong manifest, ensure the selected folder contains `manifest.json` with `manifest_version: 3` (the `extension/` folder does).
