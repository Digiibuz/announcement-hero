
import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { 
  Card, 
  CardContent, 
  CardHeader
} from "@/components/ui/card";
import { useTicketDetails } from "@/hooks/tickets";
import { useTicketNotifications } from "@/hooks/notifications";
import { 
  TicketHeader, 
  TicketMessage, 
  TicketResponseList,
  TicketReplyForm,
  TicketActions
} from "./ticket-details";

interface TicketDetailsProps {
  ticketId: string;
}

const TicketDetails: React.FC<TicketDetailsProps> = ({ ticketId }) => {
  const { user, isAdmin } = useAuth();
  const { data: ticket, isLoading } = useTicketDetails(ticketId);
  const { markTicketAsRead } = useTicketNotifications();

  useEffect(() => {
    if (ticket && ticketId) {
      markTicketAsRead(ticketId);
    }
  }, [ticketId, ticket, markTicketAsRead]);

  if (isLoading || !ticket) {
    return <p className="text-center py-8">Chargement des détails du ticket...</p>;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <TicketHeader ticket={ticket} />
      </CardHeader>
      
      <CardContent className="space-y-6">
        <TicketMessage message={ticket.message} />
        <TicketResponseList responses={ticket.responses || []} />
        <TicketReplyForm 
          ticketId={ticketId} 
          ticketStatus={ticket.status} 
        />
      </CardContent>
      
      <TicketActions 
        ticketId={ticketId}
        ticketStatus={ticket.status}
        userId={user?.id || ""}
        ticketUserId={ticket.user_id}
        isAdmin={isAdmin || false}
      />
    </Card>
  );
};

export default TicketDetails;
