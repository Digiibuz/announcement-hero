
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Announcement } from "@/types/announcement";
import { toast } from "sonner";
import { PublishingState, PublishingStatus } from "../useWordPressPublishing";

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
    
    // Start with preparation step
    updatePublishingStep("prepare", "loading", "Préparation de la publication", 10);
    
    try {
      console.log("Starting server-side WordPress publishing...");
      
      updatePublishingStep("prepare", "success", "Préparation terminée", 30);
      updatePublishingStep("server", "loading", "Publication sur WordPress via serveur", 40);
      
      // Add additional logging to help troubleshoot
      console.log("Calling edge function with payload:", {
        announcementId: announcement.id,
        userId: userId,
        categoryId: wordpressCategoryId
      });
      
      // Call the edge function with extended timeout
      const { data, error } = await supabase.functions.invoke("wordpress-publish", {
        body: {
          announcementId: announcement.id,
          userId: userId,
          categoryId: wordpressCategoryId
        },
        headers: {
          "Content-Type": "application/json"
        }
      });
      
      // Log the response for debugging
      console.log("Edge function response:", data);
      
      if (error) {
        console.error("Edge function error:", error);
        
        // Add detailed error information for troubleshooting
        let errorMessage = error.message || "Erreur inconnue";
        
        // Check for CORS issues
        if (errorMessage.includes("CORS") || error.name === "TypeError") {
          errorMessage = "Erreur CORS: Assurez-vous que l'API WordPress est correctement configurée pour accepter les requêtes externes.";
          toast.error("Erreur CORS détectée. Vérifiez la configuration du site WordPress.");
        }
        
        updatePublishingStep("server", "error", `Erreur: ${errorMessage}`, 50);
        return { 
          success: false, 
          message: `Erreur lors de la publication: ${errorMessage}`, 
          wordpressPostId: null 
        };
      }
      
      if (!data.success) {
        console.error("WordPress publishing failed:", data.message);
        updatePublishingStep("server", "error", `Échec: ${data.message || "Échec inconnu"}`, 50);
        return { 
          success: false, 
          message: data.message || "Échec de la publication WordPress", 
          wordpressPostId: null 
        };
      }
      
      // Success! Update UI and return result
      updatePublishingStep("server", "success", "Publication WordPress réussie", 80);
      updatePublishingStep("database", "success", "Mise à jour de la base de données terminée", 100);
      
      let postLink = "";
      if (data.data && data.data.postUrl) {
        postLink = ` (URL: ${data.data.postUrl})`;
      }
      
      // Log the success for debugging
      console.log("WordPress publishing completed successfully:", {
        wordpressPostId: data.data?.wordpressPostId,
        postUrl: data.data?.postUrl,
        isCustomPostType: data.data?.isCustomPostType
      });
      
      // Check if the post is accessible
      if (data.data?.postUrl) {
        try {
          const postUrlCheckMessage = "Vérification de l'accessibilité de l'article...";
          console.log(postUrlCheckMessage);
          toast.info(postUrlCheckMessage);
          
          const response = await fetch(data.data.postUrl, {
            method: 'HEAD',
            mode: 'no-cors' // Use no-cors mode to bypass CORS issues with verification
          });
          
          console.log("Post URL check response:", response.status);
          
          if (response.status === 200) {
            console.log("Post is accessible!");
            toast.success("L'article est accessible publiquement");
          } else {
            console.warn("Post may not be publicly accessible yet:", response.status);
            toast.warning("L'article a été publié mais pourrait ne pas être immédiatement accessible");
          }
        } catch (e) {
          console.warn("Failed to check post accessibility:", e);
        }
      }
      
      return { 
        success: true, 
        message: `Publication réussie avec ID: ${data.data?.wordpressPostId}${postLink}`, 
        wordpressPostId: data.data?.wordpressPostId || null 
      };
    } catch (error: any) {
      console.error("Error in server publishing process:", error);
      
      // Update the current step with error
      if (publishingState.currentStep) {
        updatePublishingStep(
          publishingState.currentStep, 
          "error", 
          `Erreur: ${error.message || "Erreur inconnue"}`
        );
      }
      
      return { 
        success: false, 
        message: `Erreur lors de la publication: ${error.message || "Erreur inconnue"}`, 
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
