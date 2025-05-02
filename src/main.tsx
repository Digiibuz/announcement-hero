import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Configuration pour éviter les rechargements complets
if ('scrollRestoration' in history) {
  // Utiliser 'manual' au lieu de 'auto' pour empêcher le défilement automatique lors du rechargement
  history.scrollRestoration = 'manual';
}

// Variables globales pour le contrôle du service worker et de l'état réseau
let serviceWorkerRegistration = null;
let networkStatusCheckInterval = null;
let lastNetworkType = '';
let lastVisibilityChange = 0;
let visibilityChangeCount = 0;
let lastReloadTime = 0;
let reloadCounter = 0;
let reloadBlockedUntil = 0; // Timestamp jusqu'auquel les rechargements sont bloqués

// Define methods on the window object - we're now using the shared type definition from network.d.ts

// Détection intelligente du type de réseau et des performances
window.checkNetworkStatus = async () => {
  // Obtenir les informations de connexion depuis l'API Network Information
  const connection = (navigator as any).connection || 
                    (navigator as any).mozConnection || 
                    (navigator as any).webkitConnection;
  
  if (connection) {
    // Tenter d'obtenir le type de connexion spécifique (non disponible dans tous les navigateurs)
    const networkType = connection.type || connection.effectiveType || 'unknown';
    
    // Si le type de réseau a changé depuis la dernière vérification, logger l'information
    if (networkType !== lastNetworkType) {
      console.log(`Type de réseau détecté: ${networkType}, Débit estimé: ${connection.downlink}Mbps, RTT: ${connection.rtt}ms`);
      lastNetworkType = networkType;
      
      // Publier un événement personnalisé pour que l'application puisse réagir
      window.dispatchEvent(new CustomEvent('networkchange', { 
        detail: { 
          type: networkType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData
        } 
      }));
    }
    
    return {
      type: networkType,
      downlink: connection.downlink || 0,
      rtt: connection.rtt || 0,
      saveData: connection.saveData || false
    };
  }
  
  // Fallback si l'API Network Information n'est pas disponible
  return {
    type: 'unknown',
    downlink: 0,
    rtt: 0,
    saveData: false
  };
};

// Utilitaire pour classifier la qualité du réseau
window.getNetworkQuality = () => {
  const connection = (navigator as any).connection || 
                    (navigator as any).mozConnection || 
                    (navigator as any).webkitConnection;
  
  if (!connection) return 'medium'; // Par défaut
  
  // Classification basée sur effective type ou combinaison downlink/rtt
  const effectiveType = connection.effectiveType;
  
  if (effectiveType === '2g' || connection.downlink < 0.5 || connection.rtt > 600) {
    return 'slow';
  } else if (effectiveType === '3g' || connection.downlink < 2 || connection.rtt > 300) {
    return 'medium';
  } else {
    return 'fast';
  }
};

// Vérifier si l'utilisateur est sur un réseau lent (2G/EDGE ou equivalent)
window.isOnSlowNetwork = () => {
  return window.getNetworkQuality() === 'slow';
};

// Vérifier si le mode économie de données est activé
window.isSaveDataEnabled = () => {
  const connection = (navigator as any).connection;
  return connection ? connection.saveData === true : false;
};

// Fonction pour enregistrer le service worker de manière plus robuste avec retry
const registerServiceWorker = async (retryCount = 3) => {
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
        if (event.data) {
          if (event.data.type === 'cacheCleared') {
            console.log('Le cache a été vidé, rechargement de la page...');
            window.location.reload();
          } else if (event.data.type === 'networkStatus') {
            console.log('Status cache:', event.data);
          }
        }
      });
      
      return registration;
    } catch (error) {
      console.error('Erreur d\'enregistrement du SW:', error);
      
      // Réessayer avec un délai exponentiel
      if (retryCount > 0) {
        const delay = Math.pow(2, 4 - retryCount) * 1000; // 1s, 2s, 4s
        console.log(`Nouvelle tentative d'enregistrement du SW dans ${delay}ms...`);
        
        setTimeout(() => {
          registerServiceWorker(retryCount - 1);
        }, delay);
      }
    }
  }
  return null;
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

// Fonction pour démarrer la surveillance de l'état du réseau
const startNetworkMonitoring = () => {
  // Vérifier immédiatement l'état du réseau
  window.checkNetworkStatus();
  
  // Mettre en place une vérification périodique adaptative
  if (!networkStatusCheckInterval) {
    // Vérifier plus fréquemment sur les réseaux instables/lents
    const checkFrequency = window.isOnSlowNetwork() ? 10000 : 30000; // 10s pour réseau lent, 30s sinon
    
    networkStatusCheckInterval = setInterval(() => {
      window.checkNetworkStatus();
    }, checkFrequency);
  }
  
  // Surveillance des changements de connexion (si API disponible)
  const connection = (navigator as any).connection;
  if (connection) {
    connection.addEventListener('change', () => {
      window.checkNetworkStatus();
    });
  }
  
  // Surveillance de l'état online/offline
  window.addEventListener('online', () => {
    console.log('Connexion rétablie');
    window.dispatchEvent(new CustomEvent('connectionchange', { detail: { online: true } }));
    // Synchroniser les données en attente si nécessaire
  });
  
  window.addEventListener('offline', () => {
    console.log('Connexion perdue');
    window.dispatchEvent(new CustomEvent('connectionchange', { detail: { online: false } }));
  });
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
  startNetworkMonitoring();
});

// Variable pour suivre si un rechargement est en cours (éviter les doubles rechargements)
let reloadInProgress = false;

// Fonction pour déterminer si on doit éviter le rechargement pour la page actuelle
const shouldPreventReload = () => {
  const currentPath = window.location.pathname;
  
  // Liste des pages où le rechargement automatique est désactivé
  const noReloadPaths = [
    '/create', // Page de création d'annonce
    '/edit',   // Page d'édition d'annonce
    '/submit', // Page de soumission de formulaire
  ];
  
  // Vérifier si le chemin actuel correspond exactement à l'un des chemins protégés
  // ou commence par l'un des chemins protégés
  for (const path of noReloadPaths) {
    if (currentPath === path || currentPath.startsWith(path + '/')) {
      console.log(`Protection contre le rechargement activée pour la page: ${currentPath}`);
      return true;
    }
  }
  
  return false;
};

// Détection des rechargements en boucle
const isReloadLooping = () => {
  const now = Date.now();
  
  // Si le rechargement est bloqué jusqu'à un certain moment
  if (now < reloadBlockedUntil) {
    console.log(`Rechargements bloqués pour encore ${Math.round((reloadBlockedUntil - now)/1000)}s`);
    return true;
  }
  
  // Si plusieurs rechargements en moins de 3 secondes, considérer qu'il y a une boucle
  if (now - lastReloadTime < 3000) {
    reloadCounter++;
    if (reloadCounter > 2) {
      console.log('Détection de boucle de rechargement, rechargements bloqués pour 30 secondes');
      reloadBlockedUntil = now + (30 * 1000); // Bloquer pour 30 secondes
      return true;
    }
  } else {
    // Réinitialiser le compteur si plus de 3 secondes se sont écoulées
    reloadCounter = 0;
  }
  
  lastReloadTime = now;
  return false;
};

// Variable pour suivre si nous venons juste de traiter un changement de visibilité
let justHandledVisibilityChange = false;
let visibilityChangeTimer = null;

// Mettre à jour le service worker lors de la reprise de l'application
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') {
    // Eviter le traitement multiple des changements de visibilité
    if (justHandledVisibilityChange) {
      console.log('Changement de visibilité récent déjà traité, ignoré');
      return;
    }
    
    justHandledVisibilityChange = true;
    
    // Réinitialiser après un délai
    if (visibilityChangeTimer) {
      clearTimeout(visibilityChangeTimer);
    }
    
    visibilityChangeTimer = setTimeout(() => {
      justHandledVisibilityChange = false;
    }, 1000);
    
    // L'utilisateur est revenu à l'application
    updateServiceWorker();
    window.checkNetworkStatus();
    
    // Anti-boucle: vérifier si nous avons beaucoup de changements de visibilité dans un court laps de temps
    const now = Date.now();
    if (now - lastVisibilityChange < 1000) {
      visibilityChangeCount++;
    } else {
      visibilityChangeCount = 0;
    }
    lastVisibilityChange = now;
    
    // Si trop de changements rapides, cela indique une boucle
    if (visibilityChangeCount > 3) {
      console.log('Détection de changements rapides de visibilité, possible boucle - annulation du rechargement');
      visibilityChangeCount = 0;
      return;
    }
    
    // NE PAS recharger la page si nous sommes sur une page sensible
    if (shouldPreventReload()) {
      console.log('Rechargement annulé pour page sensible: ' + window.location.pathname);
      return;
    }
    
    // Détection de boucle de rechargement
    if (isReloadLooping()) {
      return;
    }
    
    // Vérifier seulement pour la page de login ou autres pages nécessitant rechargement
    const currentPath = window.location.pathname;
    const isLoginPage = currentPath.includes('login');
    
    if (isLoginPage && !reloadInProgress) {
      console.log('Page de login détectée lors de la reprise, v��rification du cache...');
      // Attendre un court instant avant de vérifier s'il y a des problèmes
      setTimeout(() => {
        // Si la page est vide ou incomplète, essayer de la recharger
        if (document.body.children.length < 2) {
          console.log('Page incomplète détectée, rechargement...');
          reloadInProgress = true;
          window.clearCacheAndReload();
          // Réinitialiser le flag après un délai
          setTimeout(() => {
            reloadInProgress = false;
          }, 5000);
        }
      }, 1000);
    }
  }
});

// Utiliser createRoot pour éviter le double rendu
const root = createRoot(document.getElementById("root")!);
root.render(<App />);
