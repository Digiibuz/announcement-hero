import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WordPressCategory, DipiCptCategory } from "@/types/announcement";
import { useAuth } from "@/context/AuthContext";

/**
 * Hook to fetch WordPress categories, including standard categories and DipiPixel CPT categories
 */
export const useWordPressCategories = (configId: string | undefined) => {
  const [categories, setCategories] = useState<WordPressCategory[]>([]);
  const [dipiCategories, setDipiCategories] = useState<DipiCptCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchCategories = async () => {
    if (!configId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Fetch WordPress configuration
      const { data: wpConfig, error: wpConfigError } = await supabase
        .from('wordpress_configs')
        .select('site_url')
        .eq('id', configId)
        .single();

      if (wpConfigError) {
        console.error("Error fetching WordPress config:", wpConfigError);
        toast.error("Erreur lors de la récupération de la configuration WordPress");
        return;
      }

      if (!wpConfig || !wpConfig.site_url) {
        console.error("WordPress configuration not found");
        toast.error("Configuration WordPress introuvable");
        return;
      }

      // Ensure site_url has proper format
      const siteUrl = wpConfig.site_url;
      
      // Construct the WordPress API URL
      const restUrl = typeof siteUrl === 'string' ? siteUrl.replace(/\/$/, '') : String(siteUrl);
      const apiUrl = `${restUrl}/wp-json/wp/v2/categories?per_page=100`;
      console.log("WordPress categories URL:", apiUrl);

      // Fetch categories from WordPress REST API
      const response = await fetch(apiUrl);
      if (!response.ok) {
        throw new Error(`Failed to fetch categories: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setCategories(data);
    } catch (error: any) {
      console.error("Error fetching WordPress categories:", error);
      toast.error(`Erreur lors de la récupération des catégories WordPress: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDipiCategories = async () => {
    if (!configId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);

      // Fetch WordPress configuration
      const { data: wpConfig, error: wpConfigError } = await supabase
        .from('wordpress_configs')
        .select('site_url')
        .eq('id', configId)
        .single();

      if (wpConfigError) {
        console.error("Error fetching WordPress config:", wpConfigError);
        toast.error("Erreur lors de la récupération de la configuration WordPress");
        return;
      }

      if (!wpConfig || !wpConfig.site_url) {
        console.error("WordPress configuration not found");
        toast.error("Configuration WordPress introuvable");
        return;
      }

      // Ensure site_url has proper format
      const siteUrl = wpConfig.site_url;

      // Construct the DipiPixel CPT categories API URL
      const restUrl = typeof siteUrl === 'string' ? siteUrl.replace(/\/$/, '') : String(siteUrl);
      const dipiApiUrl = `${restUrl}/wp-json/wp/v2/dipi_cpt_categories?per_page=100`;
      console.log("DipiPixel categories URL:", dipiApiUrl);

      // Fetch DipiPixel CPT categories from WordPress REST API
      const dipiResponse = await fetch(dipiApiUrl);
      if (!dipiResponse.ok) {
        console.warn(`Failed to fetch DipiPixel categories: ${dipiResponse.status} ${dipiResponse.statusText}`);
        setDipiCategories([]);
        return;
      }

      const dipiData = await dipiResponse.json();
      setDipiCategories(dipiData);
    } catch (error: any) {
      console.error("Error fetching DipiPixel categories:", error);
      toast.error(`Erreur lors de la récupération des catégories DipiPixel: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    fetchDipiCategories();
  }, [configId, user]);

  return {
    categories,
    dipiCategories,
    isLoading,
    fetchCategories,
    fetchDipiCategories
  };
};
