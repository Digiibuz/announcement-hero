
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

  // Fonction pour tester l'accessibilité d'une URL
  const testUrlAccessibility = async (url: string): Promise<{accessible: boolean, error?: string}> => {
    try {
      console.log(`Testing accessibility for: ${url}`);
      
      // Normaliser l'URL (supprimer les doubles slashes)
      const normalizedUrl = url.replace(/([^:]\/)\/+/g, "$1");
      
      // Première tentative: fetch direct
      try {
        const response = await fetch(normalizedUrl, {
          method: 'HEAD',
          mode: 'no-cors', // Contourner CORS pour le test d'accessibilité
          cache: 'no-cache',
          headers: {'Accept': 'text/html'},
          referrerPolicy: 'no-referrer',
        });
        
        // Si nous arrivons ici sans erreur, l'URL est accessible
        return { accessible: true };
      } catch (directError: any) {
        console.log("Direct fetch test failed:", directError);
        
        // Vérifier si l'erreur est liée à CORS
        if (directError.message.includes('CORS') || directError.name === 'TypeError') {
          // Deuxième tentative avec un timeout plus court pour détecter les problèmes d'accessibilité
          try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            await fetch(`${normalizedUrl}/wp-json`, {
              method: 'GET',
              mode: 'no-cors',
              signal: controller.signal,
              headers: {'Accept': 'text/html'},
            });
            
            clearTimeout(timeoutId);
            return { accessible: true };
          } catch (timeoutError: any) {
            if (timeoutError.name === 'AbortError') {
              return { 
                accessible: false, 
                error: "Le délai d'attente a expiré lors de la tentative d'accès au site" 
              };
            }
            
            // Pour les autres erreurs, on considère que l'URL pourrait être accessible
            // mais avec un problème CORS
            return { 
              accessible: true, 
              error: "L'URL est accessible mais pourrait avoir des restrictions CORS" 
            };
          }
        }
        
        return { 
          accessible: false, 
          error: `Impossible d'accéder à l'URL: ${directError.message}` 
        };
      }
    } catch (error: any) {
      console.error("URL accessibility test error:", error);
      return { 
        accessible: false, 
        error: `Erreur lors du test d'accès: ${error.message}` 
      };
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

      // Normaliser l'URL (supprimer les doubles slashes)
      const siteUrl = wpConfig.site_url.replace(/([^:]\/)\/+/g, "$1");
      
      // Tester l'accessibilité du site avant d'essayer la connexion API
      const accessibilityCheck = await testUrlAccessibility(siteUrl);
      if (!accessibilityCheck.accessible) {
        console.error("WordPress site not accessible:", accessibilityCheck.error);
        setStatus("disconnected");
        setErrorDetails(`Erreur réseau: impossible d'accéder au site WordPress. ${accessibilityCheck.error || ''}`);
        return { 
          success: false, 
          message: `Erreur réseau: impossible d'accéder au site WordPress`,
          details: accessibilityCheck.error
        };
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
      
      const response = await fetch(infoUrl, {
        method: 'GET',
        headers: headers
      });

      if (!response.ok) {
        console.error("WordPress connection test failed:", response.statusText);
        setStatus("disconnected");
        
        let errorMsg = `Échec de connexion: ${response.statusText}`;
        
        if (response.status === 404) {
          errorMsg = "L'API REST WordPress n'est pas accessible à cette URL";
        } else if (response.status === 401 || response.status === 403) {
          errorMsg = "Identifiants incorrects ou autorisations insuffisantes";
        }
        
        setErrorDetails(errorMsg);
        return { success: false, message: errorMsg };
      }

      // Si l'authentification est utilisée, essayons d'accéder à un point d'extrémité
      // qui nécessite des autorisations pour valider les identifiants
      if (authenticationUsed) {
        try {
          // Essayons de récupérer les publications, ce qui nécessite généralement une authentification
          const authTestUrl = `${siteUrl}/wp-json/wp/v2/categories`;
          const authTest = await fetch(authTestUrl, {
            method: 'GET',
            headers: headers
          });
          
          if (!authTest.ok) {
            // Si cet appel échoue, les identifiants sont probablement incorrects
            console.warn("Authentication test failed:", authTest.statusText);
            if (authTest.status === 401 || authTest.status === 403) {
              setStatus("disconnected");
              const errorMsg = "Identifiants incorrects ou autorisations insuffisantes";
              setErrorDetails(errorMsg);
              return { 
                success: false, 
                message: errorMsg
              };
            }
          }

          // Essayons également avec les pages
          const pagesTestUrl = `${siteUrl}/wp-json/wp/v2/pages`;
          const pagesTest = await fetch(pagesTestUrl, {
            method: 'GET',
            headers: headers
          });

          if (!pagesTest.ok) {
            console.warn("Pages test failed:", pagesTest.statusText);
          }
        } catch (authError) {
          console.error("Authentication test error:", authError);
          // Ne pas échouer complètement si ce test échoue, car cela pourrait être dû
          // à une configuration différente sur le site WordPress
        }
      }

      const data = await response.json();
      setStatus("connected");
      setErrorDetails(null);
      return { success: true, message: "Connexion établie avec succès", data };

    } catch (error: any) {
      console.error("Error checking WordPress connection:", error);
      setStatus("disconnected");
      
      let errorMessage = error.message || "Erreur de connexion";
      
      // Améliorer les messages d'erreur
      if (error.message.includes("Failed to fetch")) {
        errorMessage = "Erreur réseau: impossible d'accéder au site WordPress";
      } else if (error.message.includes("NetworkError")) {
        errorMessage = "Erreur réseau: problème de connectivité";
      } else if (error.message.includes("CORS")) {
        errorMessage = "Erreur CORS: le site n'autorise pas les requêtes depuis cette origine";
      } else if (error.message.includes("timeout")) {
        errorMessage = "Délai d'attente dépassé lors de la connexion";
      }
      
      setErrorDetails(errorMessage);
      return { success: false, message: errorMessage };
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
