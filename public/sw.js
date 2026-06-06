const CACHE_NAME = 'eladma-pwa-cache-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// 1. Install event: Precache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Caching app shell');
      return cache.addAll(STATIC_ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// 2. Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('[Service Worker] Clearing old cache', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Helper: Check if the request is for an image
const isImageRequest = (request) => {
  return (
    request.destination === 'image' ||
    request.url.match(/\.(png|jpg|jpeg|gif|svg|webp|ico)/) ||
    request.url.includes('images') ||
    request.url.includes('picsum.photos')
  );
};

// 3. Fetch event: Direct intelligent caching strategy
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests or browser extension/chrome-extension requests
  if (request.method !== 'GET' || !url.protocol.startsWith('http')) {
    return;
  }

  // A. Image Cache Strategy: Cache-First
  // Images (especially product photos) rarely change. We cache them aggressively.
  if (isImageRequest(request)) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Serve from cache but fetch in the background to update it (stale-while-revalidate for images too)
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, networkResponse);
                });
              }
            })
            .catch(() => {}); // ignore network errors for standard bg-refresh
          return cachedResponse;
        }

        // Not in cache, fetch and store
        return fetch(request)
          .then((networkResponse) => {
            if (!networkResponse || networkResponse.status !== 200) {
              return networkResponse;
            }
            const copy = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, copy);
            });
            return networkResponse;
          })
          .catch(() => {
            // Offline fallback for loaded images
            return caches.match('/manifest.json'); // Return something recognizable or let it fail gracefully
          });
      })
    );
    return;
  }

  // B. Code & Style Assets (JS, CSS, fonts): Stale-While-Revalidate
  // This ensures the page loads instantly from the cache, while retrieving updates silently.
  if (
    request.destination === 'script' ||
    request.destination === 'style' ||
    request.destination === 'font' ||
    url.pathname.includes('/assets/')
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        const fetchPromise = fetch(request)
          .then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const copy = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, copy);
              });
            }
            return networkResponse;
          })
          .catch(() => cachedResponse); // absolute safety on network loss

        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // C. HTML & General Routes: Network-First with Cache fallback
  // This ensures that fresh updates to the index page or dynamic paths load accurately if online.
  event.respondWith(
    fetch(request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const copy = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, copy);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        // Fallback to cache for offline routing
        return caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If the path is a navigation, return index.html (the SPA entry)
          if (request.mode === 'navigate' || request.headers.get('accept').includes('text/html')) {
            return caches.match('/');
          }
          return Promise.reject('No connection and asset not cached');
        });
      })
  );
});
