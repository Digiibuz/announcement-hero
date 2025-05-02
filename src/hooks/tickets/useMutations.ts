
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Ticket } from './types';

// Hook pour créer un nouveau ticket
export const useCreateTicket = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (ticketData: Omit<Ticket, "id" | "updated_at">) => {
      try {
        const { data, error } = await supabase
          .from('tickets')
          .insert([ticketData])
          .select();
        
        if (error) {
          // Enregistrer l'erreur silencieusement
          localStorage.setItem('createTicketError', JSON.stringify({
            error: error.message,
            details: error.details,
            timestamp: new Date().toISOString()
          }));
          throw error;
        }
        
        return data[0];
      } catch (error) {
        // Capture toutes les erreurs non gérées
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        localStorage.setItem('createTicketUnhandledError', errorMessage);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['all-tickets'] });
    },
    onError: (error) => {
      // Enregistrer l'erreur sans l'afficher dans la console
      localStorage.setItem('createTicketMutationError', error.message || 'Erreur inconnue');
    }
  });
};

// Hook pour répondre à un ticket
export const useReplyToTicket = () => {
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();
  
  return useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: string; message: string }) => {
      try {
        const responseData = {
          ticket_id: ticketId,
          user_id: user?.id || "",
          message,
          is_admin: isAdmin,
          username: user?.name || user?.email || 'Unknown'
        };
        
        const { data, error } = await supabase
          .from('ticket_responses')
          .insert([responseData])
          .select();
        
        if (error) {
          // Enregistrer l'erreur silencieusement
          localStorage.setItem('replyToTicketError', JSON.stringify({
            ticketId,
            error: error.message,
            details: error.details,
            timestamp: new Date().toISOString()
          }));
          throw error;
        }
        
        return data[0];
      } catch (error) {
        // Capture toutes les erreurs non gérées
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        localStorage.setItem('replyToTicketUnhandledError', JSON.stringify({
          ticketId,
          error: errorMessage,
          timestamp: new Date().toISOString()
        }));
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['all-tickets'] });
    },
    onError: (error, variables) => {
      // Enregistrer l'erreur sans l'afficher dans la console
      localStorage.setItem('replyToTicketMutationError', JSON.stringify({
        ticketId: variables.ticketId,
        error: error.message || 'Erreur inconnue',
        timestamp: new Date().toISOString()
      }));
    }
  });
};

// Hook pour mettre à jour le statut d'un ticket
export const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: string }) => {
      try {
        const { data, error } = await supabase
          .from('tickets')
          .update({ status })
          .eq('id', ticketId)
          .select();
        
        if (error) {
          // Enregistrer l'erreur silencieusement
          localStorage.setItem('updateTicketStatusError', JSON.stringify({
            ticketId,
            status,
            error: error.message,
            details: error.details,
            timestamp: new Date().toISOString()
          }));
          throw error;
        }
        
        return data[0];
      } catch (error) {
        // Capture toutes les erreurs non gérées
        const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
        localStorage.setItem('updateTicketStatusUnhandledError', JSON.stringify({
          ticketId,
          status,
          error: errorMessage,
          timestamp: new Date().toISOString()
        }));
        throw error;
      }
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['all-tickets'] });
    },
    onError: (error, variables) => {
      // Enregistrer l'erreur sans l'afficher dans la console
      localStorage.setItem('updateTicketStatusMutationError', JSON.stringify({
        ticketId: variables.ticketId,
        status: variables.status,
        error: error.message || 'Erreur inconnue',
        timestamp: new Date().toISOString()
      }));
    }
  });
};
