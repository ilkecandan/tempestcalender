// Update the cache version whenever you change files
const CACHE_NAME = 'tempest-content-calendar-v7';

// Use absolute paths for GitHub Pages (/tempestcalender/ repo path)
const PREFIX = '/tempestcalender/';

const urlsToCache = [
  `${PREFIX}`,
  `${PREFIX}index.html`,
  `${PREFIX}about.html`,
  `${PREFIX}manifest.json`,
  `${PREFIX}images/background.webp`,
  // real icon files (match your manifest)
  `${PREFIX}images/icon-192.png`,
  `${PREFIX}images/icon-512.png`,
  // third-party CDNs (opaque responses are fine to cache)
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
      .catch((error) => {
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

// Fetch Handler: Cache-first for assets, Network-first for navigation with offline fallback
self.addEventListener('fetch', (event) => {
  const req = event.request;

  // Only handle GET requests
  if (req.method !== 'GET') return;

  // Handle navigation requests (HTML pages)
  if (req.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          // Prefer fresh content
          const fresh = await fetch(req);
          const cache = await caches.open(CACHE_NAME);
          // Cache the page for offline nav later
          cache.put(req, fresh.clone());
          return fresh;
        } catch (err) {
          console.warn('[SW] Offline fallback for navigation:', req.url, err);
          // Always fallback to the app shell
          return caches.match(`${PREFIX}index.html`);
        }
      })()
    );
    return;
  }

  // For other requests (CSS/JS/images/fonts), do cache-first and then update dynamically
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) {
        // Return cached fast
        return cached;
      }
      // Fetch from network and stash a copy (same-origin only to avoid weird opaque entries)
      return fetch(req)
        .then((networkRes) => {
          // Only cache basic/opaque/cors GET responses
          const shouldCache =
            networkRes &&
            (networkRes.type === 'basic' || networkRes.type === 'opaque' || networkRes.type === 'cors') &&
            networkRes.status === 200;

          if (shouldCache) {
            caches.open(CACHE_NAME).then((cache) => {
              try {
                cache.put(req, networkRes.clone());
              } catch (e) {
                // Some requests (e.g., cross-origin with no-cors) may fail put(); ignore
                console.debug('[SW] cache.put skipped:', e);
              }
            });
          }
          return networkRes;
        })
        .catch((err) => {
          console.error('[SW] Fetch failed:', err);
          // Optional: serve a tiny offline image/page here if you have one
        });
    })
  );
});
