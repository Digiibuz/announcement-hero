
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CategoryKeyword } from "@/types/wordpress";

export const useCategoryKeywords = (wordpressConfigId: string, categoryId: string) => {
  const [keywords, setKeywords] = useState<CategoryKeyword[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;

  const fetchKeywords = async () => {
    if (!wordpressConfigId || !categoryId) {
      setKeywords([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('categories_keywords')
        .select('*')
        .eq('wordpress_config_id', wordpressConfigId)
        .eq('category_id', categoryId)
        .order('created_at');
      
      if (error) {
        throw error;
      }
      
      setKeywords(data as CategoryKeyword[]);
      // Reset retry count on success
      setRetryCount(0);
    } catch (error) {
      console.error('Error fetching category keywords:', error);
      
      // Implement retry logic with backoff
      if (retryCount < maxRetries) {
        const nextRetry = retryCount + 1;
        const backoffTime = Math.pow(2, nextRetry) * 1000; // Exponential backoff
        
        console.info(`Retrying keywords fetch (${nextRetry}/${maxRetries}) in ${backoffTime}ms`);
        setTimeout(() => {
          setRetryCount(nextRetry);
        }, backoffTime);
      } else {
        // Only show toast on final retry failure
        toast.error("Erreur lors de la récupération des mots-clés");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addKeyword = async (keyword: string) => {
    if (!wordpressConfigId || !categoryId) {
      toast.error("Configuration WordPress ou catégorie non spécifiée");
      return;
    }

    if (keywords.length >= 10) {
      toast.error("Impossible d'ajouter plus de 10 mots-clés par catégorie");
      return;
    }

    try {
      setIsSubmitting(true);
      const { data, error } = await supabase
        .from('categories_keywords')
        .insert([{ 
          wordpress_config_id: wordpressConfigId,
          category_id: categoryId,
          keyword
        }])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      toast.success(`Mot-clé "${keyword}" ajouté avec succès`);
      await fetchKeywords();
      return data as CategoryKeyword;
    } catch (error: any) {
      console.error('Error adding keyword:', error);
      
      // Gérer le cas d'un mot-clé déjà existant
      if (error.code === '23505') { // Code PostgreSQL pour violation de contrainte d'unicité
        toast.error(`Le mot-clé "${keyword}" existe déjà pour cette catégorie`);
      } else if (error.message.includes("Une catégorie ne peut pas avoir plus de 10 mots-clés")) {
        toast.error("Impossible d'ajouter plus de 10 mots-clés par catégorie");
      } else {
        toast.error("Erreur lors de l'ajout du mot-clé");
      }
      throw error;
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
        throw error;
      }
      
      toast.success("Mot-clé supprimé avec succès");
      await fetchKeywords();
    } catch (error) {
      console.error('Error deleting keyword:', error);
      toast.error("Erreur lors de la suppression du mot-clé");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Obtenir la liste complète des mots-clés pour un site WordPress
  const fetchAllKeywordsForWordPressConfig = async (configId: string) => {
    if (!configId) {
      return [];
    }
    
    try {
      console.info(`Fetching all keywords for WordPress config ID: ${configId}`);
      const { data, error } = await supabase
        .from('categories_keywords')
        .select('*')
        .eq('wordpress_config_id', configId)
        .order('category_id');
      
      if (error) {
        console.error('Error in fetchAllKeywordsForWordPressConfig:', error);
        throw error;
      }
      
      if (!data) {
        return [];
      }
      
      console.info(`Successfully fetched ${data.length} keywords for WordPress config ID: ${configId}`);
      return data as CategoryKeyword[];
    } catch (error) {
      console.error('Error fetching all keywords:', error);
      // Don't show a toast here as it's called from TomEManagement and would cause double error messages
      return [];
    }
  };

  // Charger les mots-clés au chargement du composant
  useEffect(() => {
    if (wordpressConfigId && categoryId) {
      fetchKeywords();
    } else {
      setKeywords([]);
      setIsLoading(false);
    }
  }, [wordpressConfigId, categoryId, retryCount]);

  return {
    keywords,
    isLoading,
    isSubmitting,
    fetchKeywords,
    addKeyword,
    deleteKeyword,
    fetchAllKeywordsForWordPressConfig
  };
};
