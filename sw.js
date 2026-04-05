// ================================================================
// Flooring CRM — Service Worker
// Caches the app shell so it loads instantly, even offline
// ================================================================

const CACHE_NAME = 'flooring-crm-v1';

const CACHE_URLS = [
  './',
  './index.html',
  './manifest.json',
  'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700;900&family=DM+Sans:ital,opsz,wght@0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;0,9..40,800&display=swap',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
];

// ── Install: cache app shell ──
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CACHE_URLS).catch(() => {
        // Silently fail for cross-origin resources
      });
    })
  );
  self.skipWaiting();
});

// ── Activate: clean up old caches ──
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: network-first for API, cache-first for assets ──
self.addEventListener('fetch', (e) => {
  const url = e.request.url;

  // Let Supabase API calls pass through (always need fresh data)
  if (url.includes('supabase.co')) {
    return;
  }

  // Cache-first for fonts and CDN assets
  if (url.includes('fonts.googleapis.com') || url.includes('fonts.gstatic.com') || url.includes('cdn.jsdelivr.net')) {
    e.respondWith(
      caches.match(e.request).then((cached) =>
        cached || fetch(e.request).then((res) => {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((c) => c.put(e.request, clone));
          return res;
        })
      )
    );
    return;
  }

  // Network-first for HTML (get latest version)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Default: cache-first for everything else
  e.respondWith(
    caches.match(e.request).then((cached) =>
      cached || fetch(e.request)
    )
  );
});

// ── Push Notifications (if using OneSignal or similar) ──
self.addEventListener('push', (e) => {
  if (!e.data) return;
  const data = e.data.json();
  e.waitUntil(
    self.registration.showNotification(data.title || '🔔 New Lead!', {
      body:    data.body || 'You have a new lead. Tap to view.',
      icon:    './icon-192.png',
      badge:   './icon-192.png',
      vibrate: [200, 100, 200],
      data:    { url: data.url || './' },
      actions: [
        { action: 'view', title: '👁 View Lead' },
        { action: 'dismiss', title: 'Dismiss' },
      ]
    })
  );
});

self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  if (e.action === 'dismiss') return;
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((cs) => {
      if (cs.length > 0) {
        cs[0].focus();
        cs[0].navigate('./index.html');
      } else {
        clients.openWindow('./index.html');
      }
    })
  );
});
