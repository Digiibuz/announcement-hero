
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
  const { preferences, updatePreferences } = useNotificationPreferences();
  const { unreadCount, calculateUnreadCount, markAsRead, markAllAsRead } = 
    useNotificationStatus(notifications, setNotifications);

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

  // Set up realtime subscriptions
  useNotificationRealtime(setNotifications, setNotifications => {
    // Use a callback that updates notifications and recalculates the unread count
    return (notifs: Notification[]) => {
      setNotifications(notifs);
      calculateUnreadCount(notifs);
    };
  }, markAsRead);
  
  usePreferenceRealtime(preferences, updatePreferences);

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
