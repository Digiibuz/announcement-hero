
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Ticket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: "open" | "in_progress" | "closed";
  priority: "low" | "medium" | "high";
  created_at: string;
  username: string;
  responses?: TicketResponse[];
}

export interface TicketResponse {
  id?: string;
  ticket_id: string;
  user_id: string;
  message: string;
  created_at: string;
  username: string;
  is_admin: boolean;
}

// Récupérer les tickets d'un utilisateur
export const useTickets = (userId?: string) => {
  return useQuery({
    queryKey: ["tickets", userId],
    queryFn: async () => {
      if (!userId) return [];

      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          responses:ticket_responses(*)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching tickets:", error);
        throw error;
      }

      return data as Ticket[];
    },
    enabled: !!userId,
  });
};

// Récupérer tous les tickets (pour les admins)
export const useAllTickets = () => {
  return useQuery({
    queryKey: ["all-tickets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          responses:ticket_responses(*)
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching all tickets:", error);
        throw error;
      }

      return data as Ticket[];
    },
  });
};

// Récupérer les détails d'un ticket spécifique
export const useTicketDetails = (ticketId: string) => {
  return useQuery({
    queryKey: ["ticket", ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tickets")
        .select(`
          *,
          responses:ticket_responses(*)
        `)
        .eq("id", ticketId)
        .single();

      if (error) {
        console.error("Error fetching ticket details:", error);
        throw error;
      }

      // Sort responses by creation date
      if (data.responses) {
        data.responses.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }

      return data as Ticket;
    },
    enabled: !!ticketId,
  });
};

// Créer un nouveau ticket
export const useCreateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticket: Omit<Ticket, "id">) => {
      const { data, error } = await supabase
        .from("tickets")
        .insert(ticket)
        .select()
        .single();

      if (error) {
        console.error("Error creating ticket:", error);
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tickets", variables.user_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["all-tickets"],
      });
    },
  });
};

// Répondre à un ticket
export const useReplyToTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (response: Omit<TicketResponse, "id">) => {
      const { data, error } = await supabase
        .from("ticket_responses")
        .insert(response)
        .select()
        .single();

      if (error) {
        console.error("Error replying to ticket:", error);
        throw error;
      }

      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["ticket", variables.ticket_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["tickets"],
      });
      queryClient.invalidateQueries({
        queryKey: ["all-tickets"],
      });
    },
  });
};

// Mettre à jour le statut d'un ticket
export const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Ticket["status"] }) => {
      const { data, error } = await supabase
        .from("tickets")
        .update({ status })
        .eq("id", id)
        .select()
        .single();

      if (error) {
        console.error("Error updating ticket status:", error);
        throw error;
      }

      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: ["ticket", data.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["tickets", data.user_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["all-tickets"],
      });
    },
  });
};
