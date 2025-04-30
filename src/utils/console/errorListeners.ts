
/**
 * Module pour configurer les écouteurs d'événements d'erreur globaux
 */
import { SENSITIVE_PATTERNS } from './constants';

/**
 * Configure les écouteurs d'événements pour bloquer les erreurs sensibles
 */
export function setupErrorListeners(): void {
  // Installer des intercepteurs d'erreurs globaux
  window.addEventListener('error', function(event) {
    const eventData = event.message || event.error?.stack || '';
    
    // Bloquer les événements d'erreur liés aux patterns sensibles
    if (SENSITIVE_PATTERNS.some(pattern => pattern.test(eventData))) {
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
  }, true);
  
  // Même chose pour les rejets de promesses
  window.addEventListener('unhandledrejection', function(event) {
    const reasonStr = String(event.reason || '');
    
    // Bloquer les rejets de promesses liés aux patterns sensibles
    if (SENSITIVE_PATTERNS.some(pattern => pattern.test(reasonStr))) {
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
  }, true);
}
