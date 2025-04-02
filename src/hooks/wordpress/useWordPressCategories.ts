
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DipiCptCategory } from "@/types/announcement";

export const useWordPressCategories = (configIdProp?: string | null) => {
  const [categories, setCategories] = useState<DipiCptCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchCategories = useCallback(async (configId?: string | null) => {
    // Utiliser la configId passée en paramètre ou celle de la prop
    const effectiveConfigId = configId || configIdProp || user?.wordpressConfigId;
    
    if (!effectiveConfigId) {
      console.error("No WordPress configuration ID found for user", user);
      setError("No WordPress configuration found for this user");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log("Fetching categories for WordPress config ID:", effectiveConfigId);

      // First get the WordPress config for the specified ID
      const { data: wpConfig, error: wpConfigError } = await supabase
        .from('wordpress_configs')
        .select('site_url, rest_api_key, app_username, app_password')
        .eq('id', effectiveConfigId)
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

      // Normalize the URL (remove double slashes)
      const siteUrl = wpConfig.site_url.replace(/([^:]\/)\/+/g, "$1");
      
      // First try the DipiPixel custom endpoint
      let apiUrl = `${siteUrl}/wp-json/wp/v2/dipi_cpt_category`;
      
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
      
      // Add timeout to the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        console.log("Fetching DipiPixel categories from:", apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: headers,
          signal: controller.signal
        });
  
        clearTimeout(timeoutId);
  
        if (response.status === 404) {
          console.log("DipiPixel category endpoint not found, falling back to standard categories");
          
          // If DipiPixel endpoint not found, fall back to standard categories
          const standardApiUrl = `${siteUrl}/wp-json/wp/v2/categories`;
          console.log("Fetching standard WordPress categories from:", standardApiUrl);
          
          const standardResponse = await fetch(standardApiUrl, {
            method: 'GET',
            headers: headers
          });
          
          if (!standardResponse.ok) {
            const errorText = await standardResponse.text();
            console.error("WordPress API error:", standardResponse.status, errorText);
            throw new Error(`Failed to fetch categories: ${standardResponse.statusText}`);
          }
          
          const standardCategoriesData = await standardResponse.json();
          console.log("Standard WordPress categories fetched successfully:", standardCategoriesData.length);
          setCategories(standardCategoriesData);
          return;
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("WordPress API error:", response.status, errorText);
          
          if (response.status === 401 || response.status === 403) {
            throw new Error("Identifiants incorrects ou autorisations insuffisantes");
          }
          
          throw new Error(`Failed to fetch categories: ${response.statusText}`);
        }
  
        const categoriesData = await response.json();
        console.log("DipiPixel categories fetched successfully:", categoriesData.length);
        setCategories(categoriesData);
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          throw new Error("Le délai d'attente a expiré lors de la récupération des catégories");
        }
        throw fetchError;
      }
    } catch (err: any) {
      console.error("Error fetching WordPress categories:", err);
      
      let errorMessage = err.message || "Failed to fetch WordPress categories";
      
      // Improve error messages
      if (err.message.includes("Failed to fetch")) {
        errorMessage = "Erreur réseau: impossible d'accéder au site WordPress";
      } else if (err.message.includes("NetworkError")) {
        errorMessage = "Erreur réseau: problème de connectivité";
      } else if (err.message.includes("CORS")) {
        errorMessage = "Erreur CORS: le site n'autorise pas les requêtes depuis cette origine";
      }
      
      setError(errorMessage);
      toast.error("Erreur lors de la récupération des catégories");
    } finally {
      setIsLoading(false);
    }
  }, [configIdProp, user?.wordpressConfigId]);

  useEffect(() => {
    const effectiveConfigId = configIdProp || user?.wordpressConfigId;
    console.log("useWordPressCategories effect running, user:", user?.id, "configId:", effectiveConfigId);
    if (effectiveConfigId) {
      fetchCategories(effectiveConfigId);
    }
  }, [configIdProp, user?.wordpressConfigId, fetchCategories]);

  return { 
    categories, 
    isLoading, 
    error, 
    refetch: fetchCategories,
    hasCategories: categories.length > 0
  };
};
