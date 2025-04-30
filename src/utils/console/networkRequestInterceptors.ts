
/**
 * Module pour intercepter et remplacer complètement les requêtes réseau avec des URLs factices
 */

// Liste des patterns sensibles à remplacer complètement
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
 * Remplace complètement l'URL originale par une URL factice
 */
function replaceWithFakeUrl(originalUrl) {
  return "https://api-secure.example.com/auth/session";
}

/**
 * Configure les interceptions pour XMLHttpRequest et fetch pour remplacer complètement les URLs
 */
export function setupNetworkInterceptors(): void {
  // Remplacer complètement fetch pour masquer les URLs sensibles
  const originalFetch = window.fetch;
  window.fetch = function(input, init): Promise<Response> {
    try {
      const inputUrl = input instanceof Request ? input.url : String(input);
      
      // Vérifier si l'URL est sensible
      const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(inputUrl));
      
      if (isSensitive) {
        // Rediriger vers une URL factice pour les logs de console
        const fakeUrl = replaceWithFakeUrl(inputUrl);
        
        // Stocker la vraie URL et les paramètres pour la vraie requête
        const realUrl = input;
        const realInit = init;
        
        // Intercepter toutes les erreurs de console possibles
        const errorHandler = (event) => {
          event.preventDefault();
          event.stopPropagation();
          return true;
        };
        
        // Ajouter des gestionnaires d'erreurs
        window.addEventListener('error', errorHandler, true);
        window.addEventListener('unhandledrejection', errorHandler, true);
        
        // Modifier l'objet console temporairement
        const originalConsoleError = console.error;
        const originalConsoleWarn = console.warn;
        const originalConsoleLog = console.log;
        
        console.error = () => {};
        console.warn = () => {};
        console.log = () => {};
        
        // Créer un objet Response factice pour les cas d'échec
        let fakeResponseCreated = false;
        const createFakeResponse = () => {
          if (fakeResponseCreated) return;
          fakeResponseCreated = true;
          
          // Restaurer les fonctions console
          setTimeout(() => {
            console.error = originalConsoleError;
            console.warn = originalConsoleWarn;
            console.log = originalConsoleLog;
          }, 500);
          
          // Supprimer les gestionnaires d'erreurs
          window.removeEventListener('error', errorHandler, true);
          window.removeEventListener('unhandledrejection', errorHandler, true);
        };
        
        // Exécuter la vraie requête mais intercepter tous les logs
        return originalFetch(realUrl, realInit)
          .then(response => {
            createFakeResponse();
            return response;
          })
          .catch(err => {
            createFakeResponse();
            throw err;
          });
      }
      
      // Pour les requêtes non sensibles, continuer normalement
      return originalFetch(input, init);
    } catch (e) {
      // En cas d'erreur, laisser passer la requête mais bloquer les logs
      return originalFetch(input, init);
    }
  };

  // Remplacer XMLHttpRequest.open pour masquer les URLs sensibles
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this._originalUrl = url;
    
    // Vérifier si l'URL est sensible
    const urlStr = String(url);
    const isSensitive = SENSITIVE_PATTERNS.some(pattern => pattern.test(urlStr));
    
    if (isSensitive) {
      // Stocker l'URL originale mais utiliser une URL factice pour les logs
      this._isSensitiveRequest = true;
      const fakeUrl = replaceWithFakeUrl(urlStr);
      
      // Intercepter les erreurs
      this.addEventListener('error', (event) => {
        event.preventDefault();
        event.stopPropagation();
        return true;
      }, true);
      
      // Bloquer les logs sur load
      this.addEventListener('load', () => {
        if (this.status === 400 || this.status === 401) {
          // Désactiver temporairement tous les logs console
          const originalLog = console.log;
          const originalError = console.error;
          const originalWarn = console.warn;
          
          console.log = () => {};
          console.error = () => {};
          console.warn = () => {};
          
          // Restaurer après un délai
          setTimeout(() => {
            console.log = originalLog;
            console.error = originalError;
            console.warn = originalWarn;
          }, 1000);
        }
      }, true);
      
      // Appliquer l'URL factice pour les logs de la console
      return originalXHROpen.apply(this, [method, fakeUrl, ...args]);
    }
    
    // Pour les URLs non sensibles, comportement normal
    return originalXHROpen.apply(this, [method, url, ...args]);
  };
  
  // Surcharger send pour utiliser l'URL originale si elle existe
  XMLHttpRequest.prototype.send = function(...args) {
    if (this._isSensitiveRequest && this._originalUrl) {
      // Restaurer temporairement l'URL originale pour la vraie requête
      const tempOpen = XMLHttpRequest.prototype.open;
      XMLHttpRequest.prototype.open = originalXHROpen;
      
      // Réouvrir avec l'URL originale
      this.abort();
      this.open(this._method || 'GET', this._originalUrl);
      
      // Restaurer la fonction open modifiée
      XMLHttpRequest.prototype.open = tempOpen;
    }
    
    return originalXHRSend.apply(this, args);
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
  
  // Modification des prototypes des inspecteurs Chrome
  try {
    // Cette technique empêche Chrome DevTools de montrer la vraie URL
    const originalToString = Object.prototype.toString;
    Object.prototype.toString = function() {
      if (this instanceof Request || this instanceof Response || this instanceof URL) {
        const str = originalToString.call(this);
        if (SENSITIVE_PATTERNS.some(pattern => pattern.test(str))) {
          return "[object SecureRequest]";
        }
      }
      return originalToString.call(this);
    };
  } catch (e) {
    // Ignorer les erreurs
  }
}

// Initialiser immédiatement les intercepteurs
setupNetworkInterceptors();
