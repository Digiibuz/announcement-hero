
import { useState } from "react";
import { Announcement } from "@/types/announcement";
import { toast } from "sonner";
import { supabase, supabaseUrl } from "@/integrations/supabase/client";

export type PublishingStatus = "idle" | "loading" | "success" | "error";

export interface PublishingState {
  currentStep: string | null;
  steps: {
    [key: string]: {
      status: PublishingStatus;
      message?: string;
    }
  };
  progress: number;
}

const initialPublishingState: PublishingState = {
  currentStep: null,
  steps: {
    prepare: { status: "idle" },
    server: { status: "idle" },
    database: { status: "idle" }
  },
  progress: 0
};

export const useServerWordPressPublishing = () => {
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishingState, setPublishingState] = useState<PublishingState>(initialPublishingState);

  const updatePublishingStep = (stepId: string, status: PublishingStatus, message?: string, progress?: number) => {
    setPublishingState(prev => ({
      ...prev,
      currentStep: stepId,
      steps: {
        ...prev.steps,
        [stepId]: { status, message: message || prev.steps[stepId]?.message }
      },
      progress: progress !== undefined ? progress : prev.progress
    }));
  };

  const resetPublishingState = () => {
    setPublishingState(initialPublishingState);
  };

  const publishToWordPressServer = async (
    announcement: Announcement,
    wordpressCategoryId: string,
    userId: string
  ): Promise<{ success: boolean; message: string; wordpressPostId: number | null }> => {
    setIsPublishing(true);
    resetPublishingState();

    try {
      // Mise à jour de l'étape de préparation
      updatePublishingStep("prepare", "loading", "Préparation des données", 20);

      // Préparation des données pour la requête Edge Function
      const payload = {
        announcementId: announcement.id,
        userId: userId,
        categoryId: wordpressCategoryId
      };

      console.log("Publishing announcement", payload);

      updatePublishingStep("prepare", "success", "Données préparées", 40);
      updatePublishingStep("server", "loading", "Envoi à WordPress en cours", 60);

      // Using the supabaseUrl imported directly from the client file
      const functionUrl = `${supabaseUrl}/functions/v1/wordpress-publish`;
      
      // Appel direct à l'Edge Function (maintenant sans authentification requise)
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      // Traitement de la réponse
      if (!response.ok) {
        const errorData = await response.text();
        console.error("Error response from Edge Function:", errorData);
        updatePublishingStep("server", "error", "Échec de la publication sur WordPress");
        
        // Message d'erreur adapté
        let errorMessage = "Problème de connexion avec le serveur WordPress";
        if (response.status === 401) {
          errorMessage = "Problème d'authentification avec WordPress. Veuillez vérifier vos identifiants WordPress dans les paramètres.";
        }
        
        return {
          success: false,
          message: errorMessage,
          wordpressPostId: null
        };
      }

      const result = await response.json();
      
      if (result.success) {
        updatePublishingStep("server", "success", "Publication WordPress réussie", 80);
        updatePublishingStep("database", "success", "Base de données mise à jour", 100);
        
        return {
          success: true,
          message: "Publication réussie",
          wordpressPostId: result.data?.wordpressPostId || null
        };
      } else {
        updatePublishingStep("server", "error", result.message || "Erreur inconnue");
        return {
          success: false,
          message: result.message || "Erreur inconnue lors de la publication",
          wordpressPostId: null
        };
      }
    } catch (error: any) {
      console.error("Error in publishToWordPressServer:", error);
      updatePublishingStep(
        publishingState.currentStep || "server", 
        "error", 
        `Erreur: ${error.message || "Erreur inconnue"}`
      );
      
      return {
        success: false,
        message: `Erreur: ${error.message || "Erreur inconnue"}`,
        wordpressPostId: null
      };
    } finally {
      setIsPublishing(false);
    }
  };

  return {
    publishToWordPressServer,
    isPublishing,
    publishingState,
    resetPublishingState
  };
};
