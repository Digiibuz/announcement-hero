
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

interface WordPressError {
  id: string;
  name: string;
  site_url: string;
  error_message: string;
  last_checked: string;
}

export const useAdminAlerts = () => {
  const [usersNearLimit, setUsersNearLimit] = useState<UserNearLimit[]>([]);
  const [wordpressErrors, setWordPressErrors] = useState<WordPressError[]>([]);
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
      console.log(`Testing WordPress connection for: ${config.site_url}`);
      
      // Normaliser l'URL (enlever les doubles slashes)
      let siteUrl = config.site_url;
      if (siteUrl.endsWith('/')) {
        siteUrl = siteUrl.slice(0, -1);
      }
      
      // Test de l'API REST WordPress avec timeout plus court
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 secondes
      
      const testUrl = `${siteUrl}/wp-json/wp/v2/posts?per_page=1`;
      
      const response = await fetch(testUrl, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'User-Agent': 'DigiCheck/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      console.log(`Response status for ${siteUrl}: ${response.status}`);
      
      // Le site est considéré comme connecté si :
      // - 200 (OK)
      // - 401 (Unauthorized - l'API existe mais nécessite une auth)
      // - 403 (Forbidden - l'API existe mais accès refusé)
      const isConnected = response.status === 200 || response.status === 401 || response.status === 403;
      
      console.log(`Site ${siteUrl} connection result: ${isConnected ? 'Connected' : 'Disconnected'}`);
      return isConnected;
      
    } catch (error: any) {
      console.log(`Connection test failed for ${config.site_url}:`, error.message);
      
      // Toute erreur (timeout, network error, CORS, etc.) = site déconnecté
      if (error.name === 'AbortError') {
        console.log(`Timeout for ${config.site_url}`);
      } else if (error.message.includes('Failed to fetch')) {
        console.log(`Network error for ${config.site_url}`);
      }
      
      return false;
    }
  };

  const fetchWordPressErrors = async () => {
    try {
      console.log('Checking WordPress configurations for admin alerts...');
      
      // Récupérer toutes les configurations WordPress
      const { data: configs, error } = await supabase
        .from('wordpress_configs')
        .select('*');

      if (error) {
        console.error('Error fetching WordPress configs:', error);
        return;
      }

      if (!configs || configs.length === 0) {
        console.log('No WordPress configs found');
        setWordPressErrors([]);
        return;
      }

      console.log(`Testing ${configs.length} WordPress configurations for admin alerts...`);
      
      // Tester la connectivité de chaque configuration
      const errorConfigs: WordPressError[] = [];
      
      // Tester les sites en parallèle pour améliorer les performances
      const connectionTests = configs.map(async (config) => {
        const isConnected = await testWordPressConnection(config);
        
        if (!isConnected) {
          console.log(`Site ${config.site_url} is disconnected - adding to alerts`);
          return {
            id: config.id,
            name: config.name,
            site_url: config.site_url,
            error_message: 'Site inaccessible ou en erreur',
            last_checked: new Date().toISOString()
          };
        }
        
        console.log(`Site ${config.site_url} is connected - no alert needed`);
        return null;
      });
      
      const results = await Promise.all(connectionTests);
      const disconnectedSites = results.filter(result => result !== null);
      
      console.log(`Found ${disconnectedSites.length} disconnected sites for admin alerts`);
      setWordPressErrors(disconnectedSites);
      
    } catch (error) {
      console.error('Error fetching WordPress errors:', error);
      toast.error("Erreur lors de la vérification des sites WordPress");
    }
  };

  const fetchAlerts = async () => {
    setIsLoading(true);
    await Promise.all([
      fetchUsersNearLimit(),
      fetchWordPressErrors()
    ]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  return {
    usersNearLimit,
    wordpressErrors,
    isLoading,
    refetch: fetchAlerts
  };
};
