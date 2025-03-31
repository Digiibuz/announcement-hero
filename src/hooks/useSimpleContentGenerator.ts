
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ContentGenerationParams {
  topic: string;
  keywords: string;
  targetLength: number;
}

interface GeneratedContent {
  title: string;
  content: string;
  metaDescription: string;
}

export const useSimpleContentGenerator = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);

  const generateContent = async (params: ContentGenerationParams): Promise<GeneratedContent | null> => {
    try {
      setIsGenerating(true);
      
      // Appeler la fonction Edge pour générer le contenu
      const { data, error } = await supabase.functions.invoke(
        'generate-simple-content',
        {
          body: {
            topic: params.topic,
            keywords: params.keywords,
            targetLength: params.targetLength
          },
        }
      );

      if (error) {
        throw new Error(`Erreur lors de la génération: ${error.message}`);
      }

      if (!data) {
        throw new Error("Aucun contenu n'a été généré");
      }

      const content = data as GeneratedContent;
      setGeneratedContent(content);
      toast.success("Contenu généré avec succès");
      return content;
    } catch (error: any) {
      console.error("Erreur:", error);
      toast.error(error.message || "Erreur lors de la génération du contenu");
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  const publishToWordPress = async (
    content: GeneratedContent, 
    categoryId: string, 
    status: 'draft' | 'publish' = 'draft'
  ) => {
    try {
      setIsPublishing(true);
      
      const { data, error } = await supabase.functions.invoke(
        'publish-simple-content',
        {
          body: {
            title: content.title,
            content: content.content,
            metaDescription: content.metaDescription,
            categoryId,
            status
          },
        }
      );

      if (error) {
        throw new Error(`Erreur lors de la publication: ${error.message}`);
      }

      toast.success(`Contenu ${status === 'draft' ? 'enregistré en brouillon' : 'publié'} avec succès`);
      return data;
    } catch (error: any) {
      console.error("Erreur lors de la publication:", error);
      toast.error(error.message || "Erreur lors de la publication du contenu");
      return null;
    } finally {
      setIsPublishing(false);
    }
  };

  return {
    isGenerating,
    isPublishing,
    generatedContent,
    generateContent,
    publishToWordPress,
    clearContent: () => setGeneratedContent(null)
  };
};
