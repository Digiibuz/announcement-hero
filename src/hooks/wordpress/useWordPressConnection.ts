
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
      if (!siteUrl.startsWith("http")) {
        siteUrl = "https://" + siteUrl;
      }
      if (siteUrl.endsWith("/")) {
        siteUrl = siteUrl.slice(0, -1);
      }

      // Try to fetch the WordPress site info as a connection test
      const infoUrl = `${siteUrl}/wp-json`;
      
      // Préparer les en-têtes d'authentification
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
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
        const response = await fetch(infoUrl, {
          method: 'GET',
          headers: headers,
          // Add a reasonable timeout
          signal: AbortSignal.timeout(15000)
        });

        if (!response.ok) {
          console.error("WordPress connection test failed:", response.statusText);
          let errorMsg = `Échec de connexion: ${response.status} ${response.statusText}`;
          
          if (response.status === 401 || response.status === 403) {
            errorMsg = "Identifiants incorrects ou autorisations insuffisantes";
          } else if (response.status === 404) {
            errorMsg = "API REST WordPress introuvable. Vérifiez que le plugin REST API est activé.";
          }
          
          setStatus("disconnected");
          setErrorDetails(errorMsg);
          return { success: false, message: errorMsg };
        }

        // Si l'authentification est utilisée, essayons d'accéder à un point d'extrémité
        // qui nécessite des autorisations pour valider les identifiants
        if (authenticationUsed) {
          try {
            // Essayons de récupérer les catégories, ce qui nécessite généralement une authentification
            const categoriesUrl = `${siteUrl}/wp-json/wp/v2/categories`;
            console.log("Test d'authentification avec les catégories:", categoriesUrl);
            
            const categoriesResponse = await fetch(categoriesUrl, {
              method: 'GET',
              headers: headers,
              signal: AbortSignal.timeout(15000)
            });
            
            if (!categoriesResponse.ok) {
              console.warn("Categories test failed:", categoriesResponse.statusText);
              if (categoriesResponse.status === 401 || categoriesResponse.status === 403) {
                setStatus("disconnected");
                setErrorDetails("Identifiants incorrects ou autorisations insuffisantes");
                return { 
                  success: false, 
                  message: "Identifiants incorrects ou autorisations insuffisantes pour accéder aux catégories" 
                };
              }
            } else {
              // Test successful
              console.log("Catégories récupérées avec succès");
            }

            // Essayons également avec les pages
            const pagesUrl = `${siteUrl}/wp-json/wp/v2/pages`;
            console.log("Test d'authentification avec les pages:", pagesUrl);
            
            const pagesResponse = await fetch(pagesUrl, {
              method: 'GET',
              headers: headers,
              signal: AbortSignal.timeout(15000)
            });

            if (!pagesResponse.ok) {
              console.warn("Pages test failed:", pagesResponse.statusText);
              if (pagesResponse.status === 401 || pagesResponse.status === 403) {
                setStatus("disconnected");
                setErrorDetails("Identifiants incorrects ou autorisations insuffisantes pour accéder aux pages");
                return { 
                  success: false, 
                  message: "Identifiants incorrects ou autorisations insuffisantes pour accéder aux pages" 
                };
              }
            } else {
              // Test successful
              console.log("Pages récupérées avec succès");
            }
          } catch (authError: any) {
            console.error("Authentication test error:", authError);
            
            // Detect network errors
            if (authError.name === 'TypeError' && authError.message === 'Failed to fetch') {
              setStatus("disconnected");
              setErrorDetails("Erreur réseau: impossible d'accéder au site WordPress");
              return { 
                success: false, 
                message: "Erreur réseau: impossible d'accéder au site WordPress" 
              };
            }
            
            // Ne pas échouer complètement si ce test échoue, car cela pourrait être dû
            // à une configuration différente sur le site WordPress
          }
        }

        const data = await response.json();
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
          setErrorDetails("Erreur réseau: impossible d'accéder au site WordPress. Vérifiez l'URL et les paramètres CORS.");
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
