// content.js — injected into pages
// Minimal, safe placeholder that demonstrates messaging with the extension.

console.log('HomeMaintenance content script loaded');

// Insert a small unobtrusive banner at the top of the page (for demo only)
(function(){
    try {
        const bannerId = 'home-maintenance-banner';
        if (document.getElementById(bannerId)) return;
        const banner = document.createElement('div');
        banner.id = bannerId;
        banner.style.position = 'fixed';
        banner.style.top = '0';
        banner.style.left = '0';
        banner.style.right = '0';
        banner.style.padding = '6px 10px';
        banner.style.background = 'rgba(76,175,80,0.95)';
        banner.style.color = 'white';
        banner.style.fontFamily = 'Arial, sans-serif';
        banner.style.fontSize = '13px';
        banner.style.zIndex = 2147483647;
        banner.style.textAlign = 'center';
        banner.textContent = 'Home Maintenance extension active — click the extension icon for actions.';

        const close = document.createElement('button');
        close.textContent = '×';
        close.style.marginLeft = '10px';
        close.style.border = 'none';
        close.style.background = 'transparent';
        close.style.color = 'white';
        close.style.fontSize = '16px';
        close.style.cursor = 'pointer';
        close.onclick = () => banner.remove();

        banner.appendChild(close);
        document.documentElement.appendChild(banner);
        // push page content down a little so banner doesn't cover things
        document.documentElement.style.paddingTop = '34px';
    } catch (e) {
        console.warn('HomeMaintenance content script error', e);
    }
})();

// Listen for messages from the extension
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg && msg.type === 'PING_FROM_EXTENSION') {
        sendResponse({ reply: 'pong', url: window.location.href });
    }
});
