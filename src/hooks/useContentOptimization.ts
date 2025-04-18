
import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type OptimizationType = "description" | "seoTitle" | "seoDescription" | "generateDescription";

export const useContentOptimization = () => {
  const [isOptimizing, setIsOptimizing] = useState<Record<OptimizationType, boolean>>({
    description: false,
    seoTitle: false,
    seoDescription: false,
    generateDescription: false,
  });

  const optimizeContent = useCallback(async (
    type: OptimizationType,
    title: string,
    description: string
  ): Promise<string | null> => {
    setIsOptimizing(prev => ({ ...prev, [type]: true }));
    
    try {
      console.log(`Optimisation du ${type} en cours...`);
      console.log(`Paramètres: Type=${type}, Titre="${title.substring(0, 20)}...", Description="${description.substring(0, 30)}..."`);
      
      // Vérification des entrées
      if (!title) {
        throw new Error("Le titre est requis pour l'optimisation");
      }
      
      // Pour la génération, la description n'est pas obligatoire
      if (type !== "generateDescription" && !description) {
        throw new Error("La description est requise pour l'optimisation");
      }
      
      const { data, error } = await supabase.functions.invoke("optimize-content", {
        body: { type, title, description }
      });
      
      console.log("Réponse de la fonction optimize-content:", data, error);
      
      if (error) {
        console.error("Erreur Supabase Functions:", error);
        throw new Error(`Erreur lors de l'appel à la fonction: ${error.message}`);
      }
      
      if (!data || !data.success) {
        throw new Error(data?.error || "L'optimisation a échoué pour une raison inconnue");
      }
      
      const messageType = type === "description" ? "Contenu optimisé" : 
                          type === "generateDescription" ? "Contenu généré" :
                          type === "seoTitle" ? "Titre SEO optimisé" : 
                          "Méta-description optimisée";
      
      toast.success(`${messageType} avec succès`);
      
      return data.content;
    } catch (error: any) {
      console.error(`Erreur lors de l'optimisation du ${type}:`, error);
      toast.error(`Erreur lors de l'optimisation: ${error.message || error}`);
      return null;
    } finally {
      setIsOptimizing(prev => ({ ...prev, [type]: false }));
    }
  }, []);

  return {
    optimizeContent,
    isOptimizing,
  };
};
