
import React, { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useCreateTicket } from "@/hooks/useTickets";
import { toast } from "sonner";
import { Mic, MicOff } from "lucide-react";
import { useForm } from "react-hook-form";
import useVoiceRecognition from "@/hooks/useVoiceRecognition";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { LoadingIndicator } from "@/components/ui/loading-indicator";

const CreateTicketForm = () => {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const { mutate: createTicket, isPending } = useCreateTicket();
  
  // Setup form for voice recognition
  const form = useForm({
    defaultValues: {
      subject: "",
      message: ""
    }
  });
  
  // Update local state when form values change
  React.useEffect(() => {
    const subscription = form.watch((value) => {
      if (value.subject !== undefined) {
        setSubject(value.subject);
      }
      if (value.message !== undefined) {
        setMessage(value.message);
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);
  
  // Setup voice recognition for message field
  const { 
    isRecording, 
    isListening, 
    isProcessing, 
    toggleVoiceRecording, 
    isSupported 
  } = useVoiceRecognition({ 
    fieldName: 'message', 
    form 
  });

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
    form.reset({
      subject: "",
      message: ""
    });
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
              onChange={(e) => {
                setSubject(e.target.value);
                form.setValue('subject', e.target.value);
              }}
              disabled={isPending}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="message" className="text-sm font-medium">
                Votre message
              </label>
              
              {isSupported && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        type="button" 
                        variant={isRecording ? "default" : "outline"} 
                        size="icon" 
                        className={`h-8 w-8 ${isRecording ? "bg-red-500 hover:bg-red-600" : ""}`} 
                        onClick={toggleVoiceRecording}
                      >
                        {isRecording ? <MicOff size={16} /> : <Mic size={16} />}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isRecording ? "Arrêter la dictée" : "Dicter du texte"}</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
            
            {isRecording && (
              <div className="flex items-center gap-2 text-sm bg-red-50 dark:bg-red-950/20 p-2 rounded border border-red-200 dark:border-red-800">
                {isProcessing ? (
                  <>
                    <LoadingIndicator size={16} variant="dots" color="#dc2626" />
                    <span className="text-red-600 dark:text-red-400 font-medium">Transcription en cours...</span>
                  </>
                ) : (
                  <span className="text-red-600 dark:text-red-400 font-medium">
                    {isListening ? "Dictée active - parlez maintenant" : "Initialisation de la dictée..."}
                  </span>
                )}
              </div>
            )}
            
            <Textarea
              id="message"
              placeholder="Décrivez votre problème en détail..."
              rows={6}
              value={message}
              onChange={(e) => {
                setMessage(e.target.value);
                form.setValue('message', e.target.value);
              }}
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
