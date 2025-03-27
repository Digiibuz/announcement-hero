
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WordPressPage } from "@/types/wordpress";

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

      // Normalize URL (remove double slashes)
      const siteUrl = wpConfig.site_url.replace(/([^:]\/)\/+/g, "$1");

      // Construct the WordPress API URL with params to get all pages (per_page=100)
      const apiUrl = `${siteUrl}/wp-json/wp/v2/pages?per_page=100`;
      
      // Prepare headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // IMPORTANT: Always use WordPress authentication regardless of app role
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
      
      // Add request timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 seconds timeout
      
      try {
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: headers,
          signal: controller.signal,
          credentials: 'omit' // Don't send cookies to avoid CORS issues
        });
  
        clearTimeout(timeoutId);
  
        if (!response.ok) {
          const errorText = await response.text();
          console.error("WordPress API error:", response.status, errorText);
          
          if (response.status === 401 || response.status === 403) {
            throw new Error(`WordPress authentication failed. Please check that your WordPress account has sufficient permissions (Editor or Administrator role).`);
          }
          
          throw new Error(`Failed to fetch pages: ${response.statusText}`);
        }
  
        const pagesData = await response.json();
        console.log("Pages fetched successfully:", pagesData.length);
        setPages(pagesData);
      } catch (fetchError: any) {
        if (fetchError.name === 'AbortError') {
          throw new Error("Request timed out when fetching pages. The WordPress site may be slow or unreachable.");
        }
        throw fetchError;
      }
    } catch (err: any) {
      console.error("Error fetching WordPress pages:", err);
      
      let errorMessage = err.message || "Failed to fetch WordPress pages";
      
      // Improve error messages
      if (err.message.includes("Failed to fetch")) {
        errorMessage = "Network error: unable to connect to WordPress site";
      } else if (err.message.includes("NetworkError")) {
        errorMessage = "Network error: connectivity problem";
      } else if (err.message.includes("CORS")) {
        errorMessage = "CORS error: the site does not allow requests from this origin";
      } else if (err.message.includes("rest_forbidden")) {
        errorMessage = "WordPress permissions error: your WordPress account does not have sufficient permissions to access pages";
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
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
