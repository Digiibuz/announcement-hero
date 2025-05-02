
import React from "react";
import { Badge } from "@/components/ui/badge";
import { CardTitle, CardDescription } from "@/components/ui/card";
import { MailOpen } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Ticket } from "@/hooks/tickets";

interface TicketHeaderProps {
  ticket: Ticket;
}

export const TicketHeader: React.FC<TicketHeaderProps> = ({ ticket }) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return <Badge className="bg-green-500">Ouvert</Badge>;
      case "in_progress":
        return <Badge className="bg-orange-500">En cours</Badge>;
      case "closed":
        return <Badge className="bg-green-500">Résolu</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  return (
    <div className="flex justify-between items-start">
      <div className="flex items-center gap-2">
        <MailOpen className="h-5 w-5 text-primary" />
        <div>
          <CardTitle className="text-xl">{ticket.subject}</CardTitle>
          <CardDescription className="mt-1">
            Créé le {format(new Date(ticket.created_at), 'PPP à HH:mm', { locale: fr })}
            {' '} par {ticket.username}
          </CardDescription>
        </div>
      </div>
      <div className="flex gap-2">
        {getStatusBadge(ticket.status)}
      </div>
    </div>
  );
};
