
import { useState } from "react";
import { supabase, typedData } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WordPressConfig } from "@/types/wordpress";

/**
 * Hook for CRUD operations on WordPress configurations
 */
export const useWordPressConfigCrud = (onConfigsChange?: () => void) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const createConfig = async (config: Omit<WordPressConfig, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      setIsSubmitting(true);
      
      // Assurons-nous que les anciens champs sont définis comme null
      const configData = {
        ...config,
        rest_api_key: null,
        username: null,
        password: null
      };
      
      const { data, error } = await supabase
        .from('wordpress_configs')
        .insert([configData])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      toast.success("Configuration WordPress créée avec succès");
      if (onConfigsChange) onConfigsChange();
      
      return {
        id: typedData<string>(data.id),
        name: typedData<string>(data.name),
        site_url: typedData<string>(data.site_url),
        rest_api_key: typedData<string>(data.rest_api_key),
        username: typedData<string>(data.username),
        password: typedData<string>(data.password),
        app_username: typedData<string>(data.app_username),
        app_password: typedData<string>(data.app_password),
        prompt: typedData<string>(data.prompt),
        created_at: typedData<string>(data.created_at),
        updated_at: typedData<string>(data.updated_at)
      } as WordPressConfig;
    } catch (error) {
      console.error('Error creating WordPress config:', error);
      toast.error("Erreur lors de la création de la configuration WordPress");
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
      
      toast.success("Configuration WordPress mise à jour avec succès");
      if (onConfigsChange) onConfigsChange();
      
      return {
        id: typedData<string>(data.id),
        name: typedData<string>(data.name),
        site_url: typedData<string>(data.site_url),
        rest_api_key: typedData<string>(data.rest_api_key),
        username: typedData<string>(data.username),
        password: typedData<string>(data.password),
        app_username: typedData<string>(data.app_username),
        app_password: typedData<string>(data.app_password),
        prompt: typedData<string>(data.prompt),
        created_at: typedData<string>(data.created_at),
        updated_at: typedData<string>(data.updated_at)
      } as WordPressConfig;
    } catch (error) {
      console.error('Error updating WordPress config:', error);
      toast.error("Erreur lors de la mise à jour de la configuration WordPress");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteConfig = async (id: string) => {
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('wordpress_configs')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      toast.success("Configuration WordPress supprimée avec succès");
      if (onConfigsChange) onConfigsChange();
    } catch (error) {
      console.error('Error deleting WordPress config:', error);
      toast.error("Erreur lors de la suppression de la configuration WordPress");
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
