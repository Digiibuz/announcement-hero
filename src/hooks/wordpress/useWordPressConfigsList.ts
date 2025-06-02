
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
  const { user, isClient, isAdmin, isCommercial } = useAuth();

  const fetchConfigs = async () => {
    try {
      setIsLoading(true);
      
      // Pour les clients et commerciaux, on ne récupère que leur configuration WordPress attribuée
      if (isClient || isCommercial) {
        // Si l'utilisateur a un wordpressConfigId, on récupère cette configuration
        if (user?.wordpressConfigId) {
          console.log("Fetching WordPress config for user:", user.wordpressConfigId);
          
          const { data, error } = await supabase
            .from('wordpress_configs')
            .select('*')
            .eq('id', user.wordpressConfigId)
            .single();
          
          if (error) {
            console.error("Error fetching user WordPress config:", error);
            throw error;
          }
          
          console.log("WordPress config found for user:", data?.name);
          setConfigs(data ? [data as WordPressConfig] : []);
        } else {
          // Si l'utilisateur n'a pas de wordpressConfigId, on renvoie un tableau vide
          console.log("User has no WordPress config assigned");
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
