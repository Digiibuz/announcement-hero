
// Nom du cache
const CACHE_NAME = 'digiibuz-cache-v6';

// Liste des ressources à mettre en cache
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/lovable-uploads/2c24c6a4-9faf-497a-9be8-27907f99af47.png',
  // Ajout des routes principales pour éviter les rechargements
  '/dashboard',
  '/announcements',
  '/create',
  '/users',
  '/wordpress'
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

// Ne jamais mettre en cache les fichiers JavaScript pour éviter les problèmes de chargement de modules
function isJavaScriptAsset(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.pathname.endsWith('.js') || url.includes('assets/');
  } catch (e) {
    return false;
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

// Activation et contrôle immédiat des clients
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];

  event.waitUntil(
    Promise.all([
      // Suppression des anciens caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
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

// Gestion des requêtes avec stratégie pour éviter les rechargements complets
self.addEventListener('fetch', event => {
  // IMPORTANT: Ne jamais intercepter les requêtes JavaScript ou assets
  // Cela peut causer des problèmes avec les modules dynamiques
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('supabase.co') ||
      event.request.url.includes('wp-json') ||
      !isValidCacheUrl(event.request.url) ||
      isJavaScriptAsset(event.request.url) ||
      event.request.url.includes('assets/')) {
    return;
  }
  
  // Pour les requêtes de navigation (HTML)
  if (event.request.mode === 'navigate') {
    // On utilise principalement le cache pour éviter un rechargement complet
    event.respondWith(
      caches.match('/index.html')
        .then(response => {
          // Utiliser le cache en priorité pour les navigations
          return response || fetch(event.request)
            .catch(() => caches.match('/index.html'));
        })
    );
    return;
  }

  // Pour les autres requêtes non-JS - stratégie "stale-while-revalidate"
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Créer une promesse pour la requête réseau
        const fetchPromise = fetch(event.request)
          .then(networkResponse => {
            // Mettre à jour le cache avec la nouvelle réponse si valide
            if (networkResponse && 
                networkResponse.status === 200 && 
                networkResponse.type === 'basic' && 
                isValidCacheUrl(event.request.url) &&
                !isJavaScriptAsset(event.request.url)) { // Ne jamais mettre en cache les JS
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
            console.error('Fetch failed:', error);
            // Si le réseau échoue et qu'il n'y a pas de réponse en cache, on renvoie une erreur
            if (!cachedResponse) {
              throw error;
            }
            return cachedResponse;
          });

        // Renvoyer immédiatement la réponse en cache si elle existe
        return cachedResponse || fetchPromise;
      })
  );
});
