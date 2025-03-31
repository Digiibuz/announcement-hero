
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CategoryKeyword } from "@/types/wordpress";
import { toast } from "sonner";

export const useCategoryKeywords = (wordpressConfigId: string, categoryId: string) => {
  const [keywords, setKeywords] = useState<CategoryKeyword[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const fetchKeywords = useCallback(async () => {
    if (!wordpressConfigId || !categoryId) {
      setKeywords([]);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      console.info(`Fetching keywords for category ${categoryId} in WordPress config ${wordpressConfigId}`);
      
      // Utiliser maybeSingle() au lieu de single() pour éviter les erreurs lorsqu'aucun résultat n'est trouvé
      const { data, error } = await supabase
        .from('categories_keywords')
        .select('*')
        .eq('wordpress_config_id', wordpressConfigId)
        .eq('category_id', categoryId.toString()); // Toujours s'assurer que category_id est une chaîne
      
      if (error) {
        throw new Error(`Erreur lors de la récupération des mots-clés: ${error.message}`);
      }
      
      console.info(`Successfully fetched ${data?.length || 0} keywords`);
      setKeywords(data || []);
    } catch (err: any) {
      console.error('Erreur lors de la récupération des mots-clés:', err);
      setError(err);
      
      // Implement retry logic with backoff
      if (retryCount < maxRetries) {
        const nextRetry = retryCount + 1;
        const backoffTime = Math.pow(2, nextRetry) * 1000; // Exponential backoff
        
        console.info(`Retrying keyword fetch (${nextRetry}/${maxRetries}) in ${backoffTime}ms`);
        setTimeout(() => {
          setRetryCount(nextRetry);
        }, backoffTime);
      }
    } finally {
      setIsLoading(false);
    }
  }, [wordpressConfigId, categoryId, retryCount]);

  const addKeyword = async (keywordText: string) => {
    if (!wordpressConfigId || !categoryId) {
      toast.error("Configuration ou catégorie non sélectionnée");
      return;
    }
    
    try {
      setIsSubmitting(true);
      
      // Vérifier si le mot-clé existe déjà
      const { data: existingKeyword, error: checkError } = await supabase
        .from('categories_keywords')
        .select('id')
        .eq('wordpress_config_id', wordpressConfigId)
        .eq('category_id', categoryId.toString())
        .eq('keyword', keywordText)
        .maybeSingle();
      
      if (existingKeyword) {
        toast.error("Ce mot-clé existe déjà pour cette catégorie");
        return;
      }
      
      // Ajouter le nouveau mot-clé
      const { data, error } = await supabase
        .from('categories_keywords')
        .insert({
          wordpress_config_id: wordpressConfigId,
          category_id: categoryId.toString(),
          keyword: keywordText
        })
        .select('*')
        .single();
      
      if (error) {
        if (error.code === '23505') {
          toast.error("Ce mot-clé existe déjà pour cette catégorie");
        } else if (error.message.includes("check_keywords_limit")) {
          toast.error("Une catégorie ne peut pas avoir plus de 10 mots-clés");
        } else {
          throw new Error(`Erreur lors de l'ajout du mot-clé: ${error.message}`);
        }
        return;
      }
      
      toast.success("Mot-clé ajouté avec succès");
      setKeywords(prev => [...prev, data]);
    } catch (err: any) {
      console.error("Erreur lors de l'ajout du mot-clé:", err);
      toast.error(err.message || "Erreur lors de l'ajout du mot-clé");
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteKeyword = async (keywordId: string) => {
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('categories_keywords')
        .delete()
        .eq('id', keywordId);
      
      if (error) {
        throw new Error(`Erreur lors de la suppression du mot-clé: ${error.message}`);
      }
      
      toast.success("Mot-clé supprimé avec succès");
      setKeywords(prev => prev.filter(k => k.id !== keywordId));
    } catch (err: any) {
      console.error("Erreur lors de la suppression du mot-clé:", err);
      toast.error(err.message || "Erreur lors de la suppression du mot-clé");
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchAllKeywordsForWordPressConfig = useCallback(async (configId: string) => {
    if (!configId) {
      return [];
    }
    
    try {
      console.info(`Fetching all keywords for WordPress config ${configId}`);
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('categories_keywords')
        .select('*')
        .eq('wordpress_config_id', configId);
      
      if (error) {
        console.error("Error fetching all keywords:", error);
        throw error;
      }
      
      console.info(`Successfully fetched ${data?.length || 0} total keywords`);
      return data || [];
    } catch (err: any) {
      console.error("Error fetching all keywords:", err);
      toast.error(`Erreur lors du chargement des mots-clés: ${err.message || "Erreur inconnue"}`);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (wordpressConfigId && categoryId) {
      fetchKeywords();
    } else {
      setKeywords([]);
    }
  }, [wordpressConfigId, categoryId, fetchKeywords]);

  return {
    keywords,
    isLoading,
    isSubmitting,
    addKeyword,
    deleteKeyword,
    refetch: fetchKeywords,
    fetchAllKeywordsForWordPressConfig
  };
};
