
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

  const handleCloseTicket = () => {
    updateStatus(
      { ticketId: ticketId, status: "closed" },
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
      { ticketId: ticketId, status: "open" },
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
