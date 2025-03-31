
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Enregistrer le service worker pour PWA avec gestion d'erreur améliorée
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('SW registered: ', registration);
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
  
  // Prevent default for script errors to avoid cascade failures
  if (event.filename?.includes('.js')) {
    event.preventDefault();
  }
});

createRoot(document.getElementById("root")!).render(<App />);
