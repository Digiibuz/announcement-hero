import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DipiCptCategory } from "@/types/announcement";

export const useWordPressCategories = () => {
  const [categories, setCategories] = useState<DipiCptCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);
  const isLoadingRef = useRef(false);
  const lastConfigIdRef = useRef<string | null>(null);

  const fetchCategories = useCallback(async () => {
    if (!user?.wordpressConfigId || !user?.id) {
      console.warn("No WordPress configuration ID or user ID found");
      setError("Aucune configuration WordPress trouvée pour cet utilisateur");
      setCategories([]);
      return;
    }

    console.log('🔍 DEBUG: fetchCategories called with:', {
      userId: user.id,
      wordpressConfigId: user.wordpressConfigId,
      lastConfigId: lastConfigIdRef.current,
      userObjectKeys: Object.keys(user),
      userProfile: user.profile
    });

    // Éviter les appels avec des IDs de configuration différents en succession rapide
    if (lastConfigIdRef.current && lastConfigIdRef.current !== user.wordpressConfigId) {
      console.log("WordPress config ID changed, waiting for stabilization...");
      console.log('🔍 DEBUG: Config change detected:', {
        from: lastConfigIdRef.current,
        to: user.wordpressConfigId
      });
      // Attendre un peu pour que l'ID se stabilise
      await new Promise(resolve => setTimeout(resolve, 200));
      // Vérifier si l'ID a encore changé
      if (lastConfigIdRef.current && lastConfigIdRef.current !== user.wordpressConfigId) {
        console.log("Configuration still changing, skipping fetch");
        return;
      }
    }

    lastConfigIdRef.current = user.wordpressConfigId;

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
      console.log("Fetching categories for WordPress config ID:", user.wordpressConfigId);

      // Vérifier d'abord que l'utilisateur a bien accès à cette configuration
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('wordpress_config_id')
        .eq('id', user.id)
        .abortSignal(signal)
        .single();

      if (signal.aborted) return;

      if (profileError) {
        console.error("Error fetching user profile:", profileError);
        throw new Error("Erreur lors de la vérification du profil utilisateur");
      }

      console.log('🔍 DEBUG: Fresh profile data from DB:', {
        profileWordpressConfigId: profile?.wordpress_config_id,
        userWordpressConfigId: user.wordpressConfigId,
        match: profile?.wordpress_config_id === user.wordpressConfigId
      });

      if (!profile || profile.wordpress_config_id !== user.wordpressConfigId) {
        console.error("Security violation: user trying to access unauthorized WordPress config");
        console.log('🔍 DEBUG: Security check failed:', {
          profileConfigId: profile?.wordpress_config_id,
          userConfigId: user.wordpressConfigId,
          profileExists: !!profile
        });
        throw new Error("Accès non autorisé à cette configuration WordPress");
      }

      // Récupérer la configuration WordPress
      const { data: wpConfig, error: wpConfigError } = await supabase
        .from('wordpress_configs')
        .select('site_url, rest_api_key, app_username, app_password, name')
        .eq('id', user.wordpressConfigId)
        .abortSignal(signal)
        .single();

      if (signal.aborted) return;

      if (wpConfigError) {
        console.error("Error fetching WordPress config:", wpConfigError);
        console.log('🔍 DEBUG: WordPress config error details:', {
          error: wpConfigError,
          configId: user.wordpressConfigId
        });
        throw wpConfigError;
      }
      
      if (!wpConfig) {
        console.error("WordPress configuration not found");
        console.log('🔍 DEBUG: No WordPress config found for ID:', user.wordpressConfigId);
        throw new Error("Configuration WordPress non trouvée");
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
      
      // Utiliser la taxonomie personnalisée dipi_cpt_category
      const apiUrl = `${siteUrl}/wp-json/wp/v2/dipi_cpt_category`;
      
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
          
          // Si l'endpoint DipiPixel n'est pas trouvé, utiliser les catégories standards
          const standardApiUrl = `${siteUrl}/wp-json/wp/v2/categories`;
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
              setCategories(standardCategoriesData);
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
          setCategories(categoriesData);
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
  }, [user?.wordpressConfigId, user?.id]);

  const refetch = useCallback(() => {
    if (user?.wordpressConfigId && user?.id) {
      fetchCategories();
    }
  }, [fetchCategories, user?.wordpressConfigId, user?.id]);

  useEffect(() => {
    console.log("useWordPressCategories effect running, user:", user?.id, "wordpressConfigId:", user?.wordpressConfigId);
    console.log('🔍 DEBUG: useWordPressCategories effect - full user object:', {
      user: user ? {
        id: user.id,
        email: user.email,
        wordpressConfigId: user.wordpressConfigId,
        role: user.role,
        profile: user.profile
      } : null
    });
    
    // Vérifier le localStorage pour des traces de cette valeur fantôme
    console.log('🔍 DEBUG: Checking localStorage for phantom values...');
    Object.keys(localStorage).forEach(key => {
      const value = localStorage.getItem(key);
      if (value && value.includes('c1467516-7b3c-4955-96a0-90db1084b047')) {
        console.log('🚨 FOUND PHANTOM VALUE IN LOCALSTORAGE:', {
          key,
          value: value.substring(0, 200) + '...' // Limiter la taille du log
        });
      }
    });
    
    // Annuler toute requête en cours lors du changement des dépendances
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    if (user?.wordpressConfigId && user?.id) {
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
  }, [user?.wordpressConfigId, user?.id, fetchCategories]);

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
