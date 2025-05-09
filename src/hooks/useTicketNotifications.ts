
import { useState, useEffect, useCallback } from "react";
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
  const [readTicketIds, setReadTicketIds] = useState<string[]>([]);
  const [hasViewedTicketTab, setHasViewedTicketTab] = useState(false);

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

      // Function to mark a ticket as read - for type demonstration
      const markTicketAsRead = async (status: TicketReadStatus) => {
        // Placeholder function for TypeScript typing purposes
        console.log("Marking ticket as read:", status);
      };

      // Process ticket read status data with proper typing
      const typedReadStatus: TicketReadStatus[] = [];
      const readIds: string[] = [];
      
      if (ticketReadStatus) {
        ticketReadStatus.forEach((item: any) => {
          const typedItem: TicketReadStatus = {
            id: typedData<string>(item.id),
            user_id: typedData<string>(item.user_id),
            ticket_id: typedData<string>(item.ticket_id),
            read_at: typedData<string>(item.read_at)
          };
          
          typedReadStatus.push(typedItem);
          readIds.push(typedItem.ticket_id);
        });
      }
      
      setReadTicketIds(readIds);
      
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

  // Function to mark a ticket as read
  const markTicketAsRead = useCallback(async (ticketId: string) => {
    try {
      if (!user?.id) return;
      
      // Check if ticket is already marked as read
      const isAlreadyRead = readTicketIds.includes(ticketId);
      if (isAlreadyRead) return;
      
      // Insert a new read status record
      const { error } = await supabase
        .from('ticket_read_status')
        .insert({
          ticket_id: ticketId,
          user_id: user.id,
        });
        
      if (error) {
        console.error("Error marking ticket as read:", error);
        return;
      }
      
      // Update local state
      setReadTicketIds(prev => [...prev, ticketId]);
      setNewTicketsCount(prev => Math.max(0, prev - 1));
      
    } catch (error) {
      console.error("Error marking ticket as read:", error);
    }
  }, [user?.id, readTicketIds]);

  // Function to mark the ticket tab as viewed (reduces notification count)
  const markTicketTabAsViewed = useCallback(() => {
    setHasViewedTicketTab(true);
  }, []);

  // Function to reset the ticket tab view state
  const resetTicketTabView = useCallback(() => {
    setHasViewedTicketTab(false);
  }, []);

  // Get unread count - returns actual count or 0 if tab has been viewed
  const unreadCount = hasViewedTicketTab ? 0 : newTicketsCount;

  useEffect(() => {
    fetchNewTicketsCount();
  }, [user?.id]);

  return { 
    newTicketsCount, 
    isLoading, 
    markTicketAsRead, 
    markTicketTabAsViewed, 
    resetTicketTabView, 
    readTicketIds,
    unreadCount
  };
};
