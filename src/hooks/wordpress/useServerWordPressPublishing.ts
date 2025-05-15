
import { useState } from "react";
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
    categoryId: string,
    userId: string
  ): Promise<{ success: boolean; message: string; wordpressPostId: number | null }> => {
    setIsPublishing(true);
    resetPublishingState();
    
    try {
      // Step 1: Prepare the request
      updatePublishingStep("prepare", "loading", "Préparation de la publication", 20);
      
      // Prepare the payload data
      const payload = {
        announcementId: announcement.id,
        userId: userId,
        categoryId: categoryId
      };
      
      console.log("Publishing announcement", payload);
      
      updatePublishingStep("prepare", "success", "Préparation terminée", 30);
      
      // Step 2: Make the server call
      updatePublishingStep("server", "loading", "Envoi vers WordPress", 40);
      
      // Get JWT token from localStorage for authorization
      const accessToken = localStorage.getItem('supabase.auth.token') || localStorage.getItem('sb-rdwqedmvzicerwotjseg-auth-token');
      
      if (!accessToken) {
        throw new Error("Token d'authentification non trouvé. Veuillez vous reconnecter.");
      }
      
      let parsedToken;
      try {
        parsedToken = JSON.parse(accessToken);
      } catch (e) {
        console.error("Erreur lors de la lecture du token:", e);
        throw new Error("Format de token invalide. Veuillez vous reconnecter.");
      }
      
      const token = parsedToken?.currentSession?.access_token || parsedToken?.access_token;
      
      if (!token) {
        throw new Error("Token d'accès non trouvé. Veuillez vous reconnecter.");
      }
      
      // CORRECTION: Utiliser la bonne URL de l'API Edge Function
      // Modification du chemin de l'API pour utiliser l'URL complète de l'Edge Function
      const supabaseUrl = window.location.hostname.includes('localhost') 
        ? "http://localhost:54321"
        : "https://rdwqedmvzicerwotjseg.supabase.co";
      
      const edgeFunctionUrl = `${supabaseUrl}/functions/v1/wordpress-publish`;
      console.log("Calling edge function at URL:", edgeFunctionUrl);
      
      // Call the Edge Function with proper authorization
      const response = await fetch(edgeFunctionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Error response from Edge Function:", response.status, errorText);
        throw new Error(`Erreur du serveur: ${response.status} ${errorText}`);
      }
      
      // Parse and process the response
      const responseData = await response.json();
      updatePublishingStep("server", "success", "Publication sur WordPress réussie", 70);
      
      // Step 3: Update the database status if necessary
      updatePublishingStep("database", "loading", "Mise à jour de la base de données", 80);
      
      if (responseData.success && responseData.data?.wordpressPostId) {
        // The Edge Function already updates the announcement record
        updatePublishingStep("database", "success", "Base de données mise à jour", 100);
        
        return {
          success: true,
          message: "Publication réussie",
          wordpressPostId: responseData.data.wordpressPostId
        };
      } else {
        updatePublishingStep("database", "error", "Erreur lors de la mise à jour", 80);
        return {
          success: false,
          message: responseData.message || "Erreur inconnue",
          wordpressPostId: null
        };
      }
    } catch (error: any) {
      console.error("Error in publishToWordPressServer:", error);
      updatePublishingStep(
        publishingState.currentStep || "server", 
        "error", 
        `Erreur: ${error.message || "Erreur inconnue"}`,
        50
      );
      return {
        success: false,
        message: error.message || "Une erreur est survenue lors de la publication",
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
