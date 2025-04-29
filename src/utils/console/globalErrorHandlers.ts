
/**
 * Module pour gérer les erreurs globales et les rejets de promesses
 */
import { sanitizeErrorMessage } from '../urlSanitizer';

/**
 * Configure les écouteurs d'événements pour les erreurs globales
 */
export function setupGlobalErrorHandlers(): void {
  // Sauvegardes des fonctions console originales pour les restaurer si nécessaire
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;
  
  // Remplacer console.error pour bloquer les erreurs d'authentification
  console.error = function(...args) {
    // Détecter si les arguments contiennent des mots liés à l'authentification
    const containsAuthPattern = args.some(arg => {
      if (arg === undefined || arg === null) return false;
      const str = String(arg);
      return str.includes('auth') || 
             str.includes('token') || 
             str.includes('supabase.co') || 
             str.includes('400') || 
             str.includes('401') ||
             str.includes('Bad Request') ||
             str.includes('POST') && str.includes('grant_type=password') ||
             str.includes('Invalid login credentials') ||
             str.includes('token?grant_type=password');
    });
    
    // Si c'est lié à l'authentification, ne rien afficher
    if (containsAuthPattern) {
      return; // Supprime complètement le message d'erreur
    }
    
    // Pour les autres types d'erreurs, utiliser la fonction originale
    originalConsoleError.apply(console, args);
  };
  
  // Même logique pour console.warn
  console.warn = function(...args) {
    const containsAuthPattern = args.some(arg => {
      if (arg === undefined || arg === null) return false;
      const str = String(arg);
      return str.includes('auth') || 
             str.includes('token') || 
             str.includes('supabase.co') || 
             str.includes('400') || 
             str.includes('401');
    });
    
    if (containsAuthPattern) {
      return;
    }
    
    originalConsoleWarn.apply(console, args);
  };
  
  // Même logique pour console.log
  console.log = function(...args) {
    const containsAuthPattern = args.some(arg => {
      if (arg === undefined || arg === null) return false;
      const str = String(arg);
      return str.includes('auth/v1/token') || 
             str.includes('token?grant_type=password') || 
             str.includes('rdwqedmvzicerwotjseg.supabase.co') && str.includes('auth');
    });
    
    if (containsAuthPattern) {
      return;
    }
    
    originalConsoleLog.apply(console, args);
  };

  // Intercepter les erreurs globales avec capture très haut niveau
  window.addEventListener('error', (event) => {
    // Bloquer complètement les erreurs HTTP 400/401 ou liées à l'authentification
    if (event.message?.includes('400') || 
        event.message?.includes('401') || 
        event.message?.includes('Bad Request') || 
        event.message?.includes('Unauthorized') ||
        event.message?.includes('POST') && (
          event.message?.includes('supabase') || 
          event.message?.includes('token') || 
          event.message?.includes('auth/v1')
        ) ||
        event.message?.includes('rdwqedmvzicerwotjseg') ||
        event.error?.stack?.includes('token?grant_type=password')) {
      event.preventDefault();
      event.stopPropagation();
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
  }, true); // Utiliser la phase de capture pour intercepter les erreurs avant qu'elles n'atteignent d'autres gestionnaires

  // Intercepter les rejets de promesses non gérés - également en phase de capture
  window.addEventListener('unhandledrejection', (event) => {
    // Bloquer complètement les erreurs HTTP 400/401 ou liées à l'authentification
    if (typeof event.reason?.message === 'string' && 
        (event.reason.message.includes('400') || 
        event.reason.message.includes('401') || 
        event.reason.message.includes('Bad Request') || 
        event.reason.message.includes('Unauthorized') ||
        event.reason.message.includes('POST') && 
          (event.reason.message.includes('supabase') ||
           event.reason.message.includes('token') ||
           event.reason.message.includes('auth/v1')) ||
        event.reason.message.includes('rdwqedmvzicerwotjseg') ||
        event.reason?.stack?.includes('token?grant_type=password'))) {
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
    
    // Pour les autres rejets, logger une version sécurisée sans bloquer
    const reason = event.reason;
    const reasonMessage = reason?.message || '';
    const reasonStack = reason?.stack || '';
    
    // Pour les autres rejets, logger une version sécurisée
    const securedReason = typeof reason === 'string' 
      ? sanitizeErrorMessage(reason) 
      : reason instanceof Error 
        ? new Error(sanitizeErrorMessage(reason.message))
        : "Rejet de promesse non géré (détails masqués)";
    
    console.error("Rejet de promesse non géré (sécurisé):", securedReason);
  }, true); // Utiliser la phase de capture
}
