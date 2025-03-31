
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DivipixelPublication } from "@/types/divipixel";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { useWordPressPublishing } from "./useWordPressPublishing";

export const useDivipixelPublications = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();
  const { publishToWordPress, isPublishing } = useWordPressPublishing();

  const createPublication = async (data: any) => {
    try {
      setIsSubmitting(true);

      // Préparer les données de la publication
      const publicationData = {
        user_id: user?.id,
        title: data.title,
        description: data.description,
        status: data.status as "draft" | "published" | "scheduled",
        images: data.images || [],
        wordpress_category_id: data.wordpressCategory,
        publish_date: data.publishDate ? new Date(data.publishDate).toISOString() : null,
        seo_title: data.seoTitle || null,
        seo_description: data.seoDescription || null,
        seo_slug: data.seoSlug || null
      };
      console.log("Enregistrement de la publication Divipixel:", publicationData);

      // Enregistrer dans Supabase
      const {
        data: newPublication,
        error
      } = await supabase
        .from("divipixel_publications")
        .insert(publicationData)
        .select()
        .single();
        
      if (error) throw error;
      console.log("Publication Divipixel enregistrée dans Supabase:", newPublication);

      // Si le statut est "published" ou "scheduled", essayer de publier sur WordPress
      let wordpressResult = {
        success: true,
        message: "",
        wordpressPostId: null as number | null
      };
      
      if ((data.status === 'published' || data.status === 'scheduled') && data.wordpressCategory && user?.id) {
        console.log("Tentative de publication sur WordPress (Divipixel)...");
        wordpressResult = await publishToWordPress(newPublication as any, data.wordpressCategory, user.id, true);
        
        console.log("Résultat de la publication WordPress (Divipixel):", wordpressResult);
      }
      
      if (wordpressResult.success) {
        toast.success("Publication Divipixel enregistrée avec succès");
        return newPublication;
      } else {
        toast.error("Publication enregistrée dans la base de données, mais la publication WordPress a échoué: " + (wordpressResult.message || "Erreur inconnue"));
        return newPublication;
      }
    } catch (error: any) {
      console.error("Error saving Divipixel publication:", error);
      toast.error("Erreur lors de l'enregistrement: " + error.message);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    createPublication,
    isSubmitting: isSubmitting || isPublishing
  };
};
