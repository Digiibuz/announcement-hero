
import { sanitizeErrorMessage } from './security';

// Sauvegarde des fonctions console originales
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;
const originalConsoleDebug = console.debug;
const originalConsoleInfo = console.info;

/**
 * Fonction utilitaire pour sanitiser tous les types d'arguments
 * @param args Arguments à sanitiser
 * @returns Arguments sanitisés
 */
function sanitizeAllArgs(args: any[]): any[] {
  return args.map(arg => {
    if (typeof arg === 'string') {
      return sanitizeErrorMessage(arg);
    } else if (arg instanceof Error) {
      // Pour les objets Error, masquer le message, le nom et la stack trace
      const sanitizedError = new Error(sanitizeErrorMessage(arg.message));
      sanitizedError.name = arg.name;
      sanitizedError.stack = arg.stack ? sanitizeErrorMessage(arg.stack) : undefined;
      return sanitizedError;
    } else if (typeof arg === 'object' && arg !== null) {
      try {
        // Traiter spécifiquement les objets Response
        if (arg instanceof Response) {
          return {
            status: arg.status,
            statusText: arg.statusText,
            url: sanitizeErrorMessage(arg.url || '')
          };
        }
        
        // Pour les autres objets, on tente de les convertir en JSON, masquer, puis reconvertir
        const jsonStr = JSON.stringify(arg);
        const sanitizedJson = sanitizeErrorMessage(jsonStr);
        return JSON.parse(sanitizedJson);
      } catch {
        // Si ça échoue, on renvoie un objet générique
        return { info: "Objet masqué pour raisons de sécurité" };
      }
    }
    return arg;
  });
}

// Override de console.error pour intercepter et masquer les informations sensibles
console.error = function(...args: any[]) {
  // Masquer les informations sensibles dans tous les arguments
  const sanitizedArgs = sanitizeAllArgs(args);
  
  // Appel à la fonction console.error originale avec les arguments masqués
  originalConsoleError.apply(console, sanitizedArgs);
};

// Override de console.warn
console.warn = function(...args: any[]) {
  const sanitizedArgs = sanitizeAllArgs(args);
  originalConsoleWarn.apply(console, sanitizedArgs);
};

// Override de console.log
console.log = function(...args: any[]) {
  const sanitizedArgs = sanitizeAllArgs(args);
  originalConsoleLog.apply(console, sanitizedArgs);
};

// Override de console.debug
console.debug = function(...args: any[]) {
  const sanitizedArgs = sanitizeAllArgs(args);
  originalConsoleDebug.apply(console, sanitizedArgs);
};

// Override de console.info
console.info = function(...args: any[]) {
  const sanitizedArgs = sanitizeAllArgs(args);
  originalConsoleInfo.apply(console, sanitizedArgs);
};

// Intercepter les erreurs globales
window.addEventListener('error', (event) => {
  // Stopper la propagation de l'erreur originale
  event.preventDefault();
  
  // Créer une erreur sécurisée
  const securedErrorMessage = sanitizeErrorMessage(event.message);
  const securedErrorStack = event.error?.stack ? sanitizeErrorMessage(event.error.stack) : "";
  
  // Loguer l'erreur sécurisée
  console.error("Erreur globale sécurisée:", securedErrorMessage);
  if (securedErrorStack) {
    console.error("Stack sécurisée:", securedErrorStack);
  }
  
  return true;
});

// Intercepter les rejets de promesses non gérés
window.addEventListener('unhandledrejection', (event) => {
  // Stopper la propagation du rejet original
  event.preventDefault();
  
  // Créer un rejet sécurisé
  const reason = event.reason;
  const securedReason = typeof reason === 'string' 
    ? sanitizeErrorMessage(reason) 
    : reason instanceof Error 
      ? new Error(sanitizeErrorMessage(reason.message))
      : "Rejet de promesse non géré (détails masqués)";
  
  // Loguer le rejet sécurisé
  console.error("Rejet de promesse non géré (sécurisé):", securedReason);
  
  return true;
});

// Hook XMLHttpRequest pour masquer les URLs des requêtes
const originalXHROpen = XMLHttpRequest.prototype.open;
XMLHttpRequest.prototype.open = function(method: string, url: string | URL, ...args: any[]) {
  // Sauvegarder l'URL originale pour un usage interne mais masquer les logs
  console.log(`Requête XHR ${method} vers [URL_MASQUÉE]`);
  return originalXHROpen.apply(this, [method, url, ...args]);
};

// Hook fetch pour masquer les URLs des requêtes
const originalFetch = window.fetch;
window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  // Loguer la requête de manière sécurisée
  const method = init?.method || 'GET';
  console.log(`Requête fetch ${method} vers [URL_MASQUÉE]`);
  
  // Continuer avec la requête fetch originale
  return originalFetch(input, init);
};

// Fonction d'initialisation à appeler au démarrage de l'application
export function initConsoleOverrides() {
  console.log("Sécurisation des logs console initialisée");
}

// Exportation d'une fonction pour tester la sécurisation
export function testSecureLogs() {
  console.log("Test de la sécurisation des logs avec URL: https://rdwqedmvzicerwotjseg.supabase.co/auth");
  console.error("Erreur avec URL: https://preview-c18074be--announcement-hero.lovable.app/login");
  console.log("Test de masquage d'une requête HTTP: POST https://rdwqedmvzicerwotjseg.supabase.co/auth/v1/token?grant_type=password");
  console.error("Erreur d'authentification: invalid_credentials");
}
