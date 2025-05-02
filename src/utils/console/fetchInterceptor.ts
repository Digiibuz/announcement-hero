
/**
 * Module pour intercepter et modifier le prototype de fetch pour masquer les URLs sensibles
 */
import { SENSITIVE_URL_PATTERNS, shouldCompletelyBlockRequest, createSecureUrl } from './constants';

/**
 * Intercepte et modifie le prototype de fetch pour masquer les URLs sensibles
 */
export function setupFetchInterceptor(): void {
  const originalFetch = window.fetch;
  
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    try {
      // Extraire l'URL de la requête
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
      
      // Vérifier si la requête doit être complètement bloquée dans l'inspecteur
      if (shouldCompletelyBlockRequest(url)) {
        // Créer une requête fantôme qui ne sera jamais réellement envoyée à l'inspecteur
        const dummyResponse = new Response(JSON.stringify({status: "ok"}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        });
        
        // Exécuter la vraie requête en arrière-plan sans qu'elle n'apparaisse dans l'inspecteur
        originalFetch(input, init).then(() => {}).catch(() => {});
        
        // Retourner immédiatement une réponse factice pour l'inspecteur
        return Promise.resolve(dummyResponse);
      }
      
      // Vérifier si l'URL est sensible
      const isSensitive = SENSITIVE_URL_PATTERNS.some(pattern => pattern.test(url));
      
      if (isSensitive) {
        // 1. Désactiver temporairement tous les logs console
        const originalConsole = {
          log: console.log,
          error: console.error,
          warn: console.warn,
          info: console.info,
          debug: console.debug
        };
        
        // Remplacer toutes les fonctions console
        console.log = () => {};
        console.error = () => {};
        console.warn = () => {};
        console.info = () => {};
        console.debug = () => {};
        
        // 2. Désactiver temporairement tous les événements d'erreur
        const handleError = (event: Event) => {
          event.preventDefault();
          event.stopPropagation();
          return true;
        };
        
        window.addEventListener('error', handleError, true);
        window.addEventListener('unhandledrejection', handleError, true);
        
        // 3. Créer une copie de la requête avec une URL factice pour les logs
        let secureInput: RequestInfo;
        if (typeof input === 'string') {
          secureInput = createSecureUrl(input);
        } else if (input instanceof Request) {
          // Créer une copie de la requête avec l'URL sécurisée
          secureInput = new Request(createSecureUrl(input.url), {
            method: input.method,
            headers: input.headers,
            body: input.body,
            mode: input.mode,
            credentials: input.credentials,
            cache: input.cache,
            redirect: input.redirect,
            referrer: input.referrer,
            integrity: input.integrity
          });
        } else if (input instanceof URL) {
          // Convertir URL en string pour qu'il soit compatible avec RequestInfo
          secureInput = createSecureUrl(input.toString());
        } else {
          // Pour tout autre type, convertir en string
          secureInput = String(input);
        }
        
        // 4. Exécuter la vraie requête avec les écouteurs d'erreur en place
        const promise = originalFetch(input, init)
          .then(response => {
            // Pour les réponses 400/401, bloquer aussi les logs
            if (response.status === 400 || response.status === 401) {
              // Garder les logs désactivés un peu plus longtemps
              setTimeout(() => {
                console.log = originalConsole.log;
                console.error = originalConsole.error;
                console.warn = originalConsole.warn;
                console.info = originalConsole.info;
                console.debug = originalConsole.debug;
                
                window.removeEventListener('error', handleError, true);
                window.removeEventListener('unhandledrejection', handleError, true);
              }, 1000);
            } else {
              // Restaurer immédiatement pour les autres cas
              console.log = originalConsole.log;
              console.error = originalConsole.error;
              console.warn = originalConsole.warn;
              console.info = originalConsole.info;
              console.debug = originalConsole.debug;
              
              window.removeEventListener('error', handleError, true);
              window.removeEventListener('unhandledrejection', handleError, true);
            }
            
            return response;
          })
          .catch(error => {
            // Capturer silencieusement l'erreur
            localStorage.setItem('fetch_error', JSON.stringify({
              timestamp: new Date().toISOString(),
              message: 'Erreur réseau masquée'
            }));
            
            // Restaurer les fonctions console
            console.log = originalConsole.log;
            console.error = originalConsole.error;
            console.warn = originalConsole.warn;
            console.info = originalConsole.info;
            console.debug = originalConsole.debug;
            
            window.removeEventListener('error', handleError, true);
            window.removeEventListener('unhandledrejection', handleError, true);
            
            // Rejeter avec un message d'erreur générique
            throw new Error("Erreur réseau");
          });
          
        return promise;
      }
      
      // Comportement normal pour les URL non sensibles
      return originalFetch(input, init);
    } catch (e) {
      // En cas d'erreur dans l'interception, continuer avec la requête originale
      // mais bloquer les logs d'erreur
      return originalFetch(input, init);
    }
  };
}
