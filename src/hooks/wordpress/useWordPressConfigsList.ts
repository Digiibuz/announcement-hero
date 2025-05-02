
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
  const { userProfile, isClient, isAdmin } = useAuth();

  const fetchConfigs = async () => {
    try {
      setIsLoading(true);
      
      console.log("useWordPressConfigsList - fetchConfigs - userProfile:", userProfile);
      console.log("useWordPressConfigsList - fetchConfigs - isClient:", isClient);
      console.log("useWordPressConfigsList - fetchConfigs - isAdmin:", isAdmin);
      
      // Si l'utilisateur est administrateur, récupérer toutes les configurations
      if (isAdmin) {
        const { data, error } = await supabase
          .from('wordpress_configs')
          .select('*')
          .order('name');
        
        if (error) {
          throw error;
        }
        
        console.log("Admin - Fetched WordPress configs:", data?.length || 0);
        setConfigs(data as WordPressConfig[]);
      }
      // Pour les clients, on ne récupère que leur configuration WordPress attribuée
      else if (isClient && userProfile) {
        // Si le client a un wordpressConfigId, on récupère cette configuration
        const wordpressConfigId = userProfile.wordpressConfigId;
        console.log("useWordPressConfigsList - Client WordPress Config ID:", wordpressConfigId);
        
        if (wordpressConfigId) {
          const { data, error } = await supabase
            .from('wordpress_configs')
            .select('*')
            .eq('id', wordpressConfigId);
          
          if (error) {
            throw error;
          }
          
          console.log("Client - Fetched WordPress configs:", data?.length || 0);
          setConfigs(data as WordPressConfig[]);
        } else {
          // Si le client n'a pas de wordpressConfigId, on renvoie un tableau vide
          setConfigs([]);
        }
      } 
      // Pour les autres rôles ou cas non gérés, tableau vide
      else {
        setConfigs([]);
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
      
      setClientConfigs(data as ClientWordPressConfig[]);
    } catch (error) {
      console.error('Error fetching client WordPress configs:', error);
      toast.error("Erreur lors de la récupération des associations client-WordPress");
    }
  };

  useEffect(() => {
    console.log("useWordPressConfigsList - Effect triggered", {
      userProfile,
      isClient,
      isAdmin,
      configId: userProfile?.wordpressConfigId
    });
    fetchConfigs();
    fetchClientConfigs();
  }, [isClient, isAdmin, userProfile?.wordpressConfigId]);

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
