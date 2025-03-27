
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WordPressConfig, ClientWordPressConfig } from "@/types/wordpress";

export const useWordPressConfigs = () => {
  const [configs, setConfigs] = useState<WordPressConfig[]>([]);
  const [clientConfigs, setClientConfigs] = useState<ClientWordPressConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchConfigs = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('wordpress_configs')
        .select('*')
        .order('name');
      
      if (error) {
        throw error;
      }
      
      setConfigs(data as WordPressConfig[]);
    } catch (error) {
      console.error('Error fetching WordPress configs:', error);
      toast.error("Erreur lors de la récupération des configurations WordPress");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClientConfigs = async () => {
    try {
      const { data, error } = await supabase
        .from('client_wordpress_configs')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      setClientConfigs(data as ClientWordPressConfig[]);
    } catch (error) {
      console.error('Error fetching client WordPress configs:', error);
      toast.error("Erreur lors de la récupération des associations client-WordPress");
    }
  };

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
      
      setConfigs([...configs, data as WordPressConfig]);
      toast.success("Configuration WordPress créée avec succès");
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
      const { data, error } = await supabase
        .from('wordpress_configs')
        .update(config)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      setConfigs(configs.map(c => c.id === id ? (data as WordPressConfig) : c));
      toast.success("Configuration WordPress mise à jour avec succès");
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
      const { error } = await supabase
        .from('wordpress_configs')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      setConfigs(configs.filter(c => c.id !== id));
      toast.success("Configuration WordPress supprimée avec succès");
    } catch (error) {
      console.error('Error deleting WordPress config:', error);
      toast.error("Erreur lors de la suppression de la configuration WordPress");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const associateClientToConfig = async (clientId: string, configId: string) => {
    try {
      setIsSubmitting(true);
      const { data, error } = await supabase
        .from('client_wordpress_configs')
        .insert([{ client_id: clientId, wordpress_config_id: configId }])
        .select()
        .single();
      
      if (error) {
        throw error;
      }
      
      setClientConfigs([...clientConfigs, data as ClientWordPressConfig]);
      toast.success("Association client-WordPress créée avec succès");
      return data as ClientWordPressConfig;
    } catch (error) {
      console.error('Error associating client to WordPress config:', error);
      toast.error("Erreur lors de l'association du client à la configuration WordPress");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeClientConfigAssociation = async (id: string) => {
    try {
      setIsSubmitting(true);
      const { error } = await supabase
        .from('client_wordpress_configs')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw error;
      }
      
      setClientConfigs(clientConfigs.filter(c => c.id !== id));
      toast.success("Association client-WordPress supprimée avec succès");
    } catch (error) {
      console.error('Error removing client WordPress config association:', error);
      toast.error("Erreur lors de la suppression de l'association client-WordPress");
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const getConfigsForClient = (clientId: string) => {
    const clientConfigIds = clientConfigs
      .filter(cc => cc.client_id === clientId)
      .map(cc => cc.wordpress_config_id);
    
    return configs.filter(config => clientConfigIds.includes(config.id));
  };

  useEffect(() => {
    fetchConfigs();
    fetchClientConfigs();
  }, []);

  return {
    configs,
    clientConfigs,
    isLoading,
    isSubmitting,
    fetchConfigs,
    fetchClientConfigs,
    createConfig,
    updateConfig,
    deleteConfig,
    associateClientToConfig,
    removeClientConfigAssociation,
    getConfigsForClient
  };
};
