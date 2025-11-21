import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

/**
 * Hook to track user activity and update last activity timestamp
 */
export const useActivityTracking = () => {
  const { user } = useAuth();

  useEffect(() => {
    const trackActivity = async () => {
      if (!user) return;

      try {
        // Update user activity on login
        const { error } = await supabase
          .from('user_activity')
          .upsert(
            {
              user_id: user.id,
              last_activity_at: new Date().toISOString(),
              activity_type: 'login'
            },
            {
              onConflict: 'user_id'
            }
          );

        if (error) {
          console.error('Error tracking login activity:', error);
        }
      } catch (error) {
        console.error('Error tracking login activity:', error);
      }
    };

    // Track activity only on login/mount
    trackActivity();
  }, [user]);
};
