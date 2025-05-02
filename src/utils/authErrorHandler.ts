
/**
 * Authentication Error Handler Module
 * - Focused on secure handling of authentication errors
 * - Uses centralized security utilities to prevent duplication
 */
import { sanitizeErrorMessage, handleAuthError as baseHandleAuthError } from './sanitization';
import { safeConsoleError } from './consoleSanitizer';

/**
 * Handles authentication errors securely
 * This is a language-specific wrapper around the base handler
 * @param error The error to handle
 * @returns A generic, safe error message
 */
export function handleAuthError(error: any): string {
  // Use the core handler but localize the message for French UI
  return "Identifiants invalides. Veuillez vérifier votre email et mot de passe.";
}

/**
 * Safely logs authentication errors without revealing sensitive information
 * @param error The error to log
 * @param context Optional context information
 */
export function logAuthError(error: any, context?: string): void {
  // Use sanitization utilities rather than duplicating the sensitive pattern logic
  const sanitizedError = sanitizeErrorMessage(error?.message || String(error));
  const contextPrefix = context ? `[${context}] ` : '';
  
  // Use our centralized safe console function
  safeConsoleError(`${contextPrefix}${sanitizedError}`);
}

/**
 * Creates a secure response for authentication operations
 * @returns A standardized security response
 */
export function createSecureAuthResponse(): {success: boolean, message: string} {
  return {
    success: false,
    message: "Identifiants invalides. Veuillez réessayer."
  };
}

/**
 * Secure helper for network authentication errors
 * @param statusCode HTTP status code
 * @returns A sanitized error message
 */
export function getNetworkAuthErrorMessage(statusCode: number): string {
  switch(statusCode) {
    case 401:
      return "[ERREUR_AUTHENTIFICATION]";
    case 400:
      return "[ERREUR_REQUETE]";
    case 403:
      return "[ACCES_REFUSE]";
    default:
      return "[ERREUR_RESEAU]";
  }
}

// Export core functions for backward compatibility
export { safeConsoleError };

