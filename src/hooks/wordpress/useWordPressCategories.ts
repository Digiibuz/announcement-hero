
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DipiCptCategory } from "@/types/announcement";

export const useWordPressCategories = () => {
  const [categories, setCategories] = useState<DipiCptCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchCategories = useCallback(async () => {
    if (!user?.wordpressConfigId) {
      console.warn("No WordPress configuration ID found for user", user);
      setError("Aucune configuration WordPress trouvée pour cet utilisateur");
      setCategories([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log("Fetching categories for WordPress config ID:", user.wordpressConfigId);

      // Vérifier d'abord que l'utilisateur a bien accès à cette configuration
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('wordpress_config_id')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error("Error fetching user profile:", profileError);
        throw new Error("Erreur lors de la vérification du profil utilisateur");
      }

      if (!profile || profile.wordpress_config_id !== user.wordpressConfigId) {
        console.error("Security violation: user trying to access unauthorized WordPress config");
        throw new Error("Accès non autorisé à cette configuration WordPress");
      }

      // Récupérer la configuration WordPress
      const { data: wpConfig, error: wpConfigError } = await supabase
        .from('wordpress_configs')
        .select('site_url, rest_api_key, app_username, app_password, name')
        .eq('id', user.wordpressConfigId)
        .single();

      if (wpConfigError) {
        console.error("Error fetching WordPress config:", wpConfigError);
        throw wpConfigError;
      }
      
      if (!wpConfig) {
        console.error("WordPress configuration not found");
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // Augmenter le timeout à 15 secondes
      
      try {
        console.log("Fetching DipiPixel categories from:", apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: headers,
          signal: controller.signal
        });
  
        clearTimeout(timeoutId);
  
        if (response.status === 404) {
          console.log("DipiPixel category endpoint not found, falling back to standard categories");
          
          // Si l'endpoint DipiPixel n'est pas trouvé, utiliser les catégories standards
          const standardApiUrl = `${siteUrl}/wp-json/wp/v2/categories`;
          console.log("Fetching standard WordPress categories from:", standardApiUrl);
          
          const standardController = new AbortController();
          const standardTimeoutId = setTimeout(() => standardController.abort(), 15000);
          
          try {
            const standardResponse = await fetch(standardApiUrl, {
              method: 'GET',
              headers: headers,
              signal: standardController.signal
            });
            
            clearTimeout(standardTimeoutId);
            
            if (!standardResponse.ok) {
              const errorText = await standardResponse.text();
              console.error("WordPress API error:", standardResponse.status, errorText);
              throw new Error(`Échec de récupération des catégories: ${standardResponse.statusText}`);
            }
            
            const standardCategoriesData = await standardResponse.json();
            console.log("Standard WordPress categories fetched successfully:", standardCategoriesData.length, "for", wpConfig.name);
            setCategories(standardCategoriesData);
            return;
          } catch (standardError: any) {
            if (standardError.name === 'AbortError') {
              throw new Error("Le délai d'attente a expiré lors de la récupération des catégories standards");
            }
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
        console.log("DipiPixel categories fetched successfully:", categoriesData.length, "for", wpConfig.name);
        setCategories(categoriesData);
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          throw new Error("Le délai d'attente a expiré lors de la récupération des catégories");
        }
        throw fetchError;
      }
    } catch (err: any) {
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
      if (!window.location.pathname.includes('/create-announcement')) {
        toast.error("Erreur lors de la récupération des catégories");
      }
      setCategories([]);
    } finally {
      setIsLoading(false);
    }
  }, [user?.wordpressConfigId, user?.id]);

  const refetch = useCallback(() => {
    if (user?.wordpressConfigId && user?.id) {
      fetchCategories();
    }
  }, [fetchCategories, user?.wordpressConfigId, user?.id]);

  useEffect(() => {
    console.log("useWordPressCategories effect running, user:", user?.id, "wordpressConfigId:", user?.wordpressConfigId);
    if (user?.wordpressConfigId && user?.id) {
      // Ajouter un petit délai pour éviter les appels simultanés lors du rechargement
      const timer = setTimeout(() => {
        fetchCategories();
      }, 100);
      
      return () => clearTimeout(timer);
    } else {
      setCategories([]);
      setError(null);
    }
  }, [user?.wordpressConfigId, user?.id, fetchCategories]);

  return { 
    categories, 
    isLoading, 
    error, 
    refetch,
    hasCategories: categories.length > 0
  };
};
