
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase, typedData } from "@/integrations/supabase/client";
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

// Helper function to safely convert Supabase response to Ticket type
const convertToTicket = (data: any): Ticket => {
  return {
    id: typedData<string>(data.id),
    user_id: typedData<string>(data.user_id),
    subject: typedData<string>(data.subject),
    message: typedData<string>(data.message),
    status: typedData<"open" | "in_progress" | "closed">(data.status),
    priority: typedData<"low" | "medium" | "high">(data.priority),
    created_at: typedData<string>(data.created_at),
    username: typedData<string>(data.username),
    responses: Array.isArray(data.responses) 
      ? data.responses.map((response: any) => ({
          id: typedData<string>(response.id),
          ticket_id: typedData<string>(response.ticket_id),
          user_id: typedData<string>(response.user_id),
          message: typedData<string>(response.message),
          created_at: typedData<string>(response.created_at),
          username: typedData<string>(response.username),
          is_admin: typedData<boolean>(response.is_admin)
        }))
      : []
  };
};

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

      // Ensure we safely convert the unknown type to Ticket
      return (data || []).map(convertToTicket);
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

      // Ensure we safely convert the unknown type to Ticket
      return (data || []).map(convertToTicket);
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

      const ticket = convertToTicket(data);

      // Sort responses by creation date if they exist
      if (ticket.responses && ticket.responses.length > 0) {
        ticket.responses.sort((a, b) => 
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
      }

      return ticket;
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

      return convertToTicket(data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["tickets", variables.user_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["all-tickets"],
      });
      toast.success("Votre ticket a été créé avec succès");
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

      // If not the ticket owner (i.e. admin is responding), send a notification
      if (response.user_id !== (await supabase.from("tickets").select("user_id").eq("id", response.ticket_id).single()).data?.user_id) {
        // This is a response from the admin to the user's ticket
        toast.success("Réponse envoyée. L'utilisateur sera notifié.");
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

      return convertToTicket(data);
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
      
      if (data.status === "closed") {
        toast.success("Le ticket a été marqué comme résolu");
      } else if (data.status === "open") {
        toast.info("Le ticket a été réouvert");
      } else {
        toast.info("Le statut du ticket a été mis à jour");
      }
    },
  });
};
