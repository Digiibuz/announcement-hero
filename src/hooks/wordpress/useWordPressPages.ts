
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WordPressPage {
  id: number;
  date: string;
  modified: string;
  slug: string;
  status: string;
  type: string;
  link: string;
  title: {
    rendered: string;
  };
  content: {
    rendered: string;
    protected: boolean;
  };
  author: number;
  featured_media: number;
  parent: number;
  menu_order: number;
  comment_status: string;
  ping_status: string;
  template: string;
}

export const useWordPressPages = () => {
  const [pages, setPages] = useState<WordPressPage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchPages = async () => {
    if (!user?.wordpressConfigId) {
      console.error("No WordPress configuration ID found for user", user);
      setError("No WordPress configuration found for this user");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log("Fetching pages for WordPress config ID:", user.wordpressConfigId);

      // First get the WordPress config for the user
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

      // Ensure the site URL is properly formatted
      let siteUrl = wpConfig.site_url;
      if (!siteUrl.startsWith("http")) {
        siteUrl = "https://" + siteUrl;
      }
      if (siteUrl.endsWith("/")) {
        siteUrl = siteUrl.slice(0, -1);
      }

      // Construct the WordPress API URL
      const apiUrl = `${siteUrl}/wp-json/wp/v2/pages`;
      
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
      
      console.log("Fetching pages from:", apiUrl);
      
      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: headers,
          signal: AbortSignal.timeout(15000) // Add a reasonable timeout
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("WordPress API error:", response.status, errorText);
          
          if (response.status === 401 || response.status === 403) {
            throw new Error("Identifiants incorrects ou autorisations insuffisantes");
          } else if (response.status === 404) {
            throw new Error("API REST WordPress introuvable. Vérifiez que le plugin REST API est activé.");
          }
          
          throw new Error(`Failed to fetch pages: ${response.statusText}`);
        }

        const pagesData = await response.json();
        console.log("Pages fetched successfully:", pagesData.length);
        setPages(pagesData);
      } catch (fetchError: any) {
        console.error("Fetch error:", fetchError);
        
        // Check for timeout
        if (fetchError.name === 'TimeoutError' || fetchError.name === 'AbortError') {
          throw new Error("Délai d'attente dépassé lors de la récupération des pages");
        }
        
        // Network errors
        if (fetchError.name === 'TypeError' && fetchError.message === 'Failed to fetch') {
          throw new Error("Erreur réseau: impossible d'accéder au site WordPress. Vérifiez l'URL et les paramètres CORS.");
        }
        
        throw fetchError;
      }
    } catch (err: any) {
      console.error("Error fetching WordPress pages:", err);
      setError(err.message || "Failed to fetch WordPress pages");
      toast.error("Erreur lors de la récupération des pages WordPress");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("useWordPressPages effect running, user:", user?.id, "wordpressConfigId:", user?.wordpressConfigId);
    if (user?.wordpressConfigId) {
      fetchPages();
    }
  }, [user?.wordpressConfigId]);

  return { 
    pages, 
    isLoading, 
    error, 
    refetch: fetchPages,
    hasPages: pages.length > 0
  };
};
