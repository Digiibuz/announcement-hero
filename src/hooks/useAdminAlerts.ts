
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
      // Normaliser l'URL
      const siteUrl = config.site_url.replace(/([^:]\/)\/+/g, "$1");
      
      // Test simple avec timeout court
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 secondes timeout
      
      const testUrl = `${siteUrl}/wp-json/wp/v2`;
      
      const response = await fetch(testUrl, {
        method: 'HEAD',
        signal: controller.signal,
        headers: {
          'User-Agent': 'DigiCheck/1.0'
        }
      });
      
      clearTimeout(timeoutId);
      
      // Si la réponse est OK (200-299) ou même 401 (non autorisé), 
      // cela signifie que le site répond
      return response.ok || response.status === 401 || response.status === 403;
      
    } catch (error: any) {
      console.log(`Connection test failed for ${config.site_url}:`, error.message);
      // Toute erreur (timeout, network error, etc.) indique que le site est inaccessible
      return false;
    }
  };

  const fetchWordPressErrors = async () => {
    try {
      console.log('Checking WordPress configurations...');
      
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

      console.log(`Testing ${configs.length} WordPress configurations...`);
      
      // Tester la connectivité de chaque configuration
      const errorConfigs: WordPressError[] = [];
      
      for (const config of configs) {
        console.log(`Testing connection to: ${config.site_url}`);
        
        const isConnected = await testWordPressConnection(config);
        
        if (!isConnected) {
          console.log(`Site ${config.site_url} is disconnected`);
          errorConfigs.push({
            id: config.id,
            name: config.name,
            site_url: config.site_url,
            error_message: 'Site inaccessible ou en erreur',
            last_checked: new Date().toISOString()
          });
        } else {
          console.log(`Site ${config.site_url} is connected`);
        }
      }

      console.log(`Found ${errorConfigs.length} sites with connection errors`);
      setWordPressErrors(errorConfigs);
      
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
