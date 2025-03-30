
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
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
      
      console.log("Creating WordPress config:", config);
      
      // Format the URL properly to ensure it ends with a single slash
      let formattedSiteUrl = config.site_url.trim();
      if (!formattedSiteUrl.endsWith('/')) {
        formattedSiteUrl = formattedSiteUrl + '/';
      }
      
      // Prepare the configuration data with null values for unused fields
      const configData = {
        name: config.name,
        site_url: formattedSiteUrl,
        app_username: config.app_username || null,
        app_password: config.app_password || null,
        rest_api_key: null,
        username: null,
        password: null
      };
      
      console.log("Formatted config data:", configData);
      
      const { data, error } = await supabase
        .from('wordpress_configs')
        .insert([configData])
        .select()
        .single();
      
      if (error) {
        console.error("Supabase error while creating WordPress config:", error);
        throw error;
      }
      
      console.log("WordPress config created successfully:", data);
      toast.success("Configuration WordPress créée avec succès");
      if (onConfigsChange) onConfigsChange();
      return data as WordPressConfig;
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
      
      // Format the URL if it's being updated
      let updatedConfig = { ...config };
      if (config.site_url) {
        let formattedSiteUrl = config.site_url.trim();
        if (!formattedSiteUrl.endsWith('/')) {
          formattedSiteUrl = formattedSiteUrl + '/';
        }
        updatedConfig.site_url = formattedSiteUrl;
      }
      
      console.log("Updating WordPress config:", id, updatedConfig);
      
      const { data, error } = await supabase
        .from('wordpress_configs')
        .update(updatedConfig)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        console.error("Supabase error while updating WordPress config:", error);
        throw error;
      }
      
      console.log("WordPress config updated successfully:", data);
      toast.success("Configuration WordPress mise à jour avec succès");
      if (onConfigsChange) onConfigsChange();
      return data as WordPressConfig;
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
      console.log("Deleting WordPress config:", id);
      
      // Vérifier si des profils utilisent cette configuration
      const { data: profilesWithConfig, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .eq('wordpress_config_id', id);
      
      if (profilesError) {
        console.error("Error checking profiles with config:", profilesError);
        throw profilesError;
      }
      
      if (profilesWithConfig && profilesWithConfig.length > 0) {
        const userNames = profilesWithConfig.map(p => p.name || p.email).join(', ');
        throw new Error(`Cette configuration est utilisée par ${profilesWithConfig.length} utilisateur(s): ${userNames}. Veuillez d'abord modifier ou supprimer ces utilisateurs.`);
      }
      
      // Vérifier si des associations client-config existent
      const { data: clientConfigs, error: clientConfigsError } = await supabase
        .from('client_wordpress_configs')
        .select('id')
        .eq('wordpress_config_id', id);
      
      if (clientConfigsError) {
        console.error("Error checking client configs:", clientConfigsError);
        throw clientConfigsError;
      }
      
      // Supprimer d'abord les associations client-config si elles existent
      if (clientConfigs && clientConfigs.length > 0) {
        console.log(`Removing ${clientConfigs.length} client associations before deleting config`);
        
        const { error: deleteAssociationsError } = await supabase
          .from('client_wordpress_configs')
          .delete()
          .eq('wordpress_config_id', id);
        
        if (deleteAssociationsError) {
          console.error("Error deleting client associations:", deleteAssociationsError);
          throw deleteAssociationsError;
        }
      }
      
      // Maintenant, supprimer la configuration WordPress
      const { error } = await supabase
        .from('wordpress_configs')
        .delete()
        .eq('id', id);
      
      if (error) {
        console.error("Supabase error while deleting WordPress config:", error);
        throw error;
      }
      
      console.log("WordPress config deleted successfully");
      toast.success("Configuration WordPress supprimée avec succès");
      if (onConfigsChange) onConfigsChange();
    } catch (error: any) {
      console.error('Error deleting WordPress config:', error);
      toast.error(`Erreur lors de la suppression de la configuration WordPress: ${error.message}`);
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
