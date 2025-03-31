
// Nom du cache
const CACHE_NAME = 'digiibuz-cache-v2';

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

// Gestion des requêtes avec stratégie améliorée pour les routes d'administration
self.addEventListener('fetch', event => {
  // Ne pas intercepter les requêtes API ou assets non essentiels
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('supabase.co') ||
      event.request.url.includes('wp-json')) {
    return;
  }
  
  // Vérifier si c'est une route d'admin
  const isAdminRoute = event.request.url.includes('/users') || 
                       event.request.url.includes('/wordpress');
  
  // Pour les requêtes de navigation (HTML)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      // Pour les routes d'admin, essayer d'abord le cache pour éviter les rechargements complets
      isAdminRoute ? 
        caches.match(event.request)
          .then(response => {
            return response || fetch(event.request)
              .catch(() => caches.match('/index.html'));
          }) :
        fetch(event.request)
          .catch(() => {
            // Si le réseau échoue, retourner le index.html depuis le cache
            return caches.match('/index.html');
          })
    );
    return;
  }

  // Pour les autres requêtes - stratégie "stale-while-revalidate"
  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        // Créer une promesse pour la requête réseau
        const fetchPromise = fetch(event.request)
          .then(networkResponse => {
            // Mettre à jour le cache avec la nouvelle réponse si valide
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
              const responseToCache = networkResponse.clone();
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache);
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
        // ou attendre la requête réseau
        return cachedResponse || fetchPromise;
      })
  );
});
