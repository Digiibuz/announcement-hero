
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export type NotificationType = 'reminder' | 'alert' | 'info';

export interface Notification {
  id: string;
  title: string;
  content: string;
  type: NotificationType;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
  metadata?: any;
}

export interface NotificationPreferences {
  reminder_enabled: boolean;
  alert_enabled: boolean;
  info_enabled: boolean;
}

export const useNotifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    reminder_enabled: true,
    alert_enabled: true,
    info_enabled: true,
  });

  // Charger les notifications de l'utilisateur
  const fetchNotifications = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('user_notifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setNotifications(data || []);
      calculateUnreadCount(data || []);
    } catch (error: any) {
      console.error('Erreur lors du chargement des notifications:', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Charger les préférences de notifications de l'utilisateur
  const fetchPreferences = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 est l'erreur "did not return a single row" - ignorable
        throw error;
      }

      if (data) {
        setPreferences({
          reminder_enabled: data.reminder_enabled,
          alert_enabled: data.alert_enabled,
          info_enabled: data.info_enabled,
        });
      }
    } catch (error: any) {
      console.error('Erreur lors du chargement des préférences:', error.message);
    }
  };

  // Marquer une notification comme lue
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(notifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, is_read: true, read_at: new Date().toISOString() } 
          : notification
      ));
      
      calculateUnreadCount(notifications.map(notification => 
        notification.id === notificationId 
          ? { ...notification, is_read: true } 
          : notification
      ));
    } catch (error: any) {
      console.error('Erreur lors du marquage de la notification:', error.message);
      toast.error('Impossible de marquer la notification comme lue');
    }
  };

  // Marquer toutes les notifications comme lues
  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(notifications.map(notification => ({
        ...notification,
        is_read: true,
        read_at: notification.read_at || new Date().toISOString()
      })));
      
      setUnreadCount(0);
      toast.success('Toutes les notifications ont été marquées comme lues');
    } catch (error: any) {
      console.error('Erreur lors du marquage des notifications:', error.message);
      toast.error('Impossible de marquer les notifications comme lues');
    }
  };

  // Mettre à jour les préférences de notifications
  const updatePreferences = async (newPreferences: NotificationPreferences) => {
    try {
      const { error } = await supabase
        .from('notification_preferences')
        .update(newPreferences);

      if (error) throw error;

      setPreferences(newPreferences);
      toast.success('Préférences de notifications mises à jour');
    } catch (error: any) {
      console.error('Erreur lors de la mise à jour des préférences:', error.message);
      toast.error('Impossible de mettre à jour les préférences');
    }
  };

  // Calculer le nombre de notifications non lues
  const calculateUnreadCount = (notifs: Notification[]) => {
    const count = notifs.filter(n => !n.is_read).length;
    setUnreadCount(count);
  };

  // Configurer les souscriptions en temps réel pour les nouvelles notifications
  useEffect(() => {
    if (!user) return;

    fetchNotifications();
    fetchPreferences();

    // Souscrire aux nouvelles notifications
    const notificationsSubscription = supabase
      .channel('user_notifications_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'user_notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const newNotification = payload.new as Notification;
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        // Afficher une toast pour la nouvelle notification
        toast(newNotification.title, {
          description: newNotification.content,
          action: {
            label: "Voir",
            onClick: () => markAsRead(newNotification.id)
          },
        });
      })
      .subscribe();

    // Souscrire aux changements de préférences
    const preferencesSubscription = supabase
      .channel('notification_preferences_changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'notification_preferences',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const updatedPreferences = payload.new as any;
        setPreferences({
          reminder_enabled: updatedPreferences.reminder_enabled,
          alert_enabled: updatedPreferences.alert_enabled,
          info_enabled: updatedPreferences.info_enabled,
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(notificationsSubscription);
      supabase.removeChannel(preferencesSubscription);
    };
  }, [user]);

  return {
    notifications,
    unreadCount,
    isLoading,
    preferences,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    updatePreferences
  };
};
