import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WordPressPage } from "@/types/wordpress";

/**
 * Hook to fetch WordPress pages from a specific site
 */
export const useWordPressPages = (siteUrl: string) => {
  const [pages, setPages] = useState<WordPressPage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPages = async () => {
      if (!siteUrl) return;
      
      setIsLoading(true);
      setError(null);

      try {
        // Ensure site URL is valid and formatted correctly
        const restUrl = typeof siteUrl === 'string' ? siteUrl.replace(/\/$/, '') : String(siteUrl);
        const apiUrl = `${restUrl}/wp-json/wp/v2/pages`;
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch pages: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        setPages(data as WordPressPage[]);
      } catch (err: any) {
        console.error("Error fetching WordPress pages:", err);
        setError(err.message || "Failed to fetch pages");
        toast.error(`Erreur lors de la récupération des pages WordPress: ${err.message}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPages();
  }, [siteUrl]);

  return { pages, isLoading, error };
};
