
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DipiCptCategory } from "@/types/announcement";

export const useWordPressCategories = (specificConfigId?: string) => {
  const [categories, setCategories] = useState<DipiCptCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user, refreshUser } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);
  const isLoadingRef = useRef(false);
  const lastConfigIdRef = useRef<string | null>(null);
  const hasRefreshedRef = useRef(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 2;

  // Détermine quel config ID utiliser : spécifique ou celui de l'utilisateur
  const configIdToUse = specificConfigId || user?.wordpressConfigId;

  const fetchCategories = useCallback(async () => {
    // Si nous avons un configId spécifique, l'utiliser directement
    if (specificConfigId) {
      return await fetchCategoriesForConfig(specificConfigId);
    }

    // Sinon, utiliser la logique existante pour l'utilisateur connecté
    // Si l'utilisateur n'a pas d'ID ou n'est pas connecté, ne rien faire
    if (!user?.id) {
      console.warn("No user ID found, cannot fetch categories");
      setError("Utilisateur non connecté");
      setCategories([]);
      return;
    }
    
    // Si l'utilisateur n'a pas de configuration WordPress et est commercial/client,
    // essayer de rafraîchir le profil une fois
    if (!user?.wordpressConfigId && (user?.role === 'client' || user?.role === 'commercial') && !hasRefreshedRef.current) {
      console.log("Commercial/Client without WordPress config, refreshing profile...");
      hasRefreshedRef.current = true;
      try {
        await refreshUser();
        
        // Si après rafraîchissement, il n'y a toujours pas de configuration WordPress
        if (!user.wordpressConfigId && retryCount < maxRetries) {
          console.log(`Still no WordPress config after refresh. Retry ${retryCount + 1}/${maxRetries}`);
          setRetryCount(prev => prev + 1);
          setTimeout(() => fetchCategories(), 1000); // Réessayer après 1 seconde
          return;
        } else if (retryCount >= maxRetries) {
          console.warn("Max retries reached, giving up on fetching WordPress config");
          setError("Configuration WordPress non trouvée après plusieurs tentatives");
          return;
        }
        return; // Le useEffect se déclenchera à nouveau après le refresh
      } catch (refreshError) {
        console.error("Error refreshing user profile:", refreshError);
        setError("Erreur lors de la récupération du profil utilisateur");
        return;
      }
    }

    if (!user?.wordpressConfigId) {
      console.warn("No WordPress configuration ID found for user:", user?.id);
      setError("Aucune configuration WordPress trouvée pour cet utilisateur");
      setCategories([]);
      return;
    }

    return await fetchCategoriesForConfig(user.wordpressConfigId);
  }, [user?.wordpressConfigId, user?.id, user?.role, refreshUser, retryCount, specificConfigId]);

  // Nouvelle fonction pour récupérer les catégories pour un config ID spécifique
  const fetchCategoriesForConfig = useCallback(async (configId: string) => {
    console.log('🔍 DEBUG: fetchCategoriesForConfig called with:', {
      configId,
      lastConfigId: lastConfigIdRef.current
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
        console.log('🔍 DEBUG: WordPress config error details:', {
          error: wpConfigError,
          configId: configId
        });
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
      }, 15000); // 15 secondes de timeout
      
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
              await filterCategoriesByConfig(configId, standardCategoriesData);
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
          await filterCategoriesByConfig(configId, categoriesData);
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
      
      let errorMessage = err.message || "Échec de récupération des catégories WordPress";
      
      // Améliorer les messages d'erreur
      if (err.message.includes("Failed to fetch")) {
        errorMessage = "Erreur réseau: impossible d'accéder au site WordPress";
      } else if (err.message.includes("NetworkError")) {
        errorMessage = "Erreur réseau: problème de connectivité";
      } else if (err.message.includes("CORS")) {
        errorMessage = "Erreur CORS: le site n'autorise pas les requêtes depuis cette origine";
      }
      
      setError(errorMessage);
      // Ne pas afficher de toast lors du rechargement pour éviter le spam
      if (!window.location.pathname.includes('/create')) {
        toast.error("Erreur lors de la récupération des catégories");
      }
      setCategories([]);
    } finally {
      if (!signal.aborted) {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    }
  }, []);

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
    setRetryCount(0);
    hasRefreshedRef.current = false;
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
      // Si l'utilisateur existe, essayer de récupérer les catégories
      // Ajouter un délai pour éviter les appels simultanés lors du rechargement
      const timer = setTimeout(() => {
        fetchCategories();
      }, 200); // Augmenté à 200ms pour plus de stabilité
      
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
