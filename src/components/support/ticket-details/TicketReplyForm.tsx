
import React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useReplyToTicket, useUpdateTicketStatus } from "@/hooks/tickets";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { usePersistedState } from "@/hooks/usePersistedState";

interface TicketReplyFormProps {
  ticketId: string;
  ticketStatus: string;
}

export const TicketReplyForm: React.FC<TicketReplyFormProps> = ({ ticketId, ticketStatus }) => {
  // Utilisation du hook personnalisé pour persister l'état dans localStorage
  const [reply, setReply] = usePersistedState<string>(`ticket_reply_${ticketId}`, "");
  const { isAdmin } = useAuth();
  const { mutate: sendReply, isPending: isSendingReply } = useReplyToTicket();
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateTicketStatus();

  const handleSendReply = () => {
    if (!reply.trim()) {
      toast.error("Veuillez saisir une réponse");
      return;
    }

    // Enregistrement des données avant l'envoi (au cas où)
    localStorage.setItem(`ticket_reply_backup_${ticketId}`, reply);

    sendReply(
      {
        ticketId: ticketId,
        message: reply
      },
      {
        onSuccess: () => {
          setReply("");
          // Supprimer la sauvegarde après un envoi réussi
          localStorage.removeItem(`ticket_reply_backup_${ticketId}`);
          
          if (isAdmin && ticketStatus === "open") {
            try {
              updateStatus(
                { ticketId: ticketId, status: "in_progress" },
                {
                  onSuccess: () => {
                    toast.success("Statut du ticket mis à jour");
                  },
                  onError: (error) => {
                    // Enregistrer l'erreur dans localStorage sans exposer les détails techniques
                    localStorage.setItem('lastTicketStatusError', error.message || 'Erreur inconnue');
                    toast.error("Impossible de mettre à jour le statut du ticket");
                  },
                }
              );
            } catch (error) {
              // Capture des erreurs non gérées par la mutation
              const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
              localStorage.setItem('lastTicketReplyError', errorMessage);
              toast.error("Une erreur est survenue lors de la mise à jour du ticket");
            }
          }
        },
        onError: (error) => {
          // Enregistrer l'erreur dans localStorage sans exposer les détails techniques
          localStorage.setItem('lastTicketReplyError', error.message || 'Erreur inconnue');
          toast.error("Impossible d'envoyer votre réponse");
        },
      }
    );
  };

  if (ticketStatus === "closed") {
    return null;
  }

  return (
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
  );
};
