
/**
 * Creates better error messages for WordPress connection issues
 */
export const useErrorHandler = () => {
  const formatConnectionError = (error: Error | any): string => {
    let errorMessage = error.message || "Erreur de connexion";
    
    // Improve error messages
    if (error.message?.includes("Failed to fetch")) {
      errorMessage = "Erreur réseau: impossible d'accéder au site WordPress";
    } else if (error.message?.includes("NetworkError")) {
      errorMessage = "Erreur réseau: problème de connectivité";
    } else if (error.message?.includes("CORS")) {
      errorMessage = "Erreur CORS: le site n'autorise pas les requêtes depuis cette origine";
    } else if (error.message?.includes("timeout")) {
      errorMessage = "Délai d'attente dépassé lors de la connexion";
    }
    
    return errorMessage;
  };
  
  return {
    formatConnectionError
  };
};
