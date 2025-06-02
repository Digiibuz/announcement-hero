
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { WordPressConfig } from "@/types/wordpress";
import { useAuth } from "@/context/AuthContext";

/**
 * Hook to fetch WordPress configurations
 */
export const useWordPressConfigsList = () => {
  const [configs, setConfigs] = useState<WordPressConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user, isClient, isCommercial, isAdmin } = useAuth();

  const fetchConfigs = async () => {
    try {
      setIsLoading(true);
      
      // Pour les clients, on ne récupère que leur configuration WordPress attribuée
      if (isClient) {
        // Si le client a un wordpressConfigId, on récupère cette configuration
        if (user?.wordpressConfigId) {
          console.log("Fetching WordPress config for client:", user.wordpressConfigId);
          
          const { data, error } = await supabase
            .from('wordpress_configs')
            .select('*')
            .eq('id', user.wordpressConfigId)
            .single();
          
          if (error) {
            console.error("Error fetching client WordPress config:", error);
            throw error;
          }
          
          console.log("WordPress config found for client:", data?.name);
          setConfigs(data ? [data as WordPressConfig] : []);
        } else {
          // Si le client n'a pas de wordpressConfigId, on renvoie un tableau vide
          console.log("Client has no WordPress config assigned");
          setConfigs([]);
        }
      } 
      // Pour les commerciaux, on récupère les configurations de leurs clients
      else if (isCommercial) {
        console.log("🔍 Commercial mode: fetching WordPress configs for clients");
        console.log("🔍 Commercial user ID:", user?.id);
        
        // Récupérer directement les profils des clients avec leur wordpress_config_id
        // en joignant avec commercial_clients
        const { data: clientConfigs, error: configsError } = await supabase
          .from('commercial_clients')
          .select(`
            client_id,
            profiles!commercial_clients_client_id_fkey (
              id,
              wordpress_config_id,
              name,
              wordpress_configs!profiles_wordpress_config_id_fkey (
                id,
                name,
                site_url,
                created_at,
                updated_at,
                rest_api_key,
                app_username,
                app_password,
                username,
                password
              )
            )
          `)
          .eq('commercial_id', user?.id);
        
        console.log("🔍 Query result:", clientConfigs);
        console.log("🔍 Query error:", configsError);
        
        if (configsError) {
          console.error('❌ Error fetching client configs:', configsError);
          throw configsError;
        }
        
        // Extraire les configurations WordPress uniques
        const uniqueConfigs = new Map<string, WordPressConfig>();
        
        if (clientConfigs && clientConfigs.length > 0) {
          clientConfigs.forEach((relation) => {
            console.log("🔍 Processing relation:", relation);
            
            if (relation.profiles && relation.profiles.wordpress_configs) {
              const config = relation.profiles.wordpress_configs;
              console.log("🔍 Found WordPress config:", config.name);
              uniqueConfigs.set(config.id, config as WordPressConfig);
            }
          });
        }
        
        const finalConfigs = Array.from(uniqueConfigs.values());
        console.log("📊 Final WordPress configs for commercial:", finalConfigs.length);
        setConfigs(finalConfigs);
      }
      // Pour les admins, on récupère toutes les configurations
      else if (isAdmin) {
        const { data, error } = await supabase
          .from('wordpress_configs')
          .select('*')
          .order('name');
        
        if (error) {
          throw error;
        }
        
        setConfigs(data as WordPressConfig[]);
      }
      // Pour les autres rôles, tableau vide
      else {
        setConfigs([]);
      }
    } catch (error) {
      console.error('Error fetching WordPress configs:', error);
      toast.error("Erreur lors de la récupération des configurations WordPress");
      setConfigs([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("useWordPressConfigsList effect running, isClient:", isClient, "isCommercial:", isCommercial, "user.wordpressConfigId:", user?.wordpressConfigId);
    fetchConfigs();
  }, [isClient, isCommercial, isAdmin, user?.wordpressConfigId, user?.id]);

  return {
    configs,
    isLoading,
    fetchConfigs
  };
};
