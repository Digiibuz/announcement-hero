
/**
 * Module pour bloquer complètement les erreurs et logs dans la console
 */

/**
 * Bloque complètement TOUTES les erreurs console
 * @returns une fonction pour restaurer les fonctions console d'origine
 */
export function silenceAllConsoleOutput() {
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleInfo = console.info;
  const originalConsoleDebug = console.debug;
  
  // Remplacer toutes les fonctions console
  console.log = function() {};
  console.error = function() {};
  console.warn = function() {};
  console.info = function() {};
  console.debug = function() {};
  
  // Retourner une fonction de restauration
  return () => {
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    console.info = originalConsoleInfo;
    console.debug = originalConsoleDebug;
  };
}

/**
 * Bloque tous les événements d'erreur et rejets de promesses
 * @returns une fonction pour supprimer les écouteurs d'événements
 */
export function silenceAllErrorEvents() {
  const errorHandler = (event) => {
    event.preventDefault();
    event.stopPropagation();
    return true;
  };
  
  window.addEventListener('error', errorHandler, true);
  window.addEventListener('unhandledrejection', errorHandler, true);
  
  // Retourner une fonction de nettoyage
  return () => {
    window.removeEventListener('error', errorHandler, true);
    window.removeEventListener('unhandledrejection', errorHandler, true);
  };
}

/**
 * Injecte un script au début de la page pour bloquer totalement les erreurs
 */
export function injectGlobalErrorBlocker() {
  // Créer un élément script
  const script = document.createElement('script');
  
  // Code bloquant toutes les erreurs et console
  script.textContent = `
    (function() {
      // Stocker les fonctions originales
      window._originalConsoleLog = console.log;
      window._originalConsoleError = console.error;
      window._originalConsoleWarn = console.warn;
      window._originalConsoleInfo = console.info;
      window._originalConsoleDebug = console.debug;
      
      // Remplacer toutes les fonctions console
      console.log = function() {};
      console.error = function() {};
      console.warn = function() {};
      console.info = function() {};
      console.debug = function() {};
      
      // Intercepter toutes les erreurs
      window.addEventListener('error', function(event) {
        event.preventDefault();
        event.stopPropagation();
        return true;
      }, true);
      
      // Intercepter tous les rejets de promesses
      window.addEventListener('unhandledrejection', function(event) {
        event.preventDefault();
        event.stopPropagation();
        return true;
      }, true);
      
      // Intercepter toutes les requêtes XHR
      const originalOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = function() {
        try {
          this.addEventListener('error', function(e) {
            e.preventDefault();
            e.stopPropagation();
          });
        } catch(e) {}
        
        return originalOpen.apply(this, arguments);
      };
    })();
  `;
  
  // Insérer au début du document
  document.head.insertBefore(script, document.head.firstChild);
}

/**
 * Configure tout: bloque les logs, les erreurs et les requêtes réseau
 */
export function setupFullSilencing() {
  // Bloquer les logs console
  silenceAllConsoleOutput();
  
  // Bloquer les événements d'erreur
  silenceAllErrorEvents();
  
  // Injecter un script global
  injectGlobalErrorBlocker();
}

// Auto-exécuter au chargement du module
(function() {
  // Blocage immédiat de tous les logs console
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  console.log = function() {};
  console.error = function() {};
  console.warn = function() {};
  
  // Blocage de toutes les erreurs
  window.addEventListener('error', function(e) {
    e.preventDefault();
    e.stopPropagation();
    return true;
  }, true);
  
  window.addEventListener('unhandledrejection', function(e) {
    e.preventDefault();
    e.stopPropagation();
    return true;
  }, true);
})();
