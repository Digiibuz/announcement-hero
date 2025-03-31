
import { useState, useEffect } from "react";
import { useTickets, useAllTickets, Ticket } from "./useTickets";
import { useAuth } from "@/context/AuthContext";

// Clé pour le stockage local des tickets consultés
const READ_TICKETS_STORAGE_KEY = "digibuz_read_tickets";

export const useTicketNotifications = () => {
  const { user, isAdmin } = useAuth();
  const { data: userTickets = [] } = useTickets(user?.id);
  const { data: allTickets = [] } = useAllTickets();
  const [unreadCount, setUnreadCount] = useState(0);
  const [readTicketIds, setReadTicketIds] = useState<Record<string, Date>>({});

  // Charger les tickets déjà lus depuis le localStorage au chargement
  useEffect(() => {
    if (user?.id) {
      const storedReadTickets = localStorage.getItem(`${READ_TICKETS_STORAGE_KEY}_${user.id}`);
      if (storedReadTickets) {
        try {
          // Parse the stored JSON and convert string dates back to Date objects
          const parsedTickets = JSON.parse(storedReadTickets);
          const ticketsWithDateObjects: Record<string, Date> = {};
          
          // Convert string dates to Date objects
          Object.keys(parsedTickets).forEach(ticketId => {
            ticketsWithDateObjects[ticketId] = new Date(parsedTickets[ticketId]);
          });
          
          setReadTicketIds(ticketsWithDateObjects);
        } catch (e) {
          console.error("Erreur lors du chargement des tickets lus:", e);
          // En cas d'erreur, réinitialiser le stockage
          localStorage.removeItem(`${READ_TICKETS_STORAGE_KEY}_${user.id}`);
        }
      }
    }
  }, [user?.id]);

  // Vérifier si un ticket a des réponses non lues pour un client
  const checkUnreadResponsesForClient = (tickets: Ticket[], readIds: Record<string, Date>) => {
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

  // Vérifier les tickets non lus pour un admin
  const checkUnreadTicketsForAdmin = (tickets: Ticket[], readIds: Record<string, Date>) => {
    let count = 0;
    
    tickets.forEach(ticket => {
      if (ticket.status === "open") {
        // Vérifier si le ticket a été lu par l'admin
        const lastReadDate = readIds[ticket.id] ? new Date(readIds[ticket.id]) : null;
        const ticketDate = new Date(ticket.created_at);
        
        // Si le ticket n'a jamais été ouvert par l'admin ou si le ticket a été mis à jour après la dernière lecture
        if (!lastReadDate || ticketDate > lastReadDate) {
          // Si le ticket a des réponses, vérifier la dernière réponse
          if (ticket.responses && ticket.responses.length > 0) {
            const lastResponse = ticket.responses[ticket.responses.length - 1];
            const lastResponseDate = new Date(lastResponse.created_at);
            
            // Si la dernière réponse est du client et qu'elle est plus récente que la dernière lecture
            if (!lastResponse.is_admin && (!lastReadDate || lastResponseDate > lastReadDate)) {
              count++;
            }
          } else {
            // Si c'est un nouveau ticket sans réponse
            count++;
          }
        }
      }
    });

    return count;
  };

  useEffect(() => {
    if (user?.id) {
      let count = 0;
      
      if (isAdmin) {
        // Pour les admins, vérifier tous les tickets
        count = checkUnreadTicketsForAdmin(allTickets, readTicketIds);
      } else {
        // Pour les clients, vérifier uniquement leurs tickets
        count = checkUnreadResponsesForClient(userTickets, readTicketIds);
      }
      
      setUnreadCount(count);
    }
  }, [userTickets, allTickets, readTicketIds, user?.id, isAdmin]);

  // Fonction pour marquer un ticket comme lu
  const markTicketAsRead = (ticketId: string) => {
    if (!user?.id) return;
    
    // Create a new object with the updated read timestamp
    const updatedReadTickets: Record<string, Date> = {
      ...readTicketIds,
      [ticketId]: new Date()
    };
    
    // Mettre à jour l'état local
    setReadTicketIds(updatedReadTickets);
    
    // When saving to localStorage, we need to convert Date objects to ISO strings
    const storageReadTickets: Record<string, string> = {};
    Object.keys(updatedReadTickets).forEach(id => {
      storageReadTickets[id] = updatedReadTickets[id].toISOString();
    });
    
    // Sauvegarder dans localStorage
    localStorage.setItem(
      `${READ_TICKETS_STORAGE_KEY}_${user.id}`, 
      JSON.stringify(storageReadTickets)
    );
  };

  return { unreadCount, markTicketAsRead };
};
