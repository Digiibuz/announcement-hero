
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UserNearLimit {
  id: string;
  name: string;
  email: string;
  published_count: number;
  max_limit: number;
  remaining: number;
}

export const useAdminAlerts = () => {
  const [usersNearLimit, setUsersNearLimit] = useState<UserNearLimit[]>([]);
  const [disconnectedSitesCount, setDisconnectedSitesCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUsersNearLimit = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;

      // Récupérer les utilisateurs avec leurs limites de publication
      const { data: limits, error: limitsError } = await supabase
        .from('monthly_publication_limits')
        .select('*')
        .eq('year', currentYear)
        .eq('month', currentMonth);

      if (limitsError) {
        console.error('Error fetching publication limits:', limitsError);
        return;
      }

      if (!limits || limits.length === 0) {
        setUsersNearLimit([]);
        return;
      }

      // Récupérer les profils des utilisateurs
      const userIds = limits.map(limit => limit.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        return;
      }

      // Combiner les données et filtrer les utilisateurs proches de leurs limites
      const usersNearLimits = limits
        .map(limit => {
          const profile = profiles?.find(p => p.id === limit.user_id);
          if (!profile) return null;

          const remaining = limit.max_limit - limit.published_count;
          
          return {
            id: profile.id,
            name: profile.name || 'Utilisateur inconnu',
            email: profile.email || '',
            published_count: limit.published_count,
            max_limit: limit.max_limit,
            remaining: remaining
          };
        })
        .filter((user): user is UserNearLimit => 
          user !== null && user.remaining <= 5 && user.remaining > 0
        );

      setUsersNearLimit(usersNearLimits);
    } catch (error) {
      console.error('Error fetching users near limit:', error);
    }
  };

  // Utiliser la même logique que DisconnectedSitesTable pour déterminer le statut de connexion
  const getConnectionStatus = (config: any) => {
    if (config.app_username && config.app_password) {
      return { status: "connected", label: "Connecté" };
    } else if (config.rest_api_key) {
      return { status: "partial", label: "Partiel" };
    }
    return { status: "disconnected", label: "Déconnecté" };
  };

  const fetchDisconnectedSites = async () => {
    try {
      // Récupérer toutes les configurations WordPress
      const { data: configs, error } = await supabase
        .from('wordpress_configs')
        .select('*');

      if (error) {
        console.error('Error fetching WordPress configs:', error);
        return;
      }

      if (!configs || configs.length === 0) {
        setDisconnectedSitesCount(0);
        return;
      }

      // Filtrer les sites déconnectés en utilisant la même logique que DisconnectedSitesTable
      const disconnectedConfigs = configs.filter(config => {
        const status = getConnectionStatus(config);
        return status.status === "disconnected";
      });
      
      setDisconnectedSitesCount(disconnectedConfigs.length);
      
    } catch (error) {
      console.error('Error checking WordPress connections:', error);
    }
  };

  const fetchAlerts = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchUsersNearLimit(),
      fetchDisconnectedSites()
    ]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  return {
    usersNearLimit,
    disconnectedSitesCount,
    isLoading,
    refetch: fetchAlerts
  };
};
