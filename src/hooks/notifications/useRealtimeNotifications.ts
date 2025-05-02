
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to set up realtime notifications for ticket activities
 */
export const useRealtimeNotifications = (
  userId: string | undefined, 
  onNotificationReceived: () => void
) => {
  useEffect(() => {
    if (!userId) return;
    
    // Listen for ticket_read_status changes
    const readStatusChannel = supabase
      .channel('notification_read_status_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ticket_read_status',
        filter: `user_id=eq.${userId}`
      }, () => {
        onNotificationReceived();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'ticket_read_status',
        filter: `user_id=eq.${userId}`
      }, () => {
        onNotificationReceived();
      })
      .subscribe();
    
    // Listen for ticket_responses changes
    const responsesChannel = supabase
      .channel('notification_responses_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ticket_responses'
      }, () => {
        // Force an update with a short delay
        setTimeout(() => onNotificationReceived(), 300);
      })
      .subscribe();
    
    // Cleanup on unmount
    return () => {
      supabase.removeChannel(readStatusChannel);
      supabase.removeChannel(responsesChannel);
    };
  }, [userId, onNotificationReceived]);
};
