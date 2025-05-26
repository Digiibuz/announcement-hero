
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

      const { data, error } = await supabase
        .from('monthly_publication_limits')
        .select(`
          *,
          profiles:user_id (
            id,
            name,
            email
          )
        `)
        .eq('year', currentYear)
        .eq('month', currentMonth)
        .lt('published_count', 'max_limit')
        .gte('published_count', supabase.raw('max_limit - 5')); // Utilisateurs avec moins de 5 publications restantes

      if (error) throw error;

      const users = data?.map(item => ({
        id: item.profiles?.id || '',
        name: item.profiles?.name || 'Utilisateur inconnu',
        email: item.profiles?.email || '',
        published_count: item.published_count,
        max_limit: item.max_limit,
        remaining: item.max_limit - item.published_count
      })) || [];

      setUsersNearLimit(users);
    } catch (error) {
      console.error('Error fetching users near limit:', error);
    }
  };

  const fetchWordPressErrors = async () => {
    try {
      // Pour le moment, on simule des erreurs WordPress
      // Dans une vraie implémentation, on aurait une table pour stocker les statuts de connexion
      const { data: configs, error } = await supabase
        .from('wordpress_configs')
        .select('*');

      if (error) throw error;

      // Simulation d'erreurs pour la démonstration
      const errors: WordPressError[] = [];
      
      // On peut ajouter une logique pour tester la connectivité en arrière-plan
      // et stocker les résultats dans une table séparée
      
      setWordPressErrors(errors);
    } catch (error) {
      console.error('Error fetching WordPress errors:', error);
      toast.error("Erreur lors de la récupération des statuts WordPress");
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
