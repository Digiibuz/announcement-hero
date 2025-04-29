
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
      const sanitizedError = new Error(sanitizeErrorMessage(arg.message));
      sanitizedError.name = arg.name;
      sanitizedError.stack = arg.stack ? sanitizeErrorMessage(arg.stack) : undefined;
      return sanitizedError;
    } else if (typeof arg === 'object' && arg !== null) {
      try {
        // Pour les objets, on tente de les convertir en JSON, masquer, puis reconvertir
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

// Fonction d'initialisation à appeler au démarrage de l'application
export function initConsoleOverrides() {
  // Cette fonction existe juste pour s'assurer que le fichier est importé
  console.log("Sécurisation des logs console initialisée");
}

// Exportation d'une fonction pour tester la sécurisation
export function testSecureLogs() {
  console.log("Test de la sécurisation des logs avec URL: https://rdwqedmvzicerwotjseg.supabase.co/auth");
  console.error("Erreur avec URL: https://preview-c18074be--announcement-hero.lovable.app/login");
}
