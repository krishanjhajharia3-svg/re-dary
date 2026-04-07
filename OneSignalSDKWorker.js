importScripts('https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.sw.js');

// ===== LEADO CRM — Background Notifications =====

// Scheduled notifications store
let scheduledNotifications = {};

// Service Worker install
self.addEventListener('install', function(e) {
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(self.clients.claim());
});

// App se message aane pe
self.addEventListener('message', function(e) {
  if (!e.data) return;
  
  if (e.data.type === 'SCHEDULE_NOTIFICATION') {
    const data = e.data.data;
    const delay = data.scheduledTime - Date.now();
    
    if (delay <= 0) return;
    
    // Purana timer clear karo
    if (scheduledNotifications[data.leadId]) {
      clearTimeout(scheduledNotifications[data.leadId]);
    }
    
    // Naya timer set karo
    scheduledNotifications[data.leadId] = setTimeout(function() {
      self.registration.showNotification(data.title, {
        body: data.body,
        icon: 'https://krishanjhajharia3-svg.github.io/re-dary/icon-192.png',
        badge: 'https://krishanjhajharia3-svg.github.io/re-dary/icon-192.png',
        tag: 'followup-' + data.leadId,
        requireInteraction: true,
        vibrate: [200, 100, 200, 100, 200],
        data: { leadId: data.leadId, url: '/' },
        actions: [
          { action: 'call', title: '📞 Call Karein' },
          { action: 'dismiss', title: '✕ Baad Mein' }
        ]
      });
      delete scheduledNotifications[data.leadId];
    }, delay);
    
    console.log('[SW] Notification scheduled for lead:', data.leadId, 'in', Math.round(delay/60000), 'minutes');
  }
  
  if (e.data.type === 'CANCEL_NOTIFICATION') {
    const leadId = e.data.leadId;
    if (scheduledNotifications[leadId]) {
      clearTimeout(scheduledNotifications[leadId]);
      delete scheduledNotifications[leadId];
    }
  }
});

// Notification pe click
self.addEventListener('notificationclick', function(e) {
  e.notification.close();
  
  if (e.action === 'dismiss') return;
  
  const leadId = e.notification.data && e.notification.data.leadId;
  const urlToOpen = self.registration.scope;
  
  e.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then(function(clients) {
        // App already open hai toh focus karo
        for (let client of clients) {
          if (client.url.includes(self.registration.scope)) {
            client.focus();
            if (leadId) client.postMessage({ type: 'OPEN_LEAD', leadId: leadId });
            return;
          }
        }
        // App band hai toh kholo
        return self.clients.openWindow(urlToOpen);
      })
  );
});

// Push notification receive karo (OneSignal se)
self.addEventListener('push', function(e) {
  if (!e.data) return;
  
  try {
    const data = e.data.json();
    const title = data.title || '📞 Leado CRM';
    const body = data.body || 'Follow-up reminder!';
    
    e.waitUntil(
      self.registration.showNotification(title, {
        body: body,
        icon: 'https://krishanjhajharia3-svg.github.io/re-dary/icon-192.png',
        badge: 'https://krishanjhajharia3-svg.github.io/re-dary/icon-192.png',
        requireInteraction: true,
        vibrate: [200, 100, 200]
      })
    );
  } catch(err) {
    console.log('[SW] Push error:', err);
  }
});
