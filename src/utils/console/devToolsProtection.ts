
/**
 * Module pour protéger contre l'affichage d'informations sensibles dans les outils de développement
 */
import { SENSITIVE_URL_PATTERNS } from './constants';

/**
 * Configure la protection contre l'affichage d'informations sensibles dans les outils de développement
 */
export function setupDevToolsProtection(): void {
  // Modification des prototypes des inspecteurs Chrome
  try {
    // Cette technique empêche Chrome DevTools de montrer la vraie URL
    const originalToString = Object.prototype.toString;
    Object.prototype.toString = function() {
      if (this instanceof Request || this instanceof Response || this instanceof URL) {
        const str = originalToString.call(this);
        if (SENSITIVE_URL_PATTERNS.some(pattern => pattern.test(str))) {
          return "[object SecureRequest]";
        }
      }
      return originalToString.call(this);
    };
  } catch (e) {
    // Ignorer les erreurs
  }
}
