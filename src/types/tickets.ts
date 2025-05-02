
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
