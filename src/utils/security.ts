
/**
 * Main security module - Entry point for security functions
 */

// Re-export all relevant functions to maintain compatibility with existing code
export { 
  sanitizeErrorMessage, 
  safeConsoleError, 
  sanitizeAllArgs, 
  handleAuthError 
} from './sanitization';

// Re-export focused auth error handlers
export { 
  logAuthError,
  getNetworkAuthErrorMessage,
  createSecureAuthResponse
} from './authErrorHandler';

// Définition des patterns sensibles directement dans le fichier
const SENSITIVE_PATTERNS = [
  /supabase\.co/i,
  /auth\/v1\/token/i,
  /token\?grant_type=password/i,
  /auth\/v1/i,
  /grant_type=password/i,
  /400.*bad request/i,
  /401/i,
  /rdwqedmvzicerwotjseg/i
];

// Advanced protection to completely block sensitive URLs in errors
(function() {
  // Completely block unhandled errors containing sensitive information
  window.addEventListener('error', function(event) {
    const errorText = event.message || event.error?.stack || '';
    
    // Block and mask errors related to authentication
    if (SENSITIVE_PATTERNS.some(pattern => pattern.test(errorText))) {
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
  }, true);
  
  // Same for unhandled promise rejections
  window.addEventListener('unhandledrejection', function(event) {
    const reasonText = String(event.reason || '');
    
    // Block and mask rejections related to authentication
    if (SENSITIVE_PATTERNS.some(pattern => pattern.test(reasonText))) {
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
  }, true);
  
  // For console.log and console.error from outside
  const originalConsoleLog = console.log;
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  // Permanently replace console.log
  console.log = function(...args) {
    // Completely block sensitive logs
    if (args.some(arg => {
      if (arg === null || arg === undefined) return false;
      const str = String(arg);
      return SENSITIVE_PATTERNS.some(pattern => pattern.test(str));
    })) {
      return; // Don't log anything
    }
    originalConsoleLog.apply(console, args);
  };
  
  // Permanently replace console.error
  console.error = function(...args) {
    // Completely block sensitive error logs
    if (args.some(arg => {
      if (arg === null || arg === undefined) return false;
      const str = String(arg);
      return SENSITIVE_PATTERNS.some(pattern => pattern.test(str));
    })) {
      return; // Don't log anything
    }
    originalConsoleError.apply(console, args);
  };
  
  // Permanently replace console.warn
  console.warn = function(...args) {
    // Completely block sensitive warning logs
    if (args.some(arg => {
      if (arg === null || arg === undefined) return false;
      const str = String(arg);
      return SENSITIVE_PATTERNS.some(pattern => pattern.test(str));
    })) {
      return; // Don't log anything
    }
    originalConsoleWarn.apply(console, args);
  };
})();
