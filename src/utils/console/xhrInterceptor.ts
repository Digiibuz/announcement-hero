
/**
 * Module pour intercepter les requêtes XMLHttpRequest et masquer les URLs sensibles
 */
import { SENSITIVE_PATTERNS, replaceWithFakeUrl } from './constants';

/**
 * Configure l'interception de XMLHttpRequest pour remplacer les URLs sensibles
 */
export function setupXhrInterceptor(): void {
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
}
