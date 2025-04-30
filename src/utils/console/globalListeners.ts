
/**
 * Module pour configurer les écouteurs d'événements d'erreur globaux
 */
import { replaceAllSensitiveUrls } from './stringReplacer';
import { SENSITIVE_PATTERNS } from './consoleOverrides';

/**
 * Configure les écouteurs d'événements d'erreur globaux
 */
export function setupGlobalListeners(): void {
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
