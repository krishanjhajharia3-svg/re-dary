const CACHE = 're-diary-v1';
const ASSETS = ['./index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request).catch(() => caches.match('./index.html')))
  );
});

// Push Notifications for Follow-Up reminders
self.addEventListener('push', e => {
  const data = e.data ? e.data.json() : {};
  e.waitUntil(
    self.registration.showNotification(data.title || '🏠 RE Diary Follow-Up!', {
      body: data.body || 'आज follow-up pending है!',
      icon: '🏠',
      badge: '🏠',
      tag: 'followup',
      requireInteraction: true,
      actions: [
        { action: 'call', title: '📞 Call करें' },
        { action: 'dismiss', title: 'बाद में' }
      ]
    })
  );
});

self.addEventListener('notificationclick', e => {
  e.notification.close();
  if (e.action === 'call') {
    self.clients.openWindow('./index.html#followup');
  } else {
    self.clients.openWindow('./index.html');
  }
});
