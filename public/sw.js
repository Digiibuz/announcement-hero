
// Nom du cache
const CACHE_NAME = 'digiibuz-cache-v17';

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
    
    // Login module specifically should not be cached
    if (url.includes('Login-') && url.includes('.js')) {
      return true;
    }
    
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
      url.includes('login') ||   // Ne jamais mettre en cache la page de login
      url.includes('dashboard') || // Ni les pages qui nécessitent une authentification
      !isValidCacheUrl(url)
    );
  } catch (e) {
    return true;
  }
}

// Installation du service worker
self.addEventListener('install', event => {
  console.log('Installing Service Worker v17');
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
  console.log('Activating Service Worker v17');
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

// Gestion des requêtes 
self.addEventListener('fetch', event => {
  // Ne jamais intercepter certaines requêtes qui poseraient problème
  if (shouldSkipCaching(event.request.url)) {
    return;
  }
  
  // Stratégie pour les requêtes de navigation (HTML)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          // En cas d'échec, utiliser le cache ou rediriger vers la page d'accueil
          return caches.match('/index.html');
        })
    );
    return;
  }

  // Pour les autres requêtes - pas de mise en cache pour simplifier
  // et éviter les problèmes avec les modules dynamiques
  if (event.request.url.includes('.js') || 
      event.request.url.includes('.css') ||
      event.request.url.includes('assets/')) {
    return; // Ne pas intercepter les requêtes JS/CSS
  }

  // Laisser passer les autres requêtes
  event.respondWith(
    fetch(event.request)
      .catch(error => {
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

// Amélioration de la gestion des messages entre clients
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
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
