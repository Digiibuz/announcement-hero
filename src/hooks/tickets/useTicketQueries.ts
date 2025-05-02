
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Ticket } from "@/types/tickets";

// Récupérer les tickets d'un utilisateur
export const useTickets = (userId?: string) => {
  return useQuery({
    queryKey: ["tickets", userId],
    queryFn: async () => {
      if (!userId) return [];

      try {
        const { data, error } = await supabase
          .from("tickets")
          .select(`
            *,
            responses:ticket_responses(*)
          `)
          .eq("user_id", userId)
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        return data as Ticket[];
      } catch (error) {
        // Silence les erreurs pour éviter l'affichage dans la console
        return [];
      }
    },
    enabled: !!userId,
  });
};

// Récupérer tous les tickets (pour les admins)
export const useAllTickets = () => {
  return useQuery({
    queryKey: ["all-tickets"],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("tickets")
          .select(`
            *,
            responses:ticket_responses(*)
          `)
          .order("created_at", { ascending: false });

        if (error) {
          throw error;
        }

        return data as Ticket[];
      } catch (error) {
        // Silence les erreurs pour éviter l'affichage dans la console
        return [];
      }
    },
  });
};

// Récupérer les détails d'un ticket spécifique
export const useTicketDetails = (ticketId: string) => {
  return useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: async () => {
      try {
        const { data, error } = await supabase
          .from("tickets")
          .select(`
            *,
            responses:ticket_responses(*)
          `)
          .eq("id", ticketId)
          .single();

        if (error) {
          throw error;
        }

        // Sort responses by creation date
        if (data.responses) {
          data.responses.sort((a: any, b: any) => 
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          );
        }

        return data as Ticket;
      } catch (error) {
        // Silence les erreurs pour éviter l'affichage dans la console
        throw error;
      }
    },
    enabled: !!ticketId,
  });
};
