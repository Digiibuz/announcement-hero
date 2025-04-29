
/**
 * Module pour gérer les erreurs globales et les rejets de promesses
 */
import { sanitizeErrorMessage } from '../urlSanitizer';

/**
 * Configure les écouteurs d'événements pour les erreurs globales
 */
export function setupGlobalErrorHandlers(): void {
  // Intercepter les erreurs globales
  window.addEventListener('error', (event) => {
    // Stopper la propagation de l'erreur originale
    event.preventDefault();
    
    // Créer une erreur sécurisée
    const securedErrorMessage = sanitizeErrorMessage(event.message);
    const securedErrorStack = event.error?.stack ? sanitizeErrorMessage(event.error.stack) : "";
    
    // Loguer l'erreur sécurisée
    console.error("Erreur globale sécurisée:", securedErrorMessage);
    if (securedErrorStack) {
      console.error("Stack sécurisée:", securedErrorStack);
    }
    
    return true;
  });

  // Intercepter les rejets de promesses non gérés
  window.addEventListener('unhandledrejection', (event) => {
    // Stopper la propagation du rejet original
    event.preventDefault();
    
    // Créer un rejet sécurisé
    const reason = event.reason;
    const securedReason = typeof reason === 'string' 
      ? sanitizeErrorMessage(reason) 
      : reason instanceof Error 
        ? new Error(sanitizeErrorMessage(reason.message))
        : "Rejet de promesse non géré (détails masqués)";
    
    // Loguer le rejet sécurisé
    console.error("Rejet de promesse non géré (sécurisé):", securedReason);
    
    return true;
  });
}
