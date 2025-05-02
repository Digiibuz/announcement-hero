
import { useState, useEffect, useCallback } from "react";
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
  const [error, setError] = useState<string | null>(null);
  const { userProfile, isClient, isAdmin } = useAuth();

  const fetchConfigs = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      
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
        setConfigs(data as WordPressConfig[] || []);
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
          setConfigs(data as WordPressConfig[] || []);
        } else {
          // Si le client n'a pas de wordpressConfigId, on renvoie un tableau vide
          setConfigs([]);
        }
      } 
      // Pour les autres rôles ou cas non gérés, tableau vide
      else {
        setConfigs([]);
      }
    } catch (error: any) {
      console.error('Error fetching WordPress configs:', error);
      setError(error.message || "Erreur lors de la récupération des configurations WordPress");
      toast.error("Erreur lors de la récupération des configurations WordPress");
    } finally {
      setIsLoading(false);
    }
  }, [isClient, isAdmin, userProfile]);

  const fetchClientConfigs = useCallback(async () => {
    try {
      setError(null);
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
      
      setClientConfigs(data as ClientWordPressConfig[] || []);
    } catch (error: any) {
      console.error('Error fetching client WordPress configs:', error);
      setError(error.message || "Erreur lors de la récupération des associations client-WordPress");
      // Ne pas afficher de toast ici pour éviter une double notification
    }
  }, [isClient]);

  useEffect(() => {
    console.log("useWordPressConfigsList - Effect triggered", {
      userProfile,
      isClient,
      isAdmin,
      configId: userProfile?.wordpressConfigId
    });
    
    // Assurons-nous que les valeurs isClient, isAdmin et userProfile sont définies avant de faire des appels API
    if (isClient !== undefined && isAdmin !== undefined) {
      fetchConfigs();
      fetchClientConfigs();
    }
  }, [isClient, isAdmin, userProfile?.wordpressConfigId, fetchConfigs, fetchClientConfigs]);

  const getConfigsForClient = useCallback((clientId: string) => {
    const clientConfigIds = clientConfigs
      .filter(cc => cc.client_id === clientId)
      .map(cc => cc.wordpress_config_id);
    
    return configs.filter(config => clientConfigIds.includes(config.id));
  }, [configs, clientConfigs]);

  return {
    configs,
    clientConfigs,
    isLoading,
    error,
    fetchConfigs,
    fetchClientConfigs,
    getConfigsForClient
  };
};
