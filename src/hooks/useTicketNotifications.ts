import { useState, useEffect } from "react";
import { supabase, typedData } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

// Define the structure of your ticket_read_status table
interface TicketReadStatus {
  id: string;
  user_id: string;
  ticket_id: string;
  read_at: string;
}

export const useTicketNotifications = () => {
  const { user } = useAuth();
  const [newTicketsCount, setNewTicketsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  const fetchNewTicketsCount = async () => {
    setIsLoading(true);
    try {
      if (!user?.id) {
        setNewTicketsCount(0);
        return;
      }

      // Fetch all tickets that the user has read
      const { data: ticketReadStatus, error: readStatusError } = await supabase
        .from('ticket_read_status')
        .select('*')
        .eq('user_id', user.id);

      if (readStatusError) {
        console.error("Error fetching ticket read status:", readStatusError);
        return;
      }

      // Fetch all tickets
      const { data: allTickets, error: allTicketsError } = await supabase
        .from('tickets')
        .select('*');

      if (allTicketsError) {
        console.error("Error fetching all tickets:", allTicketsError);
        return;
      }

      // Function to mark a ticket as read
      const markTicketAsRead = async (ticketReadStatus: TicketReadStatus) => {
        // No need to do anything here, just demonstrating the type
      };

      // Inside your component where you're mapping over ticketReadStatus
      // Replace the forEach function with the following:
      ticketReadStatus.forEach((item: any) => {
        const typedItem: TicketReadStatus = {
          id: typedData<string>(item.id),
          user_id: typedData<string>(item.user_id),
          ticket_id: typedData<string>(item.ticket_id),
          read_at: typedData<string>(item.read_at)
        };
        // Now use typedItem for your processing
        markTicketAsRead(typedItem);
      });

      // Calculate the count of new tickets
      if (allTickets && ticketReadStatus) {
        const unreadTickets = allTickets.filter(ticket => {
          return !ticketReadStatus.some(readStatus => readStatus.ticket_id === ticket.id);
        });
        setNewTicketsCount(unreadTickets.length);
      } else {
        setNewTicketsCount(0);
      }

    } catch (error) {
      console.error("Error fetching new tickets count:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNewTicketsCount();
  }, [user?.id]);

  return { newTicketsCount, isLoading };
};
