
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
    wordpressCategoryId: string,
    userId: string
  ): Promise<{ success: boolean; message: string; wordpressPostId: number | null }> => {
    setIsPublishing(true);
    resetPublishingState();
    
    try {
      // Step 1: Prepare data
      updatePublishingStep("prepare", "loading", "Préparation de la publication", 10);
      
      if (!announcement.id) {
        updatePublishingStep("prepare", "error", "ID d'annonce manquant");
        return {
          success: false,
          message: "ID d'annonce manquant",
          wordpressPostId: null
        };
      }
      
      if (!wordpressCategoryId) {
        updatePublishingStep("prepare", "error", "ID de catégorie WordPress manquant");
        return {
          success: false,
          message: "ID de catégorie WordPress manquant",
          wordpressPostId: null
        };
      }
      
      updatePublishingStep("prepare", "success", "Préparation terminée", 25);
      
      // Step 2: Call the WordPress publish edge function
      updatePublishingStep("server", "loading", "Publication sur WordPress", 50);
      
      console.log("Calling wordpress-publish function with:", {
        announcementId: announcement.id,
        userId,
        categoryId: wordpressCategoryId
      });
      
      const { data: functionResponse, error: functionError } = await supabase.functions.invoke("wordpress-publish", {
        body: {
          announcementId: announcement.id,
          userId,
          categoryId: wordpressCategoryId
        }
      });
      
      if (functionError) {
        console.error("Edge function error:", functionError);
        updatePublishingStep("server", "error", `Erreur de la fonction: ${functionError.message}`);
        return {
          success: false,
          message: `Erreur lors de la publication: ${functionError.message}`,
          wordpressPostId: null
        };
      }
      
      console.log("Function response:", functionResponse);
      
      if (!functionResponse.success) {
        console.error("WordPress publish error:", functionResponse.message);
        updatePublishingStep("server", "error", functionResponse.message);
        return {
          success: false,
          message: functionResponse.message,
          wordpressPostId: null
        };
      }
      
      updatePublishingStep("server", "success", "Publication WordPress réussie", 75);
      
      // Step 3: Database update already handled by the Edge Function
      updatePublishingStep("database", "success", "Base de données mise à jour", 100);
      
      return {
        success: true,
        message: functionResponse.message || "Publication réussie",
        wordpressPostId: functionResponse.data?.wordpressPostId || null
      };
      
    } catch (error: any) {
      console.error("Error in server WordPress publishing:", error);
      
      // Update the current step with error status
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
