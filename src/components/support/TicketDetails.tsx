
import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription,
  CardFooter 
} from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { useTicketDetails, useReplyToTicket, useUpdateTicketStatus } from "@/hooks/tickets";
import { useTicketNotifications } from "@/hooks/useTicketNotifications";
import { toast } from "sonner";
import { MailOpen } from "lucide-react";

interface TicketDetailsProps {
  ticketId: string;
}

const TicketDetails: React.FC<TicketDetailsProps> = ({ ticketId }) => {
  const { user, isAdmin } = useAuth();
  const { data: ticket, isLoading } = useTicketDetails(ticketId);
  const [reply, setReply] = React.useState("");
  const { mutate: sendReply, isPending: isSendingReply } = useReplyToTicket();
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateTicketStatus();
  const { markTicketAsRead } = useTicketNotifications();

  useEffect(() => {
    if (ticket && ticketId) {
      markTicketAsRead(ticketId);
    }
  }, [ticketId, ticket, markTicketAsRead]);

  if (isLoading || !ticket) {
    return <p className="text-center py-8">Chargement des détails du ticket...</p>;
  }

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

  const handleSendReply = () => {
    if (!reply.trim()) {
      toast.error("Veuillez saisir une réponse");
      return;
    }

    sendReply(
      {
        ticket_id: ticketId,
        message: reply,
        user_id: user?.id || "",
        username: user?.name || "",
        is_admin: isAdmin,
        created_at: new Date().toISOString(),
      },
      {
        onSuccess: () => {
          setReply("");
          
          if (isAdmin && ticket.status === "open") {
            updateStatus(
              { id: ticketId, status: "in_progress" },
              {
                onSuccess: () => {
                  toast.success("Statut du ticket mis à jour");
                },
              }
            );
          }
        },
        onError: (error) => {
          toast.error(`Erreur lors de l'envoi de la réponse: ${error.message}`);
        },
      }
    );
  };

  const handleCloseTicket = () => {
    updateStatus(
      { id: ticketId, status: "closed" },
      {
        onSuccess: () => {
          toast.success("Ticket marqué comme résolu");
        },
        onError: (error) => {
          toast.error(`Erreur lors de la mise à jour du statut: ${error.message}`);
        },
      }
    );
  };

  const handleReopenTicket = () => {
    updateStatus(
      { id: ticketId, status: "open" },
      {
        onSuccess: () => {
          toast.success("Ticket réouvert");
        },
        onError: (error) => {
          toast.error(`Erreur lors de la mise à jour du statut: ${error.message}`);
        },
      }
    );
  };

  return (
    <Card>
      <CardHeader>
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
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 bg-muted rounded-md">
          <p className="whitespace-pre-wrap">{ticket.message}</p>
        </div>

        {ticket.responses && ticket.responses.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Réponses</h3>
            {ticket.responses.map((response, index) => (
              <div 
                key={index} 
                className={`p-4 rounded-md ${
                  response.is_admin 
                    ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500" 
                    : "bg-muted"
                }`}
              >
                <div className="flex justify-between items-center mb-1">
                  <span className="font-medium">
                    {response.is_admin ? `${response.username} (Support)` : response.username}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(response.created_at), 'PPP à HH:mm', { locale: fr })}
                  </span>
                </div>
                <p className="whitespace-pre-wrap">{response.message}</p>
              </div>
            ))}
          </div>
        )}

        {ticket.status !== "closed" && (
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Votre réponse</h3>
            <Textarea
              placeholder="Écrivez votre réponse ici..."
              rows={4}
              value={reply}
              onChange={(e) => setReply(e.target.value)}
            />
            <Button 
              onClick={handleSendReply} 
              disabled={isSendingReply || !reply.trim()}
              className="w-full"
            >
              {isSendingReply ? "Envoi en cours..." : "Envoyer la réponse"}
            </Button>
          </div>
        )}
      </CardContent>
      
      {(isAdmin || user?.id === ticket.user_id) && (
        <CardFooter className="flex justify-end space-x-2 border-t pt-4">
          {ticket.status === "closed" ? (
            <Button
              variant="outline"
              onClick={handleReopenTicket}
              disabled={isUpdatingStatus}
            >
              Réouvrir le ticket
            </Button>
          ) : (
            <Button
              variant="outline"
              onClick={handleCloseTicket}
              disabled={isUpdatingStatus}
            >
              Marquer comme résolu
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default TicketDetails;
