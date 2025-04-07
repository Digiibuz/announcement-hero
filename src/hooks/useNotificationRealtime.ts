
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Notification } from '@/types/notifications';
import { useAuth } from '@/context/AuthContext';

export const useNotificationRealtime = (
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>,
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>,
  markAsRead: (id: string) => Promise<void>
) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // Souscrire aux nouvelles notifications
    const notificationsSubscription = supabase
      .channel('user_notifications_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'user_notifications',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const newNotification = payload.new as unknown as Notification;
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

    return () => {
      supabase.removeChannel(notificationsSubscription);
    };
  }, [user, setNotifications, setUnreadCount, markAsRead]);
};
