
// Nom du cache
const CACHE_NAME = 'digiibuz-cache-v4';

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

// Stockage des données de session pour éviter les rechargements
const sessionStore = {};

// Fonctions pour la gestion du localStorage via le service worker
const getFromCache = async (key) => {
  const cache = await caches.open('localstore-cache');
  const response = await cache.match(`store/${key}`);
  return response ? response.json() : null;
};

const saveToCache = async (key, value) => {
  const cache = await caches.open('localstore-cache');
  await cache.put(
    `store/${key}`, 
    new Response(JSON.stringify(value), {
      headers: { 'Content-Type': 'application/json' }
    })
  );
};

// Gestion des requêtes avec stratégie améliorée pour éviter les rechargements
self.addEventListener('fetch', event => {
  // Ne pas intercepter les requêtes API ou assets non essentiels
  if (event.request.url.includes('/api/') || 
      event.request.url.includes('supabase.co') ||
      event.request.url.includes('wp-json')) {
    return;
  }
  
  // Gérer les messages spéciaux pour le stockage de données
  if (event.request.url.includes('/__store')) {
    event.respondWith(handleStoreRequest(event.request));
    return;
  }
  
  // Pour les requêtes de navigation (HTML)
  if (event.request.mode === 'navigate') {
    // S'il y a déjà eu une navigation, on utilise le cache
    const url = new URL(event.request.url);
    const path = url.pathname;
    
    // Vérifier si nous avons déjà chargé cette page
    const pageVisited = sessionStore[path];
    
    // Stratégie optimisée pour les navigations répétées
    event.respondWith(
      (async () => {
        try {
          // Si la page a déjà été visitée, on utilise le cache en priorité
          if (pageVisited) {
            const cachedResponse = await caches.match('/index.html');
            if (cachedResponse) {
              console.log('Utilisation du cache pour:', path);
              // Enregistrer l'heure de la dernière visite
              sessionStore[path] = Date.now();
              return cachedResponse;
            }
          }
          
          // Sinon, on fait une requête réseau puis on met en cache
          console.log('Requête réseau pour:', path);
          const networkResponse = await fetch(event.request);
          
          // Mettre à jour le cache avec la nouvelle réponse
          if (networkResponse.ok) {
            const cache = await caches.open(CACHE_NAME);
            const responseToCache = networkResponse.clone();
            await cache.put('/index.html', responseToCache);
            // Marquer cette page comme visitée
            sessionStore[path] = Date.now();
          }
          
          return networkResponse;
        } catch (error) {
          console.error('Erreur de navigation:', error);
          // En cas d'erreur réseau, on essaie de servir depuis le cache
          const cachedResponse = await caches.match('/index.html');
          if (cachedResponse) return cachedResponse;
          throw error;
        }
      })()
    );
    return;
  }

  // Pour les autres requêtes - stratégie "stale-while-revalidate" optimisée
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
        return cachedResponse || fetchPromise;
      })
  );
});

// Gestion des requêtes de stockage pour persister les données entre les rechargements
async function handleStoreRequest(request) {
  const url = new URL(request.url);
  const key = url.searchParams.get('key');
  
  if (!key) {
    return new Response(JSON.stringify({ error: 'Missing key parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  if (request.method === 'GET') {
    const data = await getFromCache(key);
    return new Response(JSON.stringify(data), {
      headers: { 'Content-Type': 'application/json' }
    });
  } else if (request.method === 'POST') {
    const value = await request.json();
    await saveToCache(key, value);
    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  return new Response(JSON.stringify({ error: 'Method not allowed' }), {
    status: 405,
    headers: { 'Content-Type': 'application/json' }
  });
}
