
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useTomeScheduler = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [nextGenerationTime, setNextGenerationTime] = useState<Date | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);

  // Effet pour mettre à jour le temps restant
  useEffect(() => {
    if (!nextGenerationTime) return;

    const updateTimeRemaining = () => {
      const now = new Date();
      const diff = nextGenerationTime.getTime() - now.getTime();
      
      if (diff <= 0) {
        setTimeRemaining("Génération imminente...");
        return;
      }
      
      // Calcul des minutes et secondes restantes
      const minutes = Math.floor(diff / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      
      setTimeRemaining(`${minutes}m ${seconds}s`);
    };

    // Mettre à jour immédiatement
    updateTimeRemaining();
    
    // Puis toutes les secondes
    const interval = setInterval(updateTimeRemaining, 1000);
    return () => clearInterval(interval);
  }, [nextGenerationTime]);

  // Fonction pour exécuter manuellement le planificateur (sans générer de contenu)
  const checkSchedulerConfig = async (): Promise<boolean> => {
    try {
      setIsRunning(true);
      console.log("Vérification de la configuration du planificateur");

      const { data, error } = await supabase.functions.invoke('tome-scheduler', {
        body: { configCheck: true }
      });

      if (error) {
        console.error("Erreur lors de la vérification de la configuration:", error);
        toast.error(`Erreur: ${error.message || "Une erreur s'est produite"}`);
        return false;
      }

      console.log("Résultat de la vérification de configuration:", data);
      
      // Si des paramètres d'automatisation sont trouvés, calculer la prochaine génération
      if (data?.automationSettings && data.automationSettings.length > 0) {
        const settings = data.automationSettings[0];
        
        // Récupérer la dernière génération pour calculer la suivante
        const { data: lastGeneration } = await supabase
          .from('tome_generations')
          .select('created_at')
          .eq('wordpress_config_id', settings.wordpress_config_id)
          .order('created_at', { ascending: false })
          .limit(1);
          
        if (lastGeneration && lastGeneration.length > 0) {
          const lastDate = new Date(lastGeneration[0].created_at);
          // Calculer l'intervalle en millisecondes
          const intervalMs = settings.frequency * 24 * 60 * 60 * 1000;
          // Calculer la prochaine génération
          const nextTime = new Date(lastDate.getTime() + intervalMs);
          
          setNextGenerationTime(nextTime);
          console.log("Prochaine génération prévue à:", nextTime);
        }
      }
      
      return true;
    } catch (error: any) {
      console.error("Erreur dans checkSchedulerConfig:", error);
      toast.error(`Erreur: ${error.message || "Une erreur s'est produite"}`);
      return false;
    } finally {
      setIsRunning(false);
    }
  };

  // Fonction pour exécuter manuellement le planificateur
  const runScheduler = async (): Promise<boolean> => {
    try {
      setIsRunning(true);
      console.log("Démarrage manuel du planificateur");

      const { data, error } = await supabase.functions.invoke('tome-scheduler', {});

      if (error) {
        console.error("Erreur lors de l'exécution du planificateur:", error);
        toast.error(`Erreur: ${error.message || "Une erreur s'est produite"}`);
        return false;
      }

      console.log("Résultat de l'exécution du planificateur:", data);

      if (data.generationsCreated === 0) {
        toast.info("Aucun contenu n'a été généré. Soit la fréquence n'est pas atteinte, soit aucune configuration n'est activée.");
      } else {
        toast.success(`${data.generationsCreated} brouillon(s) généré(s) avec succès`);
      }

      // Si au moins une génération a été créée, mettre à jour le timer
      await checkSchedulerConfig();

      return true;
    } catch (error: any) {
      console.error("Erreur dans runScheduler:", error);
      toast.error(`Erreur: ${error.message || "Une erreur s'est produite"}`);
      return false;
    } finally {
      setIsRunning(false);
    }
  };

  // Fonction pour générer du contenu à partir d'une génération existante
  const generateContent = async (generationId: string): Promise<boolean> => {
    try {
      setIsRunning(true);
      console.log("Génération de contenu pour:", generationId);

      const { data, error } = await supabase.functions.invoke('tome-generate-draft', {
        body: { generationId: generationId }
      });

      if (error) {
        console.error("Erreur lors de la génération du contenu:", error);
        toast.error(`Erreur: ${error.message || "Une erreur s'est produite"}`);
        return false;
      }

      console.log("Résultat de la génération:", data);
      return true;
    } catch (error: any) {
      console.error("Erreur dans generateContent:", error);
      toast.error(`Erreur: ${error.message || "Une erreur s'est produite"}`);
      return false;
    } finally {
      setIsRunning(false);
    }
  };

  // Fonction pour publier du contenu
  const publishContent = async (generationId: string): Promise<boolean> => {
    try {
      setIsRunning(true);
      console.log("Publication de contenu pour:", generationId);

      const { data, error } = await supabase.functions.invoke('tome-publish', {
        body: { generationId: generationId }
      });

      if (error) {
        console.error("Erreur lors de la publication du contenu:", error);
        toast.error(`Erreur: ${error.message || "Une erreur s'est produite"}`);
        return false;
      }

      console.log("Résultat de la publication:", data);

      if (data.success) {
        toast.success("Contenu publié avec succès");
        return true;
      } else {
        toast.error(`Échec de la publication: ${data.message || "Une erreur s'est produite"}`);
        return false;
      }
    } catch (error: any) {
      console.error("Erreur dans publishContent:", error);
      toast.error(`Erreur: ${error.message || "Une erreur s'est produite"}`);
      return false;
    } finally {
      setIsRunning(false);
    }
  };

  return {
    isRunning,
    runScheduler,
    generateContent,
    publishContent,
    checkSchedulerConfig,
    timeRemaining,
    nextGenerationTime
  };
};
