
import { useApiAuthentication } from "./useApiAuthentication";
import { ConnectionCheckResult } from "./types";

export const useApiTests = () => {
  const { prepareAuthHeaders } = useApiAuthentication();

  /**
   * Tests API authentication with WordPress
   */
  const testApiAuthentication = async (
    siteUrl: string, 
    appUsername: string | null, 
    appPassword: string | null,
    restApiKey: string | null
  ): Promise<ConnectionCheckResult> => {
    try {
      const { headers, authenticationUsed } = prepareAuthHeaders(appUsername, appPassword, restApiKey);
      
      // If authentication is used, try to access endpoints that require permissions
      if (authenticationUsed) {
        try {
          // Try to fetch categories (usually requires authentication)
          const authTestUrl = `${siteUrl}/wp-json/wp/v2/categories`;
          const authTest = await fetch(authTestUrl, {
            method: 'GET',
            headers: headers
          });
          
          if (!authTest.ok) {
            // If this call fails, credentials are probably incorrect
            console.warn("Authentication test failed:", authTest.statusText);
            
            if (authTest.status === 401 || authTest.status === 403) {
              return { 
                success: false, 
                message: "Identifiants incorrects ou autorisations insuffisantes"
              };
            }
          }

          // Also try with pages
          const pagesTestUrl = `${siteUrl}/wp-json/wp/v2/pages`;
          const pagesTest = await fetch(pagesTestUrl, {
            method: 'GET',
            headers: headers
          });

          if (!pagesTest.ok) {
            console.warn("Pages test failed:", pagesTest.statusText);
          }
          
          return { success: true, message: "Authentification réussie" };
        } catch (authError: any) {
          console.error("Authentication test error:", authError);
          // Don't fail completely if this test fails, it could be due to
          // a different configuration on the WordPress site
          return { 
            success: true, 
            message: "La connexion de base est établie mais les permissions d'authentification sont incertaines",
            details: authError.message
          };
        }
      }
      
      return { success: true, message: "Connexion établie sans authentification" };
    } catch (error: any) {
      return { 
        success: false, 
        message: `Erreur lors du test d'authentification: ${error.message}` 
      };
    }
  };
  
  return {
    testApiAuthentication
  };
};
