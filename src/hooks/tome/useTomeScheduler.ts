
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useTomeScheduler = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [lastCheckResult, setLastCheckResult] = useState<any>(null);

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
      setLastCheckResult(data);
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

      return true;
    } catch (error: any) {
      console.error("Erreur dans runScheduler:", error);
      toast.error(`Erreur: ${error.message || "Une erreur s'est produite"}`);
      return false;
    } finally {
      setIsRunning(false);
    }
  };

  // Fonction pour forcer la génération de contenu, ignorant la vérification de fréquence
  const forceSchedulerRun = async (): Promise<boolean> => {
    try {
      setIsRunning(true);
      console.log("Exécution forcée du planificateur");

      const { data, error } = await supabase.functions.invoke('tome-scheduler', {
        body: { forceRun: true }
      });

      if (error) {
        console.error("Erreur lors de l'exécution forcée du planificateur:", error);
        toast.error(`Erreur: ${error.message || "Une erreur s'est produite"}`);
        return false;
      }

      console.log("Résultat de l'exécution forcée du planificateur:", data);

      if (data.generationsCreated === 0) {
        toast.warning("Aucun contenu n'a pu être généré. Vérifiez les configurations (catégories, mots-clés).");
      } else {
        toast.success(`${data.generationsCreated} brouillon(s) généré(s) avec succès`);
      }

      return true;
    } catch (error: any) {
      console.error("Erreur dans forceSchedulerRun:", error);
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
    lastCheckResult,
    runScheduler,
    forceSchedulerRun,
    generateContent,
    publishContent,
    checkSchedulerConfig
  };
};
