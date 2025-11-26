import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DipiCptCategory } from "@/types/announcement";

export const useWordPressCategories = (specificConfigId?: string, skipFiltering = false) => {
  const [categories, setCategories] = useState<DipiCptCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const isLoadingRef = useRef(false);
  const lastConfigIdRef = useRef<string | null>(null);

  // Détermine quel config ID utiliser : spécifique ou celui de l'utilisateur
  const configIdToUse = specificConfigId || user?.wordpressConfigId;

  const fetchCategories = useCallback(async () => {
    // Si nous avons un configId spécifique, l'utiliser directement
    if (specificConfigId) {
      return await fetchCategoriesForConfig(specificConfigId);
    }

    // Sinon, utiliser la logique existante pour l'utilisateur connecté
    if (!user?.id) {
      console.warn("No user ID found, cannot fetch categories");
      setError("Utilisateur non connecté");
      setCategories([]);
      return;
    }

    if (!user?.wordpressConfigId) {
      console.warn("No WordPress configuration ID found for user:", user?.id);
      setError("Aucune configuration WordPress trouvée pour cet utilisateur");
      setCategories([]);
      return;
    }

    return await fetchCategoriesForConfig(user.wordpressConfigId);
  }, [user?.wordpressConfigId, user?.id, specificConfigId]);

  const fetchCategoriesForConfig = useCallback(async (configId: string) => {
    console.log("🔍 DEBUG: fetchCategoriesForConfig called with:", {
      configId,
      lastConfigId: lastConfigIdRef.current,
      skipFiltering
    });
    
    // Prevent duplicate calls
    if (lastConfigIdRef.current === configId && isLoadingRef.current) {
      console.log("⏭️ Skipping duplicate call for same config");
      return;
    }
    
    lastConfigIdRef.current = configId;
    isLoadingRef.current = true;
    setIsLoading(true);
    setError(null);

    try {
      console.log("📡 Fetching categories for config:", configId);
      
      // Get WordPress config details
      const { data: wpConfig, error: wpConfigError } = await supabase
        .from('wordpress_configs')
        .select('*')
        .eq('id', configId)
        .single();

      if (wpConfigError || !wpConfig) {
        console.error("Error fetching WordPress config details:", wpConfigError);
        throw new Error("Configuration WordPress non trouvée");
      }

      // Determine API endpoint
      const siteUrl = wpConfig.site_url.endsWith('/')
        ? wpConfig.site_url.slice(0, -1)
        : wpConfig.site_url;

      const isDiviPixel = wpConfig.endpoint_type === 'dipi_cpt';
      const categoriesEndpoint = isDiviPixel
        ? `${siteUrl}/wp-json/wp/v2/dipi_cpt_category`
        : `${siteUrl}/wp-json/wp/v2/categories`;

      console.log("Fetching from:", categoriesEndpoint);

      // Prepare headers with authentication
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (wpConfig.app_username && wpConfig.app_password) {
        const basicAuth = btoa(`${wpConfig.app_username}:${wpConfig.app_password}`);
        headers['Authorization'] = `Basic ${basicAuth}`;
      }

      // Fetch categories
      const response = await fetch(`${categoriesEndpoint}?per_page=100&_fields=id,name,count,slug`, {
        method: 'GET',
        headers: headers,
      });

      if (!response.ok) {
        console.error("Failed to fetch categories:", response.status, response.statusText);
        throw new Error(`Erreur lors de la récupération des catégories: ${response.status}`);
      }

      const fetchedCategories: DipiCptCategory[] = await response.json();
      console.log("✅ Categories fetched successfully:", fetchedCategories.length, "categories");

      // Apply filtering if needed
      if (skipFiltering) {
        setCategories(fetchedCategories);
      } else {
        await filterCategoriesByConfig(configId, fetchedCategories);
      }
    } catch (err: any) {
      console.error("Error fetching categories:", err);
      setError(err.message || "Erreur lors du chargement des catégories");
      setCategories([]);
    } finally {
      setIsLoading(false);
      isLoadingRef.current = false;
    }
  }, [skipFiltering]);

  // Fonction pour filtrer les catégories selon la configuration
  const filterCategoriesByConfig = useCallback(async (configId: string, allCategories: DipiCptCategory[]) => {
    try {
      // Récupérer les catégories autorisées pour cette config
      const { data: allowedCategories, error } = await supabase
        .from('wordpress_config_categories')
        .select('category_id')
        .eq('wordpress_config_id', configId);

      if (error) {
        console.error("Error fetching allowed categories:", error);
        setCategories(allCategories);
        return;
      }

      if (!allowedCategories || allowedCategories.length === 0) {
        console.log("No category restrictions found, showing all categories");
        setCategories(allCategories);
        return;
      }

      // Filtrer les catégories selon la configuration
      const allowedCategoryIds = new Set(allowedCategories.map(cat => cat.category_id));
      const filteredCategories = allCategories.filter(category => 
        allowedCategoryIds.has(String(category.id))
      );

      console.log(`Filtered categories: ${filteredCategories.length} out of ${allCategories.length} categories`);
      setCategories(filteredCategories);
    } catch (err) {
      console.error("Error filtering categories:", err);
      setCategories(allCategories);
    }
  }, []);

  const refetch = useCallback(() => {
    setError(null);
    setIsLoading(false);
    isLoadingRef.current = false;
    if (configIdToUse) {
      fetchCategories();
    }
  }, [fetchCategories, configIdToUse]);

  useEffect(() => {
    console.log("useWordPressCategories effect running, configIdToUse:", configIdToUse);
    
    if (configIdToUse) {
      setError(null);
      
      const timer = setTimeout(() => {
        fetchCategories();
      }, 100);
      
      return () => {
        clearTimeout(timer);
      };
    } else {
      setCategories([]);
      setError(null);
      setIsLoading(false);
      isLoadingRef.current = false;
      lastConfigIdRef.current = null;
    }
  }, [configIdToUse, fetchCategories]);

  return { 
    categories, 
    isLoading, 
    error, 
    refetch,
    hasCategories: categories.length > 0
  };
};
