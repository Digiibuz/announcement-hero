
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WordPressConfigCategory } from "@/types/wordpress-categories";

export const useWordPressConfigCategories = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchConfigCategories = useCallback(async (configId: string): Promise<WordPressConfigCategory[]> => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('wordpress_config_categories')
        .select('*')
        .eq('wordpress_config_id', configId)
        .order('category_name');

      if (error) {
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching config categories:', error);
      toast.error("Erreur lors de la récupération des catégories");
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  const saveConfigCategories = useCallback(async (
    configId: string, 
    selectedCategories: { id: string; name: string }[]
  ) => {
    try {
      setIsSubmitting(true);

      // Supprimer toutes les catégories existantes pour cette config
      const { error: deleteError } = await supabase
        .from('wordpress_config_categories')
        .delete()
        .eq('wordpress_config_id', configId);

      if (deleteError) {
        throw deleteError;
      }

      // Insérer les nouvelles catégories sélectionnées
      if (selectedCategories.length > 0) {
        const categoriesToInsert = selectedCategories.map(category => ({
          wordpress_config_id: configId,
          category_id: category.id,
          category_name: category.name
        }));

        const { error: insertError } = await supabase
          .from('wordpress_config_categories')
          .insert(categoriesToInsert);

        if (insertError) {
          throw insertError;
        }
      }

      toast.success("Catégories sauvegardées avec succès");
    } catch (error) {
      console.error('Error saving config categories:', error);
      toast.error("Erreur lors de la sauvegarde des catégories");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    isLoading,
    isSubmitting,
    fetchConfigCategories,
    saveConfigCategories
  };
};
