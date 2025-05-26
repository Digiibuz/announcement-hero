
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

  const testWordPressConnection = async (config: any): Promise<boolean> => {
    try {
      // Normaliser l'URL
      let siteUrl = config.site_url;
      if (siteUrl.endsWith('/')) {
        siteUrl = siteUrl.slice(0, -1);
      }
      
      // Test simple avec timeout court
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000);
      
      const testUrl = `${siteUrl}/wp-json/wp/v2/posts?per_page=1`;
      
      const response = await fetch(testUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'DigiCheck/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      // Site connecté si 200, 401 ou 403
      return response.status === 200 || response.status === 401 || response.status === 403;
      
    } catch (error) {
      // Toute erreur = site déconnecté
      return false;
    }
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

      // Tester la connectivité en parallèle
      const connectionTests = configs.map(async (config) => {
        return await testWordPressConnection(config);
      });
      
      const results = await Promise.all(connectionTests);
      const disconnectedCount = results.filter(isConnected => !isConnected).length;
      
      setDisconnectedSitesCount(disconnectedCount);
      
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
