
// Configuration du Service Worker

// Nom du cache
const CACHE_NAME = 'digiibuz-cache-v21';

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

// Exposer les constantes au scope global du Service Worker
self.CACHE_NAME = CACHE_NAME;
self.CORE_ASSETS = CORE_ASSETS;
self.SECONDARY_ASSETS = SECONDARY_ASSETS;
