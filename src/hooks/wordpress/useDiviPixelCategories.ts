
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WordPressCategory } from "@/types/announcement";

export const useDiviPixelCategories = () => {
  const [categories, setCategories] = useState<WordPressCategory[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchCategories = async () => {
    if (!user?.wordpressConfigId) {
      setError("Aucune configuration WordPress trouvée pour cet utilisateur");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Récupérer la configuration WordPress de l'utilisateur
      const { data: wpConfig, error: wpConfigError } = await supabase
        .from('wordpress_configs')
        .select('site_url, app_username, app_password')
        .eq('id', user.wordpressConfigId)
        .single();

      if (wpConfigError) throw wpConfigError;
      if (!wpConfig) throw new Error("Configuration WordPress introuvable");

      // Construire l'URL de l'API WordPress pour les catégories DiviPixel
      const apiUrl = `${wpConfig.site_url}/wp-json/wp/v2/dipi_cpt_category`;
      
      // Préparer les headers avec authentification si disponible
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      if (wpConfig.app_username && wpConfig.app_password) {
        const basicAuth = btoa(`${wpConfig.app_username}:${wpConfig.app_password}`);
        headers['Authorization'] = `Basic ${basicAuth}`;
      }
      
      const response = await fetch(apiUrl, { headers });

      if (!response.ok) {
        throw new Error(`Échec de récupération des catégories DiviPixel: ${response.statusText}`);
      }

      const categoriesData = await response.json();
      console.log("Catégories DiviPixel récupérées:", categoriesData);
      setCategories(categoriesData);
    } catch (err: any) {
      console.error("Erreur lors de la récupération des catégories DiviPixel:", err);
      setError(err.message || "Échec de récupération des catégories DiviPixel");
      toast.error("Erreur lors de la récupération des catégories DiviPixel");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user?.wordpressConfigId) {
      fetchCategories();
    }
  }, [user?.wordpressConfigId]);

  return { categories, isLoading, error, refetch: fetchCategories };
};
