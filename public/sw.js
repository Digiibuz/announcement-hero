
// Service Worker désactivé pour éviter les rechargements
self.addEventListener('install', event => {
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

// Ne pas intercepter les requêtes
self.addEventListener('fetch', event => {
  // Laisser passer toutes les requêtes sans intervention
});
