
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Ticket } from './types';

// Hook for creating a new ticket
export const useCreateTicket = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (ticketData: Omit<Ticket, "id" | "updated_at">) => {
      const { data, error } = await supabase
        .from('tickets')
        .insert([ticketData])
        .select();
      
      if (error) {
        throw error;
      }
      
      return data[0];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tickets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['all-tickets'] });
    },
  });
};

// Hook for replying to a ticket
export const useReplyToTicket = () => {
  const queryClient = useQueryClient();
  const { user, isAdmin } = useAuth();
  
  return useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: string; message: string }) => {
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
        throw error;
      }
      
      return data[0];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['all-tickets'] });
    },
  });
};

// Hook for updating ticket status
export const useUpdateTicketStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ ticketId, status }: { ticketId: string; status: string }) => {
      const { data, error } = await supabase
        .from('tickets')
        .update({ status })
        .eq('id', ticketId)
        .select();
      
      if (error) {
        throw error;
      }
      
      return data[0];
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['ticket', variables.ticketId] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['all-tickets'] });
    },
  });
};
