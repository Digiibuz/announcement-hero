
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
        
        // Récupérer les IDs des clients assignés à ce commercial
        const { data: commercialClients, error: clientsError } = await supabase
          .from('commercial_clients')
          .select('client_id')
          .eq('commercial_id', user?.id);
        
        if (clientsError) {
          console.error('❌ Error fetching commercial clients:', clientsError);
          throw clientsError;
        }
        
        const clientIds = commercialClients?.map(relation => relation.client_id) || [];
        console.log('🔍 Commercial clients IDs:', clientIds);
        
        if (clientIds.length > 0) {
          console.log('🔍 About to fetch WordPress configs directly via join');
          
          // Approche directe : récupérer les WordPress configs en joignant avec les profils
          // Cette requête utilise une jointure pour éviter les problèmes de RLS
          const { data: wordpressConfigs, error: configsError } = await supabase
            .from('wordpress_configs')
            .select(`
              *,
              profiles!inner(id)
            `)
            .in('profiles.id', clientIds);
          
          console.log('🔍 WordPress configs query result:', wordpressConfigs);
          console.log('🔍 WordPress configs query error:', configsError);
          
          if (configsError) {
            console.error('❌ Error fetching WordPress configs via join:', configsError);
            // Fallback: essayer une approche alternative
            console.log('🔄 Trying alternative approach...');
            
            // Alternative : récupérer toutes les configs WordPress et filtrer par les IDs clients
            const { data: allConfigs, error: allConfigsError } = await supabase
              .from('wordpress_configs')
              .select('*');
              
            if (allConfigsError) {
              console.error('❌ Error fetching all WordPress configs:', allConfigsError);
              throw allConfigsError;
            }
            
            console.log('📊 All WordPress configs fetched:', allConfigs?.length || 0);
            
            // Maintenant récupérer les profils avec les wordpress_config_id
            const { data: clientProfilesData, error: profilesError } = await supabase
              .rpc('get_client_wordpress_configs', { 
                commercial_user_id: user?.id,
                target_client_ids: clientIds 
              });
            
            if (profilesError) {
              console.error('❌ Error calling RPC function:', profilesError);
              // Si la fonction RPC n'existe pas, on utilise un fallback simple
              setConfigs([]);
              return;
            }
            
            console.log('📊 Client profiles from RPC:', clientProfilesData);
            setConfigs(clientProfilesData || []);
          } else {
            // Extraire les configurations WordPress depuis le résultat de la jointure
            const configs = wordpressConfigs?.map(item => ({
              id: item.id,
              name: item.name,
              site_url: item.site_url,
              rest_api_key: item.rest_api_key,
              app_username: item.app_username,
              app_password: item.app_password,
              username: item.username,
              password: item.password,
              created_at: item.created_at,
              updated_at: item.updated_at
            })) || [];
            
            console.log('📊 WordPress configs found for commercial:', configs.length);
            setConfigs(configs);
          }
        } else {
          console.log("Commercial has no clients assigned");
          setConfigs([]);
        }
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
