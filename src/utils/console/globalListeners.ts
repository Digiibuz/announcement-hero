/**
 * Module pour configurer les écouteurs d'événements d'erreur globaux
 */
import { replaceAllSensitiveUrls } from './stringReplacer';
import { SENSITIVE_PATTERNS } from './constants';
import { sanitizeArgs } from './consoleOverrides';

/**
 * Process error event objects to remove sensitive information
 */
function processSensitiveErrorEvent(event: ErrorEvent | PromiseRejectionEvent): boolean {
  // Extract the error text from the event
  let errorText = '';
  
  if ('message' in event) { // ErrorEvent
    errorText = event.message || (event.error?.stack || '');
  } else if ('reason' in event) { // PromiseRejectionEvent
    errorText = typeof event.reason === 'string' 
      ? event.reason
      : event.reason?.message || event.reason?.stack || '';
  }
  
  // Check if the error contains sensitive information
  if (SENSITIVE_PATTERNS.some(pattern => pattern.test(errorText))) {
    event.preventDefault();
    event.stopPropagation();
    return true;
  }
  
  return false;
}

/**
 * Sanitize error stack traces
 */
function sanitizeErrorStack(obj: any): void {
  if (obj && obj.stack) {
    Object.defineProperty(obj, 'stack', {
      get: function() {
        const originalStack = obj.stack;
        return replaceAllSensitiveUrls(originalStack);
      },
      configurable: true
    });
  }
}

/**
 * Configure les écouteurs d'événements d'erreur globaux
 */
export function setupGlobalListeners(): void {
  // Intercepter les erreurs globales
  window.addEventListener('error', (event) => {
    // Check if we should completely block this error
    if (processSensitiveErrorEvent(event)) {
      return true;
    }
    
    // Otherwise sanitize the stack trace
    if (event.error) {
      sanitizeErrorStack(event.error);
    }
  }, true);

  // Intercepter les rejets de promesses non gérés
  window.addEventListener('unhandledrejection', (event) => {
    // Check if we should completely block this rejection
    if (processSensitiveErrorEvent(event)) {
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
    } else if (event.reason) {
      sanitizeErrorStack(event.reason);
    }
  }, true);
}
