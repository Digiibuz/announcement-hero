
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Locality } from "@/types/wordpress";
import { toast } from "sonner";

export const useLocalities = () => {
  const [localities, setLocalities] = useState<Locality[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLocalities = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      console.info("Fetching localities");
      
      const { data, error } = await supabase
        .from('localities')
        .select('*')
        .order('name', { ascending: true });
      
      if (error) {
        throw new Error(`Erreur lors de la récupération des localités: ${error.message}`);
      }
      
      console.info(`Successfully fetched ${data.length} localities`);
      setLocalities(data || []);
    } catch (err: any) {
      console.error('Erreur lors de la récupération des localités:', err);
      setError(err);
      toast.error(err.message || "Erreur lors du chargement des localités");
    } finally {
      setIsLoading(false);
    }
  };

  const addLocality = async (name: string) => {
    try {
      const { data, error } = await supabase
        .from('localities')
        .insert({ name })
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      setLocalities(prev => [...prev, data]);
      toast.success("Localité ajoutée avec succès");
      return data;
    } catch (error: any) {
      console.error("Erreur lors de l'ajout de la localité:", error);
      toast.error(error.message || "Erreur lors de l'ajout de la localité");
      throw error;
    }
  };

  const deleteLocality = async (id: string) => {
    try {
      const { error } = await supabase
        .from('localities')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      setLocalities(prev => prev.filter(l => l.id !== id));
      toast.success("Localité supprimée avec succès");
    } catch (error: any) {
      console.error("Erreur lors de la suppression de la localité:", error);
      toast.error(error.message || "Erreur lors de la suppression de la localité");
      throw error;
    }
  };

  useEffect(() => {
    fetchLocalities();
  }, []);

  return {
    localities,
    isLoading,
    error,
    addLocality,
    deleteLocality,
    refetch: fetchLocalities
  };
};
