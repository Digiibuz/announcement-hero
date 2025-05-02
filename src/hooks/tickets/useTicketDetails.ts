
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Ticket, processTicketUsername } from './types';

// Hook to fetch details of a specific ticket
export const useTicketDetails = (ticketId: string | null) => {
  return useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: async () => {
      if (!ticketId) return null;
      
      // Fetch ticket data
      const { data: ticket, error } = await supabase
        .from('tickets')
        .select(`
          *,
          profiles:user_id (email, name)
        `)
        .eq('id', ticketId)
        .single();
      
      if (error) {
        console.error('Error fetching ticket:', error);
        return null;
      }
      
      // Fetch ticket responses
      const { data: responses, error: responsesError } = await supabase
        .from('ticket_responses')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      
      if (responsesError) {
        console.error('Error fetching ticket responses:', responsesError);
      }
      
      const username = processTicketUsername(ticket);
      
      return {
        ...ticket,
        username,
        responses: responses || [],
        updated_at: ticket.created_at,
        description: ""
      } as Ticket;
    },
    enabled: !!ticketId,
  });
};
