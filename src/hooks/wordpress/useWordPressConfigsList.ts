
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WordPressConfig, ClientWordPressConfig } from "@/types/wordpress";

/**
 * Hook to fetch WordPress configurations and client associations
 */
export const useWordPressConfigsList = () => {
  const [configs, setConfigs] = useState<WordPressConfig[]>([]);
  const [clientConfigs, setClientConfigs] = useState<ClientWordPressConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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
      
      console.log("Client WordPress associations:", data);
      setClientConfigs(data as ClientWordPressConfig[]);
    } catch (error) {
      console.error('Error fetching client WordPress configs:', error);
      toast.error("Erreur lors de la récupération des associations client-WordPress");
    }
  };

  useEffect(() => {
    fetchConfigs();
    fetchClientConfigs();
  }, []);

  const getConfigsForClient = (clientId: string) => {
    const clientConfigIds = clientConfigs
      .filter(cc => cc.client_id === clientId)
      .map(cc => cc.wordpress_config_id);
    
    return configs.filter(config => clientConfigIds.includes(config.id));
  };

  return {
    configs,
    clientConfigs,
    isLoading,
    fetchConfigs,
    fetchClientConfigs,
    getConfigsForClient
  };
};
