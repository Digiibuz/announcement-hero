
import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Clock } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Ticket } from "@/hooks/tickets/types";

interface AdminTicketCardProps {
  ticket: Ticket;
  onSelectTicket: (id: string) => void;
}

export const AdminTicketCard: React.FC<AdminTicketCardProps> = ({ ticket, onSelectTicket }) => {
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-500";
      case "medium":
        return "bg-orange-500";
      case "low":
        return "bg-blue-500";
      default:
        return "bg-gray-500";
    }
  };

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
    <Card key={ticket.id} className="overflow-hidden">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start flex-wrap gap-2">
          <CardTitle className="text-lg">{ticket.subject}</CardTitle>
          <div className="flex gap-2">
            {getStatusBadge(ticket.status)}
            <Badge 
              className={`${getPriorityColor(ticket.priority)}`}
            >
              {ticket.priority === "high" ? "Haute" : ticket.priority === "medium" ? "Moyenne" : "Basse"}
            </Badge>
          </div>
        </div>
        <div className="flex flex-wrap items-center text-sm text-muted-foreground mt-1 gap-2">
          <div className="flex items-center">
            <Clock className="mr-1 h-4 w-4" />
            {format(new Date(ticket.created_at), 'PPP à HH:mm', { locale: fr })}
          </div>
          <div>
            Par: <span className="font-medium">{ticket.username}</span>
          </div>
          {ticket.responses && (
            <Badge variant="outline" className="ml-2">
              {ticket.responses.length} réponse(s)
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {ticket.message}
        </p>
        <Button
          variant="outline"
          className="w-full flex items-center justify-center"
          onClick={() => onSelectTicket(ticket.id)}
        >
          <MessageSquare className="h-4 w-4 mr-2" />
          Voir les détails et répondre
        </Button>
      </CardContent>
    </Card>
  );
};
