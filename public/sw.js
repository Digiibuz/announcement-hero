
// Import des modules
importScripts('./sw-config.js');
importScripts('./sw-utils.js');
importScripts('./sw-strategies.js');

// Installation du service worker avec préchargement optimisé
self.addEventListener('install', event => {
  console.log('Installing Service Worker v20 (Optimisation Réseau)');
  
  // Stratégie de préchargement optimisée pour réseaux lents
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Préchargement du cache shell application');
        // D'abord mettre en cache les ressources essentielles
        return cache.addAll(CORE_ASSETS).then(() => {
          // Ensuite tenter de mettre en cache les ressources secondaires
          // mais ne pas bloquer l'activation si ça échoue
          return cache.addAll(SECONDARY_ASSETS).catch(err => {
            console.warn('Ressources secondaires non mises en cache:', err);
          });
        });
      })
  );
  
  // Force l'activation immédiate
  self.skipWaiting();
});

// Activation et nettoyage des anciens caches
self.addEventListener('activate', event => {
  console.log('Activating Service Worker v20 (Optimisation Réseau)');
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

// Gestion des requêtes avec stratégies adaptées aux réseaux lents
self.addEventListener('fetch', event => {
  // Pour tous les fichiers JavaScript, surtout Login, aller directement au réseau
  if (event.request.url.includes('Login-') || event.request.url.includes('.js')) {
    return;
  }
  
  // Ne jamais intercepter certaines requêtes qui poseraient problème
  if (shouldSkipCaching(event.request.url)) {
    return;
  }
  
  // Stratégie pour les requêtes de navigation (HTML)
  if (event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request, CACHE_NAME));
    return;
  }

  // Stratégie pour les assets statiques (images, CSS, polices)
  if (isStaticAsset(event.request.url)) {
    event.respondWith(cacheFirst(event.request, CACHE_NAME));
    return;
  }

  // Pour les autres requêtes - stratégie réseau d'abord, puis cache avec timeout
  event.respondWith(networkFirst(event.request, CACHE_NAME, 5000));
});

// Gestion des messages entre clients avec fonctionnalités réseau
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
  
  // Récupérer l'état réseau actuel
  if (event.data === 'getNetworkStatus') {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => {
        // Obtenir les performances de mise en cache
        caches.open(CACHE_NAME).then(cache => {
          cache.keys().then(keys => {
            client.postMessage({
              type: 'networkStatus',
              cachedItems: keys.length,
              timestamp: Date.now()
            });
          });
        });
      });
    });
  }
  
  // Ajout d'une commande pour supprimer complètement le cache
  if (event.data === 'clearCache') {
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      console.log('Tous les caches supprimés');
      // Informer le client que le cache a été supprimé
      self.clients.matchAll().then(clients => {
        clients.forEach(client => client.postMessage({ type: 'cacheCleared' }));
      });
    });
  }
});
