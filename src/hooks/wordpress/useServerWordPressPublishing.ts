
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Announcement } from "@/types/announcement";

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
    
    try {
      // Start with preparation step
      updatePublishingStep("prepare", "loading", "Préparation de la publication", 10);
      
      if (!announcement || !categoryId || !userId) {
        updatePublishingStep("prepare", "error", "Données de publication incomplètes");
        return {
          success: false,
          message: "Données de publication incomplètes",
          wordpressPostId: null
        };
      }
      
      updatePublishingStep("prepare", "success", "Préparation terminée", 33);
      
      // Call the server-side function
      updatePublishingStep("server", "loading", "Publication sur WordPress via le serveur", 50);
      
      const { data, error } = await supabase.functions.invoke('wordpress-publish', {
        body: {
          announcementId: announcement.id,
          userId: userId,
          categoryId: categoryId
        }
      });
      
      if (error || !data?.success) {
        console.error("Server publishing error:", error || data?.message);
        updatePublishingStep("server", "error", `Erreur: ${error?.message || data?.message || "Unknown error"}`);
        return {
          success: false,
          message: `Erreur de publication: ${error?.message || data?.message || "Erreur inconnue"}`,
          wordpressPostId: null
        };
      }
      
      // Success!
      updatePublishingStep("server", "success", "Publication réussie", 75);
      updatePublishingStep("database", "success", "Mise à jour des données", 100);
      
      return {
        success: true,
        message: "Publication réussie sur WordPress",
        wordpressPostId: data.data?.wordpressPostId || null
      };
      
    } catch (error: any) {
      console.error("Error in server publishing:", error);
      updatePublishingStep(publishingState.currentStep || "server", "error", `Erreur: ${error.message}`);
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
