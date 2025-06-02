
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
      userRole: user.role
    });

    // Éviter les appels avec des IDs de configuration différents en succession rapide
    if (lastConfigIdRef.current && lastConfigIdRef.current !== user.wordpressConfigId) {
      console.log("WordPress config ID changed, waiting for stabilization...");
      await new Promise(resolve => setTimeout(resolve, 200));
      if (lastConfigIdRef.current && lastConfigIdRef.current !== user.wordpressConfigId) {
        console.log("Configuration still changing, skipping fetch");
        return;
      }
    }

    lastConfigIdRef.current = user.wordpressConfigId;

    if (isLoadingRef.current) {
      console.log("Fetch already in progress, skipping...");
      return;
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

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
        .select('wordpress_config_id, role')
        .eq('id', user.id)
        .abortSignal(signal)
        .maybeSingle(); // Utiliser maybeSingle au lieu de single

      if (signal.aborted) return;

      if (profileError) {
        console.error("Error fetching user profile:", profileError);
        throw new Error("Erreur lors de la vérification du profil utilisateur");
      }

      if (!profile) {
        console.error("User profile not found");
        throw new Error("Profil utilisateur non trouvé");
      }

      console.log('🔍 DEBUG: Fresh profile data from DB:', {
        profileWordpressConfigId: profile?.wordpress_config_id,
        userWordpressConfigId: user.wordpressConfigId,
        userRole: profile?.role,
        match: profile?.wordpress_config_id === user.wordpressConfigId
      });

      if (!profile.wordpress_config_id) {
        console.error("No WordPress configuration assigned to user");
        throw new Error("Aucune configuration WordPress assignée à cet utilisateur. Veuillez contacter votre administrateur.");
      }

      if (profile.wordpress_config_id !== user.wordpressConfigId) {
        console.error("Security violation: user trying to access unauthorized WordPress config");
        throw new Error("Accès non autorisé à cette configuration WordPress");
      }

      // Récupérer la configuration WordPress
      const { data: wpConfig, error: wpConfigError } = await supabase
        .from('wordpress_configs')
        .select('site_url, rest_api_key, app_username, app_password, name')
        .eq('id', user.wordpressConfigId)
        .abortSignal(signal)
        .maybeSingle(); // Utiliser maybeSingle au lieu de single

      if (signal.aborted) return;

      if (wpConfigError) {
        console.error("Error fetching WordPress config:", wpConfigError);
        throw new Error("Erreur lors de la récupération de la configuration WordPress");
      }
      
      if (!wpConfig) {
        console.error("WordPress configuration not found for ID:", user.wordpressConfigId);
        throw new Error("Configuration WordPress non trouvée. Veuillez contacter votre administrateur.");
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
            throw new Error("Identifiants incorrects ou autorisations insuffisantes pour accéder au site WordPress");
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
      
      // Améliorer les messages d'erreur pour les commerciaux
      if (err.message.includes("Aucune configuration WordPress assignée")) {
        errorMessage = "Votre compte commercial n'a pas de site WordPress assigné. Veuillez contacter votre administrateur pour qu'il vous assigne une configuration WordPress.";
      } else if (err.message.includes("Configuration WordPress non trouvée")) {
        errorMessage = "La configuration WordPress assignée n'existe plus. Veuillez contacter votre administrateur.";
      } else if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
        errorMessage = "Erreur réseau: impossible d'accéder au site WordPress. Veuillez vérifier la configuration du site.";
      } else if (err.message.includes("CORS")) {
        errorMessage = "Erreur CORS: le site n'autorise pas les requêtes depuis cette origine";
      } else if (err.message.includes("Identifiants incorrects")) {
        errorMessage = "Les identifiants WordPress sont incorrects. Veuillez contacter votre administrateur.";
      }
      
      setError(errorMessage);
      // Ne pas afficher de toast lors du rechargement pour éviter le spam
      if (!window.location.pathname.includes('/create')) {
        toast.error(errorMessage);
      }
      setCategories([]);
    } finally {
      if (!signal.aborted) {
        setIsLoading(false);
        isLoadingRef.current = false;
      }
    }
  }, [user?.wordpressConfigId, user?.id, user?.role]);

  const refetch = useCallback(() => {
    if (user?.wordpressConfigId && user?.id) {
      fetchCategories();
    }
  }, [fetchCategories, user?.wordpressConfigId, user?.id]);

  useEffect(() => {
    console.log("useWordPressCategories effect running, user:", user?.id, "wordpressConfigId:", user?.wordpressConfigId, "role:", user?.role);
    
    // Annuler toute requête en cours lors du changement des dépendances
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    
    if (user?.wordpressConfigId && user?.id) {
      // Ajouter un délai pour éviter les appels simultanés lors du rechargement
      const timer = setTimeout(() => {
        fetchCategories();
      }, 300); // Augmenté à 300ms pour plus de stabilité
      
      return () => {
        clearTimeout(timer);
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      };
    } else {
      setCategories([]);
      setError("Aucune configuration WordPress assignée");
      setIsLoading(false);
      isLoadingRef.current = false;
      lastConfigIdRef.current = null;
    }
  }, [user?.wordpressConfigId, user?.id, user?.role, fetchCategories]);

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
