
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Notification } from '@/types/notifications';

export const useNotificationFetch = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Charger les notifications de l'utilisateur
  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      // Utiliser .from() avec un cast générique pour contourner les limitations TypeScript
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Cast explicite vers le type Notification[]
      const typedData = data as unknown as Notification[];
      
      setNotifications(typedData || []);
      return typedData || [];
    } catch (error: any) {
      console.error('Erreur lors du chargement des notifications:', error.message);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  return {
    notifications,
    setNotifications,
    isLoading,
    fetchNotifications
  };
};
