
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useWordPressPublishing } from "@/hooks/useWordPressPublishing";

export const useTomeScheduler = (wordpressConfigId: string | null) => {
  const [isLoading, setIsLoading] = useState(false);
  const { publishToWordPress, isPublishing, publishingState } = useWordPressPublishing();

  const generateContent = async (generationId: string) => {
    if (!generationId) {
      toast.error("ID de génération manquant");
      return false;
    }

    try {
      setIsLoading(true);
      
      // Call tome-generate-draft to create the content (using AI) but NOT publish
      const { data: draftData, error: draftError } = await supabase.functions.invoke('tome-generate-draft', {
        body: { generationId }
      });
      
      if (draftError) {
        console.error("Error calling tome-generate-draft function:", draftError);
        toast.error("Erreur lors de la génération du brouillon: " + draftError.message);
        return false;
      }
      
      if (!draftData.success) {
        console.error("Draft generation failed:", draftData.error);
        toast.error("Échec de la génération du brouillon: " + draftData.error);
        return false;
      }
      
      toast.success("Contenu généré avec succès");
      return true;
    } catch (error: any) {
      console.error("Error generating content:", error);
      toast.error("Erreur: " + error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const publishContent = async (generationId: string) => {
    if (!generationId) {
      toast.error("ID de génération manquant");
      return false;
    }

    try {
      setIsLoading(true);
      
      console.log("Publishing content for generation ID:", generationId);
      
      // Fetch the generation data to get details needed for WordPress
      const { data: generation, error: generationError } = await supabase
        .from('tome_generations')
        .select('*')
        .eq('id', generationId)
        .single();
        
      if (generationError || !generation) {
        console.error("Error fetching generation:", generationError);
        toast.error("Erreur lors de la récupération des données: " + (generationError?.message || "Génération non trouvée"));
        return false;
      }
      
      if (!generation.title || !generation.content) {
        toast.error("Le titre et le contenu sont obligatoires pour publier");
        return false;
      }
      
      // Use the same approach as announcements - with useWordPressPublishing hook
      const announcement = {
        id: generation.id,
        title: generation.title,
        description: generation.content,
        status: 'published',
        images: [],
        seo_title: generation.title,
        seo_description: "",
        user_id: "",
        wordpress_category_id: generation.category_id
      };

      // Get the user ID
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Utilisateur non identifié");
        return false;
      }
      
      const result = await publishToWordPress(
        announcement, 
        generation.category_id, 
        user.id
      );
      
      if (!result.success) {
        console.error("Publication failed:", result.message);
        toast.error("Échec de la publication: " + result.message);
        return false;
      }
      
      // Update the generation status in Supabase
      await supabase
        .from('tome_generations')
        .update({ 
          status: 'published',
          wordpress_post_id: result.wordpressPostId,
          published_at: new Date().toISOString()
        })
        .eq('id', generationId);
      
      toast.success("Contenu publié avec succès");
      return true;
    } catch (error: any) {
      console.error("Error publishing content:", error);
      toast.error("Erreur: " + error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    generateContent,
    publishContent
  };
};
