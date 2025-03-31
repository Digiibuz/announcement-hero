
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateTicket } from "@/hooks/useTickets";
import { toast } from "sonner";

const CreateTicketForm = () => {
  const { user } = useAuth();
  const [subject, setSubject] = React.useState("");
  const [message, setMessage] = React.useState("");
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

    createTicket({
      user_id: user.id,
      username: user.name || user.email.split("@")[0],
      subject,
      message,
      priority: "medium", // Default priority is still set at the backend
      status: "open",
      created_at: new Date().toISOString()
    });

    // Reset form after submission
    setSubject("");
    setMessage("");
  };

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
