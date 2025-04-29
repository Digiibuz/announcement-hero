
/**
 * Module principal de sécurité - Point d'entrée pour les fonctions de sécurité
 */

// Re-exporter toutes les fonctions pertinentes pour maintenir la compatibilité avec le code existant
export { sanitizeErrorMessage } from './urlSanitizer';
export { safeConsoleError, sanitizeAllArgs } from './logSanitizer';
export { handleAuthError } from './authErrorHandler';
