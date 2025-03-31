
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TomeGeneration, CategoryKeyword, Locality } from "@/types/tome";
import { format } from "date-fns";

export const useTomeGeneration = (configId: string | null) => {
  const [generations, setGenerations] = useState<TomeGeneration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<Record<string, string | null>>({});

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
      
      // Fetch content for completed generations
      for (const generation of data) {
        if (generation.status === 'published' && generation.wordpress_post_id) {
          fetchGeneratedContent(generation.id, generation.wordpress_post_id);
        }
      }
    } catch (error: any) {
      console.error("Error in fetchGenerations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [configId]);

  useEffect(() => {
    fetchGenerations();
  }, [fetchGenerations]);

  const fetchGeneratedContent = async (generationId: string, postId: number) => {
    try {
      // First check if we already have the content for this generation
      if (generatedContent[generationId]) return;
      
      // Get WordPress config to determine the site URL
      const { data: wpConfig, error: wpConfigError } = await supabase
        .from("wordpress_configs")
        .select("site_url")
        .eq("id", configId)
        .single();
        
      if (wpConfigError || !wpConfig) {
        console.error("Error fetching WordPress config:", wpConfigError);
        return;
      }
      
      // Fetch the content
      const { data: contentData, error: contentError } = await supabase.functions.invoke('fetch-tome-content', {
        body: { 
          siteUrl: wpConfig.site_url,
          postId: postId
        }
      });
      
      if (contentError) {
        console.error("Error fetching content:", contentError);
        return;
      }
      
      if (contentData?.content) {
        setGeneratedContent(prev => ({
          ...prev,
          [generationId]: contentData.content
        }));
      }
    } catch (error) {
      console.error("Error in fetchGeneratedContent:", error);
    }
  };

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
      
      // Check if keyword or locality is "none" and set to null
      const keywordId = keyword?.id === "none" ? null : keyword?.id || null;
      const localityId = locality?.id === "none" ? null : locality?.id || null;
      
      const newGeneration = {
        wordpress_config_id: configId,
        category_id: categoryId,
        keyword_id: keywordId,
        locality_id: localityId,
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
    fetchGenerations,
    generatedContent,
    fetchGeneratedContent
  };
};
