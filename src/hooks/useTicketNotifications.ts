
import { useState, useEffect, useCallback } from "react";
import { useTickets, useAllTickets, Ticket } from "./useTickets";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export const useTicketNotifications = () => {
  const { user, isAdmin } = useAuth();
  const { data: userTickets = [] } = useTickets(user?.id);
  const { data: allTickets = [] } = useAllTickets();
  const [unreadCount, setUnreadCount] = useState(0);
  const [readTicketIds, setReadTicketIds] = useState<Record<string, Date>>({});
  const [viewedTicketTab, setViewedTicketTab] = useState(false);

  // Charger les tickets déjà lus depuis Supabase au chargement
  useEffect(() => {
    const fetchReadTickets = async () => {
      if (!user?.id) return;

      const { data, error } = await supabase
        .from("ticket_read_status")
        .select("ticket_id, read_at")
        .eq("user_id", user.id);

      if (error) {
        console.error("Erreur lors du chargement des tickets lus:", error);
        return;
      }

      if (data) {
        const ticketsWithDateObjects: Record<string, Date> = {};
        
        // Convertir les dates en objets Date
        data.forEach(item => {
          ticketsWithDateObjects[item.ticket_id] = new Date(item.read_at);
        });
        
        setReadTicketIds(ticketsWithDateObjects);
      }
    };

    fetchReadTickets();
  }, [user?.id]);

  // Vérifier si un ticket a des réponses non lues pour un client
  const checkUnreadResponsesForClient = useCallback((tickets: Ticket[], readIds: Record<string, Date>) => {
    if (viewedTicketTab) {
      return 0;
    }
    
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
  }, [user?.id, viewedTicketTab]);

  // Vérifier les tickets non lus pour un admin
  const checkUnreadTicketsForAdmin = useCallback((tickets: Ticket[], readIds: Record<string, Date>) => {
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
  }, []);

  // Recalculer le nombre de notifications non lues
  const updateUnreadCount = useCallback(() => {
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
  }, [userTickets, allTickets, readTicketIds, user?.id, isAdmin, checkUnreadResponsesForClient, checkUnreadTicketsForAdmin]);

  // Mettre à jour le compteur quand les dépendances changent
  useEffect(() => {
    updateUnreadCount();
  }, [updateUnreadCount]);

  // Fonction pour marquer un ticket comme lu
  const markTicketAsRead = useCallback(async (ticketId: string) => {
    if (!user?.id) return;
    
    // La date actuelle pour marquer comme lu
    const now = new Date();
    
    // Enregistrer dans Supabase
    const { error } = await supabase
      .from("ticket_read_status")
      .upsert({
        user_id: user.id,
        ticket_id: ticketId,
        read_at: now.toISOString()
      }, { onConflict: 'user_id,ticket_id' });
    
    if (error) {
      console.error("Erreur lors de l'enregistrement du statut de lecture:", error);
      return;
    }
    
    // Mettre à jour l'état local
    setReadTicketIds(prevState => ({
      ...prevState,
      [ticketId]: now
    }));
    
    // Force immediate update of unread count
    updateUnreadCount();
  }, [user?.id, updateUnreadCount]);

  // Écouter les changements dans la table ticket_read_status en temps réel
  useEffect(() => {
    if (!user?.id) return;
    
    const channel = supabase
      .channel('ticket_read_status_changes')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ticket_read_status',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        // Mettre à jour l'état local quand un nouveau statut est inséré
        const { ticket_id, read_at } = payload.new;
        
        setReadTicketIds(prevState => ({
          ...prevState,
          [ticket_id]: new Date(read_at)
        }));
        
        // Mettre à jour le compteur
        updateUnreadCount();
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'ticket_read_status',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        // Mettre à jour l'état local quand un statut est mis à jour
        const { ticket_id, read_at } = payload.new;
        
        setReadTicketIds(prevState => ({
          ...prevState,
          [ticket_id]: new Date(read_at)
        }));
        
        // Mettre à jour le compteur
        updateUnreadCount();
      })
      .subscribe();
    
    // Nettoyer l'abonnement à la déconnexion
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, updateUnreadCount]);

  // Fonction pour marquer le tab des tickets comme vu
  const markTicketTabAsViewed = useCallback(() => {
    setViewedTicketTab(true);
    
    // Force immediate update of unread count
    updateUnreadCount();
  }, [updateUnreadCount]);

  // Réinitialiser cette valeur quand on quitte la page
  const resetTicketTabView = useCallback(() => {
    setViewedTicketTab(false);
  }, []);

  return { 
    unreadCount, 
    markTicketAsRead, 
    markTicketTabAsViewed, 
    resetTicketTabView,
    readTicketIds
  };
};
