
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
    
    // Étape de préparation
    updatePublishingStep("prepare", "loading", "Préparation de la publication", 10);
    
    try {
      console.log("Démarrage de la publication WordPress côté serveur...");
      
      updatePublishingStep("prepare", "success", "Préparation terminée", 30);
      updatePublishingStep("server", "loading", "Publication sur WordPress via serveur", 40);
      
      // Journaliser clairement la charge utile pour le débogage
      const payload = {
        announcementId: announcement.id,
        userId: userId,
        categoryId: wordpressCategoryId
      };
      
      console.log("Appel de la fonction edge avec la charge utile:", JSON.stringify(payload, null, 2));
      
      // Appeler la fonction edge avec un timeout étendu et le débogage
      let response;
      try {
        // Définir un délai d'attente plus long pour la fonction edge
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error("Délai d'attente dépassé lors de l'appel à la fonction edge")), 30000);
        });
        
        // Appeler la fonction edge avec gestion améliorée des erreurs
        const fetchPromise = supabase.functions.invoke("wordpress-publish", {
          body: payload,
          headers: {
            "Content-Type": "application/json"
          }
        });
        
        // Utiliser Promise.race pour éviter les attentes infinies
        response = await Promise.race([fetchPromise, timeoutPromise]);
        
        console.log("Réponse brute de la fonction edge:", response);
      } catch (invokeError: any) {
        console.error("Erreur d'invocation de la fonction edge:", invokeError);
        console.error("Message d'erreur:", invokeError.message);
        console.error("Stack d'erreur:", invokeError.stack);
        
        // Vérifier si c'est une erreur de CORS
        if (invokeError.message && invokeError.message.includes('CORS')) {
          updatePublishingStep("server", "error", `Erreur CORS: ${invokeError.message}`, 50);
          return { 
            success: false, 
            message: `Erreur CORS lors de l'invocation de la fonction: ${invokeError.message}`, 
            wordpressPostId: null 
          };
        }
        
        // Vérifier si c'est une erreur de timeout
        if (invokeError.message && invokeError.message.includes('timeout')) {
          updatePublishingStep("server", "error", `Délai d'attente dépassé: ${invokeError.message}`, 50);
          return { 
            success: false, 
            message: `Délai d'attente dépassé lors de l'appel à la fonction: ${invokeError.message}`, 
            wordpressPostId: null 
          };
        }
        
        // Autres erreurs d'invocation
        updatePublishingStep("server", "error", `Erreur d'invocation: ${invokeError.message || "Erreur inconnue"}`, 50);
        return { 
          success: false, 
          message: `Erreur d'invocation de la fonction: ${invokeError.message || "Erreur inconnue"}`, 
          wordpressPostId: null 
        };
      }
      
      // Traiter la réponse avec une meilleure gestion des erreurs
      if (!response) {
        console.error("La fonction edge a renvoyé une réponse nulle");
        updatePublishingStep("server", "error", "Réponse vide de la fonction", 50);
        return { 
          success: false, 
          message: "La fonction n'a pas renvoyé de réponse", 
          wordpressPostId: null 
        };
      }
      
      // Vérifier les erreurs dans la réponse
      if (response.error) {
        console.error("Erreur de la fonction edge:", response.error);
        
        // Essayer d'extraire plus de détails de l'erreur
        let errorMessage = response.error.message || "Erreur serveur";
        let errorDetails = "";
        
        if (response.error.value && typeof response.error.value === 'object') {
          errorDetails = JSON.stringify(response.error.value);
          if (response.error.value.message) {
            errorMessage = response.error.value.message;
          }
        }
        
        updatePublishingStep("server", "error", `Erreur: ${errorMessage}`, 50);
        return { 
          success: false, 
          message: `Erreur lors de la publication: ${errorMessage}`, 
          wordpressPostId: null 
        };
      }
      
      const data = response.data;
      console.log("Réponse de données de la fonction edge:", data);
      
      if (!data || data.success === false) {
        console.error("Échec de la publication WordPress:", data ? data.message : "Aucune donnée renvoyée");
        updatePublishingStep("server", "error", `Échec: ${data?.message || "Échec inconnu"}`, 50);
        return { 
          success: false, 
          message: data?.message || "Échec de la publication WordPress", 
          wordpressPostId: null 
        };
      }
      
      // Succès ! Mettre à jour l'interface utilisateur et renvoyer le résultat
      updatePublishingStep("server", "success", "Publication WordPress réussie", 80);
      updatePublishingStep("database", "success", "Mise à jour de la base de données terminée", 100);
      
      let postLink = "";
      if (data.data && data.data.postUrl) {
        postLink = ` (URL: ${data.data.postUrl})`;
      }
      
      // Journaliser le succès pour le débogage
      console.log("Publication WordPress terminée avec succès:", {
        wordpressPostId: data.data?.wordpressPostId,
        postUrl: data.data?.postUrl,
        isCustomPostType: data.data?.isCustomPostType
      });
      
      // Vérifier si le post est accessible
      if (data.data?.postUrl) {
        try {
          const postUrlCheckMessage = "Vérification de l'accessibilité de l'article...";
          console.log(postUrlCheckMessage);
          toast.info(postUrlCheckMessage);
          
          const response = await fetch(data.data.postUrl, {
            method: 'HEAD',
            mode: 'no-cors' // Utiliser le mode no-cors pour contourner les problèmes de CORS avec la vérification
          });
          
          console.log("Statut de la réponse de vérification d'URL du post:", response.status);
          
          if (response.status === 200) {
            console.log("Le post est accessible !");
            toast.success("L'article est accessible publiquement");
          } else {
            console.warn("Le post pourrait ne pas être accessible publiquement pour le moment:", response.status);
            toast.warning("L'article a été publié mais pourrait ne pas être immédiatement accessible");
          }
        } catch (e) {
          console.warn("Échec de la vérification de l'accessibilité du post:", e);
        }
      }
      
      return { 
        success: true, 
        message: `Publication réussie avec ID: ${data.data?.wordpressPostId}${postLink}`, 
        wordpressPostId: data.data?.wordpressPostId || null 
      };
    } catch (error: any) {
      console.error("Erreur dans le processus de publication serveur:", error);
      console.error("Message d'erreur:", error.message);
      console.error("Stack d'erreur:", error.stack);
      
      // Mettre à jour l'étape actuelle avec l'erreur
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
