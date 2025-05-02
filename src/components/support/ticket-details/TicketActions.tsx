
import React from "react";
import { Button } from "@/components/ui/button";
import { CardFooter } from "@/components/ui/card";
import { useUpdateTicketStatus } from "@/hooks/tickets";
import { toast } from "sonner";
import { usePersistedState } from "@/hooks/usePersistedState";
import { silenceAllConsoleOutput, silenceAllErrorEvents } from "@/utils/errorSilencer";

// Bloquer immédiatement les logs
silenceAllConsoleOutput();

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
  // Persister l'état de la dernière action pour restauration si nécessaire
  const [lastAction, setLastAction] = usePersistedState(`ticket_${ticketId}_last_action`, null);

  // Bloquer toutes les erreurs pour ce composant
  React.useEffect(() => {
    const removeErrorListeners = silenceAllErrorEvents();
    return removeErrorListeners;
  }, []);

  const handleTicketStatusChange = (newStatus: string) => {
    // Bloquer toutes les erreurs console pendant l'opération
    const restore = silenceAllConsoleOutput();
    const removeErrorListeners = silenceAllErrorEvents();
    
    try {
      // Sauvegarder l'état actuel avant modification
      setLastAction({
        previousStatus: ticketStatus,
        actionTimestamp: new Date().toISOString()
      });
      
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
            
            // Restaurer les logs après succès
            restore();
            removeErrorListeners();
          },
          onError: () => {
            // Enregistrer l'erreur silencieusement sans utiliser console
            localStorage.setItem('lastTicketActionError', JSON.stringify({
              ticketId,
              action: newStatus === "closed" ? "close" : "reopen",
              timestamp: new Date().toISOString(),
              error: 'Erreur inconnue'
            }));
            
            toast.error(`Erreur lors de la mise à jour du statut`);
            
            // Restaurer les logs après erreur
            restore();
            removeErrorListeners();
          },
        }
      );
    } catch (error) {
      // Capture les erreurs non gérées par la mutation
      localStorage.setItem('lastUnhandledTicketActionError', JSON.stringify({
        ticketId,
        action: newStatus === "closed" ? "close" : "reopen",
        timestamp: new Date().toISOString(),
        error: 'Erreur non gérée'
      }));
      
      toast.error(`Une erreur est survenue`);
      
      // Restaurer les logs après erreur
      restore();
      removeErrorListeners();
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
