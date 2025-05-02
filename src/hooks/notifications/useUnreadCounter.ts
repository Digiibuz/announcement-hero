
import { useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import { useUserTickets } from "../tickets/useUserTickets";
import { useAllTickets } from "../tickets/useAllTickets";
import { Ticket } from "../tickets/types";

/**
 * Hook to calculate unread ticket notifications
 */
export const useUnreadCounter = (readTicketIds: Record<string, Date>) => {
  const { user, isAdmin } = useAuth();
  const { data: userTickets = [] } = useUserTickets();
  const { data: allTickets = [] } = useAllTickets();

  // Check for unread responses for a client
  const checkUnreadResponsesForClient = useCallback((tickets: Ticket[], readIds: Record<string, Date>) => {
    let count = 0;
    
    tickets.forEach(ticket => {
      if (ticket.responses && ticket.responses.length > 0) {
        const lastResponse = ticket.responses[ticket.responses.length - 1];
        
        // Get the date when the ticket was last read (if ever)
        const lastReadDate = readIds[ticket.id] ? new Date(readIds[ticket.id]) : null;
        const lastResponseDate = new Date(lastResponse.created_at);
        
        // A ticket is unread if:
        // 1. It's an admin response
        // 2. The user has never opened the ticket OR opened it before the last response
        // 3. The response doesn't come from the user themselves
        if (lastResponse.is_admin && 
            lastResponse.user_id !== user?.id &&
            (!lastReadDate || lastResponseDate > lastReadDate)) {
          count++;
        }
      }
    });

    return count;
  }, [user?.id]);

  // Check unread tickets for an admin
  const checkUnreadTicketsForAdmin = useCallback((tickets: Ticket[], readIds: Record<string, Date>) => {
    let count = 0;
    
    tickets.forEach(ticket => {
      if (ticket.status === "open") {
        // Check if the ticket has been read by the admin
        const lastReadDate = readIds[ticket.id] ? new Date(readIds[ticket.id]) : null;
        const ticketDate = new Date(ticket.created_at);
        
        // If the ticket has never been opened by the admin or updated after the last read
        if (!lastReadDate || ticketDate > lastReadDate) {
          // If the ticket has responses, check the last response
          if (ticket.responses && ticket.responses.length > 0) {
            const lastResponse = ticket.responses[ticket.responses.length - 1];
            const lastResponseDate = new Date(lastResponse.created_at);
            
            // If the last response is from the client and is more recent than the last read
            if (!lastResponse.is_admin && (!lastReadDate || lastResponseDate > lastReadDate)) {
              count++;
            }
          } else {
            // If it's a new ticket with no responses
            count++;
          }
        }
      }
    });

    return count;
  }, []);

  // Calculate the number of unread notifications
  const calculateUnreadCount = useCallback(() => {
    if (!user?.id) return 0;
    
    let count = 0;
    
    if (isAdmin) {
      // For admins, check all tickets
      if (Array.isArray(allTickets)) {
        count = checkUnreadTicketsForAdmin(allTickets as Ticket[], readTicketIds);
      }
    } else {
      // For clients, check only their tickets
      if (Array.isArray(userTickets)) {
        count = checkUnreadResponsesForClient(userTickets as Ticket[], readTicketIds);
      }
    }
    
    return count;
  }, [userTickets, allTickets, readTicketIds, user?.id, isAdmin, checkUnreadResponsesForClient, checkUnreadTicketsForAdmin]);

  return { calculateUnreadCount };
};
