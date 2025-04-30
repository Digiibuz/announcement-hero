
/**
 * Module pour intercepter et sécuriser les requêtes réseau
 */

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

/**
 * Configure les interceptions pour XMLHttpRequest et fetch
 */
export function setupNetworkInterceptors(): void {
  // Intercepter fetch pour supprimer les logs des requêtes sensibles
  const originalFetch = window.fetch;
  window.fetch = function(input, init): Promise<Response> {
    try {
      const inputUrl = input instanceof Request ? input.url : String(input);
      
      // Bloquer complètement les logs pour les requêtes sensibles
      const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(inputUrl));
      
      if (isSensitive) {
        // Ajout d'un intercepteur d'erreurs temporaire pour cette requête sensible
        const errorHandler = (event) => {
          event.preventDefault();
          event.stopPropagation();
          return true;
        };
        
        // Ajouter temporairement des gestionnaires d'événements pour bloquer les erreurs
        window.addEventListener('error', errorHandler, true);
        window.addEventListener('unhandledrejection', errorHandler, true);
        
        // Exécuter la requête silencieusement
        return originalFetch(input, init)
          .finally(() => {
            // Supprimer les gestionnaires après la requête
            window.removeEventListener('error', errorHandler, true);
            window.removeEventListener('unhandledrejection', errorHandler, true);
          });
      }
      
      // Pour les requêtes non sensibles, continuer normalement
      return originalFetch(input, init);
    } catch (e) {
      // En cas d'erreur, laisser passer la requête mais bloquer les logs
      return originalFetch(input, init);
    }
  };

  // Intercepter XMLHttpRequest pour bloquer les logs des requêtes sensibles
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    const urlStr = String(url);
    
    // Vérifier si l'URL est sensible
    const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(urlStr));
    
    if (isSensitive) {
      // Intercepter et bloquer les erreurs pour cette requête
      this.addEventListener('error', (event) => {
        event.preventDefault();
        event.stopPropagation();
        return true;
      }, true);
      
      // Bloquer également les événements load qui pourraient logger des erreurs
      this.addEventListener('load', () => {
        if (this.status === 400 || this.status === 401) {
          const originalLog = console.log;
          const originalError = console.error;
          const originalWarn = console.warn;
          
          // Désactiver temporairement tous les logs console
          console.log = () => {};
          console.error = () => {};
          console.warn = () => {};
          
          // Restaurer après un délai
          setTimeout(() => {
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;
          }, 500); // Délai plus long pour s'assurer que tous les logs sont bloqués
        }
      }, true);
    }
    
    return originalXHROpen.apply(this, [method, url, ...args]);
  };

  // Installer des intercepteurs d'erreurs globaux
  window.addEventListener('error', function(event) {
    const eventData = event.message || event.error?.stack || '';
    
    // Bloquer les événements d'erreur liés aux patterns sensibles
    if (SENSITIVE_PATTERNS.some(pattern => pattern.test(eventData))) {
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
  }, true);
  
  // Même chose pour les rejets de promesses
  window.addEventListener('unhandledrejection', function(event) {
    const reasonStr = String(event.reason || '');
    
    // Bloquer les rejets de promesses liés aux patterns sensibles
    if (SENSITIVE_PATTERNS.some(pattern => pattern.test(reasonStr))) {
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
  }, true);
}

// Initialiser immédiatement les intercepteurs
setupNetworkInterceptors();
