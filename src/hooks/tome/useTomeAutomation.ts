
import { useState, useEffect } from "react";
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
  const [isEnabled, setIsEnabled] = useState<boolean>(false);
  const [frequency, setFrequency] = useState<string>("0.0007"); // Default: every minute (for testing)
  const [isSubmitting, setIsSubmitting] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [lastAutomationCheck, setLastAutomationCheck] = useState<Date | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const { generateContent, runScheduler, checkSchedulerConfig } = useTomeScheduler();
  const { categories } = useCategoriesKeywords(configId);
  const { activeLocalities } = useLocalities(configId);
  
  // Check if automation is already enabled on initialization
  useEffect(() => {
    checkAutomationSettings();
  }, [configId]);

  // Add a timer to periodically check the automation status
  useEffect(() => {
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
      
      const { data, error } = await supabase
        .from('tome_automation')
        .select('*')
        .eq('wordpress_config_id', configId)
        .maybeSingle();

      console.log("Check result:", { data, error });

      if (!error && data) {
        // Cast data to the correct type
        const automationData = data as unknown as TomeAutomation;
        setIsEnabled(automationData.is_enabled);
        setFrequency(automationData.frequency.toString());
        setApiKey(automationData.api_key || null);
        
        if (showToast && automationData.is_enabled) {
          toast.info(`Automation configured and ${automationData.is_enabled ? 'enabled' : 'disabled'} successfully`);
        }
      }
    } catch (error) {
      console.error("Error retrieving automation settings:", error);
    }
  };

  // Save automation settings
  const saveAutomationSettings = async () => {
    setIsSubmitting('loading');
    try {
      // Convert frequency to a floating point number to support minutes
      const frequencyNumber = parseFloat(frequency);
      
      console.log("Saving automation settings:", {
        configId,
        isEnabled,
        frequency: frequencyNumber
      });
      
      // Check if entries already exist
      const { data: existingData, error: checkError } = await supabase
        .from('tome_automation')
        .select('id')
        .eq('wordpress_config_id', configId)
        .maybeSingle();
        
      if (checkError) {
        console.error("Error checking existing data:", checkError);
        throw new Error(`Verification error: ${checkError.message}`);
      }

      console.log("Existing data:", existingData);

      // Prepare data to send
      const automationData: any = {
        is_enabled: isEnabled,
        frequency: frequencyNumber,
        updated_at: new Date().toISOString()
      };

      let result;
      
      if (existingData) {
        // Update existing entry
        console.log("Updating an existing entry:", existingData.id);
        result = await supabase
          .from('tome_automation')
          .update(automationData)
          .eq('id', existingData.id);
      } else {
        // Create a new entry
        console.log("Creating a new entry");
        result = await supabase
          .from('tome_automation')
          .insert({
            wordpress_config_id: configId,
            is_enabled: isEnabled,
            frequency: frequencyNumber
          });
      }

      if (result.error) {
        console.error("Supabase error during saving:", result.error);
        setIsSubmitting('error');
        throw new Error(`Save error: ${result.error.message}`);
      }

      console.log("Operation result:", result);
      setIsSubmitting('success');
      toast.success(`Automation ${isEnabled ? 'enabled' : 'disabled'}`);
      
      // After saving, refresh settings
      await checkAutomationSettings();
      
      // Run a scheduler configuration check to validate
      const configValid = await checkSchedulerConfig();
      if (configValid) {
        toast.success("Scheduler configuration validated successfully");
      }
      
      // Run the scheduler immediately if automation is enabled
      if (isEnabled) {
        const schedulerRun = await runScheduler(true);
        if (schedulerRun) {
          toast.success("Scheduler executed successfully. Check the Publications tab to see generated drafts.");
        }
      }
      
      return true;
    } catch (error: any) {
      console.error("Detailed error saving settings:", error);
      setIsSubmitting('error');
      toast.error(`Error: ${error.message || "Error saving settings"}`);
      return false;
    } finally {
      // Reset submitting state after a delay to allow success status to be shown briefly
      setTimeout(() => {
        setIsSubmitting('idle');
      }, 1000);
    }
  };

  // Generate a draft manually with random keywords and localities
  const generateRandomDraft = async () => {
    setIsSubmitting('loading');
    try {
      if (categories.length === 0) {
        toast.error("No categories available to generate content");
        return false;
      }

      // Select a random category
      const randomCategoryIndex = Math.floor(Math.random() * categories.length);
      const selectedCategory = categories[randomCategoryIndex];

      // Get all keywords for this category
      const { data: keywordsForCategory } = await supabase
        .from('categories_keywords')
        .select('*')
        .eq('category_id', selectedCategory.id);

      // Select a random keyword if available
      let selectedKeywordId = null;
      if (keywordsForCategory && keywordsForCategory.length > 0) {
        const randomKeywordIndex = Math.floor(Math.random() * keywordsForCategory.length);
        selectedKeywordId = keywordsForCategory[randomKeywordIndex].id;
      }

      // Select a random locality if available
      let selectedLocalityId = null;
      if (activeLocalities.length > 0) {
        const randomLocalityIndex = Math.floor(Math.random() * activeLocalities.length);
        selectedLocalityId = activeLocalities[randomLocalityIndex].id;
      }

      // Create an entry in the generations table
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
        throw generationError;
      }

      if (!generationData) {
        throw new Error("Failed to create generation");
      }

      // Use useTomeScheduler to generate content
      const result = await generateContent(generationData.id);
      
      if (result) {
        toast.success("Draft generated successfully");
        return true;
      } else {
        toast.error("Failed to generate draft");
        return false;
      }
    } catch (error: any) {
      console.error("Error generating draft:", error);
      toast.error("Error: " + error.message);
      return false;
    } finally {
      setIsSubmitting('idle');
    }
  };

  // Force scheduler execution to generate content immediately
  const forceRunScheduler = async () => {
    setIsSubmitting('loading');
    try {
      // Run the scheduler with forceGeneration=true
      const result = await runScheduler(true);
      
      if (!result) {
        toast.error("Failed to execute scheduler");
      }
      
      return result;
    } catch (error: any) {
      console.error("Error in forceRunScheduler:", error);
      toast.error(`Error: ${error.message || "An error occurred"}`);
      return false;
    } finally {
      setIsSubmitting('idle');
    }
  };

  return {
    isEnabled,
    setIsEnabled,
    frequency,
    setFrequency,
    isSubmitting,
    lastAutomationCheck,
    checkAutomationSettings,
    saveAutomationSettings,
    generateRandomDraft,
    forceRunScheduler,
    hasNecessaryData: categories.length > 0,
    apiKey
  };
};
