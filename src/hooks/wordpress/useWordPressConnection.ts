
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WordPressConfig } from "@/types/wordpress";

export interface ConnectionResult {
  success: boolean;
  message: string;
  hasCategories?: boolean;
  hasCustomPost?: boolean;
  hasAppAuth?: boolean;
  hasBearerAuth?: boolean;
}

export const useWordPressConnection = () => {
  const [isChecking, setIsChecking] = useState(false);
  const [status, setStatus] = useState<"connected" | "disconnected" | "unknown">("unknown");
  const [errorDetails, setErrorDetails] = useState<string | null>(null);

  const testConnection = async (config: WordPressConfig): Promise<ConnectionResult> => {
    setIsChecking(true);
    
    try {
      console.log("Testing WordPress connection for site:", config.site_url);
      
      // Ensure site_url has proper format
      const siteUrl = config.site_url.endsWith('/')
        ? config.site_url.slice(0, -1)
        : config.site_url;
      
      // Prepare headers based on available credentials
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Test first with app password
      if (config.app_username && config.app_password) {
        console.log("Testing with Application Password authentication");
        // Encodage en base64 en JavaScript - important pour l'authentification Basic
        const credentials = `${config.app_username}:${config.app_password}`;
        const basicAuth = btoa(credentials);
        headers['Authorization'] = `Basic ${basicAuth}`;
      } else if (config.rest_api_key) {
        console.log("Testing with REST API Key authentication");
        headers['Authorization'] = `Bearer ${config.rest_api_key}`;
      } else if (config.username && config.password) {
        console.log("Testing with legacy Basic authentication");
        const credentials = `${config.username}:${config.password}`;
        const basicAuth = btoa(credentials);
        headers['Authorization'] = `Basic ${basicAuth}`;
      } else {
        return {
          success: false,
          message: "Aucune méthode d'authentification configurée"
        };
      }
      
      // Essayer de récupérer les infos du site pour vérifier l'authentification
      console.log("Testing base site info endpoint");
      const response = await fetch(`${siteUrl}/wp-json/`, {
        method: 'GET',
        headers: headers
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Connection test failed:", response.status, errorText);
        
        if (response.status === 401 || response.status === 403) {
          return {
            success: false,
            message: "Échec d'authentification. Veuillez vérifier vos identifiants."
          };
        }
        
        return {
          success: false,
          message: `Échec de connexion (${response.status}): ${errorText}`
        };
      }
      
      // Site info obtenues, vérifions maintenant les catégories
      const siteInfo = await response.json();
      console.log("WordPress site info retrieved successfully");
      
      // Variables pour les capacités détectées
      let hasCategories = false;
      let hasCustomPost = false;
      let hasAppAuth = false;
      let hasBearerAuth = false;
      
      // Vérifier si les catégories DipiPixel existent
      try {
        console.log("Checking if DipiPixel categories exist");
        const categoryResponse = await fetch(`${siteUrl}/wp-json/wp/v2/dipi_cpt_category`, {
          method: 'GET',
          headers: headers
        });
        
        if (categoryResponse.ok) {
          const categories = await categoryResponse.json();
          hasCategories = Array.isArray(categories) && categories.length > 0;
          hasCustomPost = true;
          console.log("DipiPixel categories found:", hasCategories);
        } else {
          console.log("DipiPixel categories not found, checking standard categories");
          
          // Si pas de catégories DipiPixel, essayer les catégories standard
          const stdCategoryResponse = await fetch(`${siteUrl}/wp-json/wp/v2/categories`, {
            method: 'GET',
            headers: headers
          });
          
          if (stdCategoryResponse.ok) {
            const stdCategories = await stdCategoryResponse.json();
            hasCategories = Array.isArray(stdCategories) && stdCategories.length > 0;
            console.log("Standard categories found:", hasCategories);
          } else {
            console.log("No categories found");
          }
        }
      } catch (error) {
        console.error("Error checking categories:", error);
      }
      
      // Déterminer le type d'authentification utilisé
      hasAppAuth = !!(config.app_username && config.app_password);
      hasBearerAuth = !!config.rest_api_key;
      
      return {
        success: true,
        message: "Connexion établie avec succès",
        hasCategories,
        hasCustomPost,
        hasAppAuth,
        hasBearerAuth
      };
    } catch (error: any) {
      console.error("Error testing connection:", error);
      return {
        success: false,
        message: `Erreur lors du test de connexion: ${error.message}`
      };
    } finally {
      setIsChecking(false);
    }
  };
  
  const checkConnection = async (configId?: string) => {
    setIsChecking(true);
    setErrorDetails(null);
    
    try {
      if (!configId) {
        setStatus("unknown");
        return { success: false, message: "No WordPress configuration ID provided" };
      }
      
      // Get WordPress config details
      const { data: config, error } = await supabase
        .from('wordpress_configs')
        .select('*')
        .eq('id', configId)
        .single();
        
      if (error || !config) {
        console.error("Error fetching WordPress config:", error || "No config found");
        setStatus("disconnected");
        setErrorDetails("Configuration WordPress introuvable");
        return { success: false, message: "WordPress configuration not found" };
      }
      
      // Test connection with the config
      const result = await testConnection(config);
      
      if (result.success) {
        setStatus("connected");
        setErrorDetails(null);
      } else {
        setStatus("disconnected");
        setErrorDetails(result.message);
      }
      
      return result;
    } catch (error: any) {
      console.error("Error checking WordPress connection:", error);
      setStatus("disconnected");
      setErrorDetails(error.message);
      return { success: false, message: error.message };
    } finally {
      setIsChecking(false);
    }
  };
  
  return {
    status,
    isChecking,
    errorDetails,
    checkConnection,
    testConnection // Important: Expose the testConnection method
  };
};
