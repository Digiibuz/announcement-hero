
import { SupabaseClient } from '@supabase/supabase-js';

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
  profiles?: { name?: string; email?: string } | null;
  attachments?: string[];
}

export const processTicketUsername = (ticket: any): string => {
  let username = ticket.username || 'Unknown';
  
  // Extract profiles and properly check for null/undefined
  const profiles = ticket.profiles;
  
  // Only try to access properties if profiles exists and is an object
  if (profiles && typeof profiles === 'object') {
    // Use type assertion to convince TypeScript that profiles is a valid object
    const typedProfiles = profiles as { name?: string; email?: string };
    const profileName = typedProfiles.name;
    const profileEmail = typedProfiles.email;
    username = profileName || profileEmail || ticket.username || 'Unknown';
  }
  
  return username;
};
