
import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type OptimizationType = "description" | "seoTitle" | "seoDescription";

export const useContentOptimization = () => {
  const [isOptimizing, setIsOptimizing] = useState<Record<OptimizationType, boolean>>({
    description: false,
    seoTitle: false,
    seoDescription: false,
  });

  const optimizeContent = useCallback(async (
    type: OptimizationType,
    title: string,
    description: string
  ): Promise<string | null> => {
    setIsOptimizing(prev => ({ ...prev, [type]: true }));
    
    try {
      const { data, error } = await supabase.functions.invoke("optimize-content", {
        body: { type, title, description }
      });
      
      if (error) {
        throw error;
      }
      
      if (!data.success) {
        throw new Error(data.error || "L'optimisation a échoué");
      }
      
      toast.success(`${type === "description" ? "Contenu" : 
                     type === "seoTitle" ? "Titre SEO" : 
                     "Méta-description"} optimisé avec succès`);
      
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
