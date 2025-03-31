
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TomeGeneration, CategoryKeyword, Locality } from "@/types/tome";
import { format } from "date-fns";

export const useTomeGeneration = (configId: string | null) => {
  const [generations, setGenerations] = useState<TomeGeneration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchGenerations = useCallback(async () => {
    if (!configId) {
      setGenerations([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("tome_generations")
        .select("*")
        .eq("wordpress_config_id", configId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching generations:", error);
        toast.error("Erreur lors du chargement des générations: " + error.message);
        return;
      }

      setGenerations(data as TomeGeneration[]);
    } catch (error: any) {
      console.error("Error in fetchGenerations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [configId]);

  useEffect(() => {
    fetchGenerations();
  }, [fetchGenerations]);

  const createGeneration = async (
    categoryId: string,
    keyword: CategoryKeyword | null,
    locality: Locality | null,
    scheduleDate: Date | null
  ) => {
    if (!configId) return false;

    try {
      setIsSubmitting(true);
      
      const isScheduled = scheduleDate !== null;
      const formattedDate = scheduleDate ? format(scheduleDate, "yyyy-MM-dd'T'HH:mm:ss") : null;
      
      const newGeneration = {
        wordpress_config_id: configId,
        category_id: categoryId,
        keyword_id: keyword?.id || null,
        locality_id: locality?.id || null,
        status: isScheduled ? "scheduled" : "pending",
        scheduled_at: formattedDate
      };

      const { data, error } = await supabase
        .from("tome_generations")
        .insert([newGeneration])
        .select()
        .single();

      if (error) {
        console.error("Error creating generation:", error);
        toast.error("Erreur lors de la création de la génération: " + error.message);
        return false;
      }

      setGenerations([data as TomeGeneration, ...generations]);
      
      // Si ce n'est pas planifié, lancer la génération immédiate
      if (!isScheduled) {
        // Appeler la fonction edge pour démarrer la génération
        const { error: genError } = await supabase.functions.invoke('tome-generate', {
          body: { generationId: data.id }
        });
        
        if (genError) {
          console.error("Error triggering generation:", genError);
          toast.error("Erreur lors du démarrage de la génération: " + genError.message);
        }
      }
      
      toast.success(isScheduled ? "Génération planifiée avec succès" : "Génération lancée avec succès");
      return true;
    } catch (error: any) {
      console.error("Error in createGeneration:", error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const regenerate = async (generationId: string) => {
    try {
      setIsSubmitting(true);
      
      // Appeler la fonction edge pour relancer la génération
      const { error } = await supabase.functions.invoke('tome-generate', {
        body: { generationId }
      });
      
      if (error) {
        console.error("Error regenerating content:", error);
        toast.error("Erreur lors de la régénération: " + error.message);
        return false;
      }
      
      toast.success("Régénération lancée avec succès");
      await fetchGenerations(); // Rafraîchir la liste
      return true;
    } catch (error: any) {
      console.error("Error in regenerate:", error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    generations,
    isLoading,
    isSubmitting,
    createGeneration,
    regenerate,
    fetchGenerations
  };
};
