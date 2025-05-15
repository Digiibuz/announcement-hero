
import { useState } from "react";
import { supabase, supabaseUrl } from "@/integrations/supabase/client";
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
      
      // Get session for JWT authentication
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !sessionData.session?.access_token) {
        console.error("Session error:", sessionError);
        updatePublishingStep("prepare", "error", "Erreur de session: veuillez vous reconnecter", 0);
        throw new Error("Session invalide. Veuillez vous reconnecter.");
      }
      
      // Construire l'URL de la fonction edge avec le projet ID correct
      const functionUrl = `${supabaseUrl}/functions/v1/wordpress-publish`;
      console.log("Calling edge function at URL:", functionUrl);
      
      updatePublishingStep("server", "loading", "Publication sur WordPress via serveur", 50);
      
      // Set timeout for fetch request
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      try {
        const response = await fetch(functionUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionData.session.access_token}`
          },
          body: JSON.stringify({
            announcementId: announcement.id,
            userId,
            categoryId: wordpressCategoryId
          }),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Check if the response is not OK (HTTP error)
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`Error response from Edge Function: ${response.status} ${errorText}`);
          
          let errorMessage = "Erreur du serveur";
          try {
            const errorData = JSON.parse(errorText);
            errorMessage = errorData.message || errorMessage;
          } catch (e) {
            errorMessage = `Erreur ${response.status}: ${errorText.substring(0, 100)}`;
          }
          
          updatePublishingStep("server", "error", `${errorMessage}`, 60);
          
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
      } catch (fetchError: any) {
        clearTimeout(timeoutId);
        
        // Handle timeout errors specifically
        if (fetchError.name === "AbortError") {
          const timeoutMsg = "La requête a pris trop de temps. Veuillez vérifier l'accès à votre site WordPress.";
          updatePublishingStep("server", "error", timeoutMsg, 60);
          return {
            success: false, 
            message: timeoutMsg,
            wordpressPostId: null
          };
        }
        
        throw fetchError;
      }
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
