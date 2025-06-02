
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
  const { user, isClient } = useAuth();

  const isCommercial = user?.role === 'commercial';

  const fetchConfigs = async () => {
    try {
      setIsLoading(true);
      
      // Pour les clients et commerciaux, on ne récupère que leur configuration WordPress attribuée
      if (isClient || isCommercial) {
        // Si le client/commercial a un wordpressConfigId, on récupère cette configuration
        if (user?.wordpressConfigId) {
          console.log("Fetching WordPress config for client/commercial:", user.wordpressConfigId);
          
          const { data, error } = await supabase
            .from('wordpress_configs')
            .select('*')
            .eq('id', user.wordpressConfigId)
            .maybeSingle();
          
          if (error) {
            console.error("Error fetching client/commercial WordPress config:", error);
            throw error;
          }
          
          console.log("WordPress config found for client/commercial:", data?.name);
          setConfigs(data ? [data as WordPressConfig] : []);
        } else {
          // Si le client/commercial n'a pas de wordpressConfigId, on renvoie un tableau vide
          console.log("Client/commercial has no WordPress config assigned");
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
        
        setConfigs(data as WordPressConfig[]);
      }
    } catch (error) {
      console.error('Error fetching WordPress configs:', error);
      toast.error("Erreur lors de la récupération des configurations WordPress");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    console.log("useWordPressConfigsList effect running, isClient:", isClient, "isCommercial:", isCommercial, "user.wordpressConfigId:", user?.wordpressConfigId);
    fetchConfigs();
  }, [isClient, isCommercial, user?.wordpressConfigId]);

  return {
    configs,
    isLoading,
    fetchConfigs
  };
};
