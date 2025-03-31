
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useWordPressCategories } from "@/hooks/wordpress";
import { toast } from "sonner";
import { CategoryKeyword, DipiCptCategory } from "@/types/tome";

export const useCategoriesKeywords = (configId: string | null) => {
  const [keywords, setKeywords] = useState<CategoryKeyword[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Utilise le hook useWordPressCategories avec configId comme paramètre
  const { categories: wpCategories, isLoading: isCategoriesLoading } = useWordPressCategories(configId);
  
  // Filter categories based on the configId if needed
  const categories = wpCategories as unknown as DipiCptCategory[];

  const fetchKeywords = useCallback(async () => {
    if (!configId) {
      setKeywords([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("categories_keywords")
        .select("*")
        .eq("wordpress_config_id", configId);

      if (error) {
        console.error("Error fetching keywords:", error);
        toast.error("Erreur lors du chargement des mots-clés: " + error.message);
        return;
      }

      setKeywords(data as CategoryKeyword[]);
    } catch (error: any) {
      console.error("Error in fetchKeywords:", error);
    } finally {
      setIsLoading(false);
    }
  }, [configId]);

  useEffect(() => {
    fetchKeywords();
  }, [fetchKeywords]);

  const addKeyword = async (categoryId: string, categoryName: string, keyword: string) => {
    if (!configId) return false;

    try {
      setIsSubmitting(true);
      
      const newKeyword = {
        wordpress_config_id: configId,
        category_id: categoryId,
        category_name: categoryName,
        keyword: keyword
      };

      const { data, error } = await supabase
        .from("categories_keywords")
        .insert([newKeyword])
        .select()
        .single();

      if (error) {
        if (error.code === "23505") { // Code de violation de contrainte unique
          toast.error("Ce mot-clé existe déjà pour cette catégorie");
        } else {
          console.error("Error adding keyword:", error);
          toast.error("Erreur lors de l'ajout du mot-clé: " + error.message);
        }
        return false;
      }

      setKeywords([...keywords, data as CategoryKeyword]);
      toast.success("Mot-clé ajouté avec succès");
      return true;
    } catch (error: any) {
      console.error("Error in addKeyword:", error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteKeyword = async (keywordId: string) => {
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from("categories_keywords")
        .delete()
        .eq("id", keywordId);

      if (error) {
        console.error("Error deleting keyword:", error);
        toast.error("Erreur lors de la suppression du mot-clé: " + error.message);
        return false;
      }

      setKeywords(keywords.filter(k => k.id !== keywordId));
      toast.success("Mot-clé supprimé avec succès");
      return true;
    } catch (error: any) {
      console.error("Error in deleteKeyword:", error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const getKeywordsForCategory = useCallback((categoryId: string) => {
    return keywords.filter(k => k.category_id === categoryId);
  }, [keywords]);

  return {
    categories,
    keywords,
    isLoading: isLoading || isCategoriesLoading,
    isSubmitting,
    addKeyword,
    deleteKeyword,
    getKeywordsForCategory,
    fetchKeywords
  };
};
