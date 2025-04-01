
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
            setLastNotifiedId(newGeneration.id);
            toast.info(`Nouveau brouillon en cours de génération`, {
              description: "Le processus de génération a démarré en arrière-plan."
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
          
          if (updatedGeneration.status === 'draft' && updatedGeneration.title) {
            toast.success(`Brouillon généré avec succès`, {
              description: `"${updatedGeneration.title.substring(0, 30)}${updatedGeneration.title.length > 30 ? '...' : ''}"`,
            });
            setLastNotifiedId(updatedGeneration.id);
          } else if (updatedGeneration.status === 'failed') {
            toast.error(`Échec de la génération du brouillon`, {
              description: updatedGeneration.error_message || "Une erreur s'est produite",
            });
            setLastNotifiedId(updatedGeneration.id);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [configId, lastNotifiedId]);

  // This component doesn't render anything visible
  return <Toaster />;
};

export default NotificationDisplay;
