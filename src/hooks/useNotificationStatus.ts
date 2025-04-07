
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Notification } from '@/types/notifications';

export const useNotificationStatus = (notifications: Notification[], setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>) => {
  const [unreadCount, setUnreadCount] = useState(0);

  // Calculer le nombre de notifications non lues
  const calculateUnreadCount = (notifs: Notification[]) => {
    const count = notifs.filter(n => !n.is_read).length;
    setUnreadCount(count);
  };

  // Marquer une notification comme lue
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ is_read: true } as any)
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
        .update({ is_read: true } as any)
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

  return {
    unreadCount,
    calculateUnreadCount,
    markAsRead,
    markAllAsRead
  };
};
