// app.js — external script for app.html (avoids inline script for CSP compliance)
document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('testPing');
    const result = document.getElementById('result');
    if (!btn) return;

    btn.addEventListener('click', async () => {
        try {
            let tabs = await chrome.tabs.query({ active: true, currentWindow: true });
            let tab = tabs && tabs[0];
            if (!tab || !tab.id) {
                result.textContent = 'No active tab found.';
                return;
            }

            // If active tab is not http(s), try to find any http(s) tab in current window
            const url = tab.url || '';
            if (!url.startsWith('http://') && !url.startsWith('https://')) {
                const allTabs = await chrome.tabs.query({ currentWindow: true });
                const other = allTabs.find(t => t.url && (t.url.startsWith('http://') || t.url.startsWith('https://')));
                if (other) {
                    tab = other;
                } else {
                    result.textContent = `Cannot inject content script into this page (url: ${url}). Use 'Open Test Page & Ping' to open an example site.`;
                    return;
                }
            }

            await injectAndPing(tab);
        } catch (e) {
            result.textContent = 'Error: ' + e.message;
        }
    });

    // Open a test page (example.com) in a tab if none available, then inject and ping
    const openBtn = document.getElementById('openTestPageBtn');
    if (openBtn) openBtn.addEventListener('click', async () => {
        try {
            result.textContent = 'Opening test page...';
            const tab = await findOrOpenHttpTab();
            if (!tab || !tab.id) { result.textContent = 'Could not open test page.'; return; }
            await injectAndPing(tab);
        } catch (e) {
            result.textContent = 'Error: ' + e.message;
        }
    });

    async function findOrOpenHttpTab(){
        // Look for http(s) tab in current window
        const tabs = await chrome.tabs.query({ currentWindow: true });
        const found = tabs.find(t => t.url && (t.url.startsWith('http://') || t.url.startsWith('https://')));
        if (found) return found;
        // Create a new tab and wait until it loads (or timeout)
        const created = await chrome.tabs.create({ url: 'https://example.com' });
        return await new Promise((resolve) => {
            const onUpdated = (tabId, info, updatedTab) => {
                if (tabId === created.id && info.status === 'complete'){
                    chrome.tabs.onUpdated.removeListener(onUpdated);
                    resolve(updatedTab);
                }
            };
            chrome.tabs.onUpdated.addListener(onUpdated);
            // fallback after 10s
            setTimeout(async () => {
                chrome.tabs.onUpdated.removeListener(onUpdated);
                try { const t = await chrome.tabs.get(created.id); resolve(t); } catch(e){ resolve(created); }
            }, 10000);
        });
    }

    async function injectAndPing(tab){
        try {
            // Try to inject content script if not present
            try {
                await chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content.js'] });
                console.log('Injected content script into tab', tab.id);
            } catch (injErr) {
                console.warn('Could not inject content script:', injErr);
            }
            // Send ping
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
    }
});
