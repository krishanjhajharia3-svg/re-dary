importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

// ===== LEADO CRM — Background Notifications Service Worker =====
let scheduledNotifications = {};

self.addEventListener('install', function(e) {
  console.log('[SW] Installed');
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  console.log('[SW] Activated');
  e.waitUntil(self.clients.claim());
});

self.addEventListener('message', function(e) {
  if (!e.data) return;
  
  if (e.data.type === 'SCHEDULE_NOTIFICATION') {
    const data = e.data.data;
    const delay = data.scheduledTime - Date.now();
    if (delay <= 0) return;
    
    if (scheduledNotifications[data.leadId]) {
      clearTimeout(scheduledNotifications[data.leadId]);
    }
    
    scheduledNotifications[data.leadId] = setTimeout(function() {
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: 'https://krishanjhajharia3-svg.github.io/icon-192.png',
        tag: 'followup-' + data.leadId,
        requireInteraction: true,
        vibrate: [200, 100, 200],
        data: { leadId: data.leadId },
        actions: [
          { action: 'open', title: '📞 Call Karein' },
          { action: 'dismiss', title: '✕ Baad Mein' }
        ]
      });
      delete scheduledNotifications[data.leadId];
    }, delay);
  }
  
  if (e.data.type === 'CANCEL_NOTIFICATION') {
    if (scheduledNotifications[e.data.leadId]) {
      clearTimeout(scheduledNotifications[e.data.leadId]);
      delete scheduledNotifications[e.data.leadId];
    }
  }
});

self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  if (e.action === 'dismiss') return;
  const leadId = e.notification.data && e.notification.data.leadId;
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clients) {
        for (let client of clients) {
          if (client.url.includes('krishanjhajharia3-svg.github.io')) {
            client.focus();
            if (leadId) client.postMessage({ type: 'OPEN_LEAD', leadId: leadId });
            return;
          }
        }
        return self.clients.openWindow('https://krishanjhajharia3-svg.github.io/');
      })
  );
});

self.addEventListener('push', function(e) {
  if (!e.data) return;
  try {
    const data = e.data.json();
    e.waitUntil(
      self.registration.showNotification(data.title || 'Leado CRM', {
        body: data.body || 'Follow-up reminder!',
        icon: 'https://krishanjhajharia3-svg.github.io/icon-192.png',
        requireInteraction: true,
        vibrate: [200, 100, 200]
      })
    );
  } catch(err) {}
});
