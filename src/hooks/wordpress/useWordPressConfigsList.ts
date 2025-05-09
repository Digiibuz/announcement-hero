
import { useState, useEffect } from "react";
import { supabase, typedData } from "@/integrations/supabase/client";
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
  const { user, isClient } = useAuth();

  const fetchConfigs = async () => {
    try {
      setIsLoading(true);
      
      // Pour les clients, on ne récupère que leur configuration WordPress attribuée
      if (isClient) {
        // Si le client a un wordpressConfigId, on récupère cette configuration
        if (user?.wordpressConfigId) {
          const { data, error } = await supabase
            .from('wordpress_configs')
            .select('*')
            .eq('id', user.wordpressConfigId)
            .single();
          
          if (error) {
            throw error;
          }
          
          if (data) {
            const config: WordPressConfig = {
              id: typedData<string>(data.id),
              name: typedData<string>(data.name),
              site_url: typedData<string>(data.site_url),
              rest_api_key: typedData<string>(data.rest_api_key),
              username: typedData<string>(data.username),
              password: typedData<string>(data.password),
              app_username: typedData<string>(data.app_username),
              app_password: typedData<string>(data.app_password),
              created_at: typedData<string>(data.created_at),
              updated_at: typedData<string>(data.updated_at),
            };
            setConfigs([config]);
          } else {
            setConfigs([]);
          }
        } else {
          // Si le client n'a pas de wordpressConfigId, on renvoie un tableau vide
          setConfigs([]);
        }
      } 
      // Pour les autres rôles, on récupère toutes les configurations
      else {
        const { data, error } = await supabase
          .from('wordpress_configs')
          .select('*')
          .order('name');
        
        if (error) {
          throw error;
        }
        
        const typedConfigs: WordPressConfig[] = (data || []).map(item => ({
          id: typedData<string>(item.id),
          name: typedData<string>(item.name),
          site_url: typedData<string>(item.site_url),
          rest_api_key: typedData<string>(item.rest_api_key),
          username: typedData<string>(item.username),
          password: typedData<string>(item.password),
          app_username: typedData<string>(item.app_username),
          app_password: typedData<string>(item.app_password),
          created_at: typedData<string>(item.created_at),
          updated_at: typedData<string>(item.updated_at),
        }));
        
        setConfigs(typedConfigs);
      }
    } catch (error) {
      console.error('Error fetching WordPress configs:', error);
      toast.error("Erreur lors de la récupération des configurations WordPress");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClientConfigs = async () => {
    try {
      // Les clients n'ont pas besoin de récupérer toutes les associations
      if (isClient) {
        setClientConfigs([]);
        return;
      }
      
      const { data, error } = await supabase
        .from('client_wordpress_configs')
        .select('*');
      
      if (error) {
        throw error;
      }
      
      const typedClientConfigs: ClientWordPressConfig[] = (data || []).map(item => ({
        id: typedData<string>(item.id),
        client_id: typedData<string>(item.client_id),
        wordpress_config_id: typedData<string>(item.wordpress_config_id),
        created_at: typedData<string>(item.created_at),
      }));
      
      setClientConfigs(typedClientConfigs);
    } catch (error) {
      console.error('Error fetching client WordPress configs:', error);
      toast.error("Erreur lors de la récupération des associations client-WordPress");
    }
  };

  useEffect(() => {
    fetchConfigs();
    fetchClientConfigs();
  }, [isClient, user?.wordpressConfigId]);

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
