
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
      
      // Appeler la fonction Edge pour générer le contenu
      const { data, error } = await supabase.functions.invoke('tome-generate', {
        body: { generationId }
      });
      
      if (error) {
        console.error("Error calling tome-generate function:", error);
        toast.error("Erreur lors de la génération: " + error.message);
        return false;
      }
      
      if (!data.success) {
        console.error("Generation failed:", data.error);
        toast.error("Échec de la génération: " + data.error);
        return false;
      }
      
      toast.success("Contenu généré et publié avec succès");
      return true;
    } catch (error: any) {
      console.error("Error generating content:", error);
      toast.error("Erreur: " + error.message);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    generateContent
  };
};
