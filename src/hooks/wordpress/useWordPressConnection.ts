import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export type ConnectionStatus = "connected" | "disconnected" | "checking" | "unknown";

export const useWordPressConnection = () => {
  const [status, setStatus] = useState<ConnectionStatus>("unknown");
  const [isChecking, setIsChecking] = useState(false);
  const [errorDetails, setErrorDetails] = useState<string | null>(null);
  const { user } = useAuth();

  // Function to test URL accessibility with timeout
  const testUrl = async (url: string, headers: Record<string, string> = {}, timeout = 10000): Promise<boolean> => {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);
      
      console.log(`Testing URL accessibility: ${url}`);
      const response = await fetch(url, {
        method: 'HEAD', // Use HEAD method to minimize data transfer
        headers,
        signal: controller.signal,
        mode: 'no-cors', // Try with no-cors first to bypass CORS issues
        cache: 'no-cache'
      });
      
      clearTimeout(timeoutId);
      return true;
    } catch (error) {
      console.log(`URL test failed for ${url}:`, error);
      return false;
    }
  };

  const checkConnection = async (configId?: string) => {
    const wordpressConfigId = configId || user?.wordpressConfigId;
    
    if (!wordpressConfigId) {
      setStatus("disconnected");
      setErrorDetails("Aucune configuration WordPress associée");
      return { success: false, message: "Aucune configuration WordPress associée" };
    }

    try {
      setIsChecking(true);
      setStatus("checking");
      setErrorDetails(null);

      // Get the WordPress config
      const { data: wpConfig, error: wpConfigError } = await supabase
        .from('wordpress_configs')
        .select('site_url, rest_api_key, app_username, app_password')
        .eq('id', wordpressConfigId)
        .single();

      if (wpConfigError) {
        console.error("Error fetching WordPress config:", wpConfigError);
        setStatus("disconnected");
        setErrorDetails("Échec de récupération de la configuration");
        return { success: false, message: "Échec de récupération de la configuration" };
      }

      if (!wpConfig) {
        setStatus("disconnected");
        setErrorDetails("Configuration WordPress introuvable");
        return { success: false, message: "Configuration WordPress introuvable" };
      }

      // Ensure the site URL is properly formatted
      let siteUrl = wpConfig.site_url;
      // Normalize URL: remove trailing slashes and add http:// if missing
      if (!siteUrl.startsWith("http")) {
        siteUrl = "https://" + siteUrl;
      }
      if (siteUrl.endsWith("/")) {
        siteUrl = siteUrl.slice(0, -1);
      }

      // Try to check if the domain is accessible first (without any API paths)
      const domain = new URL(siteUrl).origin;
      const domainAccessible = await testUrl(domain);
      
      if (!domainAccessible) {
        setStatus("disconnected");
        setErrorDetails(`Le domaine ${domain} semble inaccessible. Vérifiez l'URL et votre connexion réseau.`);
        return { 
          success: false, 
          message: `Le domaine ${domain} semble inaccessible. Vérifiez l'URL et votre connexion réseau.` 
        };
      }
      
      // Try to fetch the WordPress site info as a connection test
      const infoUrl = `${siteUrl}/wp-json`;
      
      // Préparer les en-têtes d'authentification
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      };
      
      let authenticationUsed = false;
      
      // Utiliser Application Password si disponible
      if (wpConfig.app_username && wpConfig.app_password) {
        const basicAuth = btoa(`${wpConfig.app_username}:${wpConfig.app_password}`);
        headers['Authorization'] = `Basic ${basicAuth}`;
        authenticationUsed = true;
      } 
      // Fallback sur la clé API REST si présente
      else if (wpConfig.rest_api_key) {
        headers['Authorization'] = `Bearer ${wpConfig.rest_api_key}`;
        authenticationUsed = true;
      }
      
      console.log("Tentative de connexion à WordPress:", infoUrl);

      try {
        // Try multiple approaches to deal with CORS and network issues
        const options = {
          method: 'GET',
          headers: headers,
          signal: AbortSignal.timeout(15000),
          mode: 'cors' as RequestMode,
          credentials: 'same-origin' as RequestCredentials,
          cache: 'no-cache' as RequestCache,
        };
        
        // First try with standard CORS approach
        let response: Response | null = null;
        let errorMessage = "";
        
        try {
          response = await fetch(infoUrl, options);
        } catch (error: any) {
          console.log("First fetch attempt failed:", error);
          errorMessage = error.message;
          
          // If CORS issue detected, try alternative approach
          if (error.message.includes("CORS") || error.message === "Failed to fetch") {
            try {
              // Try with different credentials mode
              const altOptions = {...options, credentials: 'omit' as RequestCredentials};
              response = await fetch(infoUrl, altOptions);
            } catch (altError: any) {
              console.log("Alternative fetch attempt failed:", altError);
              // Keep original error if both failed
            }
          }
        }

        if (!response || !response.ok) {
          console.error("WordPress connection test failed:", response?.statusText || errorMessage);
          let errorMsg = `Échec de connexion: ${response?.status || ''} ${response?.statusText || errorMessage}`;
          
          if (response?.status === 401 || response?.status === 403) {
            errorMsg = "Identifiants incorrects ou autorisations insuffisantes";
          } else if (response?.status === 404) {
            errorMsg = "API REST WordPress introuvable. Vérifiez que le plugin REST API est activé.";
          } else if (!response || errorMessage === "Failed to fetch") {
            errorMsg = "Erreur réseau: impossible d'accéder au site WordPress. Vérifiez l'URL, votre connexion réseau et les paramètres CORS.";
          }
          
          setStatus("disconnected");
          setErrorDetails(errorMsg);
          return { success: false, message: errorMsg };
        }

        // Additional validation to ensure it's actually a WordPress API response
        const data = await response.json();
        
        if (!data || !data.namespaces || !data.namespaces.includes('wp/v2')) {
          setStatus("disconnected");
          setErrorDetails("Le point d'accès API ne semble pas être une API WordPress valide");
          return { 
            success: false, 
            message: "Le point d'accès API ne semble pas être une API WordPress valide" 
          };
        }
        
        setStatus("connected");
        setErrorDetails(null);
        return { success: true, message: "Connexion établie avec succès", data };

      } catch (fetchError: any) {
        console.error("Fetch error:", fetchError);
        
        // Check for timeout
        if (fetchError.name === 'TimeoutError' || fetchError.name === 'AbortError') {
          setStatus("disconnected");
          setErrorDetails("Délai d'attente dépassé lors de la connexion à WordPress");
          return { 
            success: false, 
            message: "Délai d'attente dépassé lors de la connexion à WordPress" 
          };
        }
        
        // Network errors (CORS, DNS, etc.)
        if (fetchError.name === 'TypeError' && fetchError.message === 'Failed to fetch') {
          setStatus("disconnected");
          setErrorDetails("Erreur réseau: impossible d'accéder au site WordPress. Vérifiez l'URL, votre connexion réseau et les paramètres CORS.");
          return { 
            success: false, 
            message: "Erreur réseau: impossible d'accéder au site WordPress" 
          };
        }
        
        setStatus("disconnected");
        setErrorDetails(`Erreur lors de la connexion: ${fetchError.message}`);
        return { 
          success: false, 
          message: `Erreur lors de la connexion: ${fetchError.message}` 
        };
      }

    } catch (error: any) {
      console.error("Error checking WordPress connection:", error);
      setStatus("disconnected");
      setErrorDetails(`Erreur de connexion: ${error.message}`);
      return { success: false, message: error.message || "Erreur de connexion" };
    } finally {
      setIsChecking(false);
    }
  };

  return {
    status,
    isChecking,
    errorDetails,
    checkConnection
  };
};
