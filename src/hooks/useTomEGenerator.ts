
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface TomEContent {
  title: string;
  meta_description: string;
  h1: string;
  content: string;
  slug: string;
}

interface GenerateContentParams {
  configId: string;
  category: string;
  categoryId: string;
  keyword: string;
  locality: string;
}

interface PublishToWordPressParams {
  configId: string;
  categoryId: string;
  content: TomEContent;
  status?: 'draft' | 'publish' | 'future';
  publishDate?: string;
}

export const useTomEGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);

  const generateContent = async ({ 
    configId, 
    category, 
    categoryId, 
    keyword, 
    locality 
  }: GenerateContentParams): Promise<TomEContent> => {
    try {
      setIsGenerating(true);

      // Récupérer le prompt de la configuration WordPress
      const { data: configData, error: configError } = await supabase
        .from('wordpress_configs')
        .select('prompt')
        .eq('id', configId)
        .single();
      
      if (configError) {
        throw new Error(`Erreur lors de la récupération de la configuration: ${configError.message}`);
      }

      if (!configData.prompt) {
        throw new Error("Aucun prompt défini pour cette configuration WordPress");
      }

      // Appeler la fonction Edge pour générer le contenu
      const { data: generatedContent, error } = await supabase.functions.invoke(
        'generate-tom-e-content',
        {
          body: {
            prompt: configData.prompt,
            category,
            keyword,
            locality,
            configId
          },
        }
      );

      if (error) {
        throw new Error(`Erreur lors de la génération du contenu: ${error.message}`);
      }

      toast.success("Contenu généré avec succès");
      return generatedContent as TomEContent;
    } catch (error: any) {
      console.error("Erreur lors de la génération du contenu:", error);
      toast.error(error.message || "Erreur lors de la génération du contenu");
      throw error;
    } finally {
      setIsGenerating(false);
    }
  };

  const publishToWordPress = async ({
    configId,
    categoryId,
    content,
    status = 'draft',
    publishDate
  }: PublishToWordPressParams) => {
    try {
      setIsPublishing(true);
      
      // Récupérer les informations de connexion WordPress
      const { data: configData, error: configError } = await supabase
        .from('wordpress_configs')
        .select('site_url, app_username, app_password')
        .eq('id', configId)
        .single();
      
      if (configError) {
        throw new Error(`Erreur lors de la récupération des informations de connexion: ${configError.message}`);
      }

      // Vérifier que les identifiants sont disponibles
      if (!configData.app_username || !configData.app_password) {
        throw new Error("Identifiants de connexion WordPress manquants");
      }

      // Configurer l'authentification
      const auth = btoa(`${configData.app_username}:${configData.app_password}`);

      // Préparer les données pour l'API WordPress
      const postData = {
        title: content.title,
        content: content.content,
        status,
        slug: content.slug,
        meta: {
          _yoast_wpseo_metadesc: content.meta_description
        },
        dipi_cpt_category: [parseInt(categoryId)]
      };

      // Ajouter la date de publication si nécessaire
      if (status === 'future' && publishDate) {
        postData.date = publishDate;
      }

      // Normaliser l'URL
      const siteUrl = configData.site_url.replace(/\/+$/, '');
      
      // Appeler l'API WordPress pour créer la page
      const response = await fetch(`${siteUrl}/wp-json/wp/v2/dipi_cpt`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${auth}`
        },
        body: JSON.stringify(postData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur lors de la publication: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      
      toast.success(`Page ${status === 'draft' ? 'enregistrée en brouillon' : 'publiée'} avec succès`);
      return responseData;
    } catch (error: any) {
      console.error("Erreur lors de la publication:", error);
      toast.error(error.message || "Erreur lors de la publication sur WordPress");
      throw error;
    } finally {
      setIsPublishing(false);
    }
  };

  return {
    isGenerating,
    isPublishing,
    generateContent,
    publishToWordPress
  };
};
