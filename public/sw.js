
// Nom du cache
const CACHE_NAME = 'digiibuz-cache-v15';

// Liste des ressources à mettre en cache
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/lovable-uploads/2c24c6a4-9faf-497a-9be8-27907f99af47.png',
];

// Vérification qu'une URL est valide pour la mise en cache
function isValidCacheUrl(url) {
  const validSchemes = ['http:', 'https:'];
  try {
    const urlObj = new URL(url);
    return validSchemes.includes(urlObj.protocol);
  } catch (e) {
    return false;
  }
}

// Ne jamais mettre en cache ces types de fichiers
function shouldSkipCaching(url) {
  try {
    const urlObj = new URL(url);
    return (
      urlObj.pathname.endsWith('.js') || 
      urlObj.pathname.endsWith('.ts') || 
      urlObj.pathname.endsWith('.tsx') || 
      url.includes('assets/') ||
      url.includes('/api/') || 
      url.includes('supabase.co') || 
      url.includes('wp-json') ||
      url.includes('storage.googleapis.com') ||
      url.includes('images/') ||
      url.includes('camera') ||
      url.includes('image/') ||
      url.includes('upload') ||
      url.includes('media') ||
      url.includes('openai.com') ||
      !isValidCacheUrl(url)
    );
  } catch (e) {
    return true;
  }
}

// Installation du service worker
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache ouvert');
        return cache.addAll(urlsToCache);
      })
  );
  // Force l'activation immédiate
  self.skipWaiting();
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    Promise.all([
      // Suppression des anciens caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              console.log('Suppression ancien cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      }),
      // Prise de contrôle immédiate des clients
      self.clients.claim()
    ])
  );
});

// Gestion des requêtes avec stratégie améliorée
self.addEventListener('fetch', event => {
  // Ne jamais intercepter certaines requêtes qui poseraient problème
  if (shouldSkipCaching(event.request.url)) {
    return;
  }
  
  // Stratégie pour les requêtes de navigation (HTML)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then(networkResponse => {
          return networkResponse;
        })
        .catch(() => {
          // En cas d'échec, utiliser le cache
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Pour les autres requêtes - stratégie "network-first"
  event.respondWith(
    fetch(event.request)
      .then(networkResponse => {
        // Mettre à jour le cache avec la nouvelle réponse si valide
        if (networkResponse && 
            networkResponse.status === 200 && 
            networkResponse.type === 'basic' && 
            isValidCacheUrl(event.request.url) &&
            !shouldSkipCaching(event.request.url)) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME)
            .then(cache => {
              try {
                cache.put(event.request, responseToCache);
              } catch (error) {
                console.error('Erreur lors de la mise en cache:', error);
              }
            });
        }
        return networkResponse;
      })
      .catch(error => {
        console.log('Fetch failed, fallback to cache for:', event.request.url);
        // Si le réseau échoue, on essaie le cache
        return caches.match(event.request)
          .catch(err => {
            console.error('Cache match also failed:', err);
            throw error;
          });
      })
  );
});

// Ajout d'un gestionnaire pour les messages entre clients
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});
