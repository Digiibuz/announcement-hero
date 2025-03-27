
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

  const fetchCategories = async () => {
    if (!user?.wordpressConfigId) {
      console.error("No WordPress configuration ID found for user", user);
      setError("No WordPress configuration found for this user");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log("Fetching categories for WordPress config ID:", user.wordpressConfigId);

      // First get the WordPress config for the user
      const { data: wpConfig, error: wpConfigError } = await supabase
        .from('wordpress_configs')
        .select('site_url, rest_api_key, app_username, app_password')
        .eq('id', user.wordpressConfigId)
        .single();

      if (wpConfigError) {
        console.error("Error fetching WordPress config:", wpConfigError);
        throw wpConfigError;
      }
      
      if (!wpConfig) {
        console.error("WordPress configuration not found");
        throw new Error("WordPress configuration not found");
      }

      console.log("WordPress config found:", {
        site_url: wpConfig.site_url,
        hasRestApiKey: !!wpConfig.rest_api_key,
        hasAppUsername: !!wpConfig.app_username,
        hasAppPassword: !!wpConfig.app_password
      });

      // Ensure the site URL is properly formatted
      let siteUrl = wpConfig.site_url;
      if (!siteUrl.startsWith("http")) {
        siteUrl = "https://" + siteUrl;
      }
      if (siteUrl.endsWith("/")) {
        siteUrl = siteUrl.slice(0, -1);
      }

      // Construct the WordPress API URL
      const apiUrl = `${siteUrl}/wp-json/wp/v2/categories`;
      
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Prioritize Application Password authentication
      if (wpConfig.app_username && wpConfig.app_password) {
        console.log("Using Application Password authentication");
        const basicAuth = btoa(`${wpConfig.app_username}:${wpConfig.app_password}`);
        headers['Authorization'] = `Basic ${basicAuth}`;
      } else if (wpConfig.rest_api_key) {
        console.log("Using REST API Key authentication");
        headers['Authorization'] = `Bearer ${wpConfig.rest_api_key}`;
      } else {
        console.log("No authentication credentials provided");
      }
      
      console.log("Fetching categories from:", apiUrl);
      
      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: headers,
          signal: AbortSignal.timeout(15000) // Add a reasonable timeout
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("WordPress API error:", response.status, errorText);
          
          if (response.status === 401 || response.status === 403) {
            throw new Error("Identifiants incorrects ou autorisations insuffisantes");
          } else if (response.status === 404) {
            throw new Error("API REST WordPress introuvable. Vérifiez que le plugin REST API est activé.");
          }
          
          throw new Error(`Failed to fetch categories: ${response.statusText}`);
        }

        const categoriesData = await response.json();
        console.log("Categories fetched successfully:", categoriesData.length);
        setCategories(categoriesData);
      } catch (fetchError: any) {
        console.error("Fetch error:", fetchError);
        
        // Check for timeout
        if (fetchError.name === 'TimeoutError' || fetchError.name === 'AbortError') {
          throw new Error("Délai d'attente dépassé lors de la récupération des catégories");
        }
        
        // Network errors
        if (fetchError.name === 'TypeError' && fetchError.message === 'Failed to fetch') {
          throw new Error("Erreur réseau: impossible d'accéder au site WordPress. Vérifiez l'URL et les paramètres CORS.");
        }
        
        throw fetchError;
      }
    } catch (err: any) {
      console.error("Error fetching WordPress categories:", err);
      setError(err.message || "Failed to fetch WordPress categories");
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
