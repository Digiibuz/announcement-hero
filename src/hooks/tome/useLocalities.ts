
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Locality {
  id: string;
  wordpress_config_id: string;
  name: string;
  region: string | null;
  active: boolean;
  created_at: string;
}

export const useLocalities = (wordpressConfigId: string | null) => {
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLocalities = async () => {
    if (!wordpressConfigId) return;

    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('localities')
        .select('*')
        .eq('wordpress_config_id', wordpressConfigId)
        .order('name', { ascending: true });
      
      if (error) {
        throw error;
      }
      
      setLocalities(data as Locality[]);
    } catch (error: any) {
      console.error("Error fetching localities:", error);
      toast.error("Erreur lors de la récupération des localités");
    } finally {
      setIsLoading(false);
    }
  };

  const addLocality = async (name: string, region: string | null = null) => {
    if (!wordpressConfigId) {
      toast.error("Configuration WordPress non trouvée");
      return null;
    }

    try {
      setIsSubmitting(true);
      
      const { data, error } = await supabase
        .from('localities')
        .insert([
          {
            wordpress_config_id: wordpressConfigId,
            name,
            region
          }
        ])
        .select()
        .single();
      
      if (error) {
        if (error.message.includes("violates unique constraint")) {
          toast.error("Cette localité existe déjà pour cette configuration");
        } else {
          toast.error("Erreur lors de l'ajout de la localité");
        }
        throw error;
      }
      
      toast.success("Localité ajoutée avec succès");
      await fetchLocalities();
      return data as Locality;
    } catch (error: any) {
      console.error("Error adding locality:", error);
      return null;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateLocalityStatus = async (id: string, active: boolean) => {
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('localities')
        .update({ active })
        .eq('id', id);
      
      if (error) {
        toast.error("Erreur lors de la mise à jour de la localité");
        throw error;
      }
      
      toast.success("Statut de la localité mis à jour");
      // Mettre à jour l'état local
      setLocalities(localities.map(loc => 
        loc.id === id ? { ...loc, active } : loc
      ));
    } catch (error: any) {
      console.error("Error updating locality status:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteLocality = async (id: string) => {
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from('localities')
        .delete()
        .eq('id', id);
      
      if (error) {
        toast.error("Erreur lors de la suppression de la localité");
        throw error;
      }
      
      toast.success("Localité supprimée avec succès");
      setLocalities(localities.filter(loc => loc.id !== id));
    } catch (error: any) {
      console.error("Error deleting locality:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (wordpressConfigId) {
      fetchLocalities();
    }
  }, [wordpressConfigId]);

  return {
    localities,
    isLoading,
    isSubmitting,
    addLocality,
    updateLocalityStatus,
    deleteLocality,
    fetchLocalities,
    activeLocalities: localities.filter(loc => loc.active)
  };
};
