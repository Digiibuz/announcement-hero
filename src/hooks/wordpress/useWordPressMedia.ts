
import { toast } from "sonner";
import { PublishingStep } from "../useWordPressPublishing";

/**
 * Handles WordPress media uploads
 */
export const uploadFeatureImage = async (
  announcement: {
    images?: string[];
    title: string;
  },
  siteUrl: string,
  authHeaders: Record<string, string>,
  updateStep: (stepId: string, status: PublishingStep, message?: string, progress?: number) => void
) => {
  let featuredMediaId = null;
  
  if (!announcement.images || announcement.images.length === 0) {
    updateStep("image", "success", "Aucune image à téléverser", 60);
    return featuredMediaId;
  }
  
  try {
    updateStep("image", "loading", "Téléversement de l'image principale", 40);
    
    // Download image from URL
    const imageUrl = announcement.images[0];
    const imageResponse = await fetch(imageUrl);
    
    if (!imageResponse.ok) {
      console.error("Échec de la récupération de l'image depuis l'URL:", imageUrl);
      updateStep("image", "error", "Échec de récupération de l'image");
      toast.warning("L'image principale n'a pas pu être préparée, publication sans image");
      return null;
    }
    
    const imageBlob = await imageResponse.blob();
    const fileName = imageUrl.split('/').pop() || `image-${Date.now()}.jpg`;
    const imageFile = new File([imageBlob], fileName, { 
      type: imageBlob.type || 'image/jpeg' 
    });
    
    // Upload to WordPress media library
    console.log("Téléversement de l'image vers la bibliothèque média WordPress");
    const mediaFormData = new FormData();
    mediaFormData.append('file', imageFile);
    mediaFormData.append('title', announcement.title);
    mediaFormData.append('alt_text', announcement.title);
    
    const mediaEndpoint = `${siteUrl}/wp-json/wp/v2/media`;
    console.log("Media endpoint:", mediaEndpoint);
    
    // Create headers for media upload (without Content-Type)
    const mediaHeaders = new Headers();
    if (authHeaders.Authorization) {
      mediaHeaders.append('Authorization', authHeaders.Authorization);
      console.log("Added authorization header to media request");
    }
    
    const mediaResponse = await fetch(mediaEndpoint, {
      method: 'POST',
      headers: mediaHeaders,
      body: mediaFormData
    });
    
    if (!mediaResponse.ok) {
      const mediaErrorText = await mediaResponse.text();
      console.error("Erreur lors du téléversement du média:", mediaResponse.status, mediaErrorText);
      updateStep("image", "error", `Échec du téléversement de l'image (${mediaResponse.status})`);
      toast.warning("L'image principale n'a pas pu être téléversée, publication sans image");
      return null;
    }
    
    const mediaData = await mediaResponse.json();
    
    if (mediaData && mediaData.id) {
      featuredMediaId = mediaData.id;
      console.log("Image téléversée avec succès, ID:", featuredMediaId);
      updateStep("image", "success", "Image téléversée avec succès", 60);
    }
  } catch (error) {
    console.error("Erreur lors du traitement de l'image principale:", error);
    updateStep("image", "error", "Erreur lors du traitement de l'image");
    toast.warning("Erreur lors du traitement de l'image principale, publication sans image");
  }
  
  return featuredMediaId;
};
