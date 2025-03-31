
import { useState, useEffect } from "react";
import { useTickets, Ticket } from "./useTickets";
import { useAuth } from "@/context/AuthContext";

// Clé pour le stockage local des tickets consultés
const READ_TICKETS_STORAGE_KEY = "digibuz_read_tickets";

export const useTicketNotifications = () => {
  const { user } = useAuth();
  const { data: tickets = [] } = useTickets(user?.id);
  const [unreadCount, setUnreadCount] = useState(0);
  const [readTicketIds, setReadTicketIds] = useState<Record<string, Date>>({});

  // Charger les tickets déjà lus depuis le localStorage au chargement
  useEffect(() => {
    if (user?.id) {
      const storedReadTickets = localStorage.getItem(`${READ_TICKETS_STORAGE_KEY}_${user.id}`);
      if (storedReadTickets) {
        try {
          setReadTicketIds(JSON.parse(storedReadTickets));
        } catch (e) {
          console.error("Erreur lors du chargement des tickets lus:", e);
          // En cas d'erreur, réinitialiser le stockage
          localStorage.removeItem(`${READ_TICKETS_STORAGE_KEY}_${user.id}`);
        }
      }
    }
  }, [user?.id]);

  // Vérifier si un ticket a des réponses non lues
  const checkUnreadResponses = (tickets: Ticket[], readIds: Record<string, Date>) => {
    let count = 0;
    
    tickets.forEach(ticket => {
      if (ticket.responses && ticket.responses.length > 0) {
        const lastResponse = ticket.responses[ticket.responses.length - 1];
        
        // Récupérer la date de dernière lecture du ticket (s'il a été lu)
        const lastReadDate = readIds[ticket.id] ? new Date(readIds[ticket.id]) : null;
        const lastResponseDate = new Date(lastResponse.created_at);
        
        // Un ticket est non lu si:
        // 1. C'est une réponse d'admin
        // 2. L'utilisateur n'a jamais ouvert le ticket OU l'a ouvert avant la dernière réponse
        // 3. La réponse ne vient pas de l'utilisateur lui-même
        if (lastResponse.is_admin && 
            lastResponse.user_id !== user?.id &&
            (!lastReadDate || lastResponseDate > lastReadDate)) {
          count++;
        }
      }
    });

    return count;
  };

  useEffect(() => {
    if (tickets.length > 0 && user?.id) {
      const count = checkUnreadResponses(tickets, readTicketIds);
      setUnreadCount(count);
    }
  }, [tickets, readTicketIds, user?.id]);

  // Fonction pour marquer un ticket comme lu
  const markTicketAsRead = (ticketId: string) => {
    if (!user?.id) return;
    
    const updatedReadTickets = {
      ...readTicketIds,
      [ticketId]: new Date().toISOString()
    };
    
    // Mettre à jour l'état local
    setReadTicketIds(updatedReadTickets);
    
    // Sauvegarder dans localStorage
    localStorage.setItem(
      `${READ_TICKETS_STORAGE_KEY}_${user.id}`, 
      JSON.stringify(updatedReadTickets)
    );
  };

  return { unreadCount, markTicketAsRead };
};
