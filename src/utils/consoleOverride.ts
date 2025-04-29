
import { sanitizeErrorMessage } from './security';

// Sauvegarde de la fonction console.error originale
const originalConsoleError = console.error;

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
        // Si ça échoue, on renvoie l'objet tel quel
        return arg;
      }
    }
    return arg;
  });
  
  // Appel à la fonction console.error originale avec les arguments masqués
  originalConsoleError.apply(console, sanitizedArgs);
};

// Fonction d'initialisation à appeler au démarrage de l'application
export function initConsoleOverrides() {
  // Cette fonction existe juste pour s'assurer que le fichier est importé
  console.log("Sécurisation des logs console initialisée");
}
