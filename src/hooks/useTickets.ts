
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/context/AuthContext';

export interface TicketResponse {
  id: string;
  ticket_id: string;
  user_id: string;
  message: string;
  created_at: string;
  is_admin: boolean;
  username: string;
}

export interface Ticket {
  id: string;
  subject: string;
  description?: string;
  status: 'open' | 'in_progress' | 'closed';
  user_id: string;
  username: string;
  created_at: string;
  updated_at?: string;
  priority: string;
  message: string;
  responses?: TicketResponse[];
}

// Hook pour récupérer les tickets d'un utilisateur
export const useTickets = (userId?: string | null) => {
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

      // Récupérer les réponses pour chaque ticket
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
      
      return ticketsWithResponses;
    },
    enabled: !!currentUserId,
  });
};

// Hook pour récupérer tous les tickets (pour les admins)
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
        
        // Add null check for profiles property and use optional chaining
        const profiles = ticket.profiles;
        const username = profiles && typeof profiles === 'object' ? 
                         (profiles?.name || profiles?.email || ticket.username || 'Unknown') : 
                         (ticket.username || 'Unknown');
        
        return {
          ...ticket,
          username,
          responses: responses || [],
          updated_at: ticket.created_at,
          description: ""
        };
      }));
      
      return ticketsWithUsernames;
    },
    enabled: !!isAdmin,
  });
};

// Hook pour récupérer un ticket spécifique
export const useTicketDetails = (ticketId: string | null) => {
  return useQuery({
    queryKey: ['ticket', ticketId],
    queryFn: async () => {
      if (!ticketId) return null;
      
      // Récupérer le ticket
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
      
      // Récupérer les réponses du ticket
      const { data: responses, error: responsesError } = await supabase
        .from('ticket_responses')
        .select('*')
        .eq('ticket_id', ticketId)
        .order('created_at', { ascending: true });
      
      if (responsesError) {
        console.error('Error fetching ticket responses:', responsesError);
      }
      
      // Add null check for profiles property and use optional chaining
      const profiles = ticket.profiles;
      const username = profiles && typeof profiles === 'object' ? 
                       (profiles?.name || profiles?.email || ticket.username || 'Unknown') : 
                       (ticket.username || 'Unknown');
      
      return {
        ...ticket,
        username,
        responses: responses || [],
        updated_at: ticket.created_at,
        description: ""
      };
    },
    enabled: !!ticketId,
  });
};

// Hook pour créer un nouveau ticket
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

// Hook pour répondre à un ticket
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

// Hook pour mettre à jour le statut d'un ticket
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
