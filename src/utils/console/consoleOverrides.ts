
/**
 * Module pour remplacer les fonctions console natives et filtrer les informations sensibles
 */
import { replaceAllSensitiveUrls } from './stringReplacer';

// Patterns sensibles à bloquer
export const SENSITIVE_PATTERNS = [
  /supabase\.co/i,
  /auth\/v1\/token/i,
  /token\?grant_type=password/i,
  /400.*bad request/i,
  /401/i,
  /grant_type=password/i,
  /rdwqedmvzicerwotjseg/i,
  /index-[a-zA-Z0-9-_]+\.js/i
];

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
 * Configure les remplacements pour toutes les méthodes console
 */
export function setupConsoleOverrides(): void {
  // Sauvegardes des fonctions console originales
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  const originalConsoleLog = console.log;
  const originalConsoleInfo = console.info;
  const originalConsoleDebug = console.debug;
  
  // Remplacer console.error pour masquer les informations sensibles
  console.error = function(...args) {
    if (containsSensitiveInfo(args)) {
      return; // Supprimer complètement le message
    }
    
    // Pour les autres messages, remplacer les URLs sensibles
    const newArgs = sanitizeArgs(args);
    originalConsoleError.apply(console, newArgs);
  };
  
  // Même logique pour console.warn
  console.warn = function(...args) {
    if (containsSensitiveInfo(args)) {
      return;
    }
    
    const newArgs = sanitizeArgs(args);
    originalConsoleWarn.apply(console, newArgs);
  };
  
  // Même logique pour console.log
  console.log = function(...args) {
    if (containsSensitiveInfo(args)) {
      return;
    }
    
    const newArgs = sanitizeArgs(args);
    originalConsoleLog.apply(console, newArgs);
  };
  
  // Même logique pour console.info
  console.info = function(...args) {
    if (containsSensitiveInfo(args)) {
      return;
    }
    
    const newArgs = sanitizeArgs(args);
    originalConsoleInfo.apply(console, newArgs);
  };
  
  // Même logique pour console.debug
  console.debug = function(...args) {
    if (containsSensitiveInfo(args)) {
      return;
    }
    
    const newArgs = sanitizeArgs(args);
    originalConsoleDebug.apply(console, newArgs);
  };
}
