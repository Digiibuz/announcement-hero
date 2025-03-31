
import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Clock, MailOpen, Mail } from "lucide-react";
import { useTickets } from "@/hooks/useTickets";
import { useTicketNotifications } from "@/hooks/useTicketNotifications";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import TicketDetails from "@/components/support/TicketDetails";

const TicketList = () => {
  const { user } = useAuth();
  const { data: tickets, isLoading, error } = useTickets(user?.id);
  const { markTicketAsRead, markTicketTabAsViewed, readTicketIds } = useTicketNotifications();
  const [selectedTicket, setSelectedTicket] = React.useState<string | null>(null);

  // Mark the tab as viewed as soon as the component mounts
  useEffect(() => {
    markTicketTabAsViewed();
  }, [markTicketTabAsViewed]);

  const handleSelectTicket = (ticketId: string) => {
    setSelectedTicket(ticketId);
    markTicketAsRead(ticketId);
  };

  const isTicketRead = (ticketId: string, lastResponseDate?: Date) => {
    if (!readTicketIds || !readTicketIds[ticketId]) return false;
    
    // Si le ticket a une dernière réponse, vérifier si elle a été lue
    if (lastResponseDate) {
      const lastReadDate = new Date(readTicketIds[ticketId]);
      return lastReadDate >= lastResponseDate;
    }
    
    // Sinon, le ticket a été lu au moins une fois
    return true;
  };

  if (isLoading) {
    return <p className="text-center py-8">Chargement de vos tickets...</p>;
  }

  if (error) {
    return <p className="text-center py-8 text-red-500">Erreur lors du chargement des tickets: {error.message}</p>;
  }

  if (!tickets || tickets.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center py-8 text-muted-foreground">
            Vous n'avez pas encore de tickets. Créez-en un pour obtenir de l'aide.
          </p>
        </CardContent>
      </Card>
    );
  }

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
        return <Badge className="bg-blue-500">En cours</Badge>;
      case "closed":
        return <Badge className="bg-gray-500">Résolu</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

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
        <div className="space-y-4">
          {tickets.map((ticket) => {
            // Déterminer si le ticket a des réponses non lues
            let hasUnreadResponse = false;
            let lastResponseDate;
            
            if (ticket.responses && ticket.responses.length > 0) {
              const lastResponse = ticket.responses[ticket.responses.length - 1];
              lastResponseDate = new Date(lastResponse.created_at);
              
              // Une réponse est non lue si c'est une réponse d'admin et que le ticket n'a pas été lu après cette réponse
              if (lastResponse.is_admin && lastResponse.user_id !== user?.id) {
                hasUnreadResponse = !isTicketRead(ticket.id, lastResponseDate);
              }
            }
            
            return (
              <Card key={ticket.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      {hasUnreadResponse ? (
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
                    <Badge 
                      className={`ml-2 ${getPriorityColor(ticket.priority)}`}
                    >
                      {ticket.priority === "high" ? "Haute" : ticket.priority === "medium" ? "Moyenne" : "Basse"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {ticket.message}
                  </p>
                  <Button
                    variant="outline"
                    className="w-full flex items-center justify-center"
                    onClick={() => handleSelectTicket(ticket.id)}
                  >
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Voir les détails et répondre
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TicketList;
