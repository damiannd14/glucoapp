// GlucoApp Service Worker
const CACHE = 'glucoapp-v1';
let scheduledAlarms = [];

self.addEventListener('install', e => {
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(clients.claim());
});

// Receive messages from main app
self.addEventListener('message', e => {
  if (!e.data) return;

  if (e.data.type === 'SHOW_NOTIF') {
    showNotif(e.data.title, e.data.body);
  }

  if (e.data.type === 'SCHEDULE_ALARMS') {
    scheduledAlarms = e.data.alarms || [];
    // Start polling
    pollAlarms();
  }
});

function showNotif(title, body) {
  const ICON = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0id2hpdGUiLz48Y2lyY2xlIGN4PSI1MCIgY3k9IjUwIiByPSI0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNDk3OGJkIiBzdHJva2Utd2lkdGg9IjE1Ii8+PC9zdmc+';
  return self.registration.showNotification(title, {
    body,
    icon: ICON,
    badge: ICON,
    vibrate: [300, 100, 300],
    requireInteraction: true,
    tag: 'glucoapp-' + Date.now()
  });
}

function pollAlarms() {
  const now = Date.now();
  const remaining = [];
  scheduledAlarms.forEach(alarm => {
    const diff = now - alarm.time;
    if (diff >= 0 && diff < 3 * 60 * 1000) {
      // Within 3 min window — fire it
      showNotif(alarm.title, alarm.body);
    } else if (alarm.time > now) {
      // Still in the future — keep
      remaining.push(alarm);
    }
  });
  scheduledAlarms = remaining;
  if (scheduledAlarms.length > 0) {
    // Check again in 30 seconds
    setTimeout(pollAlarms, 30000);
  }
}

// When notification is tapped — open app
self.addEventListener('notificationclick', e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(cs => {
      if (cs.length > 0) return cs[0].focus();
      return clients.openWindow('/');
    })
  );
});
