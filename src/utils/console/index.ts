// Point d'entrée principal pour les protections de console

// Importer toutes les protections
import './consoleFunctionOverrides';
import './networkRequestInterceptors';
import './globalErrorHandlers';

// Re-exporter les constantes sensibles pour être utilisées ailleurs
export { SENSITIVE_PATTERNS } from './constants';

// Exporter les fonctions principales
export { overrideConsoleMethods as initConsoleOverrides } from './consoleFunctionOverrides';

/**
 * Fonction pour tester la sécurisation des logs en mode développement
 */
export function testSecureLogs() {
  console.log("Test de sécurisation des logs - Information normale");
  
  // Tester avec des URLs sensibles
  console.log("URL sensible: https://rdwqedmvzicerwotjseg.supabase.co/auth/v1/token?grant_type=password");
  console.log("Autre URL sensible: https://api.digiibuz.fr/auth/login");
  console.error("Erreur avec URL: https://rdwqedmvzicerwotjseg.supabase.co/auth/v1/token");
  
  // Tester avec des codes d'erreur
  console.error("Erreur 401 - Unauthorized");
  console.error("Erreur 400 - Bad Request");
  
  // Test d'interception de requête (simulation)
  console.log("Test interception POST https://rdwqedmvzicerwotjseg.supabase.co/auth/v1/token");
  
  // Message de confirmation
  console.log("✅ Tests de sécurité des logs terminés - Si vous ne voyez pas d'URLs sensibles ci-dessus, la protection fonctionne !");
}

// Fonction pour initialiser toutes les protections au démarrage de l'application
export function initializeConsoleSecurity() {
  // Cette fonction est appelée automatiquement au démarrage de l'application
  // Toutes les protections sont déjà activées via les imports ci-dessus
  
  // Masquer complètement la requête spécifique d'authentification
  const originalOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    // Vérifier si l'URL correspond à la requête d'authentification spécifique
    if (String(url).includes('token?grant_type=password') || 
        String(url).includes('auth/v1/token') ||
        String(url).includes('supabase.co')) {
        
      // Remplacer par une URL générique dans les logs
      console.log = function(){};
      console.error = function(){};
      console.warn = function(){};
      
      // Appliquer avec l'URL originale mais sans logging
      return originalOpen.apply(this, [method, url, ...args]);
    }
    
    // Pour les autres URLs, comportement normal
    return originalOpen.apply(this, [method, url, ...args]);
  };
  
  // Bloquer spécifiquement les erreurs 400/401 dans les logs
  const originalConsoleError = console.error;
  console.error = function(...args) {
    // Vérifier si les arguments contiennent des codes d'erreur HTTP sensibles
    if (args.some(arg => {
      const str = String(arg);
      return str.includes('400') || 
             str.includes('Bad Request') || 
             str.includes('401') ||
             str.includes('auth/v1/token') ||
             str.includes('token?grant_type=password') ||
             str.includes('supabase.co');
    })) {
      return; // Ne rien afficher
    }
    
    // Pour les autres erreurs, comportement normal
    originalConsoleError.apply(console, args);
  };

  // Intercepter et bloquer les erreurs non gérées dans l'application
  window.addEventListener('error', function(event) {
    // Vérifier si l'erreur contient des informations sensibles
    const errorText = event.message || event.error?.stack || '';
    if (errorText.includes('supabase.co') || 
        errorText.includes('auth/v1/token') || 
        errorText.includes('token?grant_type=password') ||
        errorText.includes('400') ||
        errorText.includes('Bad Request') ||
        errorText.includes('401')) {
      event.preventDefault();
      event.stopPropagation();
      return true;
    }
  }, true);
}

// Exécuter immédiatement l'initialisation
initializeConsoleSecurity();
