
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useReplyToTicket, useUpdateTicketStatus } from "@/hooks/tickets";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

interface TicketReplyFormProps {
  ticketId: string;
  ticketStatus: string;
}

export const TicketReplyForm: React.FC<TicketReplyFormProps> = ({ ticketId, ticketStatus }) => {
  const [reply, setReply] = useState("");
  const { isAdmin } = useAuth();
  const { mutate: sendReply, isPending: isSendingReply } = useReplyToTicket();
  const { mutate: updateStatus, isPending: isUpdatingStatus } = useUpdateTicketStatus();

  const handleSendReply = () => {
    if (!reply.trim()) {
      toast.error("Veuillez saisir une réponse");
      return;
    }

    sendReply(
      {
        ticketId: ticketId,
        message: reply
      },
      {
        onSuccess: () => {
          setReply("");
          
          if (isAdmin && ticketStatus === "open") {
            updateStatus(
              { ticketId: ticketId, status: "in_progress" },
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
