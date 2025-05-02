
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { WordPressConfig } from "@/types/wordpress";
import { toast } from "sonner";

/**
 * Hook for WordPress configuration CRUD operations
 */
export const useWordPressConfigCrud = (onSuccess?: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createConfig = async (config: Omit<WordPressConfig, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setIsSubmitting(true);
      const { data, error } = await supabase
        .from('wordpress_configs')
        .insert([config])
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (onSuccess) {
        onSuccess();
      }

      return data;
    } catch (error: any) {
      console.error('Error creating WordPress config:', error);
      toast.error(`Erreur lors de la création: ${error.message}`);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateConfig = async (id: string, config: Partial<WordPressConfig>) => {
    try {
      setIsSubmitting(true);
      const { data, error } = await supabase
        .from('wordpress_configs')
        .update(config)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (onSuccess) {
        onSuccess();
      }

      return data;
    } catch (error: any) {
      console.error('Error updating WordPress config:', error);
      toast.error(`Erreur lors de la mise à jour: ${error.message}`);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteConfig = async (id: string) => {
    try {
      setIsSubmitting(true);
      // First check if there are any client associations
      const { data: associations, error: assocError } = await supabase
        .from('client_wordpress_configs')
        .select('id')
        .eq('wordpress_config_id', id);

      if (assocError) {
        throw assocError;
      }

      // If there are associations, delete them first
      if (associations && associations.length > 0) {
        const { error: deleteAssocError } = await supabase
          .from('client_wordpress_configs')
          .delete()
          .eq('wordpress_config_id', id);

        if (deleteAssocError) {
          throw deleteAssocError;
        }
      }

      // Then delete the config itself
      const { error } = await supabase
        .from('wordpress_configs')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      if (onSuccess) {
        onSuccess();
      }
      
      toast.success("Configuration WordPress supprimée avec succès");
    } catch (error: any) {
      console.error('Error deleting WordPress config:', error);
      toast.error(`Erreur lors de la suppression: ${error.message}`);
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isSubmitting,
    createConfig,
    updateConfig,
    deleteConfig
  };
};
