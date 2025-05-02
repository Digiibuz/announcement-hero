
import React, { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";
import { useUserTickets } from "@/hooks/tickets";
import { useTicketNotifications } from "@/hooks/notifications";
import TicketDetails from "@/components/support/TicketDetails";
import { 
  TicketCard, 
  TicketListSkeleton, 
  TicketListEmpty, 
  TicketListError 
} from "./ticket-list";

const TicketList = () => {
  const { user } = useAuth();
  const { data: tickets, isLoading, error, refetch } = useUserTickets();
  const { markTicketAsRead, markTicketTabAsViewed, readTicketIds } = useTicketNotifications();
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
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
    return <TicketListSkeleton />;
  }

  if (error) {
    return <TicketListError error={error} onRefresh={handleRefresh} />;
  }

  if (!tickets || tickets.length === 0) {
    return <TicketListEmpty />;
  }

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
              <TicketCard
                key={ticket.id}
                ticket={ticket}
                onSelect={handleSelectTicket}
                isUnread={hasUnreadResponse}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export default TicketList;
