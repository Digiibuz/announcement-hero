
/**
 * Module qui bloque toutes les erreurs et tous les logs avant même le démarrage de l'application
 * Ce module doit être importé en premier dans l'application
 */

// Bloquer complètement toutes les erreurs console
(function() {
  // Liste des patterns sensibles à bloquer complètement
  const SENSITIVE_PATTERNS = [
    /supabase\.co/i,
    /auth\/v1\/token/i,
    /token\?grant_type=password/i,
    /400.*bad request/i,
    /401/i,
    /grant_type=password/i,
    /rdwqedmvzicerwotjseg/i,
    /index-[a-zA-Z0-9-_]+\.js/i
  ];
  
  // Stocker les fonctions originales
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleInfo = console.info;
  const originalConsoleDebug = console.debug;
  
  // Remplacer complètement par des fonctions vides
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
    // Vérifier si l'URL est sensible
    const url = input instanceof Request ? input.url : String(input);
    const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(url));
    
    if (isSensitive) {
      // Établir temporairement un gestionnaire d'erreur global
      const errorHandler = function(e) {
        e.preventDefault();
        e.stopPropagation();
        return true;
      };
      window.addEventListener('error', errorHandler, true);
      window.addEventListener('unhandledrejection', errorHandler, true);
      
      // Exécuter la requête silencieusement
      const promise = originalFetch(input, init);
      
      // Intercepter toutes les erreurs
      promise.catch(error => {
        localStorage.setItem('lastFetchError', JSON.stringify({
          timestamp: new Date().toISOString(),
          message: "Erreur fetch silencée"
        }));
      });
      
      // Supprimer les gestionnaires après un délai
      setTimeout(function() {
        window.removeEventListener('error', errorHandler, true);
        window.removeEventListener('unhandledrejection', errorHandler, true);
      }, 1000);
      
      return promise;
    }
    
    // Pour les requêtes non sensibles, continuer normalement
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
    // Vérifier si l'URL est sensible
    const url = arguments[1];
    const urlStr = String(url);
    const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(urlStr));
    
    if (isSensitive) {
      // Stocker la méthode pour référence
      this._method = arguments[0];
      
      // Bloquer toutes les erreurs pendant cette requête
      this.addEventListener('error', function(e) {
        e.preventDefault();
        e.stopPropagation();
        localStorage.setItem('lastXHRError', JSON.stringify({
          timestamp: new Date().toISOString(),
          message: "Erreur XHR silencée"
        }));
        return true;
      }, true);
      
      // Bloquer les journaux pour les réponses d'erreur
      this.addEventListener('load', function() {
        if (this.status === 400 || this.status === 401) {
          localStorage.setItem('lastXHRErrorResponse', JSON.stringify({
            timestamp: new Date().toISOString(),
            status: this.status,
            message: "Réponse d'erreur XHR silencée"
          }));
        }
      }, true);
    } else {
      this.addEventListener('error', function(e) {
        e.preventDefault();
        e.stopPropagation();
        localStorage.setItem('lastXHRError', JSON.stringify({
          timestamp: new Date().toISOString(),
          message: "Erreur XHR silencée"
        }));
        return true;
      });
    }
    
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
