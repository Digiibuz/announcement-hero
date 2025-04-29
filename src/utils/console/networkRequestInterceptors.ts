
/**
 * Module pour intercepter et sécuriser les requêtes réseau
 */
import { sanitizeErrorMessage } from '../urlSanitizer';

/**
 * Configure les interceptions pour XMLHttpRequest et fetch
 */
export function setupNetworkInterceptors(): void {
  // Bloquer complètement les erreurs spécifiques d'authentification dans la console
  const originalConsoleError = console.error;
  console.error = function(...args) {
    // Bloquer complètement les erreurs d'authentification
    const isAuthError = args.some(arg => {
      if (arg === undefined || arg === null) return false;
      const str = String(arg);
      return (str.includes('POST') && (
                str.includes('auth/v1/token') ||
                str.includes('token?grant_type=password') ||
                str.includes('supabase.co')
              )) ||
             str.includes('400') || 
             str.includes('401') || 
             str.includes('Bad Request') ||
             str.includes('Invalid login credentials');
    });
    
    if (isAuthError) {
      return; // Ne rien logger du tout
    }
    
    originalConsoleError.apply(console, args.map(arg => {
      if (typeof arg === 'string') {
        return sanitizeErrorMessage(arg);
      }
      return arg;
    }));
  };

  // Intercepter fetch pour masquer les URLs des requêtes
  const originalFetch = window.fetch;
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    try {
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
        console.log(`Requête fetch vers [URL_MASQUÉE]`);
      }
      
      // Bloquer les erreurs liées à l'authentification
      if (isAuthRequest) {
        // Installer un intercepteur d'erreurs spécifique pour cette requête
        const errorHandler = (event: Event) => {
          // Bloquer complètement les erreurs liées à cette requête
          event.preventDefault();
          event.stopPropagation();
          return true;
        };
        
        // Ajouter des gestionnaires d'erreurs temporaires
        window.addEventListener('error', errorHandler, true);
        window.addEventListener('unhandledrejection', errorHandler, true);
        
        // Exécuter la requête avec les gestionnaires d'erreurs
        return originalFetch(input, init)
          .catch(error => {
            // Supprimer toute trace d'erreur dans la console
            throw new Error("Erreur d'authentification");
          })
          .finally(() => {
            // Supprimer les gestionnaires d'erreurs
            window.removeEventListener('error', errorHandler, true);
            window.removeEventListener('unhandledrejection', errorHandler, true);
          });
      }

      // Pour les autres requêtes, continuer normalement
      return originalFetch(input, init);
    } catch (error) {
      return originalFetch(input, init);
    }
  };

  // Hook XMLHttpRequest pour bloquer les URLs des requêtes sensibles
  const originalXHROpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
    // Bloquer complètement les logs pour les requêtes d'authentification
    const urlStr = url.toString();
    const isAuthRequest = urlStr.includes('auth/v1/token') || 
                         urlStr.includes('grant_type=password') || 
                         urlStr.includes('supabase.co');
    
    if (isAuthRequest) {
      // Intercepter et bloquer les erreurs pour cette requête
      this.addEventListener('error', (event) => {
        event.preventDefault();
        event.stopPropagation();
        return true;
      });
      
      // Intercepter également l'événement load pour bloquer les erreurs dans la réponse
      this.addEventListener('load', () => {
        if (this.status === 400 || this.status === 401) {
          // Ne pas logger les réponses d'erreur
          const originalConsoleLog = console.log;
          const originalConsoleError = console.error;
          console.log = () => {};
          console.error = () => {};
          
          // Restaurer après un court délai
          setTimeout(() => {
            console.log = originalConsoleLog;
            console.error = originalConsoleError;
          }, 100);
        }
      });
    } else {
      // Ne pas logger les URLs sensibles
      console.log(`Requête XHR ${method.toUpperCase()} vers [URL_MASQUÉE]`);
    }
    
    return originalXHROpen.apply(this, [method, url, ...args]);
  };

  // Bloquer spécifiquement les affichages d'URLs supabase dans la console
  // Cette partie est critique car c'est ce qui est visible dans votre capture d'écran
  const originalConsoleLog = console.log;
  console.log = function(...args) {
    // Bloquer spécifiquement les logs contenant des URLs Supabase ou des messages d'erreur d'authentification
    const shouldBlock = args.some(arg => {
      if (arg === undefined || arg === null) return false;
      const str = String(arg);
      return str.includes('rdwqedmvzicerwotjseg.supabase.co') || 
             str.includes('auth/v1/token') ||
             str.includes('token?grant_type=password');
    });
    
    if (shouldBlock) {
      return; // Ne rien logger du tout
    }
    
    originalConsoleLog.apply(console, args);
  };
  
  // Installer des gestionnaires d'erreur pour les requêtes qui pourraient échouer
  window.addEventListener('error', function(event) {
    // Vérifier si l'événement contient des URL sensibles
    if (event.message && (
        event.message.includes('supabase.co') ||
        event.message.includes('auth/v1/token') ||
        event.message.includes('token?grant_type=password') ||
        event.message.includes('400') || 
        event.message.includes('401'))) {
      // Bloquer complètement l'affichage de ces erreurs
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
  }, true); // Utiliser la phase de capture
  
  // Même chose pour les rejets de promesses
  window.addEventListener('unhandledrejection', function(event) {
    // Vérifier si le rejet contient des URL sensibles
    const reasonStr = String(event.reason || '');
    if (reasonStr.includes('supabase.co') ||
        reasonStr.includes('auth/v1/token') ||
        reasonStr.includes('token?grant_type=password') ||
        reasonStr.includes('400') || 
        reasonStr.includes('401')) {
      // Bloquer complètement l'affichage de ces erreurs
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
  }, true); // Utiliser la phase de capture
}

// Installez immédiatement les intercepteurs pour être sûr qu'ils sont actifs
setupNetworkInterceptors();
