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

            // Don't attempt to inject into special pages
            const url = tab.url || '';
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                result.textContent = `Cannot inject content script into this page (url: ${url}). Try a regular http(s) page.`;
                return;
            }

            // Try to inject content script if not present
            try {
                await chrome.scripting.executeScript({
                    target: { tabId: tab.id },
                    files: ['content.js']
                });
                console.log('Injected content script into tab', tab.id);
            } catch (injErr) {
                console.warn('Could not inject content script:', injErr);
                // Continue — message may still reach if already present
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
