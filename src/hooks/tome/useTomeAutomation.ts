import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useTomeScheduler } from "@/hooks/tome/useTomeScheduler";
import { useCategoriesKeywords, useLocalities } from "@/hooks/tome";

// Define the type for tome_automation table
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
  const [frequency, setFrequency] = useState("0.0007"); // Default: every minute (for testing)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastAutomationCheck, setLastAutomationCheck] = useState<Date | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [savingStatus, setSavingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  
  const { generateContent, runScheduler, checkSchedulerConfig, addLog, clearLogs } = useTomeScheduler();
  const { categories } = useCategoriesKeywords(configId);
  const { activeLocalities } = useLocalities(configId);
  
  // Check if automation is already enabled on initialization
  useEffect(() => {
    if (configId) {
      checkAutomationSettings();
    }
  }, [configId]);

  // Add a timer to periodically check the automation status
  useEffect(() => {
    if (!configId) return;
    
    // Check every 30 seconds if automation settings have changed
    const intervalId = setInterval(() => {
      checkAutomationSettings(false);
      setLastAutomationCheck(new Date());
    }, 30000);

    return () => clearInterval(intervalId);
  }, [configId]);

  // Retrieve automation status from the database
  const checkAutomationSettings = async (showToast = true) => {
    try {
      console.log("Checking automation settings for configId:", configId);
      addLog(`Vérification des paramètres d'automatisation pour configId: ${configId}`);
      
      const { data, error } = await supabase
        .from('tome_automation')
        .select('*')
        .eq('wordpress_config_id', configId)
        .maybeSingle();

      console.log("Check result:", { data, error });
      addLog(`Résultat de la vérification: ${error ? 'Erreur' : data ? 'OK' : 'Aucune configuration'}`);

      if (!error && data) {
        // Cast data to the correct type
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
    } catch (error: any) {
      console.error("Error retrieving automation settings:", error);
      addLog(`Erreur: ${error.message}`);
    }
  };

  // Refresh automation status
  const refreshAutomationStatus = useCallback(async () => {
    await checkAutomationSettings(true);
    setLastAutomationCheck(new Date());
  }, [configId]);

  // Toggle automation status
  const toggleAutomationStatus = useCallback((newStatus: boolean) => {
    setIsEnabled(newStatus);
    addLog(`Statut d'automatisation modifié: ${newStatus ? 'Activé' : 'Désactivé'}`);
  }, []);

  // Update automation frequency
  const updateAutomationFrequency = useCallback((newFrequency: string) => {
    setFrequency(newFrequency);
    addLog(`Fréquence d'automatisation modifiée: ${newFrequency}`);
  }, []);

  // Save automation settings
  const saveAutomationSettings = async () => {
    setIsSubmitting(true);
    setSavingStatus('loading');
    try {
      // Convert frequency to a floating point number to support minutes
      const frequencyNumber = parseFloat(frequency);
      
      console.log("Saving automation settings:", {
        configId,
        isEnabled,
        frequency: frequencyNumber
      });
      
      addLog(`Enregistrement des paramètres - Statut: ${isEnabled ? 'Activé' : 'Désactivé'}, Fréquence: ${frequencyNumber}`);
      
      // Check if entries already exist
      const { data: existingData, error: checkError } = await supabase
        .from('tome_automation')
        .select('id, api_key')
        .eq('wordpress_config_id', configId)
        .maybeSingle();
        
      if (checkError) {
        console.error("Error checking existing data:", checkError);
        addLog(`Erreur lors de la vérification des données existantes: ${checkError.message}`);
        throw new Error(`Verification error: ${checkError.message}`);
      }

      console.log("Existing data:", existingData);
      addLog(`Données existantes: ${existingData ? 'Trouvées' : 'Aucune'}`);

      // Prepare data to send
      const automationData: any = {
        is_enabled: isEnabled,
        frequency: frequencyNumber,
        updated_at: new Date().toISOString()
      };

      let result;
      
      if (existingData) {
        // Update existing entry, keep the existing API key
        console.log("Updating an existing entry:", existingData.id);
        addLog(`Mise à jour de l'entrée existante: ${existingData.id}`);
        
        result = await supabase
          .from('tome_automation')
          .update(automationData)
          .eq('id', existingData.id);
          
        // Keep the existing API key
        setApiKey(existingData.api_key || null);
      } else {
        // Create a new entry with a new API key
        console.log("Creating a new entry");
        addLog("Création d'une nouvelle entrée avec une nouvelle clé API");
        
        // Generate a new API key
        automationData.wordpress_config_id = configId;
        
        result = await supabase
          .from('tome_automation')
          .insert(automationData);
      }

      if (result.error) {
        console.error("Supabase error during saving:", result.error);
        addLog(`Erreur lors de l'enregistrement: ${result.error.message}`);
        throw new Error(`Save error: ${result.error.message}`);
      }

      console.log("Operation result:", result);
      addLog(`Résultat de l'opération: ${result.error ? 'Erreur' : 'Succès'}`);
      toast.success(`Automatisation ${isEnabled ? 'activée' : 'désactivée'}`);
      
      // After saving, refresh settings
      await checkAutomationSettings();
      setSavingStatus('success');
      
      // Run a scheduler configuration check to validate
      const configValid = await checkSchedulerConfig();
      if (configValid) {
        addLog("Configuration du planificateur validée avec succès");
        toast.success("Configuration du planificateur validée avec succès");
      } else {
        addLog("Échec de la validation de la configuration du planificateur");
      }
      
      // Run the scheduler immediately if automation is enabled
      if (isEnabled) {
        addLog("Démarrage immédiat du planificateur");
        const schedulerRun = await runScheduler(true);
        if (schedulerRun) {
          addLog("Planificateur exécuté avec succès");
          toast.success("Planificateur exécuté avec succès. Vérifiez l'onglet Publications pour voir les brouillons générés.");
        } else {
          addLog("Échec de l'exécution du planificateur");
        }
      }
      
      return true;
    } catch (error: any) {
      console.error("Detailed error saving settings:", error);
      addLog(`Erreur détaillée: ${error.message}`);
      toast.error(`Erreur: ${error.message || "Erreur lors de l'enregistrement des paramètres"}`);
      setSavingStatus('error');
      return false;
    } finally {
      setIsSubmitting(false);
      // Reset status after a delay
      setTimeout(() => {
        if (setSavingStatus) setSavingStatus('idle');
      }, 3000);
    }
  };

  // Generate a draft manually with random keywords and localities
  const generateRandomDraft = async () => {
    setIsSubmitting(true);
    try {
      if (categories.length === 0) {
        addLog("Aucune catégorie disponible pour générer du contenu");
        toast.error("Aucune catégorie disponible pour générer du contenu");
        return false;
      }

      addLog("Génération d'un brouillon aléatoire");
      
      // Select a random category
      const randomCategoryIndex = Math.floor(Math.random() * categories.length);
      const selectedCategory = categories[randomCategoryIndex];
      addLog(`Catégorie sélectionnée: ${selectedCategory.name} (${selectedCategory.id})`);

      // Get all keywords for this category
      const { data: keywordsForCategory, error: keywordError } = await supabase
        .from('categories_keywords')
        .select('*')
        .eq('category_id', selectedCategory.id);

      if (keywordError) {
        addLog(`Erreur lors de la récupération des mots-clés: ${keywordError.message}`);
        throw keywordError;
      }

      // Select a random keyword if available
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

      // Select a random locality if available
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

      // Create an entry in the generations table
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
        throw new Error("Failed to create generation");
      }

      addLog(`Génération créée avec l'ID: ${generationData.id}`);

      // Use useTomeScheduler to generate content
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
      console.error("Error generating draft:", error);
      addLog(`Erreur lors de la génération du brouillon: ${error.message}`);
      toast.error("Erreur: " + error.message);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // Force scheduler execution to generate content immediately
  const forceRunScheduler = async () => {
    setIsSubmitting(true);
    try {
      addLog("Exécution forcée du planificateur");
      
      // Run the scheduler with forceGeneration=true
      const result = await runScheduler(true);
      
      if (!result) {
        addLog("Échec de l'exécution du planificateur");
        toast.error("Échec de l'exécution du planificateur");
      } else {
        addLog("Planificateur exécuté avec succès");
      }
      
      return result;
    } catch (error: any) {
      console.error("Error in forceRunScheduler:", error);
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
