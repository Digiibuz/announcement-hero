
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Ticket, TicketResponse } from "@/types/tickets";

// Créer un nouveau ticket
export const useCreateTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticket: Omit<Ticket, "id">) => {
      try {
        const { data, error } = await supabase
          .from("tickets")
          .insert(ticket)
          .select()
          .single();

        if (error) {
          // Éviter de propager l'erreur
          throw new Error("Erreur de création du ticket");
        }

        return data;
      } catch (error) {
        // Créer une nouvelle erreur sans information sensible
        throw new Error("Erreur de création du ticket");
      }
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
    onError: () => {
      toast.error("Une erreur est survenue lors de la création du ticket");
    }
  });
};

// Répondre à un ticket
export const useReplyToTicket = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (response: Omit<TicketResponse, "id">) => {
      try {
        const { data, error } = await supabase
          .from("ticket_responses")
          .insert(response)
          .select()
          .single();

        if (error) {
          // Éviter de propager l'erreur
          throw new Error("Erreur d'ajout de la réponse");
        }

        try {
          // If not the ticket owner (i.e. admin is responding), send a notification
          if (response.user_id !== (await supabase.from("tickets").select("user_id").eq("id", response.ticket_id).maybeSingle()).data?.user_id) {
            // This is a response from the admin to the user's ticket
            // Pas de notification d'erreur ici
          }
        } catch (e) {
          // Silence les erreurs
        }

        return data;
      } catch (error) {
        // Créer une nouvelle erreur sans information sensible
        throw new Error("Erreur d'ajout de la réponse");
      }
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
      toast.success("Votre réponse a été ajoutée avec succès");
    },
    onError: () => {
      toast.error("Une erreur est survenue lors de l'ajout de votre réponse");
    }
  });
};

// Mettre à jour le statut d'un ticket
export const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Ticket["status"] }) => {
      try {
        const { data, error } = await supabase
          .from("tickets")
          .update({ status })
          .eq("id", id)
          .select()
          .single();

        if (error) {
          // Éviter de propager l'erreur
          throw new Error("Erreur de mise à jour du statut");
        }

        return data as Ticket;
      } catch (error) {
        // Créer une nouvelle erreur sans information sensible
        throw new Error("Erreur de mise à jour du statut");
      }
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
    onError: () => {
      toast.error("Une erreur est survenue lors de la mise à jour du statut du ticket");
    }
  });
};
