
/**
 * Module pour intercepter et modifier le prototype de XMLHttpRequest pour masquer les URLs sensibles
 */
import { SENSITIVE_URL_PATTERNS, shouldCompletelyBlockRequest, createSecureUrl } from './constants';

/**
 * Intercepte et modifie le prototype de XMLHttpRequest pour masquer les URLs sensibles
 */
export function setupXHRInterceptor(): void {
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]): void {
    try {
      const urlString = String(url);
      
      // Vérifier si la requête doit être complètement bloquée
      if (shouldCompletelyBlockRequest(urlString)) {
        // Stocker la méthode et l'URL originale
        this._originalUrl = urlString;
        this._isBlockedRequest = true;
        
        // Rediriger vers une URL factice
        return originalOpen.call(this, method, "https://api-secure.example.com/auth", ...args);
      }
      
      // Vérifier si l'URL est sensible
      const isSensitive = SENSITIVE_URL_PATTERNS.some(pattern => pattern.test(urlString));
      
      if (isSensitive) {
        // Stocker l'URL originale pour la vraie requête
        this._originalUrl = urlString;
        
        // Désactiver temporairement tous les logs console
        const originalConsole = {
          log: console.log,
          error: console.error,
          warn: console.warn,
          info: console.info,
          debug: console.debug
        };
        
        console.log = () => {};
        console.error = () => {};
        console.warn = () => {};
        console.info = () => {};
        console.debug = () => {};
        
        // Ajouter un écouteur pour les erreurs XHR
        this.addEventListener('error', (event) => {
          event.preventDefault();
          event.stopPropagation();
          
          // Stocker l'erreur silencieusement
          localStorage.setItem('xhr_error', JSON.stringify({
            timestamp: new Date().toISOString(),
            message: 'Erreur XHR masquée'
          }));
          
          // Restaurer les fonctions console après un délai
          setTimeout(() => {
            console.log = originalConsole.log;
            console.error = originalConsole.error;
            console.warn = originalConsole.warn;
            console.info = originalConsole.info;
            console.debug = originalConsole.debug;
          }, 500);
          
          return true;
        }, false);
        
        // Ajouter un écouteur pour la fin de requête
        this.addEventListener('load', () => {
          // Restaurer les fonctions console après un délai
          setTimeout(() => {
            console.log = originalConsole.log;
            console.error = originalConsole.error;
            console.warn = originalConsole.warn;
            console.info = originalConsole.info;
            console.debug = originalConsole.debug;
          }, 500);
        }, false);
        
        // Utiliser l'URL factice pour l'affichage dans les outils de développement
        return originalOpen.call(this, method, createSecureUrl(urlString), ...args);
      }
      
      // Comportement normal pour les URL non sensibles
      return originalOpen.call(this, method, url, ...args);
    } catch (e) {
      // En cas d'erreur, utiliser l'URL originale
      return originalOpen.call(this, method, url, ...args);
    }
  };
  
  // Intercepter la méthode send pour les requêtes bloquées
  XMLHttpRequest.prototype.send = function(...args: any[]): void {
    // Pour les requêtes qui doivent être complètement bloquées
    if (this._isBlockedRequest) {
      // Simuler une réponse réussie immédiatement
      setTimeout(() => {
        Object.defineProperty(this, 'readyState', { value: 4 });
        Object.defineProperty(this, 'status', { value: 200 });
        Object.defineProperty(this, 'statusText', { value: 'OK' });
        Object.defineProperty(this, 'responseText', { value: JSON.stringify({status: "ok"}) });
        Object.defineProperty(this, 'response', { value: JSON.stringify({status: "ok"}) });
        
        // Déclencher les événements de changement d'état et de chargement
        const loadEvent = new Event('load');
        this.dispatchEvent(loadEvent);
        
        const readyStateEvent = new Event('readystatechange');
        this.dispatchEvent(readyStateEvent);
      }, 10);
      
      // Exécuter la vraie requête en arrière-plan
      const xhr = new XMLHttpRequest();
      xhr.open(this._method || 'GET', this._originalUrl);
      xhr.send(...args);
      
      return;
    }
    
    // Pour les autres requêtes, comportement normal
    return originalSend.apply(this, args);
  };
}
