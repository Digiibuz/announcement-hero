
/**
 * Prepares authentication headers for WordPress API calls
 */
export const useApiAuthentication = () => {
  /**
   * Creates appropriate authentication headers based on available credentials
   */
  const prepareAuthHeaders = (
    appUsername: string | null, 
    appPassword: string | null, 
    restApiKey: string | null
  ): { headers: Record<string, string>; authenticationUsed: boolean } => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json'
    };
    
    let authenticationUsed = false;
    
    // Prioritize Application Password authentication
    if (appUsername && appPassword) {
      console.log("Using Application Password authentication");
      const basicAuth = btoa(`${appUsername}:${appPassword}`);
      headers['Authorization'] = `Basic ${basicAuth}`;
      authenticationUsed = true;
    } 
    // Fallback to REST API Key if present
    else if (restApiKey) {
      console.log("Using REST API Key authentication");
      headers['Authorization'] = `Bearer ${restApiKey}`;
      authenticationUsed = true;
    } else {
      console.log("No authentication credentials provided");
    }
    
    return { headers, authenticationUsed };
  };

  return {
    prepareAuthHeaders
  };
};
