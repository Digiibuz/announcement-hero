
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
  '/wordpress',
  '/login'
];

// Cache de données par page visité (état de page)
const pageDataCache = new Map();

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
  const cacheWhitelist = [CACHE_NAME, 'localstore-cache', 'page-content-cache', 'session-cache'];

  event.waitUntil(
    Promise.all([
      // Suppression des anciens caches
      caches.keys().then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheWhitelist.indexOf(cacheName) === -1) {
              console.log('Suppression de l\'ancien cache:', cacheName);
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

// Stockage des données pour éviter les rechargements
const sessionStore = {};

// Fonctions pour la gestion du localStorage via le service worker
const getFromCache = async (key) => {
  try {
    // D'abord vérifier si c'est une clé de session
    if (key.startsWith('app-session-')) {
      const cache = await caches.open('session-cache');
      const response = await cache.match(`store/${key}`);
      return response ? response.json() : null;
    }
    
    const cache = await caches.open('localstore-cache');
    const response = await cache.match(`store/${key}`);
    return response ? response.json() : null;
  } catch (error) {
    console.error('Erreur de lecture dans le cache:', error);
    return null;
  }
};

const saveToCache = async (key, value) => {
  try {
    // Pour les données de session, utiliser un cache spécial qui ne sera pas effacé entre les rechargements
    if (key.startsWith('app-session-')) {
      const cache = await caches.open('session-cache');
      await cache.put(
        `store/${key}`, 
        new Response(JSON.stringify(value), {
          headers: { 'Content-Type': 'application/json' }
        })
      );
      return;
    }
    
    const cache = await caches.open('localstore-cache');
    await cache.put(
      `store/${key}`, 
      new Response(JSON.stringify(value), {
        headers: { 'Content-Type': 'application/json' }
      })
    );
  } catch (error) {
    console.error('Erreur de sauvegarde dans le cache:', error);
  }
};

// Cache pour le contenu dynamique des pages (pour éviter les rechargements)
const getPageContent = async (path) => {
  try {
    const cache = await caches.open('page-content-cache');
    const response = await cache.match(`page-content/${path}`);
    if (response) {
      const data = await response.json();
      // Vérifier que les données ne sont pas trop anciennes (30 minutes)
      const maxAge = 30 * 60 * 1000; // 30 minutes
      if (Date.now() - data.timestamp < maxAge) {
        console.log('Contenu de page récupéré du cache:', path);
        return data.content;
      }
    }
    return null;
  } catch (error) {
    console.error('Erreur de lecture du contenu de page:', error);
    return null;
  }
};

const savePageContent = async (path, content) => {
  try {
    const cache = await caches.open('page-content-cache');
    const data = {
      content,
      timestamp: Date.now()
    };
    await cache.put(
      `page-content/${path}`, 
      new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      })
    );
    console.log('Contenu de page sauvegardé en cache:', path);
  } catch (error) {
    console.error('Erreur de sauvegarde du contenu de page:', error);
  }
};

// Gestion des requêtes avec stratégie améliorée pour éviter les rechargements
self.addEventListener('fetch', event => {
  // Créer une URL pour analyse
  const url = new URL(event.request.url);
  
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
    const path = url.pathname;
    
    // Stratégie optimisée pour les navigations - utilise le cache et le pageDataCache
    event.respondWith(
      (async () => {
        try {
          // Enregistrer l'heure de la dernière visite
          sessionStore[path] = Date.now();
          
          // Essayer de servir depuis l'index HTML en cache
          const cachedResponse = await caches.match('/index.html');
          
          // Toujours retourner l'index.html en cache pour les routes connues
          // Cela évite les rechargements complets
          if (cachedResponse && (
              path === '/' || 
              path === '/dashboard' || 
              path.startsWith('/announcements') || 
              path === '/create' || 
              path === '/users' || 
              path === '/wordpress' ||
              path === '/login'
            )) {
            console.log('Route SPA servie depuis le cache:', path);
            return cachedResponse;
          }
          
          // Pour les autres routes, essayer le réseau puis le cache
          try {
            const networkResponse = await fetch(event.request);
            
            // Mettre à jour le cache avec la nouvelle réponse
            if (networkResponse.ok) {
              const cache = await caches.open(CACHE_NAME);
              await cache.put(event.request, networkResponse.clone());
            }
            
            return networkResponse;
          } catch (error) {
            console.error('Erreur réseau, utilisation du cache:', error);
            // En cas d'erreur réseau, utiliser le cache
            if (cachedResponse) return cachedResponse;
            throw error;
          }
        } catch (error) {
          console.error('Erreur de navigation:', error);
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
            console.error('Erreur réseau:', error);
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

// Écouter les messages du client pour mettre à jour le cache de données de page
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'CACHE_PAGE_CONTENT') {
    const { path, content } = event.data;
    if (path && content) {
      savePageContent(path, content);
    }
  }
  
  // Nouveau: écouter les messages de synchronisation de session
  if (event.data && event.data.type === 'SYNC_SESSION_DATA') {
    const { key, data } = event.data;
    if (key && data) {
      saveToCache(`app-session-${key}`, data);
      // Informer les autres clients qu'une mise à jour est disponible
      self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          if (client.id !== event.source.id) {
            client.postMessage({
              type: 'SESSION_DATA_UPDATED',
              key: key
            });
          }
        });
      });
    }
  }
});
