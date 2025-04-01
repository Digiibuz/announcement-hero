
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useTomeScheduler = (wordpressConfigId: string | null) => {
  const [isLoading, setIsLoading] = useState(false);

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
      
      // Use the same approach as announcements - call the tome-publish function
      const { data, error } = await supabase.functions.invoke('tome-publish', {
        body: { generationId }
      });
      
      if (error) {
        console.error("Error calling tome-publish function:", error);
        toast.error("Erreur lors de la publication: " + error.message);
        return false;
      }
      
      if (!data.success) {
        console.error("Publication failed:", data.error);
        toast.error("Échec de la publication: " + data.error);
        return false;
      }
      
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
