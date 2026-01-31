// Diagnostic: service worker bootstrap
console.log('Service worker initializing: background.js');
try{
    // Import helper (remote sync) — wrapped to surface import errors
    importScripts('remoteSync.js');
    console.log('imported remoteSync.js successfully');
}catch(err){
    console.error('Failed to import scripts in service worker:', err);
}

// Life-cycle logging
self.addEventListener('install', (evt) => {
    console.log('Service worker install event');
});
self.addEventListener('activate', (evt) => {
    console.log('Service worker activate event');
});

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
    const options = {
        type: 'basic',
        iconUrl: chrome.runtime && chrome.runtime.getURL ? chrome.runtime.getURL('icon128.png') : 'icon128.png',
        title: 'Home Maintenance Reminder',
        message: 'Time to check your home maintenance tasks!',
        buttons: [{ title: 'Open App' }],
        requireInteraction: true
    };

    console.log('Background: creating notification with options:', options);

    // Validate required properties
    if (!options.type || !options.title || !options.message) {
        console.error('Background: notification options missing required properties', options);
        return;
    }

    chrome.notifications.create('reminder', options, (id) => {
        if (chrome.runtime.lastError) {
            console.error('Notification create error (background):', chrome.runtime.lastError);
        } else {
            console.log('Notification created (background):', id);
        }
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

// On startup, load tasks and schedule alarms
chrome.runtime.onStartup.addListener(async () => {
    console.log('Service worker starting: scheduling alarms from stored tasks');
    try{
        // schedule alarms; TaskManager.scheduleAlarmsForAllTasks lives in options loaded contexts,
        // but background can query tasks via IndexedDB directly here.
        // We'll use the same approach as TaskManager.getAllTasks but reimplement minimal read here.
        const db = await (async ()=>{
            return new Promise((resolve, reject) => {
                const req = indexedDB.open('home-maintenance-db');
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
        })();
        const tx = db.transaction('tasks', 'readonly');
        const req = tx.objectStore('tasks').getAll();
        req.onsuccess = () => {
            const tasks = req.result || [];
            tasks.forEach(task => {
                if(task.completed) return;
                const when = new Date(task.dueDate).getTime();
                if(isNaN(when)) return;
                if(when - Date.now() <= 0) chrome.alarms.create('task-' + task.id, { delayInMinutes: 0.1 });
                else chrome.alarms.create('task-' + task.id, { when });
            });
            console.log('Scheduled', tasks.length, 'task alarms');
        };

        // Also schedule remote-sync alarm if enabled
        try{
            const metaDb = await (async ()=>{
                return new Promise((resolve, reject) => {
                    const req = indexedDB.open('home-maintenance-db');
                    req.onsuccess = () => resolve(req.result);
                    req.onerror = () => reject(req.error);
                });
            })();
            const tx2 = metaDb.transaction('meta','readonly');
            const r = tx2.objectStore('meta').get('remoteEnabled');
            r.onsuccess = async () => {
                if(r.result && r.result.value){
                    const pmReq = tx2.objectStore('meta').get('remotePollMinutes');
                    pmReq.onsuccess = () => {
                        const mins = (pmReq.result && pmReq.result.value) || 1440;
                        chrome.alarms.create('remote-sync', { periodInMinutes: mins });
                        console.log('Scheduled remote-sync every', mins, 'minutes');
                    };
                }
            };
        }catch(e){ console.warn('Could not schedule remote-sync at startup', e); }

    }catch(e){ console.error('startup schedule error', e); }
});

// Listen for schedule update messages
chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
    if(msg && msg.type === 'update-remote-schedule'){
        // read meta and update alarm
        const db = await (async ()=>{
            return new Promise((resolve, reject) => {
                const req = indexedDB.open('home-maintenance-db');
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
        })();
        const tx = db.transaction('meta','readonly');
        const r1 = tx.objectStore('meta').get('remoteEnabled');
        r1.onsuccess = () => {
            const enabled = r1.result && r1.result.value;
            const r2 = tx.objectStore('meta').get('remotePollMinutes');
            r2.onsuccess = () => {
                const mins = (r2.result && r2.result.value) || 1440;
                if(enabled) chrome.alarms.create('remote-sync', { periodInMinutes: mins });
                else chrome.alarms.clear('remote-sync');
                sendResponse({ ok: true });
            };
        };
        return true; // indicate async response
    }
});


// On installation, open options to let user select the PDF
chrome.runtime.onInstalled.addListener((details) => {
    if(details.reason === 'install'){
        chrome.runtime.openOptionsPage();
    }
});

// Handle alarms for tasks and remote-sync
chrome.alarms.onAlarm.addListener(async (alarm) => {
    if(!alarm || !alarm.name) return;

    if(alarm.name === 'remote-sync'){
        // perform remote sync
        try{
            const db = await (async ()=>{
                return new Promise((resolve, reject) => {
                    const req = indexedDB.open('home-maintenance-db');
                    req.onsuccess = () => resolve(req.result);
                    req.onerror = () => reject(req.error);
                });
            })();
            const tx = db.transaction('meta','readonly');
            const r = tx.objectStore('meta').get('remoteUrl');
            r.onsuccess = async () => {
                const url = r.result && r.result.value;
                if(!url) { console.warn('remote-sync: no URL configured'); return; }
                try{
                    const res = await RemoteSync.fetchRemoteAndImport(url);
                    if(res.tasks && res.tasks.length){
                        // store tasks in db
                        const db3 = await (async ()=>{
                            return new Promise((resolve, reject) => {
                                const req = indexedDB.open('home-maintenance-db');
                                req.onsuccess = () => resolve(req.result);
                                req.onerror = () => reject(req.error);
                            });
                        })();
                        const tx3 = db3.transaction('tasks','readwrite');
                        const store3 = tx3.objectStore('tasks');
                        res.tasks.forEach(t => {
                            t.id = t.id || crypto.randomUUID();
                            store3.put(t);
                        });
                        tx3.oncomplete = () => console.log('remote-sync stored', res.tasks.length, 'tasks');
                        // schedule alarms
                        res.tasks.forEach(task => {
                            if(task.completed) return;
                            const when = new Date(task.dueDate).getTime();
                            if(isNaN(when)) return;
                            if(when - Date.now() <= 0) chrome.alarms.create('task-' + task.id, { delayInMinutes: 0.1 });
                            else chrome.alarms.create('task-' + task.id, { when });
                        });
                    }else{
                        console.log('remote-sync: no tasks found');
                    }
                }catch(e){ console.error('remote-sync error', e); }
            };
        }catch(e){ console.error('remote-sync error', e); }
        return;
    }

    if(alarm.name.startsWith('task-')){
        const id = alarm.name.replace('task-','');
        // read task
        const db = await (async ()=>{
            return new Promise((resolve, reject) => {
                const req = indexedDB.open('home-maintenance-db');
                req.onsuccess = () => resolve(req.result);
                req.onerror = () => reject(req.error);
            });
        })();
        const tx = db.transaction('tasks', 'readwrite');
        const store = tx.objectStore('tasks');
        const r = store.get(id);
        r.onsuccess = () => {
            const task = r.result;
            if(!task) return;
            // create notification with actions: snooze (1h), done
            (async ()=>{
                // Prefer generated data URL icons if present
                let iconUrl = null;
                try{
                    const db = await (async ()=>{
                        return new Promise((resolve, reject) => {
                            const req = indexedDB.open('home-maintenance-db');
                            req.onsuccess = () => resolve(req.result);
                            req.onerror = () => reject(req.error);
                        });
                    })();
                    const tx2 = db.transaction('meta','readonly');
                    const r2 = tx2.objectStore('meta').get('icon128');
                    r2.onsuccess = () => { iconUrl = r2.result ? r2.result.value : null; };
                    await new Promise(res => tx2.oncomplete = res);
                }catch(e){ console.warn('icon meta read failed', e); }

                const options = {
                    type: 'basic',
                    title: task.title,
                    message: 'Due: ' + task.dueDate,
                    requireInteraction: true,
                    buttons: [{ title: 'Snooze 1h' }, { title: 'Mark done' }]
                };
                if(iconUrl) options.iconUrl = iconUrl;
                else options.iconUrl = chrome.runtime && chrome.runtime.getURL ? chrome.runtime.getURL('icon128.png') : 'icon128.png';
                chrome.notifications.create('task-' + task.id, options, (nid) => {
                    if(chrome.runtime.lastError) console.error('notify err', chrome.runtime.lastError);
                    else console.log('notification created', nid);
                });
            })();
        };
    }
});

// Notification button actions
chrome.notifications.onButtonClicked.addListener(async (notificationId, buttonIndex) => {
    if(notificationId && notificationId.startsWith('task-')){
        const id = notificationId.replace('task-','');
        if(buttonIndex === 0){
            // Snooze: reschedule alarm 1 hour later
            chrome.alarms.create('task-' + id, { delayInMinutes: 60 });
            chrome.notifications.clear(notificationId);
        } else if(buttonIndex === 1){
            // Mark done
            const db = await (async ()=>{
                return new Promise((resolve, reject) => {
                    const req = indexedDB.open('home-maintenance-db');
                    req.onsuccess = () => resolve(req.result);
                    req.onerror = () => reject(req.error);
                });
            })();
            const tx = db.transaction('tasks','readwrite');
            const store = tx.objectStore('tasks');
            const r = store.get(id);
            r.onsuccess = () => {
                const t = r.result; if(!t) return;
                t.completed = true; t.completedAt = new Date().toISOString();
                store.put(t);
                chrome.notifications.clear(notificationId);
            };
        }
    }
});