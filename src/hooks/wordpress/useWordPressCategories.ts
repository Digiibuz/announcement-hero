
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WordPressCategory } from "@/types/announcement";

export const useWordPressCategories = () => {
  const [categories, setCategories] = useState<WordPressCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Fonction utilitaire pour normaliser les URL WordPress
  const normalizeUrl = (url: string) => {
    return url.endsWith('/') ? url.slice(0, -1) : url;
  };

  const fetchCategories = async () => {
    if (!user?.wordpressConfigId) {
      console.error("No WordPress configuration ID found for user", user);
      setError("Aucune configuration WordPress associée");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log("Récupération des catégories pour l'ID de config WordPress:", user.wordpressConfigId);

      // First get the WordPress config for the user
      const { data: wpConfig, error: wpConfigError } = await supabase
        .from('wordpress_configs')
        .select('site_url, rest_api_key, app_username, app_password')
        .eq('id', user.wordpressConfigId)
        .single();

      if (wpConfigError) {
        console.error("Erreur lors de la récupération de la config WordPress:", wpConfigError);
        throw wpConfigError;
      }
      
      if (!wpConfig) {
        console.error("Configuration WordPress introuvable");
        throw new Error("Configuration WordPress introuvable");
      }

      console.log("Configuration WordPress trouvée:", {
        site_url: wpConfig.site_url,
        hasRestApiKey: !!wpConfig.rest_api_key,
        hasAppUsername: !!wpConfig.app_username,
        hasAppPassword: !!wpConfig.app_password
      });

      // Normalize the site URL to prevent double slashes
      const siteUrl = normalizeUrl(wpConfig.site_url);
      
      // Construct the WordPress API URL
      const apiUrl = `${siteUrl}/wp-json/wp/v2/categories`;
      
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Prioritize Application Password authentication
      if (wpConfig.app_username && wpConfig.app_password) {
        console.log("Utilisation de l'authentification par Application Password");
        const basicAuth = btoa(`${wpConfig.app_username}:${wpConfig.app_password}`);
        headers['Authorization'] = `Basic ${basicAuth}`;
      } else if (wpConfig.rest_api_key) {
        console.log("Utilisation de l'authentification par clé API REST");
        headers['Authorization'] = `Bearer ${wpConfig.rest_api_key}`;
      } else {
        console.log("Aucune méthode d'authentification fournie");
      }
      
      console.log("Récupération des catégories depuis:", apiUrl);
      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: headers,
          mode: 'cors'
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Erreur API WordPress:", response.status, errorText);
          
          if (response.status === 401 || response.status === 403) {
            throw new Error("Identifiants incorrects ou autorisations insuffisantes");
          }
          
          throw new Error(`Échec de récupération des catégories: ${response.statusText}`);
        }

        const categoriesData = await response.json();
        console.log("Catégories récupérées avec succès:", categoriesData.length);
        setCategories(categoriesData);
      } catch (fetchError: any) {
        console.error("Erreur fetch catégories:", fetchError);
        
        if (fetchError.message === "Failed to fetch") {
          throw new Error("Échec de connexion: Problème réseau ou CORS. Vérifiez que le site WordPress est accessible.");
        }
        throw fetchError;
      }
    } catch (err: any) {
      console.error("Erreur lors de la récupération des catégories WordPress:", err);
      setError(err.message || "Échec de récupération des catégories WordPress");
      toast.error("Erreur lors de la récupération des catégories WordPress");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("useWordPressCategories effect running, user:", user?.id, "wordpressConfigId:", user?.wordpressConfigId);
    if (user?.wordpressConfigId) {
      fetchCategories();
    }
  }, [user?.wordpressConfigId]);

  return { 
    categories, 
    isLoading, 
    error, 
    refetch: fetchCategories,
    hasCategories: categories.length > 0
  };
};
