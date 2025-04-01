
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useTomeScheduler = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [isAutoGenerating, setIsAutoGenerating] = useState(false);
  const countdownIntervalRef = useRef<number | null>(null);

  // Nettoyage de l'intervalle à la destruction du composant
  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);

  // Effet pour récupérer l'état de l'autogénération au chargement
  useEffect(() => {
    const checkAutoGenerationState = async () => {
      try {
        // Récupérer toutes les configurations avec next_generation_time
        const { data, error } = await supabase
          .from('tome_automation')
          .select('*')
          .not('next_generation_time', 'is', null);

        if (error) {
          console.error("Erreur lors de la récupération des états d'autogénération:", error);
          return;
        }

        if (data && data.length > 0) {
          // Trouver les configurations avec autogénération active
          const activeConfigs = data.filter(config => 
            config.is_enabled && 
            config.next_generation_time && 
            new Date(config.next_generation_time) > new Date()
          );

          if (activeConfigs.length > 0) {
            // Choisir la configuration avec la prochaine génération la plus proche
            const sortedConfigs = [...activeConfigs].sort((a, b) => 
              new Date(a.next_generation_time).getTime() - new Date(b.next_generation_time).getTime()
            );
            
            const nextConfig = sortedConfigs[0];
            const nextTime = new Date(nextConfig.next_generation_time);
            const now = new Date();
            
            // Calculer le temps restant en secondes
            const remainingSeconds = Math.max(0, Math.floor((nextTime.getTime() - now.getTime()) / 1000));
            
            if (remainingSeconds > 0) {
              console.log(`Reprenant l'autogénération pour ${nextConfig.wordpress_config_id} dans ${remainingSeconds} secondes`);
              setIsAutoGenerating(true);
              startCountdown(remainingSeconds, nextConfig.frequency * 60);
            }
          }
        }
      } catch (error) {
        console.error("Erreur lors de la vérification de l'état d'autogénération:", error);
      }
    };

    checkAutoGenerationState();
  }, []);

  // Fonction pour démarrer le décompte uniquement
  const startCountdown = (initialSeconds: number, frequencyInSeconds: number) => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    setCountdown(initialSeconds);

    countdownIntervalRef.current = window.setInterval(() => {
      setCountdown((prevCountdown) => {
        if (prevCountdown === null || prevCountdown <= 1) {
          // Lorsque le compteur arrive à zéro, générer un nouveau brouillon
          runScheduler(true).catch(console.error);
          // Réinitialiser le compteur
          return frequencyInSeconds;
        }
        return prevCountdown - 1;
      });
    }, 1000);
  };

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
      return true;
    } catch (error: any) {
      console.error("Erreur dans checkSchedulerConfig:", error);
      toast.error(`Erreur: ${error.message || "Une erreur s'est produite"}`);
      return false;
    } finally {
      setIsRunning(false);
    }
  };

  // Fonction pour démarrer le décompte pour l'autogénération
  const startAutoGeneration = async (frequencyInMinutes: number) => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    const frequencyInSeconds = frequencyInMinutes * 60;
    setCountdown(frequencyInSeconds);
    setIsAutoGenerating(true);

    // Calculer et sauvegarder l'heure de la prochaine génération
    const nextGenerationTime = new Date(Date.now() + frequencyInSeconds * 1000).toISOString();

    // Mettre à jour toutes les configurations d'automatisation actives
    const { data: configs, error: fetchError } = await supabase
      .from('tome_automation')
      .select('id, wordpress_config_id')
      .eq('is_enabled', true);

    if (fetchError) {
      console.error("Erreur lors de la récupération des configurations:", fetchError);
      toast.error(`Erreur: ${fetchError.message || "Une erreur s'est produite"}`);
    } else if (configs && configs.length > 0) {
      // Mettre à jour la next_generation_time pour toutes les configurations actives
      for (const config of configs) {
        const { error: updateError } = await supabase
          .from('tome_automation')
          .update({ 
            next_generation_time: nextGenerationTime,
            frequency: frequencyInMinutes
          })
          .eq('id', config.id);

        if (updateError) {
          console.error(`Erreur lors de la mise à jour de next_generation_time pour ${config.id}:`, updateError);
        }
      }
    }

    startCountdown(frequencyInSeconds, frequencyInSeconds);
    toast.success(`Autogénération activée. Prochain brouillon dans ${frequencyInMinutes} minute(s).`);
  };

  // Fonction pour arrêter l'autogénération
  const stopAutoGeneration = async () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    setIsAutoGenerating(false);
    setCountdown(null);

    // Réinitialiser next_generation_time pour toutes les configurations
    const { error } = await supabase
      .from('tome_automation')
      .update({ next_generation_time: null })
      .eq('is_enabled', true);

    if (error) {
      console.error("Erreur lors de la réinitialisation de next_generation_time:", error);
    }

    toast.info("Autogénération désactivée");
  };

  // Fonction pour exécuter manuellement le planificateur
  const runScheduler = async (forceGeneration: boolean = false): Promise<boolean> => {
    try {
      setIsRunning(true);
      console.log("Démarrage manuel du planificateur", forceGeneration ? "avec génération forcée" : "");

      const { data, error } = await supabase.functions.invoke('tome-scheduler', {
        body: { forceGeneration }
      });

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
    countdown,
    isAutoGenerating,
    runScheduler,
    generateContent,
    publishContent,
    checkSchedulerConfig,
    startAutoGeneration,
    stopAutoGeneration
  };
};
