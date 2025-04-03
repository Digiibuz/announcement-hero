
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Configuration pour éviter les rechargements complets
if ('scrollRestoration' in history) {
  // Utiliser 'manual' au lieu de 'auto' pour empêcher le défilement automatique lors du rechargement
  history.scrollRestoration = 'manual';
}

// Amélioration des transitions de page
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    // Indique aux navigateurs que la page est prête pour les transitions
    document.documentElement.classList.add('transition-ready');
  }
});

// Enregistrer le service worker pour PWA avec gestion améliorée
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { 
      updateViaCache: 'none',
      scope: '/' 
    }).then(registration => {
      console.log('SW registered: ', registration);
      // Force une vérification de mise à jour, mais évite de recharger automatiquement
      registration.update();
      
      // Écoute des mises à jour mais ne force pas de rechargement
      registration.addEventListener('updatefound', () => {
        const newWorker = registration.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            // Nouveau service worker disponible mais ne force pas de rechargement
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('Nouvelle version disponible, mais on ne recharge pas automatiquement');
            }
          });
        }
      });
    }).catch(registrationError => {
      console.log('SW registration failed: ', registrationError);
    });
  });
}

// Empêcher le rechargement complet sur F5 en utilisant l'événement beforeunload
window.addEventListener('beforeunload', (event) => {
  // Vérifier si l'utilisateur est sur une page où un formulaire est en cours de remplissage
  if (window.location.pathname === '/create') {
    // Ne pas empêcher complètement le rechargement, mais avertir l'utilisateur
    // que ses données peuvent être perdues s'il n'a pas enregistré
    const savedData = localStorage.getItem('announcement-form-draft');
    if (savedData && Object.keys(JSON.parse(savedData)).length > 1) {
      // Une donnée valide est présente dans le localStorage
      console.log('Données de formulaire trouvées lors du rechargement');
    }
  }
});

// Utiliser createRoot pour éviter le double rendu
const root = createRoot(document.getElementById("root")!);
root.render(<App />);
