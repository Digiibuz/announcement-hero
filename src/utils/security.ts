
/**
 * Module principal de sécurité - Point d'entrée pour les fonctions de sécurité
 */

// Re-exporter toutes les fonctions pertinentes pour maintenir la compatibilité avec le code existant
export { sanitizeErrorMessage } from './urlSanitizer';
export { safeConsoleError, sanitizeAllArgs } from './logSanitizer';
export { handleAuthError } from './authErrorHandler';

// Protection avancée pour bloquer complètement les URLs sensibles dans les erreurs
(function() {
  // Patterns sensibles à bloquer complètement
  const sensitivePatterns = [
    /supabase\.co/i,
    /auth\/v1\/token/i,
    /token\?grant_type=password/i,
    /400.*bad request/i,
    /401/i,
    /grant_type=password/i,
    /rdwqedmvzicerwotjseg/i,
    /index-[a-zA-Z0-9-_]+\.js/i
  ];
  
  // Bloquer complètement les erreurs non gérées qui contiennent des informations sensibles
  window.addEventListener('error', function(event) {
    const errorText = event.message || event.error?.stack || '';
    
    // Bloquer et masquer les erreurs liées à l'authentification
    if (sensitivePatterns.some(pattern => pattern.test(errorText))) {
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
  }, true);
  
  // Même chose pour les rejets de promesses non gérés
  window.addEventListener('unhandledrejection', function(event) {
    const reasonText = String(event.reason || '');
    
    // Bloquer et masquer les rejets liés à l'authentification
    if (sensitivePatterns.some(pattern => pattern.test(reasonText))) {
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
  }, true);
  
  // Pour les console.log et console.error provenant de l'extérieur
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  // Remplacer définitivement console.log
  console.log = function(...args) {
    // Bloquer complètement les logs sensibles
    if (args.some(arg => {
      if (arg === null || arg === undefined) return false;
      const str = String(arg);
      return sensitivePatterns.some(pattern => pattern.test(str));
    })) {
      return; // Ne rien logger
    }
    originalConsoleLog.apply(console, args);
  };
  
  // Remplacer définitivement console.error
  console.error = function(...args) {
    // Bloquer complètement les logs d'erreur sensibles
    if (args.some(arg => {
      if (arg === null || arg === undefined) return false;
      const str = String(arg);
      return sensitivePatterns.some(pattern => pattern.test(str));
    })) {
      return; // Ne rien logger
    }
    originalConsoleError.apply(console, args);
  };
  
  // Remplacer définitivement console.warn
  console.warn = function(...args) {
    // Bloquer complètement les logs d'avertissement sensibles
    if (args.some(arg => {
      if (arg === null || arg === undefined) return false;
      const str = String(arg);
      return sensitivePatterns.some(pattern => pattern.test(str));
    })) {
      return; // Ne rien logger
    }
    originalConsoleWarn.apply(console, args);
  };
})();
