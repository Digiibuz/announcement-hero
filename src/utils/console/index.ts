
/**
 * Point d'entrée principal pour les fonctionnalités de sécurisation de la console
 */
import { overrideConsoleFunctions } from './consoleFunctionOverrides';
import { setupGlobalErrorHandlers } from './globalErrorHandlers';
import { setupNetworkInterceptors } from './networkRequestInterceptors';
import { sanitizeErrorMessage } from '../urlSanitizer';

/**
 * Initialise toutes les fonctionnalités de sécurisation des logs
 */
export function initConsoleOverrides(): void {
  overrideConsoleFunctions();
  setupGlobalErrorHandlers();
  setupNetworkInterceptors();
  console.log("Sécurisation des logs console initialisée");
}

/**
 * Fonction de test pour vérifier la sécurisation des logs
 */
export function testSecureLogs(): void {
  console.log("Test de la sécurisation des logs avec URL: https://rdwqedmvzicerwotjseg.supabase.co/auth");
  console.error("Erreur avec URL: https://preview-c18074be--announcement-hero.lovable.app/login");
  console.log("Test de masquage d'une requête HTTP: POST https://rdwqedmvzicerwotjseg.supabase.co/auth/v1/token?grant_type=password");
  console.error("Erreur d'authentification: invalid_credentials");
}

// Re-exporter la fonction de sanitization pour la compatibilité
export { sanitizeErrorMessage };
