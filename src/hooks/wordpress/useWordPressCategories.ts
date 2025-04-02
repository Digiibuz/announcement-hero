
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DipiCptCategory } from "@/types/announcement";
import { toast } from "sonner";

export const useWordPressCategories = (wordpressConfigId?: string) => {
  const [categories, setCategories] = useState<DipiCptCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!wordpressConfigId) {
      setCategories([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.info(`Fetching categories for WordPress config ID: ${wordpressConfigId}`);

      // Récupérer les informations de configuration WordPress
      const { data: configData, error: configError } = await supabase
        .from('wordpress_configs')
        .select('site_url, rest_api_key, app_username, app_password, username, password')
        .eq('id', wordpressConfigId)
        .single();

      if (configError) {
        throw new Error(`Erreur lors de la récupération de la configuration WordPress: ${configError.message}`);
      }

      const siteUrl = configData.site_url.replace(/\/$/, '');
      
      // Déterminer le type d'authentification à utiliser
      const hasRestApiKey = !!configData.rest_api_key;
      const hasAppCredentials = !!configData.app_username && !!configData.app_password;
      const hasBasicCredentials = !!configData.username && !!configData.password;

      console.info(`WordPress config found:`, { 
        site_url: siteUrl,
        hasRestApiKey,
        hasAppUsername: !!configData.app_username,
        hasAppPassword: !!configData.app_password
      });

      // Construire les en-têtes pour l'authentification
      let headers: HeadersInit = {
        'Content-Type': 'application/json'
      };

      if (hasRestApiKey) {
        headers['Authorization'] = `Bearer ${configData.rest_api_key}`;
      } else if (hasAppCredentials) {
        console.info('Using Application Password authentication');
        const auth = btoa(`${configData.app_username}:${configData.app_password}`);
        headers['Authorization'] = `Basic ${auth}`;
      } else if (hasBasicCredentials) {
        console.info('Using Basic authentication');
        const auth = btoa(`${configData.username}:${configData.password}`);
        headers['Authorization'] = `Basic ${auth}`;
      }

      // Appeler l'API WordPress pour récupérer les catégories DipiPixel
      const categoryUrl = `${siteUrl}/wp-json/wp/v2/dipi_cpt_category`;
      console.info(`Fetching DipiPixel categories from: ${categoryUrl}`);
      
      const response = await fetch(categoryUrl, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur lors de la récupération des catégories: ${response.status} - ${errorText}`);
      }

      const categoryData = await response.json();
      console.info(`DipiPixel categories fetched successfully: ${categoryData.length}`);
      
      setCategories(categoryData);
    } catch (err: any) {
      console.error('Erreur lors de la récupération des catégories WordPress:', err);
      setError(err);
      toast.error(`Erreur: ${err.message}`);
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [wordpressConfigId]);

  useEffect(() => {
    if (wordpressConfigId) {
      console.info(`useWordPressCategories effect running, wordpressConfigId: ${wordpressConfigId}`);
      fetchCategories();
    } else {
      setCategories([]);
    }
  }, [wordpressConfigId, fetchCategories]);

  return {
    categories,
    isLoading,
    error,
    fetchCategories
  };
};
