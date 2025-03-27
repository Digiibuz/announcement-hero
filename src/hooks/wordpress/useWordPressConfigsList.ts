
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WordPressConfig, ClientWordPressConfig } from "@/types/wordpress";
import { useAuth } from "@/context/AuthContext";

/**
 * Hook to fetch WordPress configurations and client associations
 */
export const useWordPressConfigsList = () => {
  const [configs, setConfigs] = useState<WordPressConfig[]>([]);
  const [clientConfigs, setClientConfigs] = useState<ClientWordPressConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

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

  useEffect(() => {
    fetchConfigs();
    fetchClientConfigs();
  }, []);

  const getConfigsForClient = (clientId: string) => {
    if (!clientId) return [];
    
    console.log(`Getting configs for client: ${clientId}`);
    const clientConfigIds = clientConfigs
      .filter(cc => cc.client_id === clientId)
      .map(cc => cc.wordpress_config_id);
    
    const result = configs.filter(config => clientConfigIds.includes(config.id));
    console.log(`Found ${result.length} configs for client ${clientId}`);
    return result;
  };

  // Nouvelle fonction pour obtenir les configurations disponibles pour l'utilisateur connecté
  const getUserConfigs = () => {
    if (!user) return [];

    // Si l'utilisateur est admin, renvoyer toutes les configurations
    if (user.role === "admin") {
      return configs;
    }

    // Pour les éditeurs, renvoyer seulement les configurations liées à leur ID client
    if (user.role === "editor" && user.clientId) {
      return getConfigsForClient(user.clientId);
    }
    
    // Si l'utilisateur a un wordpressConfigId direct, l'inclure aussi
    if (user.wordpressConfigId) {
      return configs.filter(config => config.id === user.wordpressConfigId);
    }

    return [];
  };

  return {
    configs,
    clientConfigs,
    isLoading,
    fetchConfigs,
    fetchClientConfigs,
    getConfigsForClient,
    getUserConfigs
  };
};
