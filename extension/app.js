// app.js — external script for app.html (avoids inline script for CSP compliance)
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('testPing');
    const result = document.getElementById('result');
    if (!btn) return;

    btn.addEventListener('click', async () => {
        try {
            const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            const tab = tabs && tabs[0];
            if (!tab || !tab.id) {
                result.textContent = 'No active tab found.';
                return;
            }

            chrome.tabs.sendMessage(tab.id, { type: 'PING_FROM_EXTENSION' }, (resp) => {
                if (chrome.runtime.lastError) {
                    result.textContent = 'No content script in tab or page blocked messaging.';
                    return;
                }
                result.textContent = 'Reply: ' + JSON.stringify(resp);
            });
        } catch (e) {
            result.textContent = 'Error: ' + e.message;
        }
    });
});
