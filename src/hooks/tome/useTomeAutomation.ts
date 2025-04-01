
import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTomeScheduler } from "@/hooks/tome/useTomeScheduler";
import { useCategoriesKeywords, useLocalities } from "@/hooks/tome";

export interface TomeAutomation {
  id: string;
  wordpress_config_id: string;
  is_enabled: boolean;
  frequency: number;
  created_at: string;
  updated_at: string;
  api_key?: string;
}

export const useTomeAutomation = (configId: string) => {
  const [isEnabled, setIsEnabled] = useState(false);
  const [frequency, setFrequency] = useState("0.0021"); // Default: every 3 minutes (for testing)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastAutomationCheck, setLastAutomationCheck] = useState<Date | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const intervalRef = useRef<number | null>(null);
  const lastFetchTimeRef = useRef<number>(0);
  
  const { generateContent, runScheduler, checkSchedulerConfig, addLog, clearLogs } = useTomeScheduler();
  const { categories } = useCategoriesKeywords(configId);
  const { activeLocalities } = useLocalities(configId);
  
  useEffect(() => {
    if (configId) {
      checkAutomationSettings();
    }
    
    return () => {
      // Clear interval on unmount
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [configId]);

  useEffect(() => {
    if (!configId) return;
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
    
    // Set up a new interval that respects throttling
    intervalRef.current = window.setInterval(() => {
      const now = Date.now();
      // Only fetch if more than 10 seconds have passed since last fetch
      if (now - lastFetchTimeRef.current > 10000) {
        checkAutomationSettings(false);
        setLastAutomationCheck(new Date());
        lastFetchTimeRef.current = now;
      }
    }, 30000); // Still check every 30 seconds, but with throttling

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [configId]);

  const checkAutomationSettings = async (showToast = true) => {
    try {
      console.log("Vérification des paramètres d'automatisation pour configId:", configId);
      addLog(`Vérification des paramètres d'automatisation pour configId: ${configId}`);
      
      const { data, error } = await supabase
        .from('tome_automation')
        .select('*')
        .eq('wordpress_config_id', configId)
        .maybeSingle();

      console.log("Résultat de la vérification:", { data, error });
      addLog(`Résultat de la vérification: ${error ? 'Erreur' : data ? 'OK' : 'Aucune configuration'}`);

      if (!error && data) {
        const automationData = data as unknown as TomeAutomation;
        setIsEnabled(automationData.is_enabled);
        setFrequency(automationData.frequency.toString());
        setApiKey(automationData.api_key || null);
        
        addLog(`Configuration trouvée - Statut: ${automationData.is_enabled ? 'Activé' : 'Désactivé'}, Fréquence: ${automationData.frequency}, API Key: ${automationData.api_key ? 'Présente' : 'Absente'}`);
        
        if (showToast && automationData.is_enabled) {
          toast.info(`Automatisation configurée et ${automationData.is_enabled ? 'activée' : 'désactivée'}`);
        }
      } else if (error) {
        addLog(`Erreur lors de la vérification: ${error.message}`);
      } else {
        addLog("Aucune configuration d'automatisation trouvée");
      }
      
      // Update last fetch time
      lastFetchTimeRef.current = Date.now();
    } catch (error: any) {
      console.error("Erreur lors de la récupération des paramètres d'automatisation:", error);
      addLog(`Erreur: ${error.message}`);
    }
  };

  const refreshAutomationStatus = useCallback(async () => {
    await checkAutomationSettings(true);
    setLastAutomationCheck(new Date());
  }, [configId]);

  const toggleAutomationStatus = useCallback((newStatus: boolean) => {
    setIsEnabled(newStatus);
    addLog(`Statut d'automatisation modifié: ${newStatus ? 'Activé' : 'Désactivé'}`);
  }, []);

  const updateAutomationFrequency = useCallback((newFrequency: string) => {
    setFrequency(newFrequency);
    addLog(`Fréquence d'automatisation modifiée: ${newFrequency}`);
  }, []);

  const saveAutomationSettings = async () => {
    setIsSubmitting(true);
    setSavingStatus('loading');
    try {
      const frequencyNumber = parseFloat(frequency);
      
      console.log("Enregistrement des paramètres d'automatisation:", {
        configId,
        isEnabled,
        frequency: frequencyNumber
      });
      
      addLog(`Enregistrement des paramètres - Statut: ${isEnabled ? 'Activé' : 'Désactivé'}, Fréquence: ${frequencyNumber}`);
      
      const { data: existingData, error: checkError } = await supabase
        .from('tome_automation')
        .select('id, api_key')
        .eq('wordpress_config_id', configId)
        .maybeSingle();
        
      if (checkError) {
        console.error("Erreur lors de la vérification des données existantes:", checkError);
        addLog(`Erreur lors de la vérification des données existantes: ${checkError.message}`);
        throw new Error(`Erreur de vérification: ${checkError.message}`);
      }

      console.log("Données existantes:", existingData);
      addLog(`Données existantes: ${existingData ? 'Trouvées' : 'Aucune'}`);

      const automationData: any = {
        is_enabled: isEnabled,
        frequency: frequencyNumber,
        updated_at: new Date().toISOString()
      };

      let result;
      
      if (existingData) {
        console.log("Mise à jour d'une entrée existante:", existingData.id);
        addLog(`Mise à jour de l'entrée existante: ${existingData.id}`);
        
        result = await supabase
          .from('tome_automation')
          .update(automationData)
          .eq('id', existingData.id);
          
        setApiKey(existingData.api_key || null);
      } else {
        console.log("Création d'une nouvelle entrée");
        addLog("Création d'une nouvelle entrée avec une nouvelle clé API");
        
        automationData.wordpress_config_id = configId;
        
        result = await supabase
          .from('tome_automation')
          .insert(automationData);
      }

      if (result.error) {
        console.error("Erreur Supabase lors de l'enregistrement:", result.error);
        addLog(`Erreur lors de l'enregistrement: ${result.error.message}`);
        throw new Error(`Erreur d'enregistrement: ${result.error.message}`);
      }

      console.log("Résultat de l'opération:", result);
      addLog(`Résultat de l'opération: ${result.error ? 'Erreur' : 'Succès'}`);
      
      // Force scheduler to acknowledge updated frequency
      const forceRun = await runScheduler(false);
      if (forceRun) {
        toast.success(`Paramètres sauvegardés et planificateur notifié`);
      } else {
        toast.success(`Paramètres d'automatisation sauvegardés avec succès`);
      }
      
      await checkAutomationSettings();
      setSavingStatus('success');
      
      const configValid = await checkSchedulerConfig();
      if (configValid) {
        addLog("Configuration du planificateur validée avec succès");
      } else {
        addLog("Échec de la validation de la configuration du planificateur");
      }
      
      return true;
    } catch (error: any) {
      console.error("Erreur détaillée lors de l'enregistrement des paramètres:", error);
      addLog(`Erreur détaillée: ${error.message}`);
      toast.error(`Erreur: ${error.message || "Erreur lors de l'enregistrement des paramètres"}`);
      setSavingStatus('error');
      return false;
    } finally {
      setIsSubmitting(false);
      setTimeout(() => {
        if (setSavingStatus) setSavingStatus('idle');
      }, 3000);
    }
  };

  const generateRandomDraft = async () => {
    setIsSubmitting(true);
    try {
      if (categories.length === 0) {
        addLog("Aucune catégorie disponible pour générer du contenu");
        toast.error("Aucune catégorie disponible pour générer du contenu");
        return false;
      }

      addLog("Génération d'un brouillon aléatoire");
      
      const randomCategoryIndex = Math.floor(Math.random() * categories.length);
      const selectedCategory = categories[randomCategoryIndex];
      addLog(`Catégorie sélectionnée: ${selectedCategory.name} (${selectedCategory.id})`);

      const { data: keywordsForCategory, error: keywordError } = await supabase
        .from('categories_keywords')
        .select('*')
        .eq('category_id', selectedCategory.id);

      if (keywordError) {
        addLog(`Erreur lors de la récupération des mots-clés: ${keywordError.message}`);
        throw keywordError;
      }

      let selectedKeywordId = null;
      let selectedKeyword = null;
      if (keywordsForCategory && keywordsForCategory.length > 0) {
        const randomKeywordIndex = Math.floor(Math.random() * keywordsForCategory.length);
        selectedKeywordId = keywordsForCategory[randomKeywordIndex].id;
        selectedKeyword = keywordsForCategory[randomKeywordIndex].keyword;
        addLog(`Mot-clé sélectionné: ${selectedKeyword} (${selectedKeywordId})`);
      } else {
        addLog("Aucun mot-clé disponible pour cette catégorie");
      }

      let selectedLocalityId = null;
      let selectedLocality = null;
      if (activeLocalities.length > 0) {
        const randomLocalityIndex = Math.floor(Math.random() * activeLocalities.length);
        selectedLocalityId = activeLocalities[randomLocalityIndex].id;
        selectedLocality = activeLocalities[randomLocalityIndex].name;
        addLog(`Localité sélectionnée: ${selectedLocality} (${selectedLocalityId})`);
      } else {
        addLog("Aucune localité disponible");
      }

      addLog("Création d'une entrée dans la table des générations");
      const { data: generationData, error: generationError } = await supabase
        .from('tome_generations')
        .insert({
          wordpress_config_id: configId,
          category_id: selectedCategory.id,
          keyword_id: selectedKeywordId,
          locality_id: selectedLocalityId,
          status: 'pending'
        })
        .select()
        .single();

      if (generationError) {
        addLog(`Erreur lors de la création de la génération: ${generationError.message}`);
        throw generationError;
      }

      if (!generationData) {
        addLog("Échec de la création de la génération");
        throw new Error("Échec de la création de la génération");
      }

      addLog(`Génération créée avec l'ID: ${generationData.id}`);

      addLog("Démarrage de la génération de contenu");
      const result = await generateContent(generationData.id);
      
      if (result) {
        addLog("Brouillon généré avec succès");
        toast.success("Brouillon généré avec succès");
        return true;
      } else {
        addLog("Échec de la génération du brouillon");
        toast.error("Échec de la génération du brouillon");
        return false;
      }
    } catch (error: any) {
      console.error("Erreur lors de la génération du brouillon:", error);
      addLog(`Erreur lors de la génération du brouillon: ${error.message}`);
      toast.error("Erreur: " + error.message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const forceRunScheduler = async () => {
    setIsSubmitting(true);
    try {
      addLog("Exécution forcée du planificateur");
      
      const result = await runScheduler(true);
      
      if (!result) {
        addLog("Échec de l'exécution du planificateur");
        toast.error("Échec de l'exécution du planificateur");
      } else {
        addLog("Planificateur exécuté avec succès");
      }
      
      return result;
    } catch (error: any) {
      console.error("Erreur dans forceRunScheduler:", error);
      addLog(`Erreur dans forceRunScheduler: ${error.message}`);
      toast.error(`Erreur: ${error.message || "Une erreur est survenue"}`);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    isEnabled,
    setIsEnabled,
    frequency,
    setFrequency,
    isSubmitting,
    savingStatus,
    lastAutomationCheck,
    apiKey,
    checkAutomationSettings,
    saveAutomationSettings,
    generateRandomDraft,
    forceRunScheduler,
    refreshAutomationStatus,
    toggleAutomationStatus,
    updateAutomationFrequency,
    hasNecessaryData: categories.length > 0,
    clearLogs
  };
};
