import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useTomeScheduler = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback((message: string) => {
    setLogs(prev => {
      const timestamp = new Date().toLocaleTimeString();
      const newLogs = [`${timestamp} - ${message}`, ...prev];
      // Keep only the last 20 logs
      return newLogs.slice(0, 20);
    });
  }, []);

  // Fonction pour vérifier la configuration du planificateur (sans générer de contenu)
  const checkSchedulerConfig = async (): Promise<boolean> => {
    try {
      setIsRunning(true);
      addLog("Checking scheduler configuration...");
      console.log("Vérification de la configuration du planificateur");

      const { data, error } = await supabase.functions.invoke('tome-scheduler', {
        body: { configCheck: true }
      });

      if (error) {
        console.error("Erreur lors de la vérification de la configuration:", error);
        toast.error(`Erreur: ${error.message || "Une erreur s'est produite"}`);
        addLog(`ERROR: ${error.message || "Une erreur lors de la vérification de la configuration"}`);
        return false;
      }

      console.log("Résultat de la vérification de configuration:", data);
      
      if (data && data.automationSettings && data.automationSettings.length > 0) {
        addLog(`Configuration checked: Found ${data.automationSettings.length} automation settings`);
        data.automationSettings.forEach((setting: any) => {
          addLog(`Config ID: ${setting.wordpress_config_id}, Frequency: ${setting.frequency} days`);
        });
      } else {
        addLog("No automation settings found or automation is disabled");
      }
      
      return true;
    } catch (error: any) {
      console.error("Erreur dans checkSchedulerConfig:", error);
      toast.error(`Erreur: ${error.message || "Une erreur s'est produite"}`);
      addLog(`ERROR: ${error.message || "Une erreur dans checkSchedulerConfig"}`);
      return false;
    } finally {
      setIsRunning(false);
    }
  };

  // Fonction pour exécuter manuellement le planificateur
  const runScheduler = async (forceGeneration = false): Promise<boolean> => {
    try {
      setIsRunning(true);
      addLog(forceGeneration ? "Forcing content generation..." : "Starting scheduler...");
      console.log("Démarrage manuel du planificateur", forceGeneration ? "avec génération forcée" : "");

      // Ajout d'un timestamp aléatoire pour éviter la mise en cache de la requête
      const timestamp = new Date().getTime();
      
      const { data, error } = await supabase.functions.invoke('tome-scheduler', {
        body: { forceGeneration, timestamp }
      });

      if (error) {
        console.error("Erreur lors de l'exécution du planificateur:", error);
        toast.error(`Erreur: ${error.message || "Une erreur s'est produite"}`);
        addLog(`ERROR: ${error.message || "Une erreur lors de l'exécution du planificateur"}`);
        return false;
      }

      console.log("Résultat de l'exécution du planificateur:", data);

      if (data.generationsCreated === 0) {
        const message = "Aucun contenu n'a été généré. Soit la fréquence n'est pas atteinte, soit aucune configuration n'est activée.";
        toast.info(message);
        addLog(message);
      } else {
        const message = `${data.generationsCreated} brouillon(s) généré(s) avec succès`;
        toast.success(message);
        addLog(`SUCCESS: ${message}`);
      }

      return true;
    } catch (error: any) {
      console.error("Erreur dans runScheduler:", error);
      toast.error(`Erreur: ${error.message || "Une erreur s'est produite"}`);
      addLog(`ERROR: ${error.message || "Une erreur dans runScheduler"}`);
      return false;
    } finally {
      setIsRunning(false);
    }
  };

  // Fonction pour générer du contenu à partir d'une génération existante
  const generateContent = async (generationId: string): Promise<boolean> => {
    try {
      setIsRunning(true);
      addLog(`Generating content for generation ID: ${generationId}`);
      console.log("Génération de contenu pour:", generationId);

      // Ajout d'un timestamp aléatoire pour éviter la mise en cache de la requête
      const timestamp = new Date().getTime();
      
      const { data, error } = await supabase.functions.invoke('tome-generate-draft', {
        body: { generationId, timestamp }
      });

      if (error) {
        console.error("Erreur lors de la génération du contenu:", error);
        toast.error(`Erreur: ${error.message || "Une erreur s'est produite"}`);
        addLog(`ERROR: ${error.message || "Une erreur lors de la génération du contenu"}`);
        return false;
      }

      console.log("Résultat de la génération:", data);
      
      if (data && data.success) {
        toast.success("Contenu généré avec succès");
        addLog(`SUCCESS: Content generated successfully for ID: ${generationId}`);
        return true;
      } else if (data && data.error) {
        toast.error(`Erreur: ${data.error}`);
        addLog(`ERROR: ${data.error}`);
        return false;
      }
      
      return true;
    } catch (error: any) {
      console.error("Erreur dans generateContent:", error);
      toast.error(`Erreur: ${error.message || "Une erreur s'est produite"}`);
      addLog(`ERROR: ${error.message || "Une erreur dans generateContent"}`);
      return false;
    } finally {
      setIsRunning(false);
    }
  };

  // Fonction pour publier du contenu
  const publishContent = async (generationId: string): Promise<boolean> => {
    try {
      setIsRunning(true);
      addLog(`Publishing content for generation ID: ${generationId}`);
      console.log("Publication de contenu pour:", generationId);

      // Ajout d'un timestamp aléatoire pour éviter la mise en cache de la requête
      const timestamp = new Date().getTime();
      
      const { data, error } = await supabase.functions.invoke('tome-publish', {
        body: { generationId, timestamp }
      });

      if (error) {
        console.error("Erreur lors de la publication du contenu:", error);
        toast.error(`Erreur: ${error.message || "Une erreur s'est produite"}`);
        addLog(`ERROR: ${error.message || "Une erreur lors de la publication du contenu"}`);
        return false;
      }

      console.log("Résultat de la publication:", data);

      if (data.success) {
        toast.success("Contenu publié avec succès");
        addLog(`SUCCESS: Content published successfully for ID: ${generationId}`);
        return true;
      } else {
        toast.error(`Échec de la publication: ${data.message || "Une erreur s'est produite"}`);
        addLog(`ERROR: ${data.message || "Une erreur lors de la publication"}`);
        return false;
      }
    } catch (error: any) {
      console.error("Erreur dans publishContent:", error);
      toast.error(`Erreur: ${error.message || "Une erreur s'est produite"}`);
      addLog(`ERROR: ${error.message || "Une erreur dans publishContent"}`);
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
    logs,
    addLog
  };
};
