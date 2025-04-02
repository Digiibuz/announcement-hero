
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { TomeGeneration, CategoryKeyword, Locality } from "@/types/tome";
import { format } from "date-fns";
import { useAuth } from "@/context/AuthContext";

// Version simplifiée de ExtendedTomeGeneration
interface ExtendedTomeGeneration extends TomeGeneration {
  wordpress_site_url?: string | null;
  category_name?: string | null;
  keyword_text?: string | null;
  locality_name?: string | null;
  locality_region?: string | null;
}

export const useTomeSimplified = (configId: string | null) => {
  const [generations, setGenerations] = useState<ExtendedTomeGeneration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user } = useAuth();

  // Récupérer les générations avec informations enrichies
  const fetchGenerations = useCallback(async () => {
    if (!configId) {
      setGenerations([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      
      // Récupérer les données de base des générations
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

      // Récupérer la configuration WordPress pour l'URL du site
      const { data: wpConfig } = await supabase
        .from("wordpress_configs")
        .select("site_url")
        .eq("id", configId)
        .single();

      // Préparer les IDs pour les requêtes suivantes
      const categoryIds = [...new Set(basicGenerations.map(g => g.category_id))];
      const keywordIds = [...new Set(basicGenerations.filter(g => g.keyword_id).map(g => g.keyword_id as string))];
      const localityIds = [...new Set(basicGenerations.filter(g => g.locality_id).map(g => g.locality_id as string))];

      // Récupérer les données associées en parallèle
      const [categoriesData, keywordsData, localitiesData] = await Promise.all([
        // Catégories
        categoryIds.length > 0 
          ? supabase
              .from("categories_keywords")
              .select("id, category_name")
              .in("id", categoryIds)
          : Promise.resolve({ data: [], error: null }),
        
        // Mots-clés
        keywordIds.length > 0
          ? supabase
              .from("categories_keywords")
              .select("id, keyword")
              .in("id", keywordIds)
          : Promise.resolve({ data: [], error: null }),
        
        // Localités
        localityIds.length > 0
          ? supabase
              .from("localities")
              .select("id, name, region")
              .in("id", localityIds)
          : Promise.resolve({ data: [], error: null }),
      ]);

      // Créer des maps pour un accès facile aux données
      const categoryMap = new Map();
      const keywordMap = new Map();
      const localityMap = new Map();

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

      // Enrichir les générations avec les données supplémentaires
      const extendedGenerations: ExtendedTomeGeneration[] = basicGenerations.map(gen => ({
        ...gen,
        wordpress_site_url: wpConfig?.site_url || null,
        category_name: categoryMap.get(gen.category_id) || null,
        keyword_text: gen.keyword_id ? keywordMap.get(gen.keyword_id as string) || null : null,
        locality_name: gen.locality_id ? localityMap.get(gen.locality_id as string)?.name || null : null,
        locality_region: gen.locality_id ? localityMap.get(gen.locality_id as string)?.region || null : null
      }));
      
      setGenerations(extendedGenerations);
    } catch (error: any) {
      console.error("Error in fetchGenerations:", error);
      toast.error(`Erreur: ${error.message || "Erreur inconnue"}`);
    } finally {
      setIsLoading(false);
    }
  }, [configId]);

  // Créer une nouvelle génération
  const createGeneration = async (
    categoryId: string,
    keyword: CategoryKeyword | null,
    locality: Locality | null,
    title?: string,
    description?: string
  ) => {
    if (!configId || !user) return false;

    try {
      setIsSubmitting(true);
      
      const keywordId = keyword?.id === "none" ? null : keyword?.id || null;
      const localityId = locality?.id === "none" ? null : locality?.id || null;
      
      // Créer l'entrée en base de données
      const newGeneration = {
        wordpress_config_id: configId,
        category_id: categoryId,
        keyword_id: keywordId,
        locality_id: localityId,
        status: "pending",
        error_message: null,
        title: title || null,
        content: null,
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

      // Ajouter à l'état local
      const basicGeneration: ExtendedTomeGeneration = {
        ...data,
        category_name: null, // Nous les obtiendrons lors du prochain fetch
        keyword_text: null,
        locality_name: null
      };
      
      setGenerations(prev => [basicGeneration, ...prev]);
      
      // Notification et démarrage de la génération
      toast.info("Génération lancée. Cela peut prendre plusieurs minutes. Le statut sera mis à jour automatiquement.", { 
        duration: 5000
      });
      
      // Appeler la fonction Edge pour générer le contenu
      console.log("Invoking tome-generate with generation ID:", data.id);
      
      try {
        const { data: genData, error: genError } = await supabase.functions.invoke('tome-generate-simplified', {
          body: { 
            generationId: data.id,
            userId: user.id 
          }
        });
        
        if (genError) {
          console.error("Error invoking tome-generate-simplified:", genError);
          toast.error("Erreur lors de la génération: " + genError.message);
          
          // Mettre à jour le statut
          await supabase
            .from("tome_generations")
            .update({ 
              status: "failed",
              error_message: "Erreur lors de l'appel à la fonction de génération: " + genError.message
            })
            .eq("id", data.id);
            
          setGenerations(prev => 
            prev.map(gen => 
              gen.id === data.id 
                ? { 
                    ...gen, 
                    status: 'failed',
                    error_message: "Erreur lors de l'appel à la fonction de génération: " + genError.message
                  } 
                : gen
            )
          );
          
          return false;
        }
        
        if (genData && genData.error) {
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
        
        console.log("Generation initiated successfully:", genData);
        
        // Rafraîchir les données pour obtenir la version mise à jour
        fetchGenerations();
        
        return true;
      } catch (invocationError: any) {
        console.error("Exception caught during function invocation:", invocationError);
        
        // Mettre à jour le statut en cas d'exception
        await supabase
          .from("tome_generations")
          .update({ 
            status: "failed",
            error_message: "Exception lors de l'appel à la fonction: " + (invocationError.message || "Erreur inconnue")
          })
          .eq("id", data.id);
          
        setGenerations(prev => 
          prev.map(gen => 
            gen.id === data.id 
              ? { 
                  ...gen, 
                  status: 'failed',
                  error_message: "Exception lors de l'appel à la fonction: " + (invocationError.message || "Erreur inconnue")
                } 
              : gen
          )
        );
        
        toast.error(`Erreur lors de l'appel à la fonction: ${invocationError.message || "Erreur inconnue"}`);
        return false;
      }
    } catch (error: any) {
      console.error("Error in createGeneration:", error);
      toast.error(`Erreur: ${error.message || "Erreur inconnue"}`);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Regénérer un contenu existant
  const regenerate = async (generationId: string) => {
    if (!user) return false;

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
      
      console.log("Invoking tome-generate-simplified with generation ID:", generationId);
      
      const { data: genData, error: genError } = await supabase.functions.invoke('tome-generate-simplified', {
        body: { 
          generationId,
          userId: user.id 
        }
      });
      
      if (genError) {
        console.error("Error invoking tome-generate-simplified:", genError);
        toast.error("Erreur lors de la régénération: " + genError.message);
        
        await supabase
          .from("tome_generations")
          .update({ 
            status: "failed",
            error_message: "Erreur lors de l'appel à la fonction de génération: " + genError.message
          })
          .eq("id", generationId);
          
        setGenerations(prev => 
          prev.map(gen => 
            gen.id === generationId 
              ? { 
                  ...gen, 
                  status: 'failed',
                  error_message: "Erreur lors de l'appel à la fonction de génération: " + genError.message
                } 
              : gen
          )
        );
        
        return false;
      }
      
      if (genData && genData.error) {
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
      
      console.log("Regeneration initiated successfully:", genData);
      
      // Mettre à jour l'état local et rafraîchir les données
      setGenerations(prev => 
        prev.map(gen => 
          gen.id === generationId ? { ...gen, status: 'pending', error_message: null } : gen
        )
      );
      
      // Rafraîchir les données
      fetchGenerations();
      
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
    fetchGenerations
  };
};
