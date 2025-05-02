
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';
import { Ticket } from './types';

// Hook to fetch tickets for the current user
export const useUserTickets = (userId?: string | null) => {
  const { user } = useAuth();
  const currentUserId = userId || user?.id;
  
  return useQuery({
    queryKey: ['tickets', currentUserId],
    queryFn: async () => {
      if (!currentUserId) return [];
      
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('user_id', currentUserId)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching tickets:', error);
        return [];
      }

      // Fetch responses for each ticket
      const ticketsWithResponses = await Promise.all((data || []).map(async (ticket) => {
        const { data: responses, error: responsesError } = await supabase
          .from('ticket_responses')
          .select('*')
          .eq('ticket_id', ticket.id)
          .order('created_at', { ascending: true });
        
        if (responsesError) {
          console.error('Error fetching ticket responses:', responsesError);
          return { ...ticket, responses: [] };
        }
        
        return { ...ticket, responses: responses || [], updated_at: ticket.created_at, description: "" };
      }));
      
      return ticketsWithResponses as Ticket[];
    },
    enabled: !!currentUserId,
  });
};
