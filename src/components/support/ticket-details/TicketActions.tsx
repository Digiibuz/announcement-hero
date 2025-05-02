
import React from "react";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { useUpdateTicketStatus } from "@/hooks/tickets";
import { toast } from "sonner";

interface TicketActionsProps {
  ticketId: string;
  ticketStatus: string;
  userId: string;
  ticketUserId: string;
  isAdmin: boolean;
}

export const TicketActions: React.FC<TicketActionsProps> = ({ 
  ticketId, 
  ticketStatus, 
  userId, 
  ticketUserId, 
  isAdmin 
}) => {
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateTicketStatus();

  const handleTicketStatusChange = (newStatus: string) => {
    try {
      updateStatus(
        { ticketId: ticketId, status: newStatus },
        {
          onSuccess: () => {
            const message = newStatus === "closed" 
              ? "Ticket marqué comme résolu" 
              : "Ticket réouvert";
            toast.success(message);
            
            // Enregistrer l'action réussie dans localStorage
            localStorage.setItem('lastTicketAction', JSON.stringify({
              ticketId,
              action: newStatus === "closed" ? "close" : "reopen",
              timestamp: new Date().toISOString()
            }));
          },
          onError: (error) => {
            // Enregistrer l'erreur silencieusement sans utiliser console
            localStorage.setItem('lastTicketActionError', JSON.stringify({
              ticketId,
              action: newStatus === "closed" ? "close" : "reopen",
              timestamp: new Date().toISOString(),
              error: error.message || 'Erreur inconnue'
            }));
            
            toast.error(`Erreur lors de la mise à jour du statut`);
          },
        }
      );
    } catch (error) {
      // Capture les erreurs non gérées par la mutation
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      localStorage.setItem('lastUnhandledTicketActionError', JSON.stringify({
        ticketId,
        action: newStatus === "closed" ? "close" : "reopen",
        timestamp: new Date().toISOString(),
        error: errorMessage
      }));
      
      toast.error(`Une erreur est survenue`);
    }
  };

  const handleCloseTicket = () => {
    handleTicketStatusChange("closed");
  };

  const handleReopenTicket = () => {
    handleTicketStatusChange("open");
  };

  if (!(isAdmin || userId === ticketUserId)) {
    return null;
  }

  return (
    <CardFooter className="flex justify-end space-x-2 border-t pt-4">
      {ticketStatus === "closed" ? (
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
  );
};
