
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface WordPressPage {
  id: number;
  title: {
    rendered: string;
  };
  slug: string;
  link: string;
  status: string;
  date: string;
}

/**
 * Hook pour récupérer les pages WordPress d'un site configuré
 */
export const useWordPressPages = () => {
  const [pages, setPages] = useState<WordPressPage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchPages = async () => {
    if (!user?.wordpressConfigId) {
      setError("Aucune configuration WordPress trouvée pour cet utilisateur");
      setPages([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Récupérer d'abord la configuration WordPress pour l'utilisateur
      const { data: wpConfig, error: wpConfigError } = await supabase
        .from('wordpress_configs')
        .select('site_url, rest_api_key')
        .eq('id', user.wordpressConfigId)
        .single();

      if (wpConfigError) {
        console.error("Erreur lors de la récupération de la config WordPress:", wpConfigError);
        throw new Error("Échec de récupération de la configuration WordPress");
      }
      
      if (!wpConfig) {
        throw new Error("Configuration WordPress introuvable");
      }

      // Construire l'URL de l'API WordPress
      const apiUrl = `${wpConfig.site_url}/wp-json/wp/v2/pages`;
      
      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${wpConfig.rest_api_key}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erreur de réponse de l'API WordPress:", errorText);
        throw new Error(`Échec de récupération des pages: ${response.statusText}`);
      }

      const pagesData = await response.json();
      setPages(pagesData);
    } catch (err: any) {
      console.error("Erreur lors de la récupération des pages WordPress:", err);
      setError(err.message || "Échec de récupération des pages WordPress");
      toast.error("Erreur lors de la récupération des pages WordPress");
      setPages([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.wordpressConfigId) {
      fetchPages();
    } else {
      setPages([]);
      setError("Aucune configuration WordPress trouvée");
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
