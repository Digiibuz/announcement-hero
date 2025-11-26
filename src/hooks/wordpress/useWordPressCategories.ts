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

  // Nouvelle fonction pour récupérer les catégories via l'edge function
  const fetchCategoriesForConfig = useCallback(async (configId: string) => {
    console.log('🔍 DEBUG: fetchCategoriesForConfig called with:', {
      configId,
      lastConfigId: lastConfigIdRef.current,
      skipFiltering
    });

    // Éviter les appels avec des IDs de configuration différents en succession rapide
    if (lastConfigIdRef.current && lastConfigIdRef.current !== configId) {
      console.log("WordPress config ID changed, waiting for stabilization...");
      await new Promise(resolve => setTimeout(resolve, 200));
      if (lastConfigIdRef.current && lastConfigIdRef.current !== configId) {
        console.log("Configuration still changing, skipping fetch");
        return;
      }
    }

    lastConfigIdRef.current = configId;

    // Éviter les appels multiples simultanés
    if (isLoadingRef.current) {
      console.log("Fetch already in progress, skipping...");
      return;
    }

    try {
      setIsLoading(true);
      isLoadingRef.current = true;
      setError(null);
      console.log("📡 Fetching categories via Edge Function for config:", configId);

      // Vérifier et rafraîchir la session si nécessaire
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        console.log("Session expired, refreshing...");
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error("Failed to refresh session:", refreshError);
          throw new Error("Session expirée. Veuillez vous reconnecter.");
        }
      }

      // Appeler l'edge function wordpress-proxy
      let { data, error: functionError } = await supabase.functions.invoke('wordpress-proxy', {
        body: {
          action: 'getCategories',
          configId,
        },
      });

      // Si erreur 401, rafraîchir la session et réessayer une fois
      if (functionError && functionError.message?.includes('401')) {
        console.log("🔄 401 detected, refreshing session and retrying...");
        const { error: refreshError } = await supabase.auth.refreshSession();
        if (refreshError) {
          console.error("Failed to refresh session:", refreshError);
          throw new Error("Session expirée. Veuillez vous reconnecter.");
        }

        // Réessayer l'appel
        const retry = await supabase.functions.invoke('wordpress-proxy', {
          body: {
            action: 'getCategories',
            configId,
          },
        });
        data = retry.data;
        functionError = retry.error;
      }

      if (functionError) {
        console.error("Edge function error:", functionError);
        throw new Error(functionError.message || "Erreur lors de la récupération des catégories");
      }

      if (!data || !data.success) {
        console.error("Invalid response from edge function:", data);
        throw new Error(data?.error || "Réponse invalide du serveur");
      }

      const fetchedCategories = data.categories || [];
      console.log(`✅ Categories fetched successfully: ${fetchedCategories.length} categories${data.cached ? ' (from cache)' : ''}`);

      // Appliquer le filtrage si nécessaire
      if (skipFiltering) {
        setCategories(fetchedCategories);
      } else {
        await filterCategoriesByConfig(configId, fetchedCategories);
      }

    } catch (err: any) {
      console.error("Error fetching WordPress categories:", err);
      
      let errorMessage = "Échec de récupération des catégories WordPress";
      
      if (err && err.message) {
        if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
          errorMessage = "Erreur réseau: impossible d'accéder au serveur";
        } else if (err.message.includes("timeout")) {
          errorMessage = "Délai d'attente dépassé. Le serveur WordPress ne répond pas.";
        } else {
          errorMessage = String(err.message);
        }
      }
      
      setError(errorMessage);
      
      // Ne pas afficher de toast lors du rechargement pour éviter le spam
      if (!window.location.pathname.includes('/create')) {
        toast.error("Erreur lors de la récupération des catégories");
      }
      
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
