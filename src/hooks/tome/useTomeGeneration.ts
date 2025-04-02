
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TomeGeneration, CategoryKeyword, Locality } from "@/types/tome";
import { format } from "date-fns";

interface ExtendedTomeGeneration extends TomeGeneration {
  error_message?: string | null;
  title?: string | null;
  content?: string | null;
  wordpress_site_url?: string | null;
}

export const useTomeGeneration = (configId: string | null) => {
  const [generations, setGenerations] = useState<ExtendedTomeGeneration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<Record<string, string | null>>({});
  const [contentErrors, setContentErrors] = useState<Record<string, string>>({});
  const [pollingGenerations, setPollingGenerations] = useState<string[]>([]);

  const fetchGenerations = useCallback(async () => {
    if (!configId) {
      setGenerations([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("tome_generations")
        .select(`
          *,
          category:categories_keywords!tome_generations_category_id_fkey(category_name),
          keyword:categories_keywords(keyword),
          locality:localities(name, region),
          wordpress_config:wordpress_configs(site_url)
        `)
        .eq("wordpress_config_id", configId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching generations:", error);
        toast.error("Erreur lors du chargement des générations: " + error.message);
        return;
      }

      // Transformer les données pour inclure l'URL du site WordPress
      const typedData = data.map(item => ({
        ...item,
        wordpress_site_url: item.wordpress_config?.site_url
      })) as ExtendedTomeGeneration[];
      
      setGenerations(typedData);
      
      // Identify generations that are in progress
      const pendingIds = typedData
        .filter(gen => gen.status === 'pending' || gen.status === 'processing')
        .map(gen => gen.id);
      
      // Update polling list
      setPollingGenerations(pendingIds);
      
      // Fetch content for completed generations with content field
      for (const generation of typedData) {
        if (generation.content) {
          setGeneratedContent(prev => ({
            ...prev,
            [generation.id]: generation.content
          }));
        }
      }
    } catch (error: any) {
      console.error("Error in fetchGenerations:", error);
    } finally {
      setIsLoading(false);
    }
  }, [configId]);

  // Setup polling for in-progress generations
  useEffect(() => {
    if (pollingGenerations.length === 0) return;
    
    console.log("Setting up polling for generations:", pollingGenerations);
    
    const intervalId = setInterval(() => {
      fetchGenerations();
    }, 5000); // Poll every 5 seconds
    
    return () => clearInterval(intervalId);
  }, [pollingGenerations, fetchGenerations]);

  useEffect(() => {
    fetchGenerations();
  }, [fetchGenerations]);

  const fetchGeneratedContent = async (generationId: string, postId: number) => {
    try {
      // First check if we already have the content for this generation
      if (generatedContent[generationId]) return;
      
      // Get WordPress config to determine the site URL
      const { data: wpConfig, error: wpConfigError } = await supabase
        .from("wordpress_configs")
        .select("site_url")
        .eq("id", configId)
        .single();
        
      if (wpConfigError || !wpConfig) {
        console.error("Error fetching WordPress config:", wpConfigError);
        setContentErrors(prev => ({
          ...prev,
          [generationId]: "Impossible de récupérer la configuration WordPress"
        }));
        return;
      }
      
      // Fetch the content
      const { data: contentData, error: contentError } = await supabase.functions.invoke('fetch-tome-content', {
        body: { 
          siteUrl: wpConfig.site_url,
          postId: postId
        }
      });
      
      if (contentError) {
        console.error("Error fetching content:", contentError);
        setContentErrors(prev => ({
          ...prev,
          [generationId]: `Erreur: ${contentError.message || "Échec de la récupération du contenu"}`
        }));
        return;
      }
      
      if (contentData?.success === false) {
        console.error("Content API returned error:", contentData.message);
        setContentErrors(prev => ({
          ...prev,
          [generationId]: `Erreur: ${contentData.message || "Contenu introuvable"}`
        }));
        return;
      }
      
      if (contentData?.content) {
        setGeneratedContent(prev => ({
          ...prev,
          [generationId]: contentData.content
        }));
        
        // Clear any previous errors
        setContentErrors(prev => {
          const newErrors = {...prev};
          delete newErrors[generationId];
          return newErrors;
        });
      } else {
        setContentErrors(prev => ({
          ...prev,
          [generationId]: "Le contenu est vide ou le format est incorrect"
        }));
      }
    } catch (error: any) {
      console.error("Error in fetchGeneratedContent:", error);
      setContentErrors(prev => ({
        ...prev,
        [generationId]: `Erreur: ${error.message || "Erreur inconnue"}`
      }));
    }
  };

  const createGeneration = async (
    categoryId: string,
    keyword: CategoryKeyword | null,
    locality: Locality | null,
    scheduleDate: Date | null,
    title?: string,
    description?: string,
    status: 'pending' | 'draft' | 'scheduled' = 'pending'
  ) => {
    if (!configId) return false;

    try {
      setIsSubmitting(true);
      
      const isScheduled = scheduleDate !== null;
      const formattedDate = scheduleDate ? format(scheduleDate, "yyyy-MM-dd'T'HH:mm:ss") : null;
      
      // Check if keyword or locality is "none" and set to null
      const keywordId = keyword?.id === "none" ? null : keyword?.id || null;
      const localityId = locality?.id === "none" ? null : locality?.id || null;
      
      // Statut déterminé par les paramètres ou la planification
      const effectiveStatus = isScheduled ? "scheduled" : status;
      
      const newGeneration = {
        wordpress_config_id: configId,
        category_id: categoryId,
        keyword_id: keywordId,
        locality_id: localityId,
        status: effectiveStatus,
        scheduled_at: formattedDate,
        error_message: null,
        title: title || null,
        content: effectiveStatus === "draft" ? "" : null,
        description: description || null
      };

      const { data, error } = await supabase
        .from("tome_generations")
        .insert([newGeneration])
        .select()
        .single();

      if (error) {
        console.error("Error creating generation:", error);
        toast.error("Erreur lors de la création de la génération: " + error.message);
        return false;
      }

      const newData = data as ExtendedTomeGeneration;
      setGenerations([newData, ...generations]);
      
      // Si c'est un brouillon, générer le contenu sans publier
      if (effectiveStatus === "draft") {
        toast.info("Génération du contenu en cours. Cela peut prendre quelques minutes.", { 
          duration: 5000
        });
        
        // Appeler la fonction edge pour démarrer la génération sans publication
        const { data: genData, error: genError } = await supabase.functions.invoke('tome-generate-draft', {
          body: { 
            generationId: data.id,
            skipPublishing: true
          }
        });
        
        if (genError) {
          console.error("Error triggering generation:", genError);
          toast.error("Erreur lors du démarrage de la génération: " + genError.message);
          return false;
        } else if (genData && genData.error) {
          console.error("Generation API returned error:", genData.error);
          toast.error("Erreur lors de la génération: " + genData.error);
          
          // Mettre à jour le statut avec l'erreur
          await supabase
            .from("tome_generations")
            .update({ 
              status: "failed",
              error_message: genData.error
            })
            .eq("id", data.id);
            
          // Mettre à jour la génération locale
          setGenerations(prev => 
            prev.map(gen => 
              gen.id === data.id 
                ? { ...gen, status: 'failed', error_message: genData.error } 
                : gen
            )
          );
          
          return false;
        } else if (genData && genData.success) {
          // Mettre à jour la génération locale avec le contenu généré
          setGenerations(prev => 
            prev.map(gen => 
              gen.id === data.id 
                ? { 
                    ...gen, 
                    status: 'draft',
                    title: genData.title || gen.title,
                    content: genData.content || gen.content
                  } 
                : gen
            )
          );
          
          // Mettre à jour dans Supabase
          await supabase
            .from("tome_generations")
            .update({ 
              status: "draft",
              title: genData.title || title,
              content: genData.content
            })
            .eq("id", data.id);
            
          toast.success("Brouillon créé avec succès");
        }
      } else if (!isScheduled) {
        // Pour les générations immédiates
        toast.info("Génération lancée. Cela peut prendre plusieurs minutes. Le statut sera mis à jour automatiquement.", { 
          duration: 5000
        });
        
        // Appeler la fonction edge pour démarrer la génération
        const { data: genData, error: genError } = await supabase.functions.invoke('tome-generate', {
          body: { generationId: data.id }
        });
        
        if (genError) {
          console.error("Error triggering generation:", genError);
          toast.error("Erreur lors du démarrage de la génération: " + genError.message);
        } else if (genData && genData.error) {
          console.error("Generation API returned error:", genData.error);
          toast.error("Erreur lors de la génération: " + genData.error);
          
          // Mettre à jour le statut avec l'erreur
          await supabase
            .from("tome_generations")
            .update({ 
              status: "failed",
              error_message: genData.error
            })
            .eq("id", data.id);
            
          // Mettre à jour la génération locale
          setGenerations(prev => 
            prev.map(gen => 
              gen.id === data.id 
                ? { ...gen, status: 'failed', error_message: genData.error } 
                : gen
            )
          );
          
          return false;
        } else {
          // Add to polling list
          setPollingGenerations(prev => [...prev, data.id]);
        }
      } else {
        toast.success("Génération planifiée avec succès pour " + format(scheduleDate as Date, "dd/MM/yyyy HH:mm"));
      }
      
      return true;
    } catch (error: any) {
      console.error("Error in createGeneration:", error);
      toast.error(`Erreur: ${error.message || "Erreur inconnue"}`);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const regenerate = async (generationId: string) => {
    try {
      setIsSubmitting(true);
      
      // Update status first
      const { error: updateError } = await supabase
        .from("tome_generations")
        .update({ 
          status: "pending", 
          error_message: null // Réinitialiser le message d'erreur
        })
        .eq("id", generationId);
        
      if (updateError) {
        console.error("Error updating generation status:", updateError);
        toast.error("Erreur lors de la mise à jour du statut: " + updateError.message);
        return false;
      }
      
      toast.info("Relance de la génération. Cela peut prendre plusieurs minutes.", { 
        duration: 5000
      });
      
      // Appeler la fonction edge pour relancer la génération
      const { data: genData, error: genError } = await supabase.functions.invoke('tome-generate', {
        body: { generationId }
      });
      
      if (genError) {
        console.error("Error regenerating content:", genError);
        toast.error("Erreur lors de la régénération: " + genError.message);
        return false;
      } else if (genData && genData.error) {
        console.error("Regeneration API returned error:", genData.error);
        toast.error("Erreur lors de la régénération: " + genData.error);
        
        // Mettre à jour le statut avec l'erreur
        await supabase
          .from("tome_generations")
          .update({ 
            status: "failed",
            error_message: genData.error
          })
          .eq("id", generationId);
          
        // Mettre à jour la génération locale
        setGenerations(prev => 
          prev.map(gen => 
            gen.id === generationId 
              ? { ...gen, status: 'failed', error_message: genData.error } 
              : gen
          )
        );
        
        return false;
      }
      
      // Add to polling list
      setPollingGenerations(prev => [...prev, generationId]);
      
      // Update local state
      setGenerations(prev => 
        prev.map(gen => 
          gen.id === generationId ? { ...gen, status: 'pending', error_message: null } : gen
        )
      );
      
      return true;
    } catch (error: any) {
      console.error("Error in regenerate:", error);
      toast.error(`Erreur: ${error.message || "Erreur inconnue"}`);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    generations,
    isLoading,
    isSubmitting,
    createGeneration,
    regenerate,
    fetchGenerations,
    generatedContent,
    contentErrors,
    fetchGeneratedContent
  };
};
