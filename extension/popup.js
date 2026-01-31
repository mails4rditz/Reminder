function openApp() {
    chrome.tabs.create({ url: chrome.runtime.getURL('app.html') });
}

async function testReminder() {
    // Test notification — build options explicitly and validate
    const options = (async ()=>{
        // prefer generated icon
        let iconUrl = null;
        try{
            const iconMeta = await TaskManager.getMeta('icon128');
            iconUrl = iconMeta;
        }catch(e){ console.warn('Could not read icon meta', e); }
        return {
            type: 'basic',
            iconUrl: iconUrl || (chrome.runtime && chrome.runtime.getURL ? chrome.runtime.getURL('icon128.png') : 'icon128.png'),
            title: 'Test Reminder',
            message: 'This is a test of the daily reminder!',
            requireInteraction: true
        };
    })();

    const finalOptions = await options;

    console.log('Creating notification with options:', finalOptions);

    // Basic validation to avoid missing-property errors
    if (!finalOptions.type || !finalOptions.title || !finalOptions.message) {
        console.error('Notification options missing required properties', finalOptions);
        alert('Notification options invalid; check console.');
        return;
    }

    chrome.notifications.create('test', finalOptions, (id) => {
        if (chrome.runtime.lastError) {
            console.error('Notification create error:', chrome.runtime.lastError);
            alert('Notification error: ' + chrome.runtime.lastError.message);
        } else {
            console.log('Notification created:', id);
        }
    });
} 

// Attach event listeners (no inline handlers to satisfy CSP)
document.addEventListener('DOMContentLoaded', () => {
    const openBtn = document.getElementById('openAppBtn');
    const testBtn = document.getElementById('testReminderBtn');
    if (openBtn) openBtn.addEventListener('click', openApp);
    if (testBtn) testBtn.addEventListener('click', testReminder);
});