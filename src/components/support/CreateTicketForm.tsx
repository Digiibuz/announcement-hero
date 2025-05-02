
import React, { useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateTicket } from "@/hooks/useTickets";
import { toast } from "sonner";
import { usePersistedState } from "@/hooks/usePersistedState";

const CreateTicketForm = () => {
  const { user } = useAuth();
  const [subject, setSubject] = usePersistedState("new_ticket_subject", "");
  const [message, setMessage] = usePersistedState("new_ticket_message", "");
  const { mutate: createTicket, isPending } = useCreateTicket();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!subject.trim()) {
      toast.error("Veuillez saisir un sujet pour votre demande");
      return;
    }

    if (!message.trim()) {
      toast.error("Veuillez détailler votre demande");
      return;
    }

    if (!user) {
      toast.error("Vous devez être connecté pour créer un ticket");
      return;
    }

    // Sauvegarde des données avant envoi
    const ticketData = {
      user_id: user.id,
      username: user.name || user.email.split("@")[0],
      subject,
      message,
      priority: "medium",
      status: "open",
      created_at: new Date().toISOString()
    };

    try {
      // Sauvegarde de sauvegarde en cas d'erreur
      localStorage.setItem("ticket_backup", JSON.stringify({
        subject,
        message,
        timestamp: new Date().toISOString()
      }));
      
      createTicket(ticketData, {
        onSuccess: () => {
          // Réinitialisation du formulaire après succès
          setSubject("");
          setMessage("");
          // Suppression de la sauvegarde
          localStorage.removeItem("ticket_backup");
          toast.success("Votre ticket a été créé avec succès");
        },
        onError: (error) => {
          // Enregistrer l'erreur silencieusement
          localStorage.setItem("ticket_creation_error", JSON.stringify({
            error: error.message || "Erreur inconnue",
            timestamp: new Date().toISOString()
          }));
          toast.error("Impossible de créer votre ticket. Veuillez réessayer.");
        }
      });
    } catch (error) {
      // Capture des erreurs non gérées par la mutation
      const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
      localStorage.setItem("ticket_creation_unhandled_error", errorMessage);
      toast.error("Une erreur est survenue lors de la création du ticket");
    }
  };

  // Tentative de restauration en cas de données présentes
  useEffect(() => {
    try {
      const backup = localStorage.getItem("ticket_backup");
      if (backup && (!subject || !message)) {
        const data = JSON.parse(backup);
        if (!subject && data.subject) setSubject(data.subject);
        if (!message && data.message) setMessage(data.message);
      }
    } catch (e) {
      // Ne rien faire en cas d'erreur
    }
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Nouveau ticket d'assistance</CardTitle>
        <CardDescription>
          Décrivez votre problème ou votre question, et notre équipe vous répondra dans les plus brefs délais.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="subject" className="text-sm font-medium">
              Sujet
            </label>
            <Input
              id="subject"
              placeholder="Ex: Problème de connexion"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="message" className="text-sm font-medium">
              Votre message
            </label>
            <Textarea
              id="message"
              placeholder="Décrivez votre problème en détail..."
              rows={6}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              disabled={isPending}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isPending}>
            {isPending ? "Envoi en cours..." : "Envoyer la demande"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default CreateTicketForm;
