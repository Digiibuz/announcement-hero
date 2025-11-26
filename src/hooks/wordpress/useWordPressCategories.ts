import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DipiCptCategory } from "@/types/announcement";
import { isDemoMode, DEMO_CATEGORIES } from "@/utils/demoMode";

export const useWordPressCategories = (specificConfigId?: string, skipFiltering = false) => {
  const [categories, setCategories] = useState<DipiCptCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, refreshUser } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);
  const isLoadingRef = useRef(false);
  const lastConfigIdRef = useRef<string | null>(null);

  // Détermine quel config ID utiliser : spécifique ou celui de l'utilisateur
  const configIdToUse = specificConfigId || user?.wordpressConfigId;

  const fetchCategories = useCallback(async () => {
    // MODE DÉMO : Si l'utilisateur est testeur, retourner les catégories mockées
    if (isDemoMode(user?.role)) {
      console.log("🎭 MODE TESTEUR activé pour:", user?.email);
      setIsLoading(false);
      isLoadingRef.current = false;
      setError(null);
      setCategories(DEMO_CATEGORIES as DipiCptCategory[]);
      return;
    }

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
  }, [user?.wordpressConfigId, user?.id, user?.role, user?.email, specificConfigId]);

  // Nouvelle fonction pour récupérer les catégories pour un config ID spécifique
  const fetchCategoriesForConfig = useCallback(async (configId: string) => {
    console.log('🔍 DEBUG: fetchCategoriesForConfig called with:', {
      configId,
      lastConfigId: lastConfigIdRef.current,
      skipFiltering
    });

    // Éviter les appels avec des IDs de configuration différents en succession rapide
    if (lastConfigIdRef.current && lastConfigIdRef.current !== configId) {
      console.log("WordPress config ID changed, waiting for stabilization...");
      // Attendre un peu pour que l'ID se stabilise
      await new Promise(resolve => setTimeout(resolve, 200));
      // Vérifier si l'ID a encore changé
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

    // Annuler toute requête en cours
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Créer un nouveau contrôleur d'abort
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    try {
      setIsLoading(true);
      isLoadingRef.current = true;
      setError(null);
      console.log("Fetching categories for WordPress config ID:", configId);

      // Vérifier et rafraîchir la session si nécessaire
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError || !session) {
          console.log("Session expired, refreshing...");
          const { error: refreshError } = await supabase.auth.refreshSession();
          if (refreshError) {
            console.error("Failed to refresh session:", refreshError);
            throw new Error("Session expirée. Veuillez vous reconnecter.");
          }
        }
      } catch (sessionErr) {
        console.error("Session check error:", sessionErr);
      }

      // Récupérer la configuration WordPress directement
      const { data: wpConfig, error: wpConfigError } = await supabase
        .from('wordpress_configs')
        .select('site_url, rest_api_key, app_username, app_password, name')
        .eq('id', configId)
        .abortSignal(signal)
        .maybeSingle();

      if (signal.aborted) return;

      if (wpConfigError) {
        console.error("Error fetching WordPress config:", wpConfigError);
        throw wpConfigError;
      }
      
      if (!wpConfig) {
        console.error("WordPress configuration not found for ID:", configId);
        throw new Error("Configuration WordPress introuvable");
      }

      console.log("WordPress config found:", {
        name: wpConfig.name,
        site_url: wpConfig.site_url,
        hasRestApiKey: !!wpConfig.rest_api_key,
        hasAppUsername: !!wpConfig.app_username,
        hasAppPassword: !!wpConfig.app_password
      });

      // Normaliser l'URL (supprimer les doubles slashes)
      const siteUrl = wpConfig.site_url.replace(/([^:]\/)\/+/g, "$1");
      
      // Utiliser la taxonomie personnalisée dipi_cpt_category avec per_page=100
      const apiUrl = `${siteUrl}/wp-json/wp/v2/dipi_cpt_category?per_page=100`;
      
      // Préparer les headers d'authentification
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Priorité à l'authentification par Application Password
      if (wpConfig.app_username && wpConfig.app_password) {
        console.log("Using Application Password authentication for", wpConfig.name);
        const basicAuth = btoa(`${wpConfig.app_username}:${wpConfig.app_password}`);
        headers['Authorization'] = `Basic ${basicAuth}`;
      } else if (wpConfig.rest_api_key) {
        console.log("Using REST API Key authentication for", wpConfig.name);
        headers['Authorization'] = `Bearer ${wpConfig.rest_api_key}`;
      } else {
        console.log("No authentication credentials provided for", wpConfig.name);
      }
      
      // Ajouter un délai d'expiration à la requête
      const timeoutId = setTimeout(() => {
        if (!signal.aborted) {
          abortControllerRef.current?.abort();
        }
      }, 30000); // 30 secondes de timeout
      
      try {
        console.log("Fetching DipiPixel categories from:", apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: headers,
          signal: signal
        });

        clearTimeout(timeoutId);

        if (signal.aborted) return;
  
        if (response.status === 404) {
          console.log("DipiPixel category endpoint not found, falling back to standard categories");
          
          // Si l'endpoint DipiPixel n'est pas trouvé, utiliser les catégories standards avec per_page=100
          const standardApiUrl = `${siteUrl}/wp-json/wp/v2/categories?per_page=100`;
          console.log("Fetching standard WordPress categories from:", standardApiUrl);
          
          const standardTimeoutId = setTimeout(() => {
            if (!signal.aborted) {
              abortControllerRef.current?.abort();
            }
          }, 15000);
          
          try {
            const standardResponse = await fetch(standardApiUrl, {
              method: 'GET',
              headers: headers,
              signal: signal
            });
            
            clearTimeout(standardTimeoutId);

            if (signal.aborted) return;
            
            if (!standardResponse.ok) {
              const errorText = await standardResponse.text();
              console.error("WordPress API error:", standardResponse.status, errorText);
              throw new Error(`Échec de récupération des catégories: ${standardResponse.statusText}`);
            }
            
            const standardCategoriesData = await standardResponse.json();
            
            if (!signal.aborted) {
              console.log("Standard WordPress categories fetched successfully:", standardCategoriesData.length, "for", wpConfig.name);
              if (skipFiltering) {
                setCategories(standardCategoriesData);
              } else {
                await filterCategoriesByConfig(configId, standardCategoriesData);
              }
            }
            return;
          } catch (standardError: any) {
            if (standardError.name === 'AbortError' || signal.aborted) return;
            throw standardError;
          }
        }
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("WordPress API error:", response.status, errorText);
          
          if (response.status === 401 || response.status === 403) {
            throw new Error("Identifiants incorrects ou autorisations insuffisantes");
          }
          
          throw new Error(`Échec de récupération des catégories: ${response.statusText}`);
        }
  
        const categoriesData = await response.json();
        
        if (!signal.aborted) {
          console.log("DipiPixel categories fetched successfully:", categoriesData.length, "for", wpConfig.name);
          if (skipFiltering) {
            setCategories(categoriesData);
          } else {
            await filterCategoriesByConfig(configId, categoriesData);
          }
        }
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError' || signal.aborted) return;
        throw fetchError;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (err: any) {
      if (signal.aborted) return;
      
      console.error("Error fetching WordPress categories:", err);
      
      let errorMessage = "Échec de récupération des catégories WordPress";
      
      try {
        // Améliorer les messages d'erreur de manière sûre
        if (err && err.message) {
          if (err.message.includes("Failed to fetch")) {
            errorMessage = "Erreur réseau: impossible d'accéder au site WordPress";
          } else if (err.message.includes("NetworkError")) {
            errorMessage = "Erreur réseau: problème de connectivité";
          } else if (err.message.includes("CORS")) {
            errorMessage = "Erreur CORS: le site n'autorise pas les requêtes depuis cette origine";
          } else {
            errorMessage = String(err.message);
          }
        }
      } catch (msgError) {
        console.error("Error processing error message:", msgError);
      }
      
      setError(errorMessage);
      // Ne pas afficher de toast lors du rechargement pour éviter le spam
      try {
        if (!window.location.pathname.includes('/create')) {
          toast.error("Erreur lors de la récupération des catégories");
        }
      } catch (toastError) {
        console.error("Error showing toast:", toastError);
      }
      setCategories([]);
    } finally {
      if (!signal.aborted) {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
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
        // En cas d'erreur, afficher toutes les catégories
        setCategories(allCategories);
        return;
      }

      if (!allowedCategories || allowedCategories.length === 0) {
        // Si aucune catégorie n'est configurée, afficher toutes les catégories
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
      // En cas d'erreur, afficher toutes les catégories
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
    
    // Annuler toute requête en cours lors du changement des dépendances
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    if (configIdToUse) {
      // Réinitialiser l'état avant de charger
      setError(null);
      
      // Si l'utilisateur existe, essayer de récupérer les catégories
      const timer = setTimeout(() => {
        fetchCategories();
      }, 100);
      
      return () => {
        clearTimeout(timer);
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    } else {
      setCategories([]);
      setError(null);
      setIsLoading(false);
      isLoadingRef.current = false;
      lastConfigIdRef.current = null;
    }
  }, [configIdToUse, fetchCategories]);

  // Nettoyer les requêtes en cours lors du démontage du composant
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { 
    categories, 
    isLoading, 
    error, 
    refetch,
    hasCategories: categories.length > 0
  };
};
