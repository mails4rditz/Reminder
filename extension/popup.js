function openApp() {
    chrome.tabs.create({ url: chrome.runtime.getURL('app.html') });
}

function testReminder() {
    // Test notification
    chrome.notifications.create('test', {
        type: 'basic',
        iconUrl: chrome.runtime && chrome.runtime.getURL ? chrome.runtime.getURL('icon128.png') : 'icon128.png',
        title: 'Test Reminder',
        message: 'This is a test of the daily reminder!',
        requireInteraction: true
    });
}

// Attach event listeners (no inline handlers to satisfy CSP)
document.addEventListener('DOMContentLoaded', () => {
    const openBtn = document.getElementById('openAppBtn');
    const testBtn = document.getElementById('testReminderBtn');
    if (openBtn) openBtn.addEventListener('click', openApp);
    if (testBtn) testBtn.addEventListener('click', testReminder);
});