
// Network and caching strategies for the Service Worker

/**
 * Stratégie "Cache First" - Tente d'abord le cache, puis le réseau
 */
function cacheFirst(request, cacheName) {
  return caches.match(request)
    .then(cachedResponse => {
      if (cachedResponse) {
        // Si déjà en cache, l'utiliser immédiatement
        return cachedResponse;
      }
      
      // Sinon, aller chercher sur le réseau
      return fetch(request)
        .then(response => {
          // Ne pas mettre en cache les réponses non réussies
          if (!response || response.status !== 200) {
            return response;
          }
          
          // Mettre en cache pour usage futur
          const responseClone = response.clone();
          caches.open(cacheName).then(cache => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(error => {
          console.error('Erreur de récupération:', error);
          // Réponse par défaut pour les images
          if (request.url.match(/\.(jpg|png|svg|webp|avif)$/)) {
            return caches.match('/placeholder.svg');
          }
          return new Response('', { status: 404 });
        });
    });
}

/**
 * Stratégie "Network First" - Tente d'abord le réseau avec timeout, puis le cache
 */
function networkFirst(request, cacheName, timeoutMs = 3000) {
  return Promise.race([
    // Timeout pour éviter les attentes trop longues sur réseaux lents
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout')), timeoutMs);
    }),
    fetch(request)
  ])
  .then(response => {
    // Mettre en cache la nouvelle version pour usage futur
    const responseClone = response.clone();
    caches.open(cacheName).then(cache => {
      cache.put(request, responseClone);
    });
    return response;
  })
  .catch(() => {
    console.log('Récupération depuis le cache suite au timeout ou échec réseau');
    // En cas d'échec, utiliser le cache ou rediriger vers la page d'accueil
    return caches.match(request)
      .then(cachedResponse => {
        return cachedResponse || caches.match('/index.html');
      });
  });
}

/**
 * Stratégie "Network Only" - Ne jamais utiliser le cache
 */
function networkOnly(request) {
  return fetch(request);
}

export {
  cacheFirst,
  networkFirst,
  networkOnly
};
