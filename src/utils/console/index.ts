
/**
 * Module central pour la gestion sécurisée des logs console
 */
import { setupNetworkInterceptors } from './networkRequestInterceptors';
import { overrideConsoleMethods } from './consoleFunctionOverrides';
import { setupGlobalErrorHandlers } from './globalErrorHandlers';

/**
 * Initialise toutes les sécurisations de logs console
 */
export function initConsoleOverrides(): void {
  // Initialiser AVANT tout autre code dans l'application
  console.log("Sécurisation des logs console initialisée");
  
  // Remplacer les méthodes console standard par des versions sécurisées
  overrideConsoleMethods();
  
  // Configurer les interceptions des requêtes réseau (XHR, fetch)
  setupNetworkInterceptors();
  
  // Configurer les gestionnaires d'erreurs globaux
  setupGlobalErrorHandlers();
}

/**
 * Fonction pour tester que le masquage fonctionne correctement
 * Note: À n'utiliser qu'en développement
 */
export function testSecureLogs(): void {
  try {
    // Test avec une URL sensible
    console.log("Test de la sécurisation des logs avec URL:", "https://rdwqedmvzicerwotjseg.supabase.co/auth/v1/token");
    
    // Test avec une URL sensible dans une erreur
    console.error("Erreur avec URL:", "https://rdwqedmvzicerwotjseg.supabase.co/functions/v1/get-config");
    
    // Test avec une requête HTTP
    console.log("Test de masquage d'une requête HTTP:", "POST https://rdwqedmvzicerwotjseg.supabase.co/auth/v1/token");
    
    // Test des erreurs d'authentification
    console.error("Erreur d'authentification: invalid_credentials", "Missing authorization header");
    
    // Test des messages d'erreur 401
    console.error("POST https://rdwqedmvzicerwotjseg.supabase.co/functions/v1/get-config 401");
  } catch (e) {
    console.error("Erreur lors des tests de masquage:", e);
  }
}
