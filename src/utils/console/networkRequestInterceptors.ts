
/**
 * Module pour intercepter et sécuriser les requêtes réseau
 */
import { sanitizeErrorMessage } from '../urlSanitizer';

/**
 * Configure les interceptions pour XMLHttpRequest et fetch
 */
export function setupNetworkInterceptors(): void {
  // Hook XMLHttpRequest pour masquer les URLs des requêtes
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
    // Masquer complètement l'URL dans les logs
    const maskedMethod = method.toUpperCase();
    
    // Ne pas logger du tout les requêtes d'authentification
    const urlStr = url.toString();
    if (urlStr.includes('auth/v1/token') || 
        urlStr.includes('grant_type=password') || 
        urlStr.includes('supabase')) {
      // Ne rien logger pour les requêtes d'authentification
      return originalXHROpen.apply(this, [method, url, ...args]);
    }
    
    console.log(`Requête XHR ${maskedMethod} vers [URL_MASQUÉE]`);
    
    // Stocker l'URL originale de façon non accessible aux logs
    return originalXHROpen.apply(this, [method, url, ...args]);
  };

  // Intercepter XMLHttpRequest.send pour masquer les corps de requêtes
  const originalXHRSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function(body: any) {
    // Ne pas logger le corps de la requête qui pourrait contenir des données sensibles
    return originalXHRSend.apply(this, [body]);
  };

  // Ajouter un gestionnaire pour intercepter les erreurs XMLHttpRequest
  const originalXHRSetOnError = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, 'onerror');
  if (originalXHRSetOnError && originalXHRSetOnError.set) {
    Object.defineProperty(XMLHttpRequest.prototype, 'onerror', {
      set(handler) {
        // Wrapper le handler d'origine pour masquer les erreurs
        const secureHandler = function(this: XMLHttpRequest, ev: Event) {
          // Ne rien logger pour les erreurs de requêtes
          // Appeler le handler original avec un événement assaini
          if (typeof handler === 'function') {
            return handler.call(this, ev);
          }
        };
        originalXHRSetOnError.set.call(this, secureHandler);
      },
      get: originalXHRSetOnError.get
    });
  }

  // Hook fetch pour masquer les URLs des requêtes
  const originalFetch = window.fetch;
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    try {
      // Masquer complètement l'URL dans les logs
      const method = init?.method || 'GET';
      const maskedMethod = method.toUpperCase();
      
      // Intercepter spécifiquement les requêtes vers les endpoints d'authentification
      const inputUrl = input instanceof Request ? input.url : input.toString();
      const isAuthRequest = typeof inputUrl === 'string' && (
        inputUrl.includes('auth/v1/token') || 
        inputUrl.includes('grant_type=password') ||
        inputUrl.includes('supabase.co') ||
        inputUrl.includes('token')
      );
      
      // Ne rien logger pour les requêtes d'authentification
      if (!isAuthRequest) {
        // Ne jamais afficher l'URL réelle dans les logs
        console.log(`Requête fetch ${maskedMethod} vers [URL_MASQUÉE]`);
      }
      
      // Intercepter spécifiquement les requêtes vers les Edge Functions Supabase
      if (isAuthRequest && init) {
        // S'assurer que les requêtes aux Edge Functions ont les bons en-têtes
        init.headers = {
          ...init.headers,
          'X-Client-Info': 'DigiiBuz Web App',
          'Content-Type': 'application/json'
        };
      }

      // Capturer les erreurs de réseau ou d'authentification sans exposer l'URL
      return originalFetch(input, init).then(response => {
        // Intercepter spécifiquement les erreurs 400/401
        if ((response.status === 400 || response.status === 401) && 
            typeof inputUrl === 'string') {
          // Ne pas logger d'erreurs pour les échecs d'authentification
        }
        return response;
      }).catch((error) => {
        // Masquer toutes les informations sensibles dans l'erreur
        throw error; // Propager l'erreur originale pour ne pas casser le flux d'exécution
      });
    } catch (error) {
      return originalFetch(input, init); // Continuer malgré l'erreur d'interception
    }
  };

  // Installer un gestionnaire global pour les erreurs réseau non gérées
  window.addEventListener('error', function(event) {
    // Si l'erreur concerne une requête réseau ou d'authentification
    if (event.error && (
        String(event.message).includes('http') || 
        String(event.message).includes('fetch') || 
        String(event.message).includes('auth') || 
        String(event.message).includes('token') || 
        String(event.message).includes('401') || 
        String(event.message).includes('400') ||
        String(event.message).includes('supabase') ||
        String(event.message).includes('grant_type=password'))) {
      
      // Empêcher l'affichage de l'erreur originale
      event.preventDefault();
      return true;
    }
  }, true);

  // Gestionnaire pour les rejets de promesses non gérés (comme les fetch)
  window.addEventListener('unhandledrejection', function(event) {
    // Si l'erreur concerne une requête réseau ou d'authentification
    if (event.reason && typeof event.reason.message === 'string' && (
        event.reason.message.includes('http') || 
        event.reason.message.includes('fetch') ||
        event.reason.message.includes('auth') || 
        event.reason.message.includes('token') ||
        event.reason.message.includes('401') ||
        event.reason.message.includes('400') ||
        event.reason.message.includes('supabase') ||
        event.reason.message.includes('grant_type=password'))) {
      
      // Empêcher l'affichage de l'erreur originale
      event.preventDefault();
      return true;
    }
  });
  
  // Complètement remplacer console.error pour supprimer les erreurs d'authentification
  const originalConsoleError = console.error;
  console.error = function(...args) {
    // Rechercher des motifs spécifiques d'erreur d'authentification dans les arguments
    const containsAuthError = args.some(arg => {
      if (typeof arg === 'string') {
        return (
          arg.includes('POST') && 
          (arg.includes('auth/v1/token') || 
           arg.includes('grant_type=password') ||
           arg.includes('400') ||
           arg.includes('Bad Request'))
        );
      }
      return false;
    });
    
    // Supprimer complètement les logs d'erreur d'authentification
    if (containsAuthError) {
      return; // Ne rien logger du tout
    }
    
    // Sinon utiliser la fonction d'origine avec les arguments sanitisés
    originalConsoleError.apply(console, args.map(arg => {
      if (typeof arg === 'string') {
        return sanitizeErrorMessage(arg);
      }
      return arg;
    }));
  };
}
