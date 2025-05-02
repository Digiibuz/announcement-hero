
// Nom du cache
const CACHE_NAME = 'digiibuz-cache-v19';

// Liste des ressources à mettre en cache immédiatement (shell de l'application)
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/lovable-uploads/2c24c6a4-9faf-497a-9be8-27907f99af47.png',
];

// Assets supplémentaires à mettre en cache pour une utilisation hors ligne
const SECONDARY_ASSETS = [
  // Polices web essentielles
  'https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;500;600;700;800&display=swap',
  // Images d'interface communes
  '/placeholder.svg',
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

// Déterminer si une URL est un asset statique qui peut être mis en cache
function isStaticAsset(url) {
  try {
    const urlObj = new URL(url);
    return (
      urlObj.pathname.endsWith('.css') ||
      urlObj.pathname.endsWith('.woff2') ||
      urlObj.pathname.endsWith('.png') ||
      urlObj.pathname.endsWith('.svg') ||
      urlObj.pathname.endsWith('.jpg') ||
      urlObj.pathname.endsWith('.webp') ||
      urlObj.pathname.endsWith('.avif') ||
      urlObj.pathname.endsWith('.ico')
    );
  } catch (e) {
    return false;
  }
}

// Ne jamais mettre en cache ces types de fichiers
function shouldSkipCaching(url) {
  try {
    const urlObj = new URL(url);
    
    // Login module specifically should not be cached
    if (url.includes('Login-') || url.includes('login')) {
      console.log('Skipping cache for login resource:', url);
      return true;
    }
    
    // Ne jamais mettre en cache les ressources JavaScript
    if (urlObj.pathname.endsWith('.js')) {
      return true;
    }
    
    return (
      urlObj.pathname.endsWith('.ts') || 
      urlObj.pathname.endsWith('.tsx') || 
      url.includes('assets/') ||
      url.includes('/api/') || 
      url.includes('supabase.co') || 
      url.includes('wp-json') ||
      url.includes('storage.googleapis.com') ||
      url.includes('camera') ||
      url.includes('image/') ||
      url.includes('upload') ||
      url.includes('media') ||
      url.includes('openai.com') ||
      url.includes('login') ||   // Ne jamais mettre en cache la page de login
      url.includes('dashboard') || // Ni les pages qui nécessitent une authentification
      !isValidCacheUrl(url)
    );
  } catch (e) {
    return true;
  }
}

// Installation du service worker avec préchargement optimisé
self.addEventListener('install', event => {
  console.log('Installing Service Worker v19 (Optimisation Réseau)');
  
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
  console.log('Activating Service Worker v19 (Optimisation Réseau)');
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
    event.respondWith(
      // Stratégie "network first, fallback to cache" 
      // Avec timeout pour réseaux lents
      Promise.race([
        // Timeout pour éviter les attentes trop longues sur réseaux lents
        new Promise((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 3000); // 3s de timeout
        }),
        fetch(event.request)
      ])
      .then(response => {
        // Mettre en cache la nouvelle version pour usage futur
        const responseClone = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseClone);
        });
        return response;
      })
      .catch(() => {
        console.log('Récupération depuis le cache suite au timeout ou échec réseau');
        // En cas d'échec, utiliser le cache ou rediriger vers la page d'accueil
        return caches.match(event.request)
          .then(cachedResponse => {
            return cachedResponse || caches.match('/index.html');
          });
      })
    );
    return;
  }

  // Stratégie pour les assets statiques (images, CSS, polices)
  if (isStaticAsset(event.request.url)) {
    event.respondWith(
      // Stratégie "cache first, fallback to network"
      caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            // Si déjà en cache, l'utiliser immédiatement
            return cachedResponse;
          }
          
          // Sinon, aller chercher sur le réseau
          return fetch(event.request)
            .then(response => {
              // Mettre en cache pour usage futur
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then(cache => {
                cache.put(event.request, responseClone);
              });
              return response;
            })
            .catch(error => {
              console.error('Erreur de récupération asset statique:', error);
              // Réponse par défaut pour les images
              if (event.request.url.match(/\.(jpg|png|svg|webp|avif)$/)) {
                return caches.match('/placeholder.svg');
              }
              return new Response('', { status: 404 });
            });
        })
    );
    return;
  }

  // Pour les autres requêtes - stratégie réseau d'abord, puis cache avec timeout
  event.respondWith(
    Promise.race([
      // Timeout pour éviter les attentes trop longues sur réseaux lents
      new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 5000); // 5s de timeout
      }),
      fetch(event.request)
    ])
    .then(response => {
      // Ne pas mettre en cache les réponses non réussies
      if (!response || response.status !== 200) {
        return response;
      }
      
      // Mettre en cache les bonnes réponses
      const responseClone = response.clone();
      caches.open(CACHE_NAME).then(cache => {
        cache.put(event.request, responseClone);
      });
      return response;
    })
    .catch(error => {
      console.log('Récupération depuis le cache suite au timeout ou échec réseau', error);
      return caches.match(event.request)
        .then(cachedResponse => {
          if (cachedResponse) {
            return cachedResponse;
          }
          
          // Pour les ressources non trouvées, retourner une réponse vide
          return new Response('', { status: 404 });
        });
    })
  );
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
