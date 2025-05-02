
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { TicketReadStatus } from "./types";

/**
 * Hook to manage ticket read status
 */
export const useReadStatus = () => {
  const { user } = useAuth();
  const [readTicketIds, setReadTicketIds] = useState<Record<string, Date>>({});

  // Load read ticket status from Supabase
  useEffect(() => {
    const fetchReadTickets = async () => {
      if (!user?.id) return;

      try {
        const { data, error } = await supabase
          .from('ticket_read_status')
          .select('*')
          .eq('user_id', user.id);

        if (error) {
          console.error("Error loading read tickets:", error);
          return;
        }

        if (data) {
          const ticketsWithDateObjects: Record<string, Date> = {};
          
          // Convert dates to Date objects
          data.forEach((item: TicketReadStatus) => {
            ticketsWithDateObjects[item.ticket_id] = new Date(item.read_at);
          });
          
          setReadTicketIds(ticketsWithDateObjects);
        }
      } catch (error) {
        console.error("Error loading read tickets:", error);
      }
    };

    fetchReadTickets();
  }, [user?.id]);

  // Mark a ticket as read
  const markTicketAsRead = useCallback(async (ticketId: string) => {
    if (!user?.id) return;
    
    // Current date for read timestamp
    const now = new Date();
    
    try {
      // Save to Supabase
      const { error } = await supabase
        .from('ticket_read_status')
        .upsert({
          user_id: user.id,
          ticket_id: ticketId,
          read_at: now.toISOString()
        }, { onConflict: 'user_id,ticket_id' });
      
      if (error) {
        console.error("Error saving read status:", error);
        return;
      }
      
      // Update local state
      setReadTicketIds(prevState => ({
        ...prevState,
        [ticketId]: now
      }));
    } catch (error) {
      console.error("Error saving read status:", error);
    }
  }, [user?.id]);

  return { readTicketIds, setReadTicketIds, markTicketAsRead };
};
