
// Point d'entrée principal pour les protections de console

// Importer toutes les protections
import './consoleFunctionOverrides';
import './networkRequestInterceptors';
import './globalErrorHandlers';

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
