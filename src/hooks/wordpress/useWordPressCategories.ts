
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WordPressCategory } from "@/types/announcement";

/**
 * Hook for fetching WordPress categories from a configured WordPress site
 */
export const useWordPressCategories = () => {
  const [categories, setCategories] = useState<WordPressCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchCategories = async () => {
    if (!user?.wordpressConfigId) {
      setError("No WordPress configuration found for this user");
      setCategories([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // First get the WordPress config for the user
      const { data: wpConfig, error: wpConfigError } = await supabase
        .from('wordpress_configs')
        .select('site_url, rest_api_key, app_username, app_password')
        .eq('id', user.wordpressConfigId)
        .single();

      if (wpConfigError) {
        console.error("Error fetching WordPress config:", wpConfigError);
        throw new Error("Failed to retrieve WordPress configuration");
      }
      
      if (!wpConfig) {
        throw new Error("WordPress configuration not found");
      }

      // Construct the WordPress API URL
      const apiUrl = `${wpConfig.site_url}/wp-json/wp/v2/categories`;
      
      // Prepare authentication headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Use Application Password if available
      if (wpConfig.app_username && wpConfig.app_password) {
        const basicAuth = btoa(`${wpConfig.app_username}:${wpConfig.app_password}`);
        headers['Authorization'] = `Basic ${basicAuth}`;
      } 
      // Fall back to REST API key if present
      else if (wpConfig.rest_api_key) {
        headers['Authorization'] = `Bearer ${wpConfig.rest_api_key}`;
      }
      
      const response = await fetch(apiUrl, {
        headers: headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("WordPress API error response:", errorText);
        throw new Error(`Failed to fetch categories: ${response.statusText}`);
      }

      const categoriesData = await response.json();
      setCategories(categoriesData);
    } catch (err: any) {
      console.error("Error fetching WordPress categories:", err);
      setError(err.message || "Failed to fetch WordPress categories");
      toast.error("Erreur lors de la récupération des catégories WordPress");
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.wordpressConfigId) {
      fetchCategories();
    } else {
      setCategories([]);
      setError("No WordPress configuration found");
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
