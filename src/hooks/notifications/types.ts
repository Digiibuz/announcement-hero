
// Define types for ticket notifications
export interface TicketReadStatus {
  id: string;
  user_id: string;
  ticket_id: string;
  read_at: string;
}

export interface NotificationsContextValue {
  unreadCount: number;
  markTicketAsRead: (ticketId: string) => Promise<void>;
  markTicketTabAsViewed: () => void;
  resetTicketTabView: () => void;
  readTicketIds: Record<string, Date>;
}
