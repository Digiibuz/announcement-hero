
/**
 * Module pour gérer les remplacements des fonctions console
 */

// Sauvegarde des fonctions console originales
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;
const originalConsoleDebug = console.debug;
const originalConsoleInfo = console.info;

// Liste des patterns sensibles à bloquer complètement
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

// Fonction pour vérifier si un message contient des informations sensibles
function containsSensitiveInfo(args) {
  if (!args || args.length === 0) return false;
  
  return args.some(arg => {
    if (arg === null || arg === undefined) return false;
    const str = String(arg);
    return SENSITIVE_PATTERNS.some(pattern => pattern.test(str));
  });
}

/**
 * Remplace les fonctions console natives pour masquer les informations sensibles
 */
export function overrideConsoleMethods(): void {
  // Override de console.error pour bloquer complètement les informations sensibles
  console.error = function(...args) {
    // Bloquer complètement les logs contenant des informations sensibles
    if (containsSensitiveInfo(args)) {
      return; // Ne rien afficher
    }
    
    // Appel à la fonction console.error originale uniquement pour les messages non sensibles
    originalConsoleError.apply(console, args);
  };

  // Override de console.warn
  console.warn = function(...args) {
    // Bloquer complètement les logs contenant des informations sensibles
    if (containsSensitiveInfo(args)) {
      return; // Ne rien afficher
    }
    
    originalConsoleWarn.apply(console, args);
  };

  // Override de console.log
  console.log = function(...args) {
    // Bloquer complètement les logs contenant des informations sensibles
    if (containsSensitiveInfo(args)) {
      return; // Ne rien afficher
    }
    
    originalConsoleLog.apply(console, args);
  };

  // Override de console.debug
  console.debug = function(...args) {
    // Bloquer complètement les logs contenant des informations sensibles
    if (containsSensitiveInfo(args)) {
      return; // Ne rien afficher
    }
    
    originalConsoleDebug.apply(console, args);
  };

  // Override de console.info
  console.info = function(...args) {
    // Bloquer complètement les logs contenant des informations sensibles
    if (containsSensitiveInfo(args)) {
      return; // Ne rien afficher
    }
    
    originalConsoleInfo.apply(console, args);
  };
}

/**
 * Restaure les fonctions console d'origine (utile pour les tests)
 */
export function restoreConsoleFunctions(): void {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
  console.debug = originalConsoleDebug;
  console.info = originalConsoleInfo;
}
