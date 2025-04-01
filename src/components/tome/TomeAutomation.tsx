
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useTomeAutomation } from "@/hooks/tome/useTomeAutomation";
import { useTomeScheduler } from "@/hooks/tome/useTomeScheduler";
import { useCategoriesKeywords } from "@/hooks/tome";
import AutomationStatus from "./automation/AutomationStatus";
import FrequencySelector from "./automation/FrequencySelector";
import WarningMessage from "./automation/WarningMessage";
import AutomationActions from "./automation/AutomationActions";

interface TomeAutomationProps {
  configId: string;
}

const TomeAutomation: React.FC<TomeAutomationProps> = ({ configId }) => {
  const { 
    isEnabled, 
    setIsEnabled, 
    frequency, 
    setFrequency, 
    isSubmitting,
    savingStatus,
    lastAutomationCheck,
    apiKey,
    refreshAutomationStatus,
    saveAutomationSettings,
    generateRandomDraft,
    forceRunScheduler,
    toggleAutomationStatus,
    updateAutomationFrequency,
    hasNecessaryData,
    clearLogs
  } = useTomeAutomation(configId);
  
  const { logs } = useTomeScheduler();
  const { isLoading: isCategoriesLoading } = useCategoriesKeywords(configId);

  // Fixed: Helper functions to convert Promise<boolean> to Promise<void>
  const handleGenerateRandomDraft = async (): Promise<void> => {
    await generateRandomDraft();
  };
  
  const handleForceRunScheduler = async (): Promise<void> => {
    await forceRunScheduler();
  };
  
  const handleSaveSettings = async (): Promise<void> => {
    await saveAutomationSettings();
  };

  if (isCategoriesLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-32">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Automatisation des publications</CardTitle>
        <CardDescription>
          Configurez la génération automatique de brouillons avec des mots-clés et localités aléatoires
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AutomationStatus
          isEnabled={isEnabled}
          onEnabledChange={toggleAutomationStatus}
          hasNecessaryData={hasNecessaryData}
          isSubmitting={isSubmitting || savingStatus === 'loading'}
          lastAutomationCheck={lastAutomationCheck}
          frequency={frequency}
          onRefresh={refreshAutomationStatus}
        />

        <FrequencySelector
          frequency={frequency}
          onFrequencyChange={updateAutomationFrequency}
          isEnabled={isEnabled}
          isSubmitting={isSubmitting || savingStatus === 'loading'}
        />

        <WarningMessage 
          hasNecessaryData={hasNecessaryData} 
          logs={logs.slice(-5)} // Show only the last 5 logs
        />
      </CardContent>
      <CardFooter>
        <AutomationActions
          onGenerateRandomDraft={handleGenerateRandomDraft}
          onForceRunScheduler={handleForceRunScheduler}
          onSaveSettings={handleSaveSettings}
          hasNecessaryData={hasNecessaryData}
          isSubmitting={isSubmitting || savingStatus === 'loading'}
          logs={logs}
          onClearLogs={clearLogs}
        />
      </CardFooter>
    </Card>
  );
};

export default TomeAutomation;
