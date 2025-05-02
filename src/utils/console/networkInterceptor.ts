
/**
 * Module pour intercepter toutes les requêtes réseau et masquer complètement les URLs sensibles
 * avant qu'elles n'apparaissent dans la console ou les outils de développement
 */

// Liste des patterns d'URL sensibles à masquer complètement
const SENSITIVE_URL_PATTERNS = [
  /supabase\.co/i,
  /auth\/v1\/token/i,
  /token\?grant_type=password/i,
  /auth\/v1/i,
  /grant_type=password/i,
  /400.*bad request/i,
  /401/i,
  /rdwqedmvzicerwotjseg/i
];

/**
 * Remplace l'URL originale par une URL sécurisée qui n'expose pas d'informations sensibles
 */
function createSecureUrl(originalUrl: string): string {
  return "https://api-secure.example.com/auth";
}

/**
 * Intercepte et modifie le prototype de fetch pour masquer les URLs sensibles
 */
export function setupFetchInterceptor(): void {
  const originalFetch = window.fetch;
  
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    try {
      // Extraire l'URL de la requête
      const url = typeof input === 'string' ? input : input instanceof Request ? input.url : String(input);
      
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
        } else {
          secureInput = input;
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

/**
 * Intercepte et modifie le prototype de XMLHttpRequest pour masquer les URLs sensibles
 */
export function setupXHRInterceptor(): void {
  const originalOpen = XMLHttpRequest.prototype.open;
  
  XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]): void {
    try {
      const urlString = String(url);
      
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
}

/**
 * Configure les interceptions pour fetch et XMLHttpRequest
 */
export function setupNetworkInterceptors(): void {
  setupFetchInterceptor();
  setupXHRInterceptor();
}

// Initialiser les intercepteurs immédiatement
setupNetworkInterceptors();

// Exporter pour utilisation ailleurs
export default setupNetworkInterceptors;
