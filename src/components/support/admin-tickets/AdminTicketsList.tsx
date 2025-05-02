
import React from "react";
import { AdminTicketCard } from "./AdminTicketCard";
import { AdminTicketsEmpty } from "./AdminTicketsEmpty";
import { Ticket } from "@/hooks/tickets/types";

interface AdminTicketsListProps {
  tickets: Ticket[];
  onSelectTicket: (id: string) => void;
}

export const AdminTicketsList: React.FC<AdminTicketsListProps> = ({ 
  tickets,
  onSelectTicket
}) => {
  if (tickets.length === 0) {
    return <AdminTicketsEmpty isFiltered={true} />;
  }

  return (
    <div className="space-y-4">
      {tickets.map((ticket) => (
        <AdminTicketCard 
          key={ticket.id} 
          ticket={ticket} 
          onSelectTicket={onSelectTicket} 
        />
      ))}
    </div>
  );
};
