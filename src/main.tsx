
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

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
  }
}

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
      
      // Vérifier et mettre à jour le service worker
      registration.update();
      
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

// Fonction pour déclencher la mise à jour du service worker
const updateServiceWorker = async () => {
  if ('serviceWorker' in navigator) {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
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
});

// Mettre à jour le service worker lors de la reprise de l'application
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    // L'utilisateur est revenu à l'application
    updateServiceWorker();
    
    // Vérifier si nous sommes sur la page de login et si l'application vient d'être réactivée
    const isLoginPage = window.location.pathname.includes('login');
    if (isLoginPage) {
      console.log('Page de login détectée lors de la reprise, vérification du cache...');
      // Attendre un court instant avant de vérifier s'il y a des problèmes
      setTimeout(() => {
        // Si la page est vide ou incomplète, essayer de la recharger
        if (document.body.children.length < 2) {
          console.log('Page incomplète détectée, rechargement...');
          window.clearCacheAndReload();
        }
      }, 1000);
    }
  }
});

// Utiliser createRoot pour éviter le double rendu
const root = createRoot(document.getElementById("root")!);
root.render(<App />);
