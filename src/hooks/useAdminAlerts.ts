
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

interface DisconnectedSite {
  id: string;
  name: string;
  site_url: string;
  client_name?: string;
  client_email?: string;
  disconnection_reason: string;
}

export const useAdminAlerts = () => {
  const [usersNearLimit, setUsersNearLimit] = useState<UserNearLimit[]>([]);
  const [disconnectedSites, setDisconnectedSites] = useState<DisconnectedSite[]>([]);
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

  // Fonction pour déterminer le statut de connexion et le motif de déconnexion
  const getConnectionStatus = (config: any) => {
    if (config.app_username && config.app_password) {
      return { 
        status: "connected", 
        label: "Connecté",
        reason: ""
      };
    } else if (config.rest_api_key) {
      return { 
        status: "partial", 
        label: "Partiel",
        reason: "Seule la clé API REST est configurée"
      };
    }

    // Déterminer la raison spécifique de la déconnexion
    let reason = "Configuration incomplète";
    if (!config.site_url) {
      reason = "URL du site manquante";
    } else if (!config.app_username && !config.app_password && !config.rest_api_key) {
      reason = "Aucun identifiant configuré";
    } else if (config.app_username && !config.app_password) {
      reason = "Mot de passe d'application manquant";
    } else if (!config.app_username && config.app_password) {
      reason = "Nom d'utilisateur d'application manquant";
    }

    return { 
      status: "disconnected", 
      label: "Déconnecté",
      reason: reason
    };
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
        setDisconnectedSites([]);
        setDisconnectedSitesCount(0);
        return;
      }

      // Récupérer les profils des utilisateurs pour associer les clients
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, name, email, wordpress_config_id')
        .eq('role', 'client');

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
      }

      // Filtrer les sites déconnectés et enrichir avec les informations client
      const disconnectedConfigs = configs
        .map(config => {
          const status = getConnectionStatus(config);
          if (status.status !== "disconnected") return null;

          // Trouver le client associé à cette configuration
          const client = profiles?.find(profile => profile.wordpress_config_id === config.id);

          const disconnectedSite: DisconnectedSite = {
            id: config.id,
            name: config.name || 'Site sans nom',
            site_url: config.site_url || '',
            client_name: client?.name,
            client_email: client?.email,
            disconnection_reason: status.reason
          };

          return disconnectedSite;
        })
        .filter((site): site is DisconnectedSite => site !== null);
      
      setDisconnectedSites(disconnectedConfigs);
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
    disconnectedSites,
    disconnectedSitesCount,
    isLoading,
    refetch: fetchAlerts
  };
};
