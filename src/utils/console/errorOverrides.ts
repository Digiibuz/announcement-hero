
/**
 * Module pour modifier les prototypes des objets Error et les rendre plus sécurisés
 */
import { replaceAllSensitiveUrls } from './stringReplacer';
import { SENSITIVE_PATTERNS } from './consoleOverrides';

/**
 * Configure les remplacements pour les prototypes d'erreur
 */
export function setupErrorPrototypeOverrides(): void {
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
}
