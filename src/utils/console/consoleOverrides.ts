
/**
 * Module pour remplacer les fonctions console natives et filtrer les informations sensibles
 */
import { replaceAllSensitiveUrls } from './stringReplacer';
import { SENSITIVE_PATTERNS as GLOBAL_SENSITIVE_PATTERNS } from './constants';

// Export the patterns for reuse in other modules
export const SENSITIVE_PATTERNS = GLOBAL_SENSITIVE_PATTERNS;

/**
 * Vérifie si un argument contient des informations sensibles
 */
export function containsSensitiveInfo(args: any[]): boolean {
  if (!args || args.length === 0) return false;
  
  return args.some(arg => {
    if (arg === undefined || arg === null) return false;
    const str = String(arg);
    return SENSITIVE_PATTERNS.some(pattern => pattern.test(str));
  });
}

/**
 * Remplace les arguments sensibles par des versions sécurisées
 */
export function sanitizeArgs(args: any[]): any[] {
  return args.map(arg => {
    if (typeof arg === 'string') {
      return replaceAllSensitiveUrls(arg);
    }
    return arg;
  });
}

/**
 * Safely wraps a console function to filter sensitive information
 */
export function createSafeConsoleFunction(
  originalFn: (...args: any[]) => void
): (...args: any[]) => void {
  return function(...args) {
    if (containsSensitiveInfo(args)) {
      return; // Supprimer complètement le message
    }
    
    // Pour les autres messages, remplacer les URLs sensibles
    const newArgs = sanitizeArgs(args);
    originalFn.apply(console, newArgs);
  };
}

/**
 * Initialize all console security features
 */
export function initializeConsoleSecurity(): void {
  setupConsoleOverrides();
}

/**
 * Configure les remplacements pour toutes les méthodes console
 */
export function setupConsoleOverrides(): void {
  // Sauvegardes des fonctions console originales
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;
  const originalConsoleInfo = console.info;
  const originalConsoleDebug = console.debug;
  
  // Replace each console function with a safe version
  console.error = createSafeConsoleFunction(originalConsoleError);
  console.warn = createSafeConsoleFunction(originalConsoleWarn);
  console.log = createSafeConsoleFunction(originalConsoleLog);
  console.info = createSafeConsoleFunction(originalConsoleInfo);
  console.debug = createSafeConsoleFunction(originalConsoleDebug);
}

/**
 * Override network requests
 */
export function overrideNetworkRequests(): void {
  // This can be implemented in the future if needed
  console.log('Network request overrides initialized');
}

// Export overrideConsoleFunctions as an alias for setupConsoleOverrides
export const overrideConsoleFunctions = setupConsoleOverrides;
