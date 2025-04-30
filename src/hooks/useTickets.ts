
// If this file doesn't exist in the codebase, we'll create it with proper null checks

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface Ticket {
  id: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'closed';
  user_id: string;
  username?: string;
  created_at: string;
  updated_at: string;
}

export const useTickets = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['tickets', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching tickets:', error);
        return [];
      }
      
      return data || [];
    },
    enabled: !!user?.id,
  });
};

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
      
      // Transform data to include username
      const ticketsWithUsernames = (data || []).map(ticket => ({
        ...ticket,
        username: ticket.profiles?.name || ticket.profiles?.email || 'Unknown'
      }));
      
      return ticketsWithUsernames;
    },
    enabled: !!isAdmin,
  });
};

export const useTicket = (ticketId: string | null) => {
  return useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: async () => {
      if (!ticketId) return null;
      
      const { data, error } = await supabase
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
      
      return {
        ...data,
        username: data.profiles?.name || data.profiles?.email || 'Unknown'
      };
    },
    enabled: !!ticketId,
  });
};
