
import { useState, useEffect } from "react";
import { useTickets, Ticket } from "./useTickets";
import { useAuth } from "@/context/AuthContext";

export const useTicketNotifications = () => {
  const { user } = useAuth();
  const { data: tickets = [] } = useTickets(user?.id);
  const [unreadCount, setUnreadCount] = useState(0);

  // Vérifie si un ticket a des réponses non lues
  const checkUnreadResponses = (tickets: Ticket[]) => {
    // Logique simplifiée: considère qu'une réponse est non lue si elle est récente (moins de 24h)
    // et si le dernier message vient d'un admin et non de l'utilisateur
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    let count = 0;
    
    tickets.forEach(ticket => {
      if (ticket.responses && ticket.responses.length > 0) {
        const lastResponse = ticket.responses[ticket.responses.length - 1];
        
        // Si la dernière réponse vient d'un admin et est récente
        if (lastResponse.is_admin && 
            new Date(lastResponse.created_at) > oneDayAgo && 
            lastResponse.user_id !== user?.id) {
          count++;
        }
      }
    });

    return count;
  };

  useEffect(() => {
    if (tickets.length > 0) {
      const count = checkUnreadResponses(tickets);
      setUnreadCount(count);
    }
  }, [tickets, user?.id]);

  return { unreadCount };
};
