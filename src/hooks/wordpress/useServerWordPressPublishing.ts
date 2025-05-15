
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Announcement } from "@/types/announcement";
import { toast } from "sonner";

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
    try {
      setIsPublishing(true);
      resetPublishingState();
      
      // Start preparation step
      updatePublishingStep("prepare", "loading", "Préparation de la publication", 30);
      
      console.log("Publishing announcement", {
        announcementId: announcement.id,
        userId,
        categoryId: wordpressCategoryId
      });
      
      // Call Edge function to handle WordPress publishing
      const functionUrl = `https://rdwqedmvzicerwotjseg.supabase.co/functions/v1/wordpress-publish`;
      console.log("Calling edge function at URL:", functionUrl);
      
      updatePublishingStep("server", "loading", "Publication sur WordPress via serveur", 50);
      
      // Appel à la fonction Edge avec l'authentification JWT
      const { data: sessionData } = await supabase.auth.getSession();
      
      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionData.session?.access_token || ''}`
        },
        body: JSON.stringify({
          announcementId: announcement.id,
          userId,
          categoryId: wordpressCategoryId
        })
      });
      
      // Check if the response is not OK (HTTP error)
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`Error response from Edge Function: ${response.status} ${errorText}`);
        
        updatePublishingStep("server", "error", `Erreur du serveur: ${response.status}`, 60);
        
        throw new Error(`Erreur du serveur: ${response.status} ${errorText}`);
      }
      
      // Parse JSON response
      const responseData = await response.json();
      console.log("Server response:", responseData);
      
      // Check for success in response
      if (!responseData.success) {
        updatePublishingStep("server", "error", responseData.message || "Erreur inconnue", 60);
        return {
          success: false,
          message: responseData.message || "Erreur inconnue",
          wordpressPostId: null
        };
      }
      
      // Success case
      updatePublishingStep("server", "success", "Publication réussie sur WordPress", 80);
      updatePublishingStep("database", "success", "Mise à jour complète", 100);
      
      return {
        success: true,
        message: responseData.message || "Publication réussie",
        wordpressPostId: responseData.data?.wordpressPostId || null
      };
    } catch (error: any) {
      console.error("Error in publishToWordPressServer:", error);
      
      // Ensure current step shows error
      if (publishingState.currentStep) {
        updatePublishingStep(publishingState.currentStep, "error", `Erreur: ${error.message}`, 60);
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
