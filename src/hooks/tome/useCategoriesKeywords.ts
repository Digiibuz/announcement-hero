
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useWordPressCategories } from "@/hooks/wordpress";

export interface CategoryKeyword {
  id: string;
  wordpress_config_id: string;
  category_id: string;
  category_name: string;
  keyword: string;
  created_at: string;
}

export const useCategoriesKeywords = (wordpressConfigId: string | null) => {
  const [keywords, setKeywords] = useState<CategoryKeyword[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { categories, isLoading: isCategoriesLoading } = useWordPressCategories();

  const fetchKeywords = async () => {
    if (!wordpressConfigId) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('categories_keywords')
        .select('*')
        .eq('wordpress_config_id', wordpressConfigId)
        .order('category_name', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      setKeywords(data as CategoryKeyword[]);
    } catch (error: any) {
      console.error("Error fetching keywords:", error);
      toast.error("Erreur lors de la récupération des mots-clés");
    } finally {
      setIsLoading(false);
    }
  };

  const addKeyword = async (categoryId: string, categoryName: string, keyword: string) => {
    if (!wordpressConfigId) {
      toast.error("Configuration WordPress non trouvée");
      return null;
    }

    try {
      setIsSubmitting(true);
      
      const { data, error } = await supabase
        .from('categories_keywords')
        .insert([
          {
            wordpress_config_id: wordpressConfigId,
            category_id: categoryId,
            category_name: categoryName,
            keyword
          }
        ])
        .select()
        .single();
      
      if (error) {
        if (error.message.includes("violates unique constraint")) {
          toast.error("Ce mot-clé existe déjà pour cette catégorie");
        } else if (error.message.includes("Une catégorie ne peut pas avoir plus de 10 mots-clés")) {
          toast.error("Une catégorie ne peut pas avoir plus de 10 mots-clés");
        } else {
          toast.error("Erreur lors de l'ajout du mot-clé");
        }
        throw error;
      }
      
      toast.success("Mot-clé ajouté avec succès");
      await fetchKeywords();
      return data as CategoryKeyword;
    } catch (error: any) {
      console.error("Error adding keyword:", error);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteKeyword = async (id: string) => {
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('categories_keywords')
        .delete()
        .eq('id', id);
      
      if (error) {
        toast.error("Erreur lors de la suppression du mot-clé");
        throw error;
      }
      
      toast.success("Mot-clé supprimé avec succès");
      setKeywords(keywords.filter(k => k.id !== id));
    } catch (error: any) {
      console.error("Error deleting keyword:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getKeywordsForCategory = (categoryId: string) => {
    return keywords.filter(k => k.category_id === categoryId);
  };

  useEffect(() => {
    if (wordpressConfigId) {
      fetchKeywords();
    }
  }, [wordpressConfigId]);

  return {
    keywords,
    isLoading: isLoading || isCategoriesLoading,
    isSubmitting,
    addKeyword,
    deleteKeyword,
    fetchKeywords,
    getKeywordsForCategory,
    categories
  };
};
