// Open the bundled app page when notifications are clicked.
// Use the extension's internal app page so the extension is self-contained.
const APP_URL = chrome.runtime && chrome.runtime.getURL
    ? chrome.runtime.getURL('app.html')
    : 'app.html';

// Set up daily alarm at 9 AM
chrome.runtime.onInstalled.addListener(() => {
    chrome.alarms.create('dailyReminder', {
        delayInMinutes: getMinutesUntil9AM(),
        periodInMinutes: 24 * 60 // Repeat daily
    });
});

// Listen for alarm
chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === 'dailyReminder') {
        showReminderNotification();
    }
});

// Show notification
function showReminderNotification() {
    chrome.notifications.create('reminder', {
        type: 'basic',
        iconUrl: chrome.runtime && chrome.runtime.getURL ? chrome.runtime.getURL('icon128.png') : 'icon128.png',
        title: 'Home Maintenance Reminder',
        message: 'Time to check your home maintenance tasks!',
        buttons: [{ title: 'Open App' }],
        requireInteraction: true
    });
}

// Handle notification click
chrome.notifications.onButtonClicked.addListener((notificationId, buttonIndex) => {
    if (notificationId === 'reminder' && buttonIndex === 0) {
        // Open the hosted web app
        chrome.tabs.create({ url: APP_URL });
    }
});

chrome.notifications.onClicked.addListener((notificationId) => {
    if (notificationId === 'reminder') {
        chrome.tabs.create({ url: APP_URL });
    }
});

// Calculate minutes until 9 AM
function getMinutesUntil9AM() {
    const now = new Date();
    const nineAM = new Date(now);
    nineAM.setHours(9, 0, 0, 0);
    
    if (now > nineAM) {
        nineAM.setDate(nineAM.getDate() + 1);
    }
    
    return Math.floor((nineAM - now) / (1000 * 60));
}