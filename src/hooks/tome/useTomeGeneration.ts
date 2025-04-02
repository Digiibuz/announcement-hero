import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TomeGeneration, CategoryKeyword, Locality } from "@/types/tome";
import { format } from "date-fns";

interface ExtendedTomeGeneration extends TomeGeneration {
  wordpress_site_url?: string | null;
  category_name?: string | null;
  keyword_text?: string | null;
  locality_name?: string | null;
  locality_region?: string | null;
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
      
      const { data: basicGenerations, error: genError } = await supabase
        .from("tome_generations")
        .select("*")
        .eq("wordpress_config_id", configId)
        .order("created_at", { ascending: false });

      if (genError) {
        console.error("Error fetching generations:", genError);
        toast.error("Erreur lors du chargement des générations: " + genError.message);
        return;
      }

      const { data: wpConfig, error: wpConfigError } = await supabase
        .from("wordpress_configs")
        .select("id, site_url")
        .eq("id", configId)
        .single();

      if (wpConfigError) {
        console.error("Error fetching WordPress config:", wpConfigError);
      }

      const categoryIds = [...new Set(basicGenerations.map(g => g.category_id))];
      const keywordIds = [...new Set(basicGenerations.filter(g => g.keyword_id).map(g => g.keyword_id as string))];
      const localityIds = [...new Set(basicGenerations.filter(g => g.locality_id).map(g => g.locality_id as string))];

      const [categoriesData, keywordsData, localitiesData] = await Promise.all([
        categoryIds.length > 0 
          ? supabase
              .from("categories_keywords")
              .select("id, category_name")
              .in("id", categoryIds)
          : Promise.resolve({ data: [], error: null }),
        
        keywordIds.length > 0
          ? supabase
              .from("categories_keywords")
              .select("id, keyword")
              .in("id", keywordIds)
          : Promise.resolve({ data: [], error: null }),
        
        localityIds.length > 0
          ? supabase
              .from("localities")
              .select("id, name, region")
              .in("id", localityIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      const categoryMap = new Map<string, string>();
      const keywordMap = new Map<string, string>();
      const localityMap = new Map<string, { name: string, region: string | null }>();

      if (categoriesData.data) {
        categoriesData.data.forEach(cat => categoryMap.set(cat.id, cat.category_name));
      }
      
      if (keywordsData.data) {
        keywordsData.data.forEach(kw => keywordMap.set(kw.id, kw.keyword));
      }
      
      if (localitiesData.data) {
        localitiesData.data.forEach(loc => 
          localityMap.set(loc.id, { name: loc.name, region: loc.region })
        );
      }

      const extendedGenerations: ExtendedTomeGeneration[] = basicGenerations.map(gen => {
        const enhanced: ExtendedTomeGeneration = {
          ...gen,
          wordpress_site_url: wpConfig?.site_url || null,
          category_name: categoryMap.get(gen.category_id) || null,
          keyword_text: gen.keyword_id ? keywordMap.get(gen.keyword_id as string) || null : null,
          locality_name: gen.locality_id ? localityMap.get(gen.locality_id as string)?.name || null : null,
          locality_region: gen.locality_id ? localityMap.get(gen.locality_id as string)?.region || null : null
        };
        return enhanced;
      });
      
      setGenerations(extendedGenerations);
      
      const pendingIds = extendedGenerations
        .filter(gen => gen.status === 'pending' || gen.status === 'processing')
        .map(gen => gen.id);
      
      setPollingGenerations(pendingIds);
      
      for (const generation of extendedGenerations) {
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

  useEffect(() => {
    if (pollingGenerations.length === 0) return;
    
    console.log("Setting up polling for generations:", pollingGenerations);
    
    const intervalId = setInterval(() => {
      fetchGenerations();
    }, 5000);
    
    return () => clearInterval(intervalId);
  }, [pollingGenerations, fetchGenerations]);

  useEffect(() => {
    fetchGenerations();
  }, [fetchGenerations]);

  const fetchGeneratedContent = async (generationId: string, postId: number) => {
    try {
      if (generatedContent[generationId]) return;
      
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

  const getGenerationById = async (id: string): Promise<ExtendedTomeGeneration | null> => {
    try {
      if (!id) return null;
      
      const { data: generation, error } = await supabase
        .from("tome_generations")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching generation:", error);
        toast.error("Erreur lors du chargement de la publication: " + error.message);
        return null;
      }

      const { data: wpConfig } = await supabase
        .from("wordpress_configs")
        .select("site_url")
        .eq("id", generation.wordpress_config_id)
        .single();

      const { data: category } = await supabase
        .from("categories_keywords")
        .select("category_name")
        .eq("id", generation.category_id)
        .single();

      let keyword = null;
      if (generation.keyword_id) {
        const { data: keywordData } = await supabase
          .from("categories_keywords")
          .select("keyword")
          .eq("id", generation.keyword_id)
          .single();
        keyword = keywordData;
      }

      let locality = null;
      if (generation.locality_id) {
        const { data: localityData } = await supabase
          .from("localities")
          .select("name, region")
          .eq("id", generation.locality_id)
          .single();
        locality = localityData;
      }

      const enhancedGeneration: ExtendedTomeGeneration = {
        ...generation,
        wordpress_site_url: wpConfig?.site_url || null,
        category_name: category?.category_name || null,
        keyword_text: keyword?.keyword || null,
        locality_name: locality?.name || null,
        locality_region: locality?.region || null
      };
      
      return enhancedGeneration;
    } catch (error: any) {
      console.error("Error in getGenerationById:", error);
      toast.error(`Erreur: ${error.message || "Erreur inconnue"}`);
      return null;
    }
  };

  const updateGeneration = async (
    generationId: string, 
    data: { 
      title?: string; 
      content?: string;
      description?: string;
    }
  ): Promise<boolean> => {
    try {
      const updateData: Partial<TomeGeneration> = {};
      
      if (data.title !== undefined) updateData.title = data.title;
      if (data.content !== undefined) updateData.content = data.content;
      if (data.description !== undefined) updateData.description = data.description;
      
      const { error } = await supabase
        .from("tome_generations")
        .update(updateData)
        .eq("id", generationId);

      if (error) {
        console.error("Error updating generation:", error);
        toast.error("Erreur lors de la mise à jour: " + error.message);
        return false;
      }
      
      setGenerations(prev => 
        prev.map(gen => 
          gen.id === generationId 
            ? { 
                ...gen, 
                title: data.title !== undefined ? data.title : gen.title,
                content: data.content !== undefined ? data.content : gen.content,
                description: data.description !== undefined ? data.description : gen.description
              } 
            : gen
        )
      );
      
      return true;
    } catch (error: any) {
      console.error("Error in updateGeneration:", error);
      toast.error(`Erreur: ${error.message || "Erreur inconnue"}`);
      return false;
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
      
      const keywordId = keyword?.id === "none" ? null : keyword?.id || null;
      const localityId = locality?.id === "none" ? null : locality?.id || null;
      
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

      const newlyCreatedGeneration = await getGenerationById(data.id);
      
      if (newlyCreatedGeneration) {
        setGenerations([newlyCreatedGeneration, ...generations]);
      } else {
        setGenerations([data as ExtendedTomeGeneration, ...generations]);
      }
      
      if (effectiveStatus === "draft") {
        toast.info("Génération du contenu en cours. Cela peut prendre quelques minutes.", { 
          duration: 5000
        });
        
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
          
          await supabase
            .from("tome_generations")
            .update({ 
              status: "failed",
              error_message: genData.error
            })
            .eq("id", data.id);
            
          setGenerations(prev => 
            prev.map(gen => 
              gen.id === data.id 
                ? { ...gen, status: 'failed', error_message: genData.error } 
                : gen
            )
          );
          
          return false;
        } else if (genData && genData.success) {
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
        toast.info("Génération et publication lancées. Cela peut prendre plusieurs minutes. Le statut sera mis à jour automatiquement.", { 
          duration: 5000
        });
        
        const { data: genData, error: genError } = await supabase.functions.invoke('tome-generate', {
          body: { generationId: data.id }
        });
        
        if (genError) {
          console.error("Error triggering generation:", genError);
          toast.error("Erreur lors du démarrage de la génération: " + genError.message);
        } else if (genData && genData.error) {
          console.error("Generation API returned error:", genData.error);
          toast.error("Erreur lors de la génération: " + genData.error);
          
          await supabase
            .from("tome_generations")
            .update({ 
              status: "failed",
              error_message: genData.error
            })
            .eq("id", data.id);
            
          setGenerations(prev => 
            prev.map(gen => 
              gen.id === data.id 
                ? { ...gen, status: 'failed', error_message: genData.error } 
                : gen
            )
          );
          
          return false;
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
      
      const { error: updateError } = await supabase
        .from("tome_generations")
        .update({ 
          status: "pending", 
          error_message: null
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
        
        await supabase
          .from("tome_generations")
          .update({ 
            status: "failed",
            error_message: genData.error
          })
          .eq("id", generationId);
          
        setGenerations(prev => 
          prev.map(gen => 
            gen.id === generationId 
              ? { ...gen, status: 'failed', error_message: genData.error } 
              : gen
          )
        );
        
        return false;
      }
      
      setPollingGenerations(prev => [...prev, generationId]);
      
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
    fetchGeneratedContent,
    getGenerationById,
    updateGeneration
  };
};
