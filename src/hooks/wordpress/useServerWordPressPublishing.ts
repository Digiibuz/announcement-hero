
import { useState } from 'react';
import { Announcement } from '@/types/announcement';
import { toast } from 'sonner';

export type PublishingStatus = 'idle' | 'loading' | 'success' | 'error';

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
    prepare: { status: 'idle' },
    server: { status: 'idle' },
    database: { status: 'idle' }
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
    wordpressCategory: string,
    userId: string
  ) => {
    try {
      setIsPublishing(true);
      resetPublishingState();
      
      // Step 1: Prepare for publishing
      updatePublishingStep("prepare", "loading", "Préparation des données", 10);
      
      console.log("Publishing announcement", {
        announcementId: announcement.id,
        userId,
        categoryId: wordpressCategory
      });
      
      updatePublishingStep("prepare", "success", "Données préparées", 30);
      
      // Step 2: Call the Edge Function
      updatePublishingStep("server", "loading", "Envoi à WordPress", 40);
      
      // Get Supabase URL from environment or use a default fallback
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://rdwqedmvzicerwotjseg.supabase.co";
      
      // Making the API call to the Edge Function with proper URL and authentication
      const response = await fetch(`${supabaseUrl}/functions/v1/wordpress-publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          announcementId: announcement.id,
          userId,
          categoryId: wordpressCategory
        })
      });
      
      // Detailed error handling
      if (!response.ok) {
        let errorText = "";
        let errorDetail = "";
        
        try {
          const errorData = await response.json();
          errorText = errorData.message || response.statusText;
          
          if (response.status === 401) {
            errorDetail = "Problème d'authentification avec WordPress. Veuillez vérifier vos identifiants WordPress dans les paramètres.";
          } else if (response.status === 404) {
            errorDetail = "Point d'accès WordPress introuvable. Vérifiez l'URL du site WordPress.";
          } else {
            errorDetail = `Erreur ${response.status}: ${errorText}`;
          }
        } catch (e) {
          errorDetail = `Erreur inattendue: ${response.status} ${response.statusText}`;
        }
        
        console.error("Error response from Edge Function:", errorDetail);
        updatePublishingStep("server", "error", `Erreur: ${errorDetail}`, 60);
        return { success: false, message: errorDetail, wordpressPostId: null };
      }
      
      // Successful response processing
      const result = await response.json();
      
      if (result.success) {
        updatePublishingStep("server", "success", "Publication WordPress réussie", 70);
        updatePublishingStep("database", "success", "Base de données mise à jour", 100);
        
        return {
          success: true,
          message: result.message || "Publication réussie sur WordPress",
          wordpressPostId: result.data?.wordpressPostId || null
        };
      } else {
        updatePublishingStep("server", "error", result.message || "Erreur inconnue", 70);
        return {
          success: false,
          message: result.message || "Échec de la publication sur WordPress",
          wordpressPostId: null
        };
      }
      
    } catch (error: any) {
      console.error("Error in server publishing:", error);
      
      // Update the current step with error status
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
