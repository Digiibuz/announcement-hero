
import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const useTomeScheduler = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = useCallback((message: string) => {
    console.log("Scheduler log:", message);
    setLogs(prev => [...prev, message]);
  }, []);

  // Fonction pour vérifier la configuration du planificateur (sans générer de contenu)
  const checkSchedulerConfig = async (): Promise<boolean> => {
    try {
      setIsRunning(true);
      addLog("Vérification de la configuration du planificateur...");

      // IMPORTANT: Paramètres standardisés pour la vérification de configuration
      const params = { 
        configCheck: true,  // Explicitement true pour la vérification
        forceGeneration: false, // Explicitement false pour la vérification
        timestamp: new Date().getTime(),
        debug: true
      };
      
      addLog(`Paramètres de la requête de vérification: ${JSON.stringify(params)}`);
      console.log("Paramètres de vérification de configuration:", params);

      const { data, error } = await supabase.functions.invoke('tome-scheduler', {
        body: params
      });

      if (error) {
        console.error("Erreur lors de la vérification de la configuration:", error);
        addLog(`Erreur: ${error.message || "Une erreur s'est produite"}`);
        toast.error(`Erreur: ${error.message || "Une erreur s'est produite"}`);
        return false;
      }

      console.log("Résultat de la vérification de configuration:", data);
      
      if (data && data.automationSettings) {
        const settingsCount = data.automationSettings.length;
        addLog(`Configuration validée: ${settingsCount} configuration(s) d'automatisation active(s)`);
        
        if (settingsCount > 0) {
          data.automationSettings.forEach((setting: any) => {
            addLog(`Config ID: ${setting.wordpress_config_id.slice(0, 8)}... | Fréquence: ${setting.frequency} jour(s)`);
          });
        }
      } else {
        addLog("Aucune configuration d'automatisation active trouvée");
      }
      
      return true;
    } catch (error: any) {
      console.error("Erreur dans checkSchedulerConfig:", error);
      addLog(`Erreur: ${error.message || "Une erreur s'est produite"}`);
      toast.error(`Erreur: ${error.message || "Une erreur s'est produite"}`);
      return false;
    } finally {
      setIsRunning(false);
    }
  };

  // Fonction pour exécuter manuellement le planificateur
  const runScheduler = async (forceGeneration = true): Promise<boolean> => {
    try {
      setIsRunning(true);
      addLog(`Démarrage ${forceGeneration ? "forcé" : "manuel"} du planificateur...`);
      
      // STANDARDISATION DES PARAMÈTRES: Toujours utiliser ces paramètres pour l'exécution
      // que ce soit en mode manuel ou automatique
      const params = { 
        forceGeneration: true, // TOUJOURS true pour exécution (manuelle ou auto)
        configCheck: false,    // TOUJOURS false pour exécution (manuelle ou auto)
        timestamp: new Date().getTime(),
        debug: true
      };
      
      addLog(`Paramètres de la requête d'exécution: ${JSON.stringify(params)}`);
      console.log("Paramètres d'exécution du planificateur:", params);

      const { data, error } = await supabase.functions.invoke('tome-scheduler', {
        body: params
      });

      if (error) {
        console.error("Erreur lors de l'exécution du planificateur:", error);
        addLog(`Erreur: ${error.message || "Une erreur s'est produite"}`);
        toast.error(`Erreur: ${error.message || "Une erreur s'est produite"}`);
        return false;
      }

      console.log("Résultat de l'exécution du planificateur:", data);
      addLog(`Réponse du serveur: ${JSON.stringify(data)}`);

      if (data && typeof data.generationsCreated === 'number') {
        if (data.generationsCreated === 0) {
          const message = forceGeneration 
            ? "Aucun contenu généré. Vérifiez que des catégories et mots-clés existent." 
            : "Aucun contenu généré. La fréquence n'est peut-être pas atteinte ou aucune configuration n'est activée.";
          
          addLog(message);
          toast.info(message);
        } else {
          const message = `${data.generationsCreated} brouillon(s) généré(s) avec succès`;
          addLog(message);
          toast.success(message);
        }
      }
      
      if (data && data.processingDetails) {
        data.processingDetails.forEach((detail: any) => {
          addLog(`Traitement config ${detail.configId.slice(0, 8)}...: ${detail.result}`);
          
          if (detail.reason) {
            addLog(`Raison: ${detail.reason}`);
          }
        });
      }

      return true;
    } catch (error: any) {
      console.error("Erreur dans runScheduler:", error);
      addLog(`Erreur: ${error.message || "Une erreur s'est produite"}`);
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
      addLog(`Génération de contenu pour: ${generationId.slice(0, 8)}...`);

      // Ajout d'un timestamp aléatoire pour éviter la mise en cache de la requête
      const timestamp = new Date().getTime();
      
      const params = {
        generationId,
        timestamp,
        debug: true
      };
      
      addLog(`Paramètres d'appel à tome-generate-draft: ${JSON.stringify(params)}`);
      
      const { data, error } = await supabase.functions.invoke('tome-generate-draft', {
        body: params
      });

      if (error) {
        console.error("Erreur lors de la génération du contenu:", error);
        addLog(`Erreur: ${error.message || "Une erreur s'est produite"}`);
        toast.error(`Erreur: ${error.message || "Une erreur s'est produite"}`);
        return false;
      }

      console.log("Résultat de la génération:", data);
      addLog(`Réponse du serveur: ${JSON.stringify(data)}`);
      
      if (data && data.success) {
        addLog("Contenu généré avec succès");
        toast.success("Contenu généré avec succès");
        return true;
      } else if (data && data.error) {
        addLog(`Erreur: ${data.error}`);
        toast.error(`Erreur: ${data.error}`);
        return false;
      }
      
      return true;
    } catch (error: any) {
      console.error("Erreur dans generateContent:", error);
      addLog(`Erreur: ${error.message || "Une erreur s'est produite"}`);
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
      addLog(`Publication de contenu pour: ${generationId.slice(0, 8)}...`);

      // Ajout d'un timestamp aléatoire pour éviter la mise en cache de la requête
      const timestamp = new Date().getTime();
      
      const { data, error } = await supabase.functions.invoke('tome-publish', {
        body: { 
          generationId, 
          timestamp,
          debug: true
        }
      });

      if (error) {
        console.error("Erreur lors de la publication du contenu:", error);
        addLog(`Erreur: ${error.message || "Une erreur s'est produite"}`);
        toast.error(`Erreur: ${error.message || "Une erreur s'est produite"}`);
        return false;
      }

      console.log("Résultat de la publication:", data);
      addLog(`Réponse du serveur: ${JSON.stringify(data)}`);

      if (data && data.success) {
        addLog("Contenu publié avec succès");
        toast.success("Contenu publié avec succès");
        return true;
      } else {
        addLog(`Échec de la publication: ${data?.message || "Une erreur s'est produite"}`);
        toast.error(`Échec de la publication: ${data?.message || "Une erreur s'est produite"}`);
        return false;
      }
    } catch (error: any) {
      console.error("Erreur dans publishContent:", error);
      addLog(`Erreur: ${error.message || "Une erreur s'est produite"}`);
      toast.error(`Erreur: ${error.message || "Une erreur s'est produite"}`);
      return false;
    } finally {
      setIsRunning(false);
    }
  };

  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);

  return {
    isRunning,
    runScheduler,
    generateContent,
    publishContent,
    checkSchedulerConfig,
    logs,
    addLog,
    clearLogs
  };
};
