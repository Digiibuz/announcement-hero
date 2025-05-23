
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Variables pour stocker l'état de l'application
let lastAppState = {
  path: null as string | null,
  scroll: { x: 0, y: 0 }
};

// Configuration pour éviter les rechargements complets
if ('scrollRestoration' in history) {
  // Utiliser 'manual' au lieu de 'auto' pour empêcher le défilement automatique lors du rechargement
  history.scrollRestoration = 'manual';
}

// Variable globale pour le contrôle du service worker
let serviceWorkerRegistration = null;

// Define the clearCacheAndReload method on the window object
// Type declaration for the global window object
declare global {
  interface Window {
    clearCacheAndReload: () => void;
    preventReload: boolean;
    lastFocusTime: number;
    navigationType: 'PUSH' | 'POP' | 'REPLACE' | null;
  }
}

// Initialiser la préférence de rechargement et le temps du dernier focus
window.preventReload = true;
window.lastFocusTime = Date.now();
window.navigationType = null;

// Fonction pour enregistrer le service worker de manière plus robuste
const registerServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', {
        updateViaCache: 'none',
        scope: '/'
      });
      
      console.log('SW enregistré:', registration);
      serviceWorkerRegistration = registration;
      
      // Gérer les mises à jour du service worker
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('Une nouvelle version du service worker est disponible');
              
              // Si la page est visible, proposer un rechargement
              if (document.visibilityState === 'visible') {
                // Créer une notification pour informer l'utilisateur
                if ('Notification' in window && Notification.permission === 'granted') {
                  new Notification('Application mise à jour', {
                    body: 'Une nouvelle version est disponible. Rechargez la page pour l\'utiliser.'
                  });
                }
              }
            }
          });
        }
      });
      
      // Écouter les messages du service worker
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'cacheCleared') {
          console.log('Le cache a été vidé, rechargement de la page...');
          window.location.reload();
        }
      });
      
    } catch (error) {
      console.error('Erreur d\'enregistrement du SW:', error);
    }
  }
};

// Fonction pour déclencher la mise à jour du service worker SANS recharger
const updateServiceWorkerSilently = async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      // Mise à jour silencieuse en arrière-plan
      registration.update();
    }
  }
};

// Fonction pour vider complètement le cache et forcer le rechargement
window.clearCacheAndReload = () => {
  if (serviceWorkerRegistration && navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage('clearCache');
  } else {
    window.location.reload();
  }
};

// Enregistrer le service worker au chargement
window.addEventListener('load', () => {
  registerServiceWorker();
  
  // Restaurer l'état de l'application si nécessaire
  try {
    const lastPath = sessionStorage.getItem('app_last_path');
    const currentPath = window.location.pathname + window.location.search + window.location.hash;
    
    // Si l'utilisateur est sur la page de login et qu'il y avait une page précédente,
    // nous ne restaurons pas l'état pour éviter des redirections en boucle
    if (lastPath && currentPath !== lastPath && !currentPath.includes('/login')) {
      console.log('Restauration de la navigation vers:', lastPath);
      // Utiliser history.replaceState pour éviter d'ajouter une entrée dans l'historique
      window.history.replaceState(null, '', lastPath);
    }
    
    // Restaurer la position de défilement
    const savedScroll = sessionStorage.getItem('app_last_scroll');
    if (savedScroll) {
      const { x, y } = JSON.parse(savedScroll);
      setTimeout(() => {
        window.scrollTo(x, y);
      }, 100);
    }
    
    // Sauvegarder l'état actuel
    lastAppState.path = currentPath;
    
  } catch (error) {
    console.warn('Erreur lors de la restauration de l\'état:', error);
  }
});

// Optimisation du gestionnaire focus pour éviter les rechargements
window.addEventListener('focus', () => {
  const now = Date.now();
  const timeSinceLastFocus = now - (window.lastFocusTime || 0);
  window.lastFocusTime = now;
  
  // Navigation fluide préservée - pas de rechargement
  console.log("Focus détecté, navigation fluide préservée");
  
  // Mettre à jour le service worker SEULEMENT si nécessaire et de manière silencieuse
  if (timeSinceLastFocus > 300000) { // 5 minutes au lieu de 1 minute
    setTimeout(() => {
      updateServiceWorkerSilently();
    }, 2000); // Délai plus long pour éviter les conflits
  }
});

// Gestionnaire de visibilité optimisé pour éviter les rechargements
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    // L'utilisateur est revenu à l'application - AUCUN rechargement
    console.log('Reprise de l\'application sans rechargement');
    
    // Mise à jour silencieuse du service worker avec un délai
    setTimeout(() => {
      updateServiceWorkerSilently();
    }, 3000); // Délai plus long pour stabilité
  } else {
    // L'utilisateur quitte l'application
    // Sauvegarde de l'état actuel
    lastAppState.path = window.location.pathname + window.location.search + window.location.hash;
    lastAppState.scroll = {
      x: window.scrollX,
      y: window.scrollY
    };
    
    // Sauvegarde en session storage pour récupération ultérieure si besoin
    sessionStorage.setItem('app_last_path', lastAppState.path);
    sessionStorage.setItem('app_last_scroll', JSON.stringify(lastAppState.scroll));
  }
});

// Utiliser createRoot pour éviter le double rendu
const root = createRoot(document.getElementById("root")!);
root.render(<App />);
