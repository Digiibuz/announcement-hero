
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { NotificationPreferences } from '@/types/notifications';

export const usePreferenceRealtime = (
  setPreferences: React.Dispatch<React.SetStateAction<NotificationPreferences>>
) => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

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
      supabase.removeChannel(preferencesSubscription);
    };
  }, [user, setPreferences]);
};
