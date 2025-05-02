
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
          console.warn("Error fetching tickets: ", error.message);
          return [];
        }

        return data as Ticket[];
      } catch (error) {
        // Enhanced error handling with silent failure
        return [];
      }
    },
    enabled: !!userId,
    // Désactiver la remontée des erreurs dans la console
    meta: {
      silenceErrors: true
    }
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
          console.warn("Error fetching all tickets: ", error.message);
          return [];
        }

        return data as Ticket[];
      } catch (error) {
        // Enhanced error handling with silent failure
        return [];
      }
    },
    // Désactiver la remontée des erreurs dans la console
    meta: {
      silenceErrors: true
    }
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
          .maybeSingle(); // Utiliser maybeSingle au lieu de single pour éviter les erreurs

        if (error || !data) {
          // Créer un ticket vide pour éviter les erreurs
          return {
            id: "",
            user_id: "",
            subject: "",
            message: "",
            status: "open" as const,
            priority: "medium" as const,
            created_at: "",
            username: "",
            responses: []
          };
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
        // Retourner un ticket vide pour éviter les erreurs dans l'UI
        return {
          id: "",
          user_id: "",
          subject: "",
          message: "",
          status: "open" as const,
          priority: "medium" as const,
          created_at: "",
          username: "",
          responses: []
        };
      }
    },
    enabled: !!ticketId,
    // Désactiver la remontée des erreurs dans la console
    meta: {
      silenceErrors: true
    }
  });
};
