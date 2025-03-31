
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Clock, MailOpen, Mail, RefreshCw } from "lucide-react";
import { useTickets } from "@/hooks/useTickets";
import { useTicketNotifications } from "@/hooks/useTicketNotifications";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import TicketDetails from "@/components/support/TicketDetails";
import { Skeleton } from "@/components/ui/skeleton";

const TicketList = () => {
  const { user } = useAuth();
  const { data: tickets, isLoading, error, refetch } = useTickets(user?.id);
  const { markTicketAsRead, markTicketTabAsViewed, readTicketIds } = useTicketNotifications();
  const [selectedTicket, setSelectedTicket] = React.useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mark the tab as viewed as soon as the component mounts
  useEffect(() => {
    markTicketTabAsViewed();
  }, [markTicketTabAsViewed]);

  const handleSelectTicket = (ticketId: string) => {
    setSelectedTicket(ticketId);
    markTicketAsRead(ticketId);
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
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

  if (isLoading || isRefreshing) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="pb-2">
              <div className="flex justify-between items-start">
                <Skeleton className="h-6 w-64" />
                <Skeleton className="h-6 w-20" />
              </div>
              <div className="flex items-center mt-1">
                <Skeleton className="h-4 w-40 mt-2" />
              </div>
            </CardHeader>
            <CardContent>
              <Skeleton className="h-4 w-full mb-4" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center py-8 text-red-500">
            <p>Erreur lors du chargement des tickets: {error.message}</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={handleRefresh}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Réessayer
            </Button>
          </div>
        </CardContent>
      </Card>
    );
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
      {!selectedTicket && (
        <div className="flex justify-end mb-4">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      )}
      
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
