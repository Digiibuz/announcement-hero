
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Announcement } from "@/types/announcement";
import { toast } from "@/hooks/use-toast";

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
    categoryId: string,
    userId: string
  ): Promise<{ success: boolean; message: string; wordpressPostId: number | null }> => {
    setIsPublishing(true);
    resetPublishingState();
    
    // Start preparing publication 
    updatePublishingStep("prepare", "loading", "Préparation de la publication", 10);
    
    try {
      console.log("Publishing announcement", {
        announcementId: announcement.id,
        userId,
        categoryId
      });
      
      // Update to calling the server function
      updatePublishingStep("server", "loading", "Publication sur WordPress", 50);
      
      // Need to use full URL for Edge Functions to work properly
      const { data: session } = await supabase.auth.getSession();
      
      if (!session?.session?.access_token) {
        updatePublishingStep("server", "error", "Session non disponible");
        return {
          success: false,
          message: "Votre session a expiré. Veuillez vous reconnecter.",
          wordpressPostId: null
        };
      }
      
      // Log the function URL to debug issues
      const functionUrl = `${supabase.functions.url}/wordpress-publish`;
      console.log("Calling edge function at URL:", functionUrl);
      
      const { data, error } = await supabase.functions.invoke("wordpress-publish", {
        body: {
          announcementId: announcement.id,
          userId,
          categoryId
        }
      });
      
      console.log("Server response:", data);
      
      if (error) {
        console.error("Error from edge function:", error);
        updatePublishingStep("server", "error", `Erreur: ${error.message}`);
        return {
          success: false,
          message: `Erreur lors de la publication: ${error.message}`,
          wordpressPostId: null
        };
      }
      
      if (!data?.success) {
        const errorMessage = data?.message || "Erreur inconnue lors de la publication";
        console.error("Publication error:", errorMessage);
        updatePublishingStep("server", "error", `Échec: ${errorMessage}`);
        return {
          success: false,
          message: errorMessage,
          wordpressPostId: null
        };
      }
      
      // Server function was successful
      updatePublishingStep("server", "success", "Publication sur WordPress réussie", 80);
      
      // Database work was handled by the server function
      updatePublishingStep("database", "success", "Mise à jour finalisée", 100);
      
      return {
        success: true,
        message: data.message || "Publié avec succès sur WordPress",
        wordpressPostId: data.data?.wordpressPostId || null
      };
    } catch (error: any) {
      console.error("Error publishing to WordPress Server:", error);
      
      if (publishingState.currentStep) {
        updatePublishingStep(publishingState.currentStep, "error", `Erreur: ${error.message}`);
      }
      
      return {
        success: false,
        message: `Erreur lors de la publication: ${error.message}`,
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
