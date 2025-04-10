
import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { DipiCptCategory } from "@/types/announcement";

const CACHE_KEY = 'wordpress_categories_cache';
const CACHE_TTL = 1000 * 60 * 30; // 30 minutes

// Type pour le cache des catégories
interface CategoryCache {
  timestamp: number;
  wordpressConfigId: string;
  data: DipiCptCategory[];
}

export const useWordPressCategories = () => {
  const [categories, setCategories] = useState<DipiCptCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoadingFromCache, setIsLoadingFromCache] = useState(false);
  const { user } = useAuth();
  const abortControllerRef = useRef<AbortController | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);
  const retryCountRef = useRef(0);
  const maxRetries = 3;

  // Fonction pour charger les catégories depuis le cache local
  const loadCachedCategories = useCallback(() => {
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        const cache: CategoryCache = JSON.parse(cachedData);
        const now = Date.now();
        const configId = user?.wordpressConfigId;
        
        // Vérifier si le cache est encore valide (TTL) et correspond à la configuration actuelle
        if (now - cache.timestamp < CACHE_TTL && configId === cache.wordpressConfigId) {
          console.log("Catégories chargées depuis le cache local, âge:", (now - cache.timestamp) / 1000, "secondes");
          setCategories(cache.data);
          return true;
        } else {
          console.log("Cache expiré ou configuration différente");
          localStorage.removeItem(CACHE_KEY);
        }
      }
      return false;
    } catch (err) {
      console.error("Erreur lors du chargement du cache des catégories:", err);
      return false;
    }
  }, [user?.wordpressConfigId]);

  // Fonction pour sauvegarder les catégories dans le cache local
  const saveCategoriesInCache = useCallback((data: DipiCptCategory[]) => {
    try {
      const configId = user?.wordpressConfigId;
      if (!configId) return;
      
      const cacheData: CategoryCache = {
        timestamp: Date.now(),
        wordpressConfigId: configId,
        data
      };
      
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      console.log("Catégories sauvegardées dans le cache local");
    } catch (err) {
      console.error("Erreur lors de la sauvegarde du cache des catégories:", err);
    }
  }, [user?.wordpressConfigId]);

  // Fonction principale pour récupérer les catégories
  const fetchCategories = useCallback(async (forceRefresh = false) => {
    // Annuler toute requête en cours
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Annuler tout retry programmé
    if (retryTimeoutRef.current) {
      window.clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // Vérifier si l'utilisateur a une configuration WordPress
    if (!user?.wordpressConfigId) {
      console.error("No WordPress configuration ID found for user", user);
      setError("No WordPress configuration found for this user");
      return false;
    }

    // Si nous ne forçons pas le rafraîchissement, essayer d'abord le cache
    if (!forceRefresh) {
      setIsLoadingFromCache(true);
      const loadedFromCache = loadCachedCategories();
      setIsLoadingFromCache(false);
      
      // Si nous avons réussi à charger depuis le cache, retourner true
      if (loadedFromCache) return true;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log("Fetching categories for WordPress config ID:", user.wordpressConfigId);

      // Créer un nouvel AbortController pour cette requête
      abortControllerRef.current = new AbortController();

      // Récupérer la configuration WordPress de l'utilisateur
      const { data: wpConfig, error: wpConfigError } = await supabase
        .from('wordpress_configs')
        .select('site_url, rest_api_key, app_username, app_password')
        .eq('id', user.wordpressConfigId)
        .single();

      if (wpConfigError) {
        console.error("Error fetching WordPress config:", wpConfigError);
        throw wpConfigError;
      }
      
      if (!wpConfig) {
        console.error("WordPress configuration not found");
        throw new Error("WordPress configuration not found");
      }

      console.log("WordPress config found:", {
        site_url: wpConfig.site_url,
        hasRestApiKey: !!wpConfig.rest_api_key,
        hasAppUsername: !!wpConfig.app_username,
        hasAppPassword: !!wpConfig.app_password
      });

      // Normaliser l'URL (supprimer les doubles slashes)
      const siteUrl = wpConfig.site_url.replace(/([^:]\/)\/+/g, "$1");

      // Utiliser la taxonomie personnalisée dipi_cpt_category au lieu des catégories standards
      const apiUrl = `${siteUrl}/wp-json/wp/v2/dipi_cpt_category`;
      console.log("Fetching DipiPixel categories from:", apiUrl);
      
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Prioritize Application Password authentication
      if (wpConfig.app_username && wpConfig.app_password) {
        console.log("Using Application Password authentication");
        const basicAuth = btoa(`${wpConfig.app_username}:${wpConfig.app_password}`);
        headers['Authorization'] = `Basic ${basicAuth}`;
      } else if (wpConfig.rest_api_key) {
        console.log("Using REST API Key authentication");
        headers['Authorization'] = `Bearer ${wpConfig.rest_api_key}`;
      } else {
        console.log("No authentication credentials provided");
      }
      
      // Utiliser l'AbortController pour pouvoir annuler la requête
      const signal = abortControllerRef.current.signal;
      
      // Ajouter un délai d'expiration à la requête
      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }, 15000); // 15 secondes de timeout (augmenté pour les réseaux lents)
      
      try {
        // Logique de vérification de l'état du réseau (si disponible)
        const isSlowNetwork = typeof window.isOnSlowNetwork === 'function' && window.isOnSlowNetwork();
        
        // Sur réseau lent, d'abord vérifier s'il existe une version mise en cache
        if (isSlowNetwork) {
          loadCachedCategories();
        }
        
        // Faire la requête fetch avec une gestion plus robuste
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: headers,
          signal: signal,
          // Essayer de réutiliser le cache sur réseau lent
          cache: isSlowNetwork ? 'force-cache' : 'default',
        });
  
        clearTimeout(timeoutId);
  
        // Gérer spécifiquement le cas où l'endpoint DipiPixel n'existe pas
        if (response.status === 404) {
          console.log("DipiPixel category endpoint not found, falling back to standard categories");
          
          // Si l'endpoint DipiPixel n'existe pas, utiliser les catégories standard
          const standardApiUrl = `${siteUrl}/wp-json/wp/v2/categories`;
          console.log("Fetching standard WordPress categories from:", standardApiUrl);
          
          const standardResponse = await fetch(standardApiUrl, {
            method: 'GET',
            headers: headers,
            signal: signal,
            cache: isSlowNetwork ? 'force-cache' : 'default',
          });
          
          if (!standardResponse.ok) {
            const errorText = await standardResponse.text();
            console.error("WordPress API error:", standardResponse.status, errorText);
            throw new Error(`Failed to fetch categories: ${standardResponse.statusText}`);
          }
          
          const standardCategoriesData = await standardResponse.json();
          console.log("Standard WordPress categories fetched successfully:", standardCategoriesData.length);
          setCategories(standardCategoriesData);
          saveCategoriesInCache(standardCategoriesData);
          return true;
        }
        
        // Gérer les autres codes d'erreur de la réponse
        if (!response.ok) {
          const errorText = await response.text();
          console.error("WordPress API error:", response.status, errorText);
          
          if (response.status === 401 || response.status === 403) {
            throw new Error("Identifiants incorrects ou autorisations insuffisantes");
          }
          
          throw new Error(`Failed to fetch categories: ${response.statusText}`);
        }
  
        const categoriesData = await response.json();
        console.log("DipiPixel categories fetched successfully:", categoriesData.length);
        setCategories(categoriesData);
        saveCategoriesInCache(categoriesData);
        return true;
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        // Si l'erreur est due à une annulation de la requête, ne pas la traiter comme une vraie erreur
        if (fetchError.name === 'AbortError') {
          console.log("Request aborted:", fetchError.message);
          // Si nous avons déjà des catégories (du cache), considérer l'opération comme réussie
          if (categories.length > 0) {
            return true;
          }
          throw new Error("Le délai d'attente a expiré lors de la récupération des catégories");
        }
        throw fetchError;
      }
    } catch (err: any) {
      console.error("Error fetching WordPress categories:", err);
      
      let errorMessage = err.message || "Failed to fetch WordPress categories";
      
      // Améliorer les messages d'erreur
      if (err.message.includes("Failed to fetch")) {
        errorMessage = "Erreur réseau: impossible d'accéder au site WordPress";
      } else if (err.message.includes("NetworkError")) {
        errorMessage = "Erreur réseau: problème de connectivité";
      } else if (err.message.includes("CORS")) {
        errorMessage = "Erreur CORS: le site n'autorise pas les requêtes depuis cette origine";
      }
      
      setError(errorMessage);
      
      // Implémenter une logique de retry avec backoff exponentiel si nous n'avons pas atteint le nombre max de retries
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        const delay = Math.min(1000 * Math.pow(2, retryCountRef.current), 10000); // Max 10s de délai
        console.log(`Retrying in ${delay/1000}s (retry ${retryCountRef.current}/${maxRetries})...`);
        
        retryTimeoutRef.current = window.setTimeout(() => {
          console.log(`Executing retry ${retryCountRef.current}...`);
          fetchCategories(false);
        }, delay);
      } else {
        toast.error("Erreur lors de la récupération des catégories DipiPixel");
        retryCountRef.current = 0; // Réinitialiser pour la prochaine tentative manuelle
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user?.wordpressConfigId, loadCachedCategories, saveCategoriesInCache, categories.length]);

  // Nettoyage des ressources lors du démontage du composant
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (retryTimeoutRef.current) {
        window.clearTimeout(retryTimeoutRef.current);
      }
    };
  }, []);

  // Charger les catégories au montage du composant
  useEffect(() => {
    console.log("useWordPressCategories effect running, user:", user?.id, "wordpressConfigId:", user?.wordpressConfigId);
    if (user?.wordpressConfigId) {
      fetchCategories(false);
    }
  }, [user?.wordpressConfigId, fetchCategories]);

  // Fonction publique pour forcer le rafraîchissement des catégories
  const refetch = useCallback(() => {
    retryCountRef.current = 0; // Réinitialiser le compteur de retries lors d'un refetch manuel
    return fetchCategories(true);
  }, [fetchCategories]);

  return { 
    categories, 
    isLoading, 
    error, 
    refetch,
    hasCategories: categories.length > 0,
    isLoadingFromCache
  };
};

// Removed the duplicate global declaration as we now use the shared type in network.d.ts
