
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

  const fetchWordPressErrors = async () => {
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
        setWordPressErrors([]);
        return;
      }

      // Tester la connectivité de chaque configuration
      const errorConfigs: WordPressError[] = [];
      
      for (const config of configs) {
        try {
          // Test simple de connectivité avec timeout
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000);
          
          const testUrl = `${config.site_url}/wp-json`;
          const response = await fetch(testUrl, {
            method: 'HEAD',
            mode: 'no-cors',
            signal: controller.signal,
          });
          
          clearTimeout(timeoutId);
          
        } catch (fetchError: any) {
          // Si le fetch échoue, c'est probablement un problème de connectivité
          if (fetchError.name === 'AbortError') {
            errorConfigs.push({
              id: config.id,
              name: config.name,
              site_url: config.site_url,
              error_message: 'Délai d\'attente dépassé - Site inaccessible',
              last_checked: new Date().toISOString()
            });
          } else if (fetchError.message.includes('Failed to fetch')) {
            errorConfigs.push({
              id: config.id,
              name: config.name,
              site_url: config.site_url,
              error_message: 'Impossible d\'accéder au site',
              last_checked: new Date().toISOString()
            });
          }
        }
      }

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
