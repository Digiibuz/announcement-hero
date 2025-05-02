
/**
 * Module qui bloque toutes les erreurs et tous les logs avant même le démarrage de l'application
 * Ce module doit être importé en premier dans l'application
 */

// Bloquer complètement toutes les erreurs console
(function() {
  // Ne pas utiliser try/catch pour éviter toute erreur
  
  // Stocker les fonctions originales
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleInfo = console.info;
  const originalConsoleDebug = console.debug;
  
  // Remplacer par des fonctions vides
  console.log = function() {};
  console.error = function() {};
  console.warn = function() {};
  console.info = function() {};
  console.debug = function() {};
  
  // Intercepter tous les événements d'erreur
  window.addEventListener('error', function(event) {
    event.preventDefault();
    event.stopPropagation();
    return true;
  }, true);
  
  // Intercepter tous les rejets de promesses non gérés
  window.addEventListener('unhandledrejection', function(event) {
    event.preventDefault();
    event.stopPropagation();
    return true;
  }, true);
  
  // Stocker les erreurs dans localStorage si nécessaire
  window.onerror = function(message, source, lineno, colno, error) {
    localStorage.setItem('lastGlobalError', JSON.stringify({
      timestamp: new Date().toISOString(),
      message: String(message).substring(0, 100) // Limiter la taille
    }));
    return true; // Empêcher l'erreur d'être affichée
  };
  
  // Stocker les erreurs de promesses dans localStorage si nécessaire
  window.onunhandledrejection = function(event) {
    localStorage.setItem('lastUnhandledRejection', JSON.stringify({
      timestamp: new Date().toISOString(),
      message: "Erreur de promesse non gérée"
    }));
    return true; // Empêcher l'erreur d'être affichée
  };
  
  // Intercepter le fetch API pour éviter les erreurs réseau
  const originalFetch = window.fetch;
  window.fetch = function(input, init) {
    const promise = originalFetch(input, init);
    
    // Intercepter toutes les erreurs
    promise.catch(error => {
      localStorage.setItem('lastFetchError', JSON.stringify({
        timestamp: new Date().toISOString(),
        message: "Erreur fetch silencée" 
      }));
    });
    
    return promise;
  };
  
  // Intercepter XMLHttpRequest pour éviter les erreurs réseau
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function() {
    this.addEventListener('error', function(e) {
      e.preventDefault();
      e.stopPropagation();
      localStorage.setItem('lastXHRError', JSON.stringify({
        timestamp: new Date().toISOString(),
        message: "Erreur XHR silencée"
      }));
    });
    
    return originalXHROpen.apply(this, arguments);
  };
  
  // Laisser un message dans localStorage pour indiquer l'initialisation
  localStorage.setItem('errorBlockerInitialized', JSON.stringify({
    timestamp: new Date().toISOString(),
    message: "Bloqueur d'erreurs activé"
  }));
})();

// Exporter une fonction vide - ce module agit principalement par son effet de bord
export function initErrorBlocker() {
  // Fonction intentionnellement vide, le code s'exécute au chargement du module
}
