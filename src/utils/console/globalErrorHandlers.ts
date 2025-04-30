
/**
 * Module pour gérer les erreurs globales et les rejets de promesses
 */

/**
 * Configure les écouteurs d'événements pour les erreurs globales
 */
export function setupGlobalErrorHandlers(): void {
  // Patterns sensibles à bloquer
  const SENSITIVE_PATTERNS = [
    /supabase\.co/i,
    /auth\/v1\/token/i,
    /token\?grant_type=password/i,
    /400.*bad request/i,
    /401/i,
    /grant_type=password/i,
    /rdwqedmvzicerwotjseg/i,
    /index-[a-zA-Z0-9-_]+\.js/i,
    /POST.*auth/i,
    /invalid login credentials/i
  ];
  
  // Sauvegardes des fonctions console originales
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;
  
  // Remplacer console.error pour bloquer complètement les erreurs d'authentification et URLs sensibles
  console.error = function(...args) {
    // Bloquer complètement les messages avec des patterns sensibles
    if (args.some(arg => {
      if (arg === undefined || arg === null) return false;
      const str = String(arg);
      return SENSITIVE_PATTERNS.some(pattern => pattern.test(str));
    })) {
      return; // Supprimer complètement le message
    }
    
    // Pour les autres types d'erreurs, utiliser la fonction originale
    originalConsoleError.apply(console, args);
  };
  
  // Même logique pour console.warn
  console.warn = function(...args) {
    if (args.some(arg => {
      if (arg === undefined || arg === null) return false;
      const str = String(arg);
      return SENSITIVE_PATTERNS.some(pattern => pattern.test(str));
    })) {
      return;
    }
    
    originalConsoleWarn.apply(console, args);
  };
  
  // Même logique pour console.log
  console.log = function(...args) {
    if (args.some(arg => {
      if (arg === undefined || arg === null) return false;
      const str = String(arg);
      return SENSITIVE_PATTERNS.some(pattern => pattern.test(str));
    })) {
      return;
    }
    
    originalConsoleLog.apply(console, args);
  };

  // Intercepter les erreurs globales avec capture très haut niveau
  window.addEventListener('error', (event) => {
    // Vérifier si l'erreur contient des informations sensibles
    const errorText = event.message || event.error?.stack || '';
    if (SENSITIVE_PATTERNS.some(pattern => pattern.test(errorText))) {
      event.preventDefault();
      event.stopPropagation();
      return true;
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
  }, true);
  
  // Intercepteur supplémentaire pour les messages d'erreur dans les logs de console
  const consoleErrorDescriptor = Object.getOwnPropertyDescriptor(console, 'error');
  if (consoleErrorDescriptor && consoleErrorDescriptor.configurable) {
    const originalError = console.error;
    Object.defineProperty(console, 'error', {
      value: function(...args) {
        // Bloquer complètement les erreurs avec des URLs ou messages sensibles
        if (args.some(arg => {
          if (!arg) return false;
          const str = String(arg);
          return SENSITIVE_PATTERNS.some(pattern => pattern.test(str));
        })) {
          return; // Ne rien afficher
        }
        return originalError.apply(this, args);
      }
    });
  }
}
