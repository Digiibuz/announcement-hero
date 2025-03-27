
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WordPressCategory } from "@/types/announcement";
import { useWordPressConfigsList } from "./useWordPressConfigsList";

export const useWordPressCategories = () => {
  const [categories, setCategories] = useState<WordPressCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { getUserConfigs } = useWordPressConfigsList();

  const fetchCategories = async () => {
    if (!user) {
      setError("Utilisateur non connecté");
      return;
    }

    // Récupérer les configurations WordPress de l'utilisateur
    const userConfigs = getUserConfigs();
    console.log("User WordPress configs in categories hook:", userConfigs);
    
    if (userConfigs.length === 0) {
      console.error("Aucune configuration WordPress trouvée pour l'utilisateur", user);
      setError("Aucune configuration WordPress trouvée pour cet utilisateur");
      return;
    }

    // Utiliser la première configuration disponible (on pourrait ensuite ajouter un sélecteur)
    const configToUse = userConfigs[0];
    console.log("Using WordPress config:", configToUse.name, configToUse.id);

    try {
      setIsLoading(true);
      setError(null);

      // Normaliser l'URL (supprimer les doubles slashes)
      const siteUrl = configToUse.site_url.replace(/([^:]\/)\/+/g, "$1");

      // Construct the WordPress API URL
      const apiUrl = `${siteUrl}/wp-json/wp/v2/categories`;
      
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Prioritize Application Password authentication
      if (configToUse.app_username && configToUse.app_password) {
        console.log("Using Application Password authentication");
        const basicAuth = btoa(`${configToUse.app_username}:${configToUse.app_password}`);
        headers['Authorization'] = `Basic ${basicAuth}`;
      } else if (configToUse.rest_api_key) {
        console.log("Using REST API Key authentication");
        headers['Authorization'] = `Bearer ${configToUse.rest_api_key}`;
      } else {
        console.log("No authentication credentials provided");
      }
      
      console.log("Fetching categories from:", apiUrl);
      
      // Ajouter un délai d'expiration à la requête
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes de timeout
      
      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: headers,
          signal: controller.signal
        });
  
        clearTimeout(timeoutId);
  
        if (!response.ok) {
          const errorText = await response.text();
          console.error("WordPress API error:", response.status, errorText);
          
          if (response.status === 401 || response.status === 403) {
            throw new Error("Identifiants incorrects ou autorisations insuffisantes");
          }
          
          throw new Error(`Failed to fetch categories: ${response.statusText}`);
        }
  
        const categoriesData = await response.json();
        console.log("Categories fetched successfully:", categoriesData.length);
        setCategories(categoriesData);
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
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
      toast.error("Erreur lors de la récupération des catégories WordPress");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("useWordPressCategories effect running, user:", user?.id);
    if (user) {
      fetchCategories();
    }
  }, [user]);

  return { 
    categories, 
    isLoading, 
    error, 
    refetch: fetchCategories,
    hasCategories: categories.length > 0
  };
};
