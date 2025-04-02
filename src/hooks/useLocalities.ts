
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Locality } from "@/types/wordpress";

export const useLocalities = () => {
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchLocalities = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('localities')
        .select('*')
        .order('name');
      
      if (error) {
        throw error;
      }
      
      setLocalities(data as Locality[]);
    } catch (error) {
      console.error('Error fetching localities:', error);
      toast.error("Erreur lors de la récupération des localités");
    } finally {
      setIsLoading(false);
    }
  };

  const createLocality = async (name: string) => {
    try {
      setIsSubmitting(true);
      const { data, error } = await supabase
        .from('localities')
        .insert([{ name }])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      toast.success(`Localité "${name}" ajoutée avec succès`);
      await fetchLocalities();
      return data as Locality;
    } catch (error: any) {
      console.error('Error creating locality:', error);
      
      // Gérer le cas d'une localité déjà existante
      if (error.code === '23505') { // Code PostgreSQL pour violation de contrainte d'unicité
        toast.error(`La localité "${name}" existe déjà`);
      } else {
        toast.error("Erreur lors de la création de la localité");
      }
      throw error;
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
        throw error;
      }
      
      toast.success("Localité supprimée avec succès");
      await fetchLocalities();
    } catch (error) {
      console.error('Error deleting locality:', error);
      toast.error("Erreur lors de la suppression de la localité");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    fetchLocalities();
  }, []);

  return {
    localities,
    isLoading,
    isSubmitting,
    fetchLocalities,
    createLocality,
    deleteLocality
  };
};
