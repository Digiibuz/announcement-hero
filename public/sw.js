
// Version basée sur la date pour forcer les mises à jour
const VERSION = '1.2.8';
const CACHE_NAME = `digiibuz-v${VERSION}`;
const STATIC_CACHE_NAME = `digiibuz-static-v${VERSION}`;

// Files to cache on install
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/lovable-uploads/2c24c6a4-9faf-497a-9be8-27907f99af47.png'
];

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing version:', VERSION);
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => {
        console.log('Service Worker: Skip waiting to activate immediately');
        return self.skipWaiting();
      })
  );
});

// Activate event - Clean up old caches and force reload immediately
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating version:', VERSION);
  event.waitUntil(
    Promise.all([
      // Clean up old caches
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== STATIC_CACHE_NAME) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Take control of all clients immediately
      self.clients.claim()
    ]).then(() => {
      // Force reload all clients immediately when new version is available
      return self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          console.log('Forcing reload for new version:', VERSION);
          client.navigate(client.url);
        });
      });
    })
  );
});

// Fetch event - Network first strategy with automatic reload on updates
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // API calls - always try network first
  if (url.pathname.includes('/api/') || url.hostname.includes('supabase')) {
    event.respondWith(
      fetch(request).catch(() => {
        return caches.match(request);
      })
    );
    return;
  }

  // For main app files, always check network first for updates
  if (url.pathname === '/' || url.pathname.includes('.js') || url.pathname.includes('.css')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // If we got a valid response, cache it and return
          if (response && response.status === 200) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return response;
        })
        .catch(() => {
          // Only fallback to cache if network fails
          return caches.match(request);
        })
    );
    return;
  }

  // Static assets - cache first but with shorter max-age
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        // Return cached version if available and not too old
        if (cachedResponse) {
          const cacheDate = new Date(cachedResponse.headers.get('date') || 0);
          const now = new Date();
          const cacheAge = now.getTime() - cacheDate.getTime();
          
          // If cached version is older than 1 hour, try to fetch new version in background
          if (cacheAge > 60 * 60 * 1000) {
            fetch(request).then((response) => {
              if (response && response.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, response);
                });
              }
            }).catch(() => {
              // Ignore network errors for background updates
            });
          }
          
          return cachedResponse;
        }
        
        // If not in cache, fetch from network
        return fetch(request)
          .then((response) => {
            if (!response || response.status !== 200) {
              return response;
            }

            const responseToCache = response.clone();
            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              });

            return response;
          });
      })
  );
});

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('Service Worker: Received SKIP_WAITING message');
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CHECK_UPDATE') {
    console.log('Service Worker: Checking for updates');
    // Force update by clearing current caches and reloading
    Promise.all([
      caches.delete(CACHE_NAME),
      caches.delete(STATIC_CACHE_NAME)
    ]).then(() => {
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          console.log('Auto-reloading for update check');
          client.navigate(client.url);
        });
      });
    });
  }
});

// Periodic update check with auto-reload
self.addEventListener('sync', (event) => {
  if (event.tag === 'version-check') {
    event.waitUntil(
      self.clients.matchAll().then((clients) => {
        clients.forEach((client) => {
          console.log('Auto-reloading for sync update');
          client.navigate(client.url);
        });
      })
    );
  }
});

console.log('Service Worker loaded with version:', VERSION);
