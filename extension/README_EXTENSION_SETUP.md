Home Maintenance Extension — setup & notes

Goal
---
Automatically extract tasks from a local PDF named "Home Maintenance Checklist.pdf", store tasks, and schedule notifications.

Limitations & Privacy
---------------------
- Browser security prevents a web extension from silently reading arbitrary folders without user consent. The approach implemented here requires a one-time user action to select the PDF file via a file-picker (options page). This is a single, explicit permission the user grants to allow automatic re-reading later.
- For full automation without any user action (place PDF in a folder and the extension reads it), you must install a native helper (Native Messaging host) to watch the folder and pass the file to the extension. See the "native_helper.md" section if you want that.

Files added
-----------
- `options.html` / `options.js` — UI to select PDF, force parse, clear tasks
- `pdfParser.js` — extracts text using `pdf.js` (pdfjs-dist) and parses tasks
- `taskManager.js` — stores tasks + file handle in IndexedDB and schedules alarms
- updated `background.js` — schedules alarms on startup, handles notifications

What you must do (pdf.js dependency)
-------------------------------------
Good news — `pdf.js` builds are already included in `extension/libs/pdfjs/` (pdf.js and pdf.worker.js, v3.9.179), so remote PDF parsing works out-of-the-box — no additional steps required.

If you prefer to update the runtime to a newer version, install `pdfjs-dist` and copy the builds into `extension/libs/pdfjs/` (or replace the files already there):

```bash
npm install pdfjs-dist
cp node_modules/pdfjs-dist/build/pdf.js extension/libs/pdfjs/
cp node_modules/pdfjs-dist/build/pdf.worker.js extension/libs/pdfjs/
```

How it works (summary)
----------------------
1. Open the extension options page (right-click the extension → Options).
2. Choose one of the following automatic sources:
   - Local PDF: Click "Select Home Maintenance Checklist.pdf" (one-time consent) and the extension will parse it and schedule tasks.
   - Remote JSON/PDF: Provide a remote URL (JSON or PDF) and enable remote auto-sync — the extension will poll the URL automatically and import tasks (no native helper required when using a remote URL).
3. The extension parses the source and populates tasks into IndexedDB.
4. The background service worker reads tasks and schedules alarms (using `chrome.alarms`). When an alarm fires, a notification is shown with Snooze and Mark done actions.

Remote JSON format example
--------------------------
The remote endpoint should return a JSON array of tasks. Each task object should include at least `title` and `dueDate` (ISO date or parsable date string). Example:

[
  { "title": "Change HVAC filter", "dueDate": "2026-03-10", "recurrence": "monthly" },
  { "title": "Inspect roof", "dueDate": "2026-06-01" }
]

Demo file included
------------------
A sample `tasks.json` is included at `extension/demo/tasks.json` for quick testing. You can use it as a remote URL (raw GitHub):

`https://raw.githubusercontent.com/mails4rditz/Reminder/master/extension/demo/tasks.json`

Use this URL in the extension `Options` → Remote URL, then click **Fetch now** or enable auto-sync to test the remote import flow.

CI smoke test
-------------
A smoke test is included that fetches the demo URL and validates the JSON schema (title and parseable `dueDate`). The test runs on push and pull requests via GitHub Actions. You can run it locally with:

```bash
node tests/smoke/test_remote_import.js
```

To test a different URL locally, set the `REMOTE_URL` environment variable before running the script.

Notes on PDF remote sources
---------------------------
- You can also point the remote URL to a PDF file; for automatic parsing the extension requires `pdf.js` to be present in `extension/libs/pdfjs/` (see the README section about adding `pdf.js`).
- If you host on GitHub (raw content) or GitHub Pages, ensure the file is publicly accessible and allows cross-origin requests (CORS).

Testing
-------
- Select your PDF, click "Force parse now". You should see parsed tasks appear on the options page.
- Click the popup and use actions to view tasks. The `Test Reminder` in the popup still works for quick checks.
- Use the service worker console (chrome://extensions → Service worker link) to see logs and errors.

Cross-browser notes
-------------------
- Chrome & Edge (Chromium): File System Access API and storing handles in IndexedDB works well. Background automation (reading file across restarts) should work after the one-time file pick.
- Firefox: File System Access API support is limited. In Firefox you may need to re-select the PDF or use the upload flow. Native Messaging works on all browsers but requires a small native program to be installed by the user.

If you want me to implement a Native Messaging host to watch a folder and push updates automatically, say so and I will provide a cross-platform native helper (Python or Node.js) and an updated extension manifest + host manifest.