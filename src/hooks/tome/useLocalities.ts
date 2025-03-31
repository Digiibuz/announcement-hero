
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Locality } from "@/types/tome";

export const useLocalities = (configId: string | null) => {
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLocalities = useCallback(async () => {
    if (!configId) {
      setLocalities([]);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from("localities")
        .select("*")
        .eq("wordpress_config_id", configId)
        .order("name");

      if (error) {
        console.error("Error fetching localities:", error);
        toast.error("Erreur lors du chargement des localités: " + error.message);
        return;
      }

      setLocalities(data as Locality[]);
    } catch (error: any) {
      console.error("Error in fetchLocalities:", error);
    } finally {
      setIsLoading(false);
    }
  }, [configId]);

  useEffect(() => {
    fetchLocalities();
  }, [fetchLocalities]);

  const addLocality = async (name: string, region: string | null) => {
    if (!configId) return false;

    try {
      setIsSubmitting(true);
      
      const newLocality = {
        wordpress_config_id: configId,
        name: name,
        region: region,
        active: true
      };

      const { data, error } = await supabase
        .from("localities")
        .insert([newLocality])
        .select()
        .single();

      if (error) {
        if (error.code === "23505") {
          toast.error("Cette localité existe déjà");
        } else {
          console.error("Error adding locality:", error);
          toast.error("Erreur lors de l'ajout de la localité: " + error.message);
        }
        return false;
      }

      setLocalities([...localities, data as Locality]);
      toast.success("Localité ajoutée avec succès");
      return true;
    } catch (error: any) {
      console.error("Error in addLocality:", error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateLocalityStatus = async (localityId: string, active: boolean) => {
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from("localities")
        .update({ active })
        .eq("id", localityId);

      if (error) {
        console.error("Error updating locality status:", error);
        toast.error("Erreur lors de la mise à jour du statut: " + error.message);
        return false;
      }

      setLocalities(
        localities.map(loc => 
          loc.id === localityId ? { ...loc, active } : loc
        )
      );
      
      toast.success(`Localité ${active ? 'activée' : 'désactivée'} avec succès`);
      return true;
    } catch (error: any) {
      console.error("Error in updateLocalityStatus:", error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteLocality = async (localityId: string) => {
    try {
      setIsSubmitting(true);
      
      const { error } = await supabase
        .from("localities")
        .delete()
        .eq("id", localityId);

      if (error) {
        console.error("Error deleting locality:", error);
        toast.error("Erreur lors de la suppression de la localité: " + error.message);
        return false;
      }

      setLocalities(localities.filter(loc => loc.id !== localityId));
      toast.success("Localité supprimée avec succès");
      return true;
    } catch (error: any) {
      console.error("Error in deleteLocality:", error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeLocalities = localities.filter(loc => loc.active);

  return {
    localities,
    activeLocalities,
    isLoading,
    isSubmitting,
    addLocality,
    updateLocalityStatus,
    deleteLocality,
    fetchLocalities
  };
};
