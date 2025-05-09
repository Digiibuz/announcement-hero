
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WordPressPage } from "@/types/wordpress";

/**
 * Hook to fetch WordPress pages from a specific site
 */
export const useWordPressPages = (siteUrl?: string) => {
  const [pages, setPages] = useState<WordPressPage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPages, setHasPages] = useState(false);

  // Create a refetch function to allow manual refreshing
  const refetch = useCallback(async (url?: string) => {
    const targetUrl = url || siteUrl;
    if (!targetUrl) return;
    
    setIsLoading(true);
    setError(null);

    try {
      // Ensure site URL is valid and formatted correctly
      const restUrl = typeof targetUrl === 'string' ? 
        targetUrl.replace(/\/$/, '') : String(targetUrl);
      const apiUrl = `${restUrl}/wp-json/wp/v2/pages`;
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch pages: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      setPages(data as WordPressPage[]);
      setHasPages(data && Array.isArray(data) && data.length > 0);
    } catch (err: any) {
      console.error("Error fetching WordPress pages:", err);
      setError(err.message || "Failed to fetch pages");
      toast.error(`Erreur lors de la récupération des pages WordPress: ${err.message}`);
      setHasPages(false);
    } finally {
      setIsLoading(false);
    }
  }, [siteUrl]);

  useEffect(() => {
    if (siteUrl) {
      refetch(siteUrl);
    }
  }, [siteUrl, refetch]);

  return { 
    pages, 
    isLoading, 
    error, 
    refetch, 
    hasPages 
  };
};
