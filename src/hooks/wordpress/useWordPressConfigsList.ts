
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
          console.log('🔍 About to fetch profiles for client IDs:', clientIds);
          
          // Récupérer TOUS les profils clients, puis filtrer côté client
          const { data: clientProfiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, wordpress_config_id')
            .in('id', clientIds);
          
          if (profilesError) {
            console.error('❌ Error fetching client profiles:', profilesError);
            throw profilesError;
          }
          
          console.log('🔍 Raw client profiles:', clientProfiles);
          console.log('🔍 Number of profiles returned:', clientProfiles?.length || 0);
          
          // Debug: vérifier chaque profil individuellement
          clientProfiles?.forEach((profile, index) => {
            console.log(`🔍 Profile ${index}:`, {
              id: profile.id,
              wordpress_config_id: profile.wordpress_config_id,
              type: typeof profile.wordpress_config_id,
              hasValue: !!profile.wordpress_config_id,
              trimmed: profile.wordpress_config_id?.trim?.() || 'NO_TRIM_METHOD'
            });
          });
          
          // Filtrer côté client pour exclure les profils sans wordpress_config_id
          const validProfiles = clientProfiles?.filter(profile => {
            const hasConfig = profile.wordpress_config_id && 
                             profile.wordpress_config_id !== null && 
                             profile.wordpress_config_id !== '' &&
                             profile.wordpress_config_id.toString().trim() !== '';
            console.log(`🔍 Profile ${profile.id} has valid config:`, hasConfig, profile.wordpress_config_id);
            return hasConfig;
          }) || [];
          
          console.log('🔍 Valid client profiles with WordPress config:', validProfiles);
          
          const wordpressConfigIds = validProfiles.map(profile => profile.wordpress_config_id);
          console.log('🔍 WordPress config IDs for clients:', wordpressConfigIds);
          
          if (wordpressConfigIds.length > 0) {
            console.log('🔍 About to fetch WordPress configs for IDs:', wordpressConfigIds);
            
            // Récupérer les configurations WordPress
            const { data, error } = await supabase
              .from('wordpress_configs')
              .select('*')
              .in('id', wordpressConfigIds)
              .order('name');
            
            if (error) {
              console.error('❌ Error fetching WordPress configs:', error);
              throw error;
            }
            
            console.log('📊 WordPress configs found for commercial:', data?.length || 0);
            console.log('📊 WordPress configs details:', data);
            setConfigs(data as WordPressConfig[]);
          } else {
            console.log("No WordPress configs found for commercial's clients");
            setConfigs([]);
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
