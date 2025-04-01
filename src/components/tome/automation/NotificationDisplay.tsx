
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { TomeGeneration } from "@/types/tome";
import { Toaster } from "@/components/ui/sonner";

interface NotificationDisplayProps {
  configId: string;
}

const NotificationDisplay: React.FC<NotificationDisplayProps> = ({ configId }) => {
  const [lastNotifiedId, setLastNotifiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!configId) return;

    // Show an initial toast to confirm the notification system is active
    toast.info("Système de notification actif", {
      description: "Vous recevrez des alertes lors des générations automatiques",
      duration: 3000
    });

    console.log("Subscribing to real-time changes for configId:", configId);

    // Subscribe to real-time changes on the tome_generations table
    const channel = supabase
      .channel('tome-generation-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'tome_generations',
          filter: `wordpress_config_id=eq.${configId}`
        },
        (payload) => {
          const newGeneration = payload.new as TomeGeneration;
          if (newGeneration && newGeneration.id !== lastNotifiedId) {
            console.log("New generation detected:", newGeneration.id);
            setLastNotifiedId(newGeneration.id);
            toast.info(`Nouveau brouillon en cours de génération`, {
              description: "Le processus de génération a démarré en arrière-plan.",
              duration: 5000
            });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'tome_generations',
          filter: `wordpress_config_id=eq.${configId}`
        },
        (payload) => {
          const updatedGeneration = payload.new as TomeGeneration;
          
          if (!updatedGeneration || updatedGeneration.id === lastNotifiedId) return;
          
          console.log("Generation updated:", updatedGeneration.id, "Status:", updatedGeneration.status);
          
          if (updatedGeneration.status === 'draft' && updatedGeneration.title) {
            toast.success(`Brouillon généré avec succès`, {
              description: `"${updatedGeneration.title.substring(0, 30)}${updatedGeneration.title.length > 30 ? '...' : ''}"`,
              duration: 5000
            });
            setLastNotifiedId(updatedGeneration.id);
          } else if (updatedGeneration.status === 'failed') {
            toast.error(`Échec de la génération du brouillon`, {
              description: updatedGeneration.error_message || "Une erreur s'est produite",
              duration: 5000
            });
            setLastNotifiedId(updatedGeneration.id);
          }
        }
      )
      .subscribe((status) => {
        console.log("Subscription status:", status);
      });

    return () => {
      console.log("Unsubscribing from real-time changes");
      supabase.removeChannel(channel);
    };
  }, [configId, lastNotifiedId]);

  // This component doesn't render anything visible except the toaster
  return <Toaster />;
};

export default NotificationDisplay;
