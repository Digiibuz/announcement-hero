
/**
 * Module pour intercepter les requêtes fetch et masquer les URLs sensibles
 */
import { SENSITIVE_PATTERNS, replaceWithFakeUrl } from './constants';

/**
 * Configure l'interception du fetch API pour remplacer les URLs sensibles
 */
export function setupFetchInterceptor(): void {
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
}
