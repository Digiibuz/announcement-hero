
import React, { useState } from "react";
import { useAllTickets } from "@/hooks/tickets";
import { Button } from "@/components/ui/button";
import TicketDetails from "@/components/support/TicketDetails";
import { 
  AdminTicketsList, 
  AdminTicketsFilters, 
  AdminTicketsEmpty 
} from "@/components/support/admin-tickets";
import { TicketListSkeleton, TicketListError } from "@/components/support/ticket-list";

interface AdminTicketsProps {
  filter: "all" | "open" | "closed";
}

const AdminTickets: React.FC<AdminTicketsProps> = ({ filter: initialFilter }) => {
  const { data: allTickets = [], isLoading, error, refetch } = useAllTickets();
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter);
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  if (isLoading) {
    return <TicketListSkeleton />;
  }

  if (error) {
    return <TicketListError error={error as Error} onRefresh={() => refetch()} />;
  }

  if (!allTickets || allTickets.length === 0) {
    return <AdminTicketsEmpty />;
  }

  // Apply filters
  const filteredTickets = allTickets.filter(ticket => {
    // Apply status filter
    if (statusFilter === "open") {
      if (ticket.status !== "open" && ticket.status !== "in_progress") return false;
    } else if (statusFilter === "closed") {
      if (ticket.status !== "closed") return false;
    }
    
    // Apply priority filter
    if (priorityFilter !== "all" && ticket.priority !== priorityFilter) {
      return false;
    }
    
    return true;
  });

  return (
    <div>
      {selectedTicket ? (
        <div>
          <Button
            variant="outline"
            className="mb-4"
            onClick={() => setSelectedTicket(null)}
          >
            ← Retour à la liste
          </Button>
          <TicketDetails ticketId={selectedTicket} />
        </div>
      ) : (
        <>
          <AdminTicketsFilters 
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            priorityFilter={priorityFilter}
            setPriorityFilter={setPriorityFilter}
          />
          
          <AdminTicketsList 
            tickets={filteredTickets} 
            onSelectTicket={setSelectedTicket} 
          />
        </>
      )}
    </div>
  );
};

export default AdminTickets;
