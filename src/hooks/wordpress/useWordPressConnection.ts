
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

export type ConnectionStatus = "connected" | "disconnected" | "checking" | "unknown";

export const useWordPressConnection = () => {
  const [status, setStatus] = useState<ConnectionStatus>("unknown");
  const [isChecking, setIsChecking] = useState(false);
  const { user } = useAuth();

  const checkConnection = async (configId?: string) => {
    const wordpressConfigId = configId || user?.wordpressConfigId;
    
    if (!wordpressConfigId) {
      setStatus("disconnected");
      return { success: false, message: "Aucune configuration WordPress associée" };
    }

    try {
      setIsChecking(true);
      setStatus("checking");

      // Get the WordPress config
      const { data: wpConfig, error: wpConfigError } = await supabase
        .from('wordpress_configs')
        .select('site_url, rest_api_key, app_username, app_password')
        .eq('id', wordpressConfigId)
        .single();

      if (wpConfigError) {
        console.error("Error fetching WordPress config:", wpConfigError);
        setStatus("disconnected");
        return { success: false, message: "Échec de récupération de la configuration" };
      }

      if (!wpConfig) {
        setStatus("disconnected");
        return { success: false, message: "Configuration WordPress introuvable" };
      }

      // Try to fetch the WordPress site info as a connection test
      const infoUrl = `${wpConfig.site_url}/wp-json`;
      
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
        return { success: false, message: `Échec de connexion: ${response.statusText}` };
      }

      // Si l'authentification est utilisée, essayons d'accéder à un point d'extrémité
      // qui nécessite des autorisations pour valider les identifiants
      if (authenticationUsed) {
        try {
          // Essayons de récupérer les publications, ce qui nécessite généralement une authentification
          const postsUrl = `${wpConfig.site_url}/wp-json/wp/v2/posts?context=edit`;
          const authTest = await fetch(postsUrl, {
            method: 'GET',
            headers: headers
          });
          
          if (!authTest.ok) {
            // Si cet appel échoue, les identifiants sont probablement incorrects
            console.warn("Authentication test failed:", authTest.statusText);
            if (authTest.status === 401 || authTest.status === 403) {
              setStatus("disconnected");
              return { 
                success: false, 
                message: "Identifiants incorrects ou autorisations insuffisantes" 
              };
            }
          }
        } catch (authError) {
          console.error("Authentication test error:", authError);
          // Ne pas échouer complètement si ce test échoue, car cela pourrait être dû
          // à une configuration différente sur le site WordPress
        }
      }

      const data = await response.json();
      setStatus("connected");
      return { success: true, message: "Connexion établie avec succès", data };

    } catch (error: any) {
      console.error("Error checking WordPress connection:", error);
      setStatus("disconnected");
      return { success: false, message: error.message || "Erreur de connexion" };
    } finally {
      setIsChecking(false);
    }
  };

  return {
    status,
    isChecking,
    checkConnection
  };
};
