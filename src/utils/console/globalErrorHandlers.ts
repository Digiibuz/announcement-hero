
/**
 * Module pour gérer les erreurs globales et les rejets de promesses
 * avec une approche plus agressive de remplacement d'URLs
 */

// URLs sensibles à remplacer
const SENSITIVE_URLS = [
  'supabase.co',
  'auth/v1/token',
  'token?grant_type=password',
  'grant_type=password',
  'rdwqedmvzicerwotjseg'
];

// URL factice à utiliser dans les logs
const FAKE_URL = 'https://api-secure.example.com/auth';

/**
 * Remplace toutes les URLs sensibles dans une chaîne
 */
function replaceAllSensitiveUrls(str: string): string {
  if (!str) return str;
  
  let result = str;
  
  // Remplacer toutes les URLs HTTP(S) sensibles
  for (const sensitiveUrl of SENSITIVE_URLS) {
    // URL complète avec protocole
    const httpRegex = new RegExp(`https?://[^\\s"']*${sensitiveUrl}[^\\s"']*`, 'gi');
    result = result.replace(httpRegex, FAKE_URL);
    
    // Partie d'URL sans protocole
    const partRegex = new RegExp(`[^\\s"'/]*${sensitiveUrl}[^\\s"']*`, 'gi');
    result = result.replace(partRegex, 'api-secure.example.com');
  }
  
  // Remplacer les requêtes HTTP avec méthode
  const methodRegex = /(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+https?:\/\/[^\s"']*/gi;
  result = result.replace(methodRegex, '$1 ' + FAKE_URL);
  
  // Remplacer les codes d'erreur HTTP
  result = result.replace(/400\s*\(Bad Request\)/gi, '[ERREUR_HTTP]');
  result = result.replace(/401\s*\(Unauthorized\)/gi, '[ERREUR_HTTP]');
  
  // Remplacer les références aux fichiers JS minifiés
  result = result.replace(/index-[a-zA-Z0-9_-]+\.js/gi, 'app.js');
  
  return result;
}

/**
 * Configure les écouteurs d'événements pour les erreurs globales
 * et remplace toutes les URLs sensibles
 */
export function setupGlobalErrorHandlers(): void {
  // Patterns sensibles à bloquer
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
  
  // Sauvegardes des fonctions console originales
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;
  const originalConsoleInfo = console.info;
  const originalConsoleDebug = console.debug;
  
  // Remplacer console.error pour remplacer toutes les URLs sensibles
  console.error = function(...args) {
    // Bloquer complètement les messages avec des patterns sensibles
    if (args.some(arg => {
      if (arg === undefined || arg === null) return false;
      const str = String(arg);
      return SENSITIVE_PATTERNS.some(pattern => pattern.test(str));
    })) {
      return; // Supprimer complètement le message
    }
    
    // Pour les autres messages, remplacer les URLs sensibles
    const newArgs = args.map(arg => {
      if (typeof arg === 'string') {
        return replaceAllSensitiveUrls(arg);
      }
      return arg;
    });
    
    // Appel à la fonction originale avec les arguments modifiés
    originalConsoleError.apply(console, newArgs);
  };
  
  // Même logique pour console.warn
  console.warn = function(...args) {
    if (args.some(arg => {
      if (arg === undefined || arg === null) return false;
      const str = String(arg);
      return SENSITIVE_PATTERNS.some(pattern => pattern.test(str));
    })) {
      return;
    }
    
    const newArgs = args.map(arg => {
      if (typeof arg === 'string') {
        return replaceAllSensitiveUrls(arg);
      }
      return arg;
    });
    
    originalConsoleWarn.apply(console, newArgs);
  };
  
  // Même logique pour console.log
  console.log = function(...args) {
    if (args.some(arg => {
      if (arg === undefined || arg === null) return false;
      const str = String(arg);
      return SENSITIVE_PATTERNS.some(pattern => pattern.test(str));
    })) {
      return;
    }
    
    const newArgs = args.map(arg => {
      if (typeof arg === 'string') {
        return replaceAllSensitiveUrls(arg);
      }
      return arg;
    });
    
    originalConsoleLog.apply(console, newArgs);
  };
  
  // Même logique pour console.info
  console.info = function(...args) {
    if (args.some(arg => {
      if (arg === undefined || arg === null) return false;
      const str = String(arg);
      return SENSITIVE_PATTERNS.some(pattern => pattern.test(str));
    })) {
      return;
    }
    
    const newArgs = args.map(arg => {
      if (typeof arg === 'string') {
        return replaceAllSensitiveUrls(arg);
      }
      return arg;
    });
    
    originalConsoleInfo.apply(console, newArgs);
  };
  
  // Même logique pour console.debug
  console.debug = function(...args) {
    if (args.some(arg => {
      if (arg === undefined || arg === null) return false;
      const str = String(arg);
      return SENSITIVE_PATTERNS.some(pattern => pattern.test(str));
    })) {
      return;
    }
    
    const newArgs = args.map(arg => {
      if (typeof arg === 'string') {
        return replaceAllSensitiveUrls(arg);
      }
      return arg;
    });
    
    originalConsoleDebug.apply(console, newArgs);
  };

  // Remplacer Error.prototype.toString pour masquer les URLs dans les objets Error
  const originalErrorToString = Error.prototype.toString;
  Error.prototype.toString = function() {
    const originalString = originalErrorToString.call(this);
    return replaceAllSensitiveUrls(originalString);
  };
  
  // Remplacer Object.prototype.toString pour les URLs dans les objets
  const originalObjectToString = Object.prototype.toString;
  Object.prototype.toString = function() {
    const originalString = originalObjectToString.call(this);
    if (this instanceof Request || this instanceof Response || this instanceof URL) {
      return replaceAllSensitiveUrls(originalString);
    }
    return originalString;
  };

  // Intercepter les erreurs globales
  window.addEventListener('error', (event) => {
    // Vérifier si l'erreur contient des informations sensibles
    const errorText = event.message || event.error?.stack || '';
    if (SENSITIVE_PATTERNS.some(pattern => pattern.test(errorText))) {
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
    
    // Remplacer les informations sensibles dans les messages d'erreur
    if (event.error && event.error.stack) {
      Object.defineProperty(event.error, 'stack', {
        get: function() {
          const originalStack = Error.prototype.stack;
          return replaceAllSensitiveUrls(originalStack);
        },
        configurable: true
      });
    }
  }, true);

  // Intercepter les rejets de promesses non gérés
  window.addEventListener('unhandledrejection', (event) => {
    // Vérifier si la raison contient des informations sensibles
    const reasonText = typeof event.reason === 'string' 
      ? event.reason
      : event.reason?.message || event.reason?.stack || '';
    
    if (SENSITIVE_PATTERNS.some(pattern => pattern.test(reasonText))) {
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
    
    // Remplacer les informations sensibles dans les raisons de rejet
    if (typeof event.reason === 'string') {
      Object.defineProperty(event, 'reason', {
        get: function() {
          return replaceAllSensitiveUrls(event.reason);
        },
        configurable: true
      });
    } else if (event.reason && event.reason.stack) {
      Object.defineProperty(event.reason, 'stack', {
        get: function() {
          const originalStack = event.reason.stack;
          return replaceAllSensitiveUrls(originalStack);
        },
        configurable: true
      });
    }
  }, true);
}

// Initialiser automatiquement
setupGlobalErrorHandlers();
