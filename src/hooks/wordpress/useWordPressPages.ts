
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useWordPressPages = (configIdProp?: string | null) => {
  const [pages, setPages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchPages = useCallback(async (configId?: string | null) => {
    // Utiliser la configId passée en paramètre ou celle de la prop
    const effectiveConfigId = configId || configIdProp || user?.wordpressConfigId;
    
    if (!effectiveConfigId) {
      console.error("No WordPress configuration ID found for pages", user);
      setError("No WordPress configuration found for pages");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log("Fetching pages for WordPress config ID:", effectiveConfigId);

      // First get the WordPress config
      const { data: wpConfig, error: wpConfigError } = await supabase
        .from('wordpress_configs')
        .select('site_url, rest_api_key, app_username, app_password')
        .eq('id', effectiveConfigId)
        .single();

      if (wpConfigError) {
        console.error("Error fetching WordPress config for pages:", wpConfigError);
        throw wpConfigError;
      }
      
      if (!wpConfig) {
        console.error("WordPress configuration not found for pages");
        throw new Error("WordPress configuration not found for pages");
      }

      // Normalize the URL (remove double slashes)
      const siteUrl = wpConfig.site_url.replace(/([^:]\/)\/+/g, "$1");
      
      // First try the pages endpoint
      let apiUrl = `${siteUrl}/wp-json/wp/v2/pages`;
      
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Prioritize Application Password authentication
      if (wpConfig.app_username && wpConfig.app_password) {
        console.log("Using Application Password authentication for pages");
        const basicAuth = btoa(`${wpConfig.app_username}:${wpConfig.app_password}`);
        headers['Authorization'] = `Basic ${basicAuth}`;
      } else if (wpConfig.rest_api_key) {
        console.log("Using REST API Key authentication for pages");
        headers['Authorization'] = `Bearer ${wpConfig.rest_api_key}`;
      } else {
        console.log("No authentication credentials provided for pages");
      }
      
      // Add timeout to the request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
      
      try {
        console.log("Fetching WordPress pages from:", apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: headers,
          signal: controller.signal
        });
  
        clearTimeout(timeoutId);
  
        if (!response.ok) {
          const errorText = await response.text();
          console.error("WordPress API error for pages:", response.status, errorText);
          
          if (response.status === 401 || response.status === 403) {
            throw new Error("Identifiants incorrects ou autorisations insuffisantes");
          }
          
          throw new Error(`Failed to fetch pages: ${response.statusText}`);
        }
  
        const pagesData = await response.json();
        console.log("WordPress pages fetched successfully:", pagesData.length);
        setPages(pagesData);
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          throw new Error("Le délai d'attente a expiré lors de la récupération des pages");
        }
        throw fetchError;
      }
    } catch (err: any) {
      console.error("Error fetching WordPress pages:", err);
      
      let errorMessage = err.message || "Failed to fetch WordPress pages";
      
      // Improve error messages
      if (err.message.includes("Failed to fetch")) {
        errorMessage = "Erreur réseau: impossible d'accéder au site WordPress";
      } else if (err.message.includes("NetworkError")) {
        errorMessage = "Erreur réseau: problème de connectivité";
      } else if (err.message.includes("CORS")) {
        errorMessage = "Erreur CORS: le site n'autorise pas les requêtes depuis cette origine";
      }
      
      setError(errorMessage);
      toast.error("Erreur lors de la récupération des pages");
    } finally {
      setIsLoading(false);
    }
  }, [configIdProp, user?.wordpressConfigId]);

  useEffect(() => {
    const effectiveConfigId = configIdProp || user?.wordpressConfigId;
    console.log("useWordPressPages effect running, user:", user?.id, "configId:", effectiveConfigId);
    if (effectiveConfigId) {
      fetchPages(effectiveConfigId);
    }
  }, [configIdProp, user?.wordpressConfigId, fetchPages]);

  return { 
    pages, 
    isLoading, 
    error, 
    refetch: fetchPages,
    hasPages: pages.length > 0
  };
};
