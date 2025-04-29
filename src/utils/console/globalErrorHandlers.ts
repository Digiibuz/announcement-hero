
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
    // Bloquer complètement les erreurs HTTP 400/401
    if (event.message?.includes('400') || 
        event.message?.includes('401') || 
        event.message?.includes('Bad Request') || 
        event.message?.includes('Unauthorized') ||
        event.message?.includes('POST') && event.message?.includes('supabase')) {
      event.preventDefault();
      return true;
    }
    
    // Déterminer si c'est une erreur liée à l'authentification ou aux requêtes réseau
    const errorMessage = event.message || '';
    const errorStack = event.error?.stack || '';
    const isAuthOrNetworkError = 
      errorMessage.includes('auth') || 
      errorMessage.includes('token') || 
      errorMessage.includes('401') || 
      errorMessage.includes('400') ||
      errorMessage.includes('supabase') ||
      errorStack.includes('auth') ||
      errorStack.includes('token') ||
      errorStack.includes('login') ||
      errorMessage.includes('fetch') ||
      errorMessage.includes('http') ||
      errorMessage.includes('request');
    
    if (isAuthOrNetworkError) {
      // Stopper la propagation de l'erreur originale pour les erreurs d'authentification
      event.preventDefault();
      return true;
    }
    
    // Pour les autres erreurs, logger une version sécurisée sans bloquer
    const securedErrorMessage = sanitizeErrorMessage(event.message);
    const securedErrorStack = event.error?.stack ? sanitizeErrorMessage(event.error.stack) : "";
    
    // Loguer l'erreur sécurisée
    console.error("Erreur globale sécurisée:", securedErrorMessage);
    if (securedErrorStack) {
      console.error("Stack sécurisée:", securedErrorStack);
    }
  });

  // Intercepter les rejets de promesses non gérés
  window.addEventListener('unhandledrejection', (event) => {
    // Bloquer complètement les erreurs HTTP 400/401
    if (typeof event.reason?.message === 'string' && 
        (event.reason.message.includes('400') || 
        event.reason.message.includes('401') || 
        event.reason.message.includes('Bad Request') || 
        event.reason.message.includes('Unauthorized') ||
        event.reason.message.includes('POST') && event.reason.message.includes('supabase'))) {
      event.preventDefault();
      return true;
    }
    
    // Déterminer si c'est un rejet lié à l'authentification
    const reason = event.reason;
    const reasonMessage = reason?.message || '';
    const reasonStack = reason?.stack || '';
    const isAuthRelated = 
      reasonMessage.includes('auth') || 
      reasonMessage.includes('token') || 
      reasonMessage.includes('401') || 
      reasonMessage.includes('400') ||
      reasonMessage.includes('supabase') ||
      reasonStack.includes('auth') ||
      reasonStack.includes('token') ||
      reasonStack.includes('login');
    
    if (isAuthRelated) {
      // Stopper la propagation du rejet original pour l'authentification
      event.preventDefault();
      return true;
    }
    
    // Pour les autres rejets, logger une version sécurisée sans bloquer
    const securedReason = typeof reason === 'string' 
      ? sanitizeErrorMessage(reason) 
      : reason instanceof Error 
        ? new Error(sanitizeErrorMessage(reason.message))
        : "Rejet de promesse non géré (détails masqués)";
    
    // Loguer le rejet sécurisé
    console.error("Rejet de promesse non géré (sécurisé):", securedReason);
  });
}
