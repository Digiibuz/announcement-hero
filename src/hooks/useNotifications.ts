
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Notification, NotificationPreferences } from '@/types/notifications';
import { useNotificationFetch } from './useNotificationFetch';
import { useNotificationStatus } from './useNotificationStatus';
import { useNotificationRealtime } from './useNotificationRealtime';
import { useNotificationPreferences } from './useNotificationPreferences';
import { usePreferenceRealtime } from './usePreferenceRealtime';

export type { NotificationType, Notification, NotificationPreferences } from '@/types/notifications';

export const useNotifications = () => {
  const { user } = useAuth();
  const { notifications, setNotifications, isLoading, fetchNotifications } = useNotificationFetch();
  const [preferences, setPreferences] = useState<NotificationPreferences>({
    reminder_enabled: true,
    alert_enabled: true,
    info_enabled: true,
  });
  const { unreadCount, calculateUnreadCount, markAsRead, markAllAsRead } = 
    useNotificationStatus(notifications, setNotifications);
  const { preferences: prefData, updatePreferences } = useNotificationPreferences();

  // Initialize notifications and unread count
  useEffect(() => {
    if (user) {
      fetchNotifications().then(notifs => {
        if (notifs) {
          calculateUnreadCount(notifs);
        }
      });
    }
  }, [user]);

  // Sync preferences from the preferences hook
  useEffect(() => {
    if (prefData) {
      setPreferences(prefData);
    }
  }, [prefData]);

  // Set up realtime subscriptions
  useNotificationRealtime(setNotifications, setUnreadCount => setUnreadCount, markAsRead);
  usePreferenceRealtime(setPreferences);

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
