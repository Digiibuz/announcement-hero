
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

  // Hook fetch pour masquer les URLs des requêtes
  const originalFetch = window.fetch;
  window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    // Masquer complètement l'URL dans les logs
    const method = init?.method || 'GET';
    const maskedMethod = method.toUpperCase();
    
    // Ne jamais afficher l'URL réelle dans les logs
    console.log(`Requête fetch ${maskedMethod} vers [URL_MASQUÉE]`);
    
    // Capturer les erreurs de réseau sans exposer l'URL
    return originalFetch(input, init).catch((error) => {
      // Masquer toutes les informations sensibles dans l'erreur
      console.error(`Erreur réseau lors d'une requête ${maskedMethod}:`, sanitizeErrorMessage(error.message));
      throw error; // Propager l'erreur originale pour ne pas casser le flux d'exécution
    });
  };

  // Surveiller les erreurs de console pour masquer les URL en direct
  const originalConsoleError = console.error;
  console.error = function(...args) {
    // Masquer les URLs dans tous les arguments d'erreur
    const sanitizedArgs = args.map(arg => {
      if (typeof arg === 'string') {
        // Masquer les requêtes HTTP qui pourraient être loggées
        arg = arg.replace(/\b(GET|POST|PUT|DELETE|PATCH|OPTIONS|HEAD)\s+https?:\/\/[^\s"']+/gi, '$1 [URL_MASQUÉE]');
        
        // Masquer les URLs intégrées dans le texte
        arg = sanitizeErrorMessage(arg);
      }
      return arg;
    });
    
    // Utiliser l'implémentation originale de console.error avec les arguments nettoyés
    originalConsoleError.apply(console, sanitizedArgs);
  };

  // Injecter un gestionnaire global pour masquer les erreurs non gérées
  window.addEventListener('error', function(event) {
    if (event.message && event.message.includes('http')) {
      // Empêcher l'affichage de l'erreur originale si elle contient une URL
      event.preventDefault();
      
      // Afficher une version sécurisée de l'erreur
      console.error('Erreur réseau sécurisée (détails masqués)');
      return true;
    }
  }, true);

  // Masquer les erreurs dans les requêtes réseau non gérées
  window.addEventListener('unhandledrejection', function(event) {
    if (event.reason && (typeof event.reason.message === 'string' && event.reason.message.includes('http'))) {
      // Empêcher l'affichage de l'erreur originale si elle contient une URL
      event.preventDefault();
      
      // Afficher une version sécurisée de l'erreur
      console.error('Promesse rejetée (URL masquée):', sanitizeErrorMessage(String(event.reason)));
      return true;
    }
  });
}
