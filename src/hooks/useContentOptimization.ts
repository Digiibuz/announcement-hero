
import { useCallback, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showToast } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { useAILimits } from "@/hooks/useAILimits";
import { AIGenerationSettings } from "@/components/announcements/AIGenerationOptions";

export type OptimizationType = "generateDescription" | "generateSocialContent" | "generateFacebookContent";

export const useContentOptimization = () => {
  const { user } = useAuth();
  const { canGenerate, incrementGeneration, stats } = useAILimits(user?.id);
  
  const [isOptimizing, setIsOptimizing] = useState<Record<OptimizationType, boolean>>({
    generateDescription: false,
    generateSocialContent: false,
    generateFacebookContent: false,
  });

  const optimizeContent = useCallback(async (
    type: OptimizationType,
    title: string,
    description: string,
    aiSettings?: AIGenerationSettings,
    aiInstructions?: string
  ): Promise<string | null> => {
    // Vérifier les limites IA avant de commencer
    if (!canGenerate()) {
      showToast.error(`Limite de ${stats.maxLimit} générations IA atteinte ce mois-ci. Contactez votre administrateur pour augmenter votre quota.`);
      return null;
    }

    setIsOptimizing(prev => ({ ...prev, [type]: true }));
    
    try {
      console.log(`Génération de contenu en cours...`);
      console.log(`Paramètres: Titre="${title.substring(0, 20)}...", Description="${description?.substring(0, 30) || ""}..."`);
      
      // Vérification des entrées
      if (!title) {
        throw new Error("Le titre est requis pour la génération de contenu");
      }
      
      const { data, error } = await supabase.functions.invoke("optimize-content", {
        body: { type, title, description, aiSettings, aiInstructions }
      });
      
      console.log("Réponse de la fonction optimize-content:", data, error);
      
      if (error) {
        console.error("Erreur Supabase Functions:", error);
        
        // Vérifier si c'est une erreur de quota (429)
        if (error.message && error.message.includes("non-2xx status code") && error.status === 429) {
          throw new Error("Limite d'utilisation de l'API OpenAI atteinte. Veuillez réessayer plus tard ou vérifier votre abonnement.");
        }
        
        throw new Error(`Erreur lors de l'appel à la fonction: ${error.message}`);
      }
      
      if (!data || !data.success) {
        // Traitement spécifique pour les erreurs de quota OpenAI
        if (data?.error && (
          data.error.includes("quota") || 
          data.error.includes("limite") || 
          data.error.includes("OpenAI")
        )) {
          throw new Error("Limite d'utilisation de l'API OpenAI atteinte. Veuillez réessayer plus tard ou vérifier votre abonnement.");
        }
        
        throw new Error(data?.error || "La génération a échoué pour une raison inconnue");
      }
      
      // Incrémenter le compteur IA après une génération réussie
      const incremented = await incrementGeneration();
      if (!incremented) {
        console.warn("Échec de l'incrémentation du compteur IA");
      }
      
      return data.content;
    } catch (error: any) {
      console.error(`Erreur lors de la génération:`, error);
      
      // Message d'erreur plus convivial pour les erreurs de quota
      if (error.message && (
          error.message.includes("quota") || 
          error.message.includes("limite") || 
          error.message.includes("OpenAI") ||
          error.message.includes("rate")
      )) {
        showToast.error("Limite d'utilisation de l'IA atteinte. Veuillez réessayer plus tard ou contacter le support pour augmenter votre quota.");
      } else {
        showToast.error(`Erreur lors de la génération: ${error.message || error}`);
      }
      
      return null;
    } finally {
      setIsOptimizing(prev => ({ ...prev, [type]: false }));
    }
  }, [canGenerate, incrementGeneration, stats.maxLimit]);

  return {
    optimizeContent,
    isOptimizing,
    aiStats: stats,
    canGenerate
  };
};
