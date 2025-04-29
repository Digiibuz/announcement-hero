
/**
 * Utilitaires pour sécuriser les logs dans la console
 */
import { sanitizeErrorMessage } from './urlSanitizer';

/**
 * Wrapper pour console.error qui masque les informations sensibles
 * @param message Le message d'erreur
 * @param args Arguments supplémentaires
 */
export function safeConsoleError(message: string, ...args: any[]): void {
  // Masquer le message principal
  const sanitizedMessage = sanitizeErrorMessage(message);
  
  // Masquer également les arguments qui pourraient contenir des informations sensibles
  const sanitizedArgs = args.map(arg => {
    if (typeof arg === 'string') {
      return sanitizeErrorMessage(arg);
    } else if (typeof arg === 'object' && arg !== null) {
      try {
        // Tenter de masquer les objets JSON contenant des informations sensibles
        const jsonString = JSON.stringify(arg);
        const sanitizedJson = sanitizeErrorMessage(jsonString);
        return JSON.parse(sanitizedJson);
      } catch {
        // En cas d'échec, retourner un objet générique
        return {"message": "Objet masqué pour raisons de sécurité"};
      }
    }
    return arg;
  });
  
  // Utiliser console.error directement ici pour éviter les boucles infinies
  // La version globale de console.error est déjà écrasée
  console.error(sanitizedMessage, ...sanitizedArgs);
}

/**
 * Fonction utilitaire pour sanitiser tous les types d'arguments
 * @param args Arguments à sanitiser
 * @returns Arguments sanitisés
 */
export function sanitizeAllArgs(args: any[]): any[] {
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
