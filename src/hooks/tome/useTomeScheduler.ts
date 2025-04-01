
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useWordPressPublishing } from "@/hooks/useWordPressPublishing";
import { Announcement } from "@/types/announcement";
import { useAuth } from "@/context/AuthContext";

export const useTomeScheduler = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { publishToWordPress, isPublishing, publishingState } = useWordPressPublishing();
  const { user } = useAuth();

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
      
      // Get the current user
      if (!user) {
        toast.error("Utilisateur non identifié");
        return false;
      }

      // Get the correct WordPress config ID for the current user
      const clientWordpressConfigId = user.wordpressConfigId;
      
      console.log("Client user WordPress config ID:", clientWordpressConfigId);
      console.log("Generation WordPress config ID:", generation.wordpress_config_id);
      
      if (!clientWordpressConfigId) {
        toast.error("Aucune configuration WordPress associée à cet utilisateur");
        return false;
      }
      
      // Si la configuration WordPress de l'utilisateur est différente de celle de la génération,
      // mettre à jour la génération avec la configuration de l'utilisateur actuel
      if (clientWordpressConfigId !== generation.wordpress_config_id) {
        console.log("Updating generation WordPress config ID to client's config:", clientWordpressConfigId);
        
        const { error: updateError } = await supabase
          .from('tome_generations')
          .update({ wordpress_config_id: clientWordpressConfigId })
          .eq('id', generationId);
          
        if (updateError) {
          console.error("Error updating generation WordPress config:", updateError);
          toast.error("Erreur lors de la mise à jour de la configuration WordPress");
          return false;
        }
        
        // Update the local generation variable with the new config ID
        generation.wordpress_config_id = clientWordpressConfigId;
      }
      
      // Use the same approach as announcements - with useWordPressPublishing hook
      const currentDate = new Date().toISOString();
      const announcement: Announcement = {
        id: generation.id,
        title: generation.title,
        description: generation.content,
        status: 'published',
        images: [],
        seo_title: generation.title,
        seo_description: "",
        user_id: user.id,
        created_at: currentDate,
        updated_at: currentDate,
        wordpress_category_id: generation.category_id
      };
      
      // Crucial: nous utilisons la configuration WordPress de l'utilisateur connecté
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

  // Fonction pour exécuter manuellement le planificateur
  const runScheduler = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase.functions.invoke('tome-scheduler', {});
      
      if (error) {
        console.error("Error calling tome-scheduler function:", error);
        toast.error("Erreur lors de l'exécution du planificateur: " + error.message);
        return false;
      }
      
      if (!data.success) {
        console.error("Scheduler run failed:", data.error);
        toast.error("Échec de l'exécution du planificateur: " + data.error);
        return false;
      }
      
      toast.success(`Planificateur exécuté avec succès. ${data.generationsCreated} publications générées.`);
      return true;
    } catch (error: any) {
      console.error("Error running scheduler:", error);
      toast.error("Erreur: " + error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    generateContent,
    publishContent,
    runScheduler
  };
};
