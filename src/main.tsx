
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Configuration pour éviter les rechargements complets
if ('scrollRestoration' in history) {
  // Utiliser 'manual' au lieu de 'auto' pour empêcher le défilement automatique lors du rechargement
  history.scrollRestoration = 'manual';
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
      
      // Vérifier et mettre à jour le service worker
      registration.update();
      
      // Gérer les mises à jour du service worker
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('Une nouvelle version du service worker est disponible');
              
              // Si la page est visible, demander un rechargement
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

// Enregistrer le service worker au chargement
window.addEventListener('load', () => {
  registerServiceWorker();
});

// Mettre à jour le service worker lors de la reprise de l'application
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    // L'utilisateur est revenu à l'application
    updateServiceWorker();
  }
});

// Utiliser createRoot pour éviter le double rendu
const root = createRoot(document.getElementById("root")!);
root.render(<App />);
