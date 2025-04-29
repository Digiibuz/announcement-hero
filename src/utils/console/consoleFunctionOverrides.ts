
/**
 * Module pour gérer les remplacements des fonctions console
 */
import { sanitizeAllArgs } from '../logSanitizer';

// Sauvegarde des fonctions console originales
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;
const originalConsoleLog = console.log;
const originalConsoleDebug = console.debug;
const originalConsoleInfo = console.info;

/**
 * Remplace les fonctions console natives pour masquer les informations sensibles
 */
export function overrideConsoleFunctions(): void {
  // Override de console.error pour intercepter et masquer les informations sensibles
  console.error = function(...args: any[]) {
    // Masquer les informations sensibles dans tous les arguments
    const sanitizedArgs = sanitizeAllArgs(args);
    
    // Appel à la fonction console.error originale avec les arguments masqués
    originalConsoleError.apply(console, sanitizedArgs);
  };

  // Override de console.warn
  console.warn = function(...args: any[]) {
    const sanitizedArgs = sanitizeAllArgs(args);
    originalConsoleWarn.apply(console, sanitizedArgs);
  };

  // Override de console.log
  console.log = function(...args: any[]) {
    const sanitizedArgs = sanitizeAllArgs(args);
    originalConsoleLog.apply(console, sanitizedArgs);
  };

  // Override de console.debug
  console.debug = function(...args: any[]) {
    const sanitizedArgs = sanitizeAllArgs(args);
    originalConsoleDebug.apply(console, sanitizedArgs);
  };

  // Override de console.info
  console.info = function(...args: any[]) {
    const sanitizedArgs = sanitizeAllArgs(args);
    originalConsoleInfo.apply(console, sanitizedArgs);
  };
}

/**
 * Restaure les fonctions console d'origine (utile pour les tests)
 */
export function restoreConsoleFunctions(): void {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
  console.debug = originalConsoleDebug;
  console.info = originalConsoleInfo;
}
