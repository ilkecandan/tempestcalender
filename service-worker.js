// Update the cache version whenever you change files
const CACHE_NAME = 'tempest-content-calendar-v6';

const urlsToCache = [
  './',
  './index.html',
  './about.html',
  './manifest.json',
  './images/background.webp',
  './icons/icon-192.png',
  './icons/icon-512.png',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css'
];

// Install Service Worker and Cache Files
self.addEventListener('install', (event) => {
  console.log('[SW] Installing…');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Pre-caching app shell');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('[SW] Cache addAll error:', error);
      })
  );
  self.skipWaiting();
});

// Activate Service Worker and Remove Old Caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating…');
  event.waitUntil(
    caches.keys().then((cacheNames) =>
      Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      )
    )
  );
  self.clients.claim();
});

// Fetch Handler: Cache-first with Navigation Fallback
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Handle navigation requests (HTML pages)
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Try fetching from the network first
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE_NAME);
          cache.put(req, fresh.clone()); // update cache
          return fresh;
        } catch (err) {
          console.warn('[SW] Offline fallback for navigation:', req.url);
          return caches.match('./index.html'); // fallback to app shell
        }
      })()
    );
    return;
  }

  // For other requests (CSS/JS/images), cache-first
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) {
        return cached;
      }
      return fetch(req).then((networkRes) => {
        // Cache new resources
        return caches.open(CACHE_NAME).then((cache) => {
          cache.put(req, networkRes.clone());
          return networkRes;
        });
      }).catch((err) => {
        console.error('[SW] Fetch failed:', err);
      });
    })
  );
});
