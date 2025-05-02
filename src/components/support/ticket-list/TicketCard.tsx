
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Clock, MailOpen, Mail } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Ticket } from "@/hooks/tickets";

interface TicketCardProps {
  ticket: Ticket;
  onSelect: (ticketId: string) => void;
  isUnread: boolean;
}

export const TicketCard: React.FC<TicketCardProps> = ({ ticket, onSelect, isUnread }) => {
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
    <Card className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            {isUnread ? (
              <Mail className="h-4 w-4 mr-2 text-primary" />
            ) : (
              <MailOpen className="h-4 w-4 mr-2 text-muted-foreground" />
            )}
            <CardTitle className="text-lg">{ticket.subject}</CardTitle>
          </div>
          {getStatusBadge(ticket.status)}
        </div>
        <div className="flex items-center text-sm text-muted-foreground mt-1">
          <Clock className="mr-1 h-4 w-4" />
          {format(new Date(ticket.created_at), 'PPP à HH:mm', { locale: fr })}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {ticket.message}
        </p>
        <Button
          variant="outline"
          className="w-full flex items-center justify-center"
          onClick={() => onSelect(ticket.id)}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Voir les détails et répondre
        </Button>
      </CardContent>
    </Card>
  );
};
