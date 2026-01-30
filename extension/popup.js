function openApp() {
    chrome.tabs.create({ url: chrome.runtime.getURL('../index.html') });
}

function testReminder() {
    // Test notification
    chrome.notifications.create('test', {
        type: 'basic',
        iconUrl: 'icon128.png',
        title: 'Test Reminder',
        message: 'This is a test of the daily reminder!',
        requireInteraction: true
    });
}