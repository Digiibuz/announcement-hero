
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CategoryKeyword } from "./useCategoriesKeywords";
import { Locality } from "./useLocalities";

export interface TomeGeneration {
  id: string;
  wordpress_config_id: string;
  category_id: string;
  keyword_id: string | null;
  locality_id: string | null;
  wordpress_post_id: number | null;
  status: string;
  created_at: string;
  scheduled_at: string | null;
  published_at: string | null;
}

export const useTomeGeneration = (wordpressConfigId: string | null) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generations, setGenerations] = useState<TomeGeneration[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchGenerations = async () => {
    if (!wordpressConfigId) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('tome_generations')
        .select('*')
        .eq('wordpress_config_id', wordpressConfigId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw error;
      }
      
      setGenerations(data as TomeGeneration[]);
    } catch (error: any) {
      console.error("Error fetching generations:", error);
      toast.error("Erreur lors de la récupération des générations");
    } finally {
      setIsLoading(false);
    }
  };

  const createGeneration = async (
    categoryId: string,
    keyword: CategoryKeyword | null,
    locality: Locality | null,
    scheduleDate: Date | null = null
  ) => {
    if (!wordpressConfigId) {
      toast.error("Configuration WordPress non trouvée");
      return null;
    }

    try {
      setIsSubmitting(true);
      
      const generationData = {
        wordpress_config_id: wordpressConfigId,
        category_id: categoryId,
        keyword_id: keyword?.id || null,
        locality_id: locality?.id || null,
        status: scheduleDate ? 'scheduled' : 'pending',
        scheduled_at: scheduleDate ? scheduleDate.toISOString() : null
      };
      
      const { data, error } = await supabase
        .from('tome_generations')
        .insert([generationData])
        .select()
        .single();
      
      if (error) {
        toast.error("Erreur lors de la création de la génération");
        throw error;
      }
      
      toast.success("Génération " + (scheduleDate ? "planifiée" : "créée") + " avec succès");
      await fetchGenerations();
      return data as TomeGeneration;
    } catch (error: any) {
      console.error("Error creating generation:", error);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateGenerationStatus = async (id: string, status: string, wordpressPostId?: number) => {
    try {
      const updateData: any = { status };
      
      if (status === 'published' && wordpressPostId) {
        updateData.wordpress_post_id = wordpressPostId;
        updateData.published_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('tome_generations')
        .update(updateData)
        .eq('id', id);
      
      if (error) {
        toast.error("Erreur lors de la mise à jour du statut");
        throw error;
      }
      
      await fetchGenerations();
    } catch (error: any) {
      console.error("Error updating generation status:", error);
    }
  };

  const deleteGeneration = async (id: string) => {
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('tome_generations')
        .delete()
        .eq('id', id);
      
      if (error) {
        toast.error("Erreur lors de la suppression de la génération");
        throw error;
      }
      
      toast.success("Génération supprimée avec succès");
      setGenerations(generations.filter(g => g.id !== id));
    } catch (error: any) {
      console.error("Error deleting generation:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    generations,
    isLoading,
    isSubmitting,
    createGeneration,
    updateGenerationStatus,
    deleteGeneration,
    fetchGenerations
  };
};
