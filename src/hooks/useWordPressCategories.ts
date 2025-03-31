
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DipiCptCategory, WordPressCategory } from "@/types/announcement";

export const useWordPressCategories = () => {
  const [categories, setCategories] = useState<DipiCptCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchCategories = async () => {
    if (!user?.wordpressConfigId) {
      setError("No WordPress configuration found for this user");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // First get the WordPress config for the user
      const { data: wpConfig, error: wpConfigError } = await supabase
        .from('wordpress_configs')
        .select('site_url, username, password, rest_api_key, app_username, app_password')
        .eq('id', user.wordpressConfigId)
        .single();

      if (wpConfigError) throw wpConfigError;
      if (!wpConfig) throw new Error("WordPress configuration not found");

      // Normalize the URL (remove double slashes)
      const siteUrl = wpConfig.site_url.replace(/([^:]\/)\/+/g, "$1");
      
      // Try to use the custom taxonomy endpoint for DipiPixel first
      let apiUrl = `${siteUrl}/wp-json/wp/v2/dipi_cpt_category`;
      
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Prioritize Application Password authentication
      if (wpConfig.app_username && wpConfig.app_password) {
        const basicAuth = btoa(`${wpConfig.app_username}:${wpConfig.app_password}`);
        headers['Authorization'] = `Basic ${basicAuth}`;
      } else if (wpConfig.rest_api_key) {
        headers['Authorization'] = `Bearer ${wpConfig.rest_api_key}`;
      }
      
      // First try the DipiPixel custom taxonomy endpoint
      let response = await fetch(apiUrl, {
        method: 'GET',
        headers: headers
      });

      // If DipiPixel endpoint not found, fall back to standard categories
      if (response.status === 404) {
        console.log("DipiPixel category endpoint not found, falling back to standard categories");
        apiUrl = `${siteUrl}/wp-json/wp/v2/categories`;
        
        response = await fetch(apiUrl, {
          method: 'GET',
          headers: headers
        });
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.statusText}`);
      }

      const categoriesData = await response.json();
      setCategories(categoriesData);
    } catch (err: any) {
      console.error("Error fetching WordPress categories:", err);
      setError(err.message || "Failed to fetch WordPress categories");
      toast.error("Erreur lors de la récupération des catégories");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
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
