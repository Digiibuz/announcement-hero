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
        // Update user activity
        const { error } = await supabase
          .from('user_activity')
          .upsert(
            {
              user_id: user.id,
              last_activity_at: new Date().toISOString(),
              activity_type: 'activity'
            },
            {
              onConflict: 'user_id'
            }
          );

        if (error) {
          console.error('Error tracking activity:', error);
        }
      } catch (error) {
        console.error('Error tracking activity:', error);
      }
    };

    // Track activity on mount
    trackActivity();

    // Track activity every 5 minutes
    const interval = setInterval(trackActivity, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);
};
