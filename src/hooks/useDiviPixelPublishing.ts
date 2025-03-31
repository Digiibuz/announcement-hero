
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { DiviPixelPage } from "@/types/announcement";
import { toast } from "sonner";

export const useDiviPixelPublishing = () => {
  const [isPublishing, setIsPublishing] = useState(false);
  
  const publishToDiviPixel = async (
    diviPixelPage: DiviPixelPage,
    wordpressCategoryId: string,
    userId: string
  ): Promise<{ success: boolean; message: string; wordpressPostId: number | null }> => {
    setIsPublishing(true);
    
    try {
      // Récupérer la configuration WordPress de l'utilisateur
      const { data: userProfile, error: profileError } = await supabase
        .from('profiles')
        .select('wordpress_config_id')
        .eq('id', userId)
        .single();

      if (profileError || !userProfile?.wordpress_config_id) {
        console.error("Erreur lors de la récupération de la configuration WordPress:", profileError || "Aucun ID de configuration WordPress trouvé");
        return { 
          success: false, 
          message: "Configuration WordPress introuvable",
          wordpressPostId: null 
        };
      }
      
      // Récupérer les détails de la configuration WordPress
      const { data: wpConfig, error: wpConfigError } = await supabase
        .from('wordpress_configs')
        .select('*')
        .eq('id', userProfile.wordpress_config_id)
        .single();
        
      if (wpConfigError || !wpConfig) {
        console.error("Erreur lors de la récupération des détails de la configuration WordPress:", wpConfigError || "Aucune configuration trouvée");
        return { 
          success: false, 
          message: "Configuration WordPress introuvable", 
          wordpressPostId: null 
        };
      }
      
      // S'assurer que l'URL du site a le bon format
      const siteUrl = wpConfig.site_url.endsWith('/') 
        ? wpConfig.site_url.slice(0, -1) 
        : wpConfig.site_url;
      
      // Construire l'URL de l'API REST WordPress pour les pages DiviPixel
      const apiUrl = `${siteUrl}/wp-json/wp/v2/dipi_cpt`;
      
      // Préparer les données du post
      const wpPostData = {
        title: diviPixelPage.title,
        content: JSON.stringify({
          organization_pixels: diviPixelPage.organization_pixels || {},
          components_used: diviPixelPage.components_used || []
        }),
        status: diviPixelPage.status === 'published' ? 'publish' : diviPixelPage.status === 'scheduled' ? 'future' : 'draft',
        dipi_cpt_category: [parseInt(wordpressCategoryId)],
        // Ajouter la date si programmée
        date: diviPixelPage.status === 'scheduled' && diviPixelPage.publish_date
          ? new Date(diviPixelPage.publish_date).toISOString()
          : undefined,
        // Ajouter les métadonnées SEO
        meta: {
          _yoast_wpseo_title: diviPixelPage.seo_title || "",
          _yoast_wpseo_metadesc: diviPixelPage.meta_description || "",
          _yoast_wpseo_focuskw: diviPixelPage.title
        }
      };
      
      console.log("Données du post DiviPixel:", wpPostData);
      
      // Préparer les headers avec authentification
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      
      // Vérifier les informations d'authentification
      if (wpConfig.app_username && wpConfig.app_password) {
        // Format d'authentification par mot de passe d'application: "Basic base64(username:password)"
        const basicAuth = btoa(`${wpConfig.app_username}:${wpConfig.app_password}`);
        headers['Authorization'] = `Basic ${basicAuth}`;
        console.log("Utilisation de l'authentification par mot de passe d'application");
      } else {
        return { 
          success: false, 
          message: "Aucune méthode d'authentification disponible", 
          wordpressPostId: null 
        };
      }
      
      // Envoyer la requête à WordPress
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(wpPostData)
      });
      
      // Gérer la réponse
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Erreur de l'API WordPress:", errorText);
        return { 
          success: false, 
          message: `Erreur lors de la publication WordPress (${response.status}): ${errorText}`, 
          wordpressPostId: null 
        };
      }
      
      const wpResponseData = await response.json();
      console.log("Réponse WordPress:", wpResponseData);
      
      // Vérifier si la réponse contient l'ID du post WordPress
      if (wpResponseData && wpResponseData.id) {
        // Mettre à jour la page DiviPixel dans Supabase avec l'ID du post WordPress
        const { error: updateError } = await supabase
          .from("divipixel_pages")
          .update({ wordpress_post_id: wpResponseData.id })
          .eq("id", diviPixelPage.id);
          
        if (updateError) {
          console.error("Erreur lors de la mise à jour de la page DiviPixel avec l'ID du post WordPress:", updateError);
          toast.error("La page a été publiée sur WordPress mais l'ID n'a pas pu être enregistré dans la base de données");
        } else {
          console.log("Mise à jour réussie de la page DiviPixel avec l'ID du post WordPress:", wpResponseData.id);
        }
        
        return { 
          success: true, 
          message: "Publié avec succès sur WordPress", 
          wordpressPostId: wpResponseData.id 
        };
      } else {
        console.error("La réponse WordPress ne contient pas l'ID du post", wpResponseData);
        return { 
          success: false, 
          message: "La réponse WordPress ne contient pas l'ID du post", 
          wordpressPostId: null 
        };
      }
    } catch (error: any) {
      console.error("Erreur lors de la publication sur WordPress:", error);
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
    publishToDiviPixel,
    isPublishing
  };
};
