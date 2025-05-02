
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Ticket, processTicketUsername } from './types';

// Hook to fetch all tickets (admin only)
export const useAllTickets = () => {
  const { isAdmin } = useAuth();
  
  return useQuery({
    queryKey: ['all-tickets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tickets')
        .select(`
          *,
          profiles:user_id (email, name)
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching all tickets:', error);
        return [];
      }
      
      // Transform data to include username and fetch responses
      const ticketsWithUsernames = await Promise.all((data || []).map(async (ticket) => {
        const { data: responses, error: responsesError } = await supabase
          .from('ticket_responses')
          .select('*')
          .eq('ticket_id', ticket.id)
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
        };
      }));
      
      return ticketsWithUsernames as Ticket[];
    },
    enabled: !!isAdmin,
  });
};
