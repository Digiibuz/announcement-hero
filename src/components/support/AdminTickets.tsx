
import React, { useState } from "react";
import { useAllTickets } from "@/hooks/useTickets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MessageSquare, Clock, Filter } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import TicketDetails from "@/components/support/TicketDetails";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface AdminTicketsProps {
  filter: "all" | "open" | "closed";
}

const AdminTickets: React.FC<AdminTicketsProps> = ({ filter: initialFilter }) => {
  const { data: allTickets, isLoading, error } = useAllTickets();
  const [selectedTicket, setSelectedTicket] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>(initialFilter);
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  if (isLoading) {
    return <p className="text-center py-8">Chargement des tickets...</p>;
  }

  if (error) {
    return <p className="text-center py-8 text-red-500">Erreur lors du chargement des tickets: {error.message}</p>;
  }

  if (!allTickets || allTickets.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center py-8 text-muted-foreground">
            Aucun ticket trouvé.
          </p>
        </CardContent>
      </Card>
    );
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
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span>Filtres:</span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm">Statut:</span>
              <Select 
                value={statusFilter} 
                onValueChange={setStatusFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="open">Tickets actifs</SelectItem>
                  <SelectItem value="closed">Tickets résolus</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm">Priorité:</span>
              <Select 
                value={priorityFilter} 
                onValueChange={setPriorityFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrer par priorité" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les priorités</SelectItem>
                  <SelectItem value="high">Haute</SelectItem>
                  <SelectItem value="medium">Moyenne</SelectItem>
                  <SelectItem value="low">Basse</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {filteredTickets.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-center py-8 text-muted-foreground">
                  Aucun ticket ne correspond aux filtres sélectionnés.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredTickets.map((ticket) => (
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
                      onClick={() => setSelectedTicket(ticket.id)}
                    >
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Voir les détails et répondre
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminTickets;
