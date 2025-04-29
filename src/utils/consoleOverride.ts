
import { sanitizeErrorMessage } from './security';

// Sauvegarde des fonctions console originales
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;

// Override de console.error pour intercepter et masquer les informations sensibles
console.error = function(...args: any[]) {
  // Masquer les informations sensibles dans tous les arguments
  const sanitizedArgs = args.map(arg => {
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
  
  // Appel à la fonction console.error originale avec les arguments masqués
  originalConsoleError.apply(console, sanitizedArgs);
};

// Override de console.warn pour les messages d'avertissement qui pourraient contenir des infos sensibles
console.warn = function(...args: any[]) {
  // Appliquer le même traitement que pour console.error
  const sanitizedArgs = args.map(arg => {
    if (typeof arg === 'string') {
      return sanitizeErrorMessage(arg);
    } else if (typeof arg === 'object' && arg !== null) {
      try {
        const jsonStr = JSON.stringify(arg);
        const sanitizedJson = sanitizeErrorMessage(jsonStr);
        return JSON.parse(sanitizedJson);
      } catch {
        return arg;
      }
    }
    return arg;
  });
  
  originalConsoleWarn.apply(console, sanitizedArgs);
};

// Override partiel de console.log pour les messages sensibles
// On applique une détection moins aggressive pour ne pas trop impacter les logs de débogage
console.log = function(...args: any[]) {
  const sanitizedArgs = args.map(arg => {
    // Pour console.log, on ne traite que les chaînes qui contiennent des mots-clés sensibles
    if (typeof arg === 'string' && 
        (arg.includes('supabase') || 
         arg.includes('auth') || 
         arg.includes('token') || 
         arg.includes('password') ||
         /https?:\/\/[a-z0-9-_]{10,30}\.supabase\.co/.test(arg))) {
      return sanitizeErrorMessage(arg);
    }
    return arg;
  });
  
  originalConsoleLog.apply(console, sanitizedArgs);
};

// Fonction d'initialisation à appeler au démarrage de l'application
export function initConsoleOverrides() {
  // Cette fonction existe juste pour s'assurer que le fichier est importé
  console.log("Sécurisation des logs console initialisée");
}
