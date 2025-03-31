
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Ajouter un gestionnaire d'erreurs amélioré pour les modules
const originalImport = window.import;
window.import = function(...args) {
  return originalImport.apply(this, args).catch(error => {
    console.error('Module import error:', error);
    
    // Effacer le cache de l'application si c'est une erreur de chargement de module
    if (error.message && error.message.includes('Failed to fetch dynamically imported module')) {
      console.log('Clearing cache due to module loading error...');
      
      // Clear module cache
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          cacheNames.forEach(cacheName => {
            caches.delete(cacheName);
          });
          console.log('Cache cleared, reloading application...');
          window.location.reload();
        });
      } else {
        // Fallback if Cache API is not available
        localStorage.clear();
        sessionStorage.clear();
        console.log('Storage cleared, reloading application...');
        window.location.reload();
      }
    }
    
    throw error;
  });
};

// Enregistrer le service worker pour PWA avec gestion d'erreur améliorée et versionnement
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
        
        // Check for updates every hour
        setInterval(() => {
          registration.update().catch(err => {
            console.error('SW update error:', err);
          });
        }, 60 * 60 * 1000);
      })
      .catch(registrationError => {
        console.error('SW registration failed: ', registrationError);
        // Continue sans service worker
      });
  });
}

// Ajout d'un gestionnaire d'erreurs global pour mieux comprendre les problèmes de chargement
window.addEventListener('error', function(event) {
  // Log the error details
  console.error('Global error:', {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error
  });
  
  // Handle module loading errors specifically
  if (event.message && event.message.includes('Failed to fetch dynamically imported module')) {
    console.error('Module loading failed - will attempt recovery');
    
    // Try to clear cache and reload after a short delay
    setTimeout(() => {
      if ('caches' in window) {
        caches.keys().then(cacheNames => {
          return Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
        }).then(() => {
          console.log('Cache cleared, reloading page...');
          window.location.reload();
        });
      } else {
        window.location.reload();
      }
    }, 2000);
  }
  
  // Prevent default for script errors to avoid cascade failures
  if (event.filename?.includes('.js')) {
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
