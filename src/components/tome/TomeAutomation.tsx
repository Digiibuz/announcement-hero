
import React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useTomeAutomation } from "@/hooks/tome/useTomeAutomation";
import AutomationStatus from "./automation/AutomationStatus";
import FrequencySelector from "./automation/FrequencySelector";
import WarningMessage from "./automation/WarningMessage";
import AutomationActions from "./automation/AutomationActions";
import { useCategoriesKeywords, useLocalities } from "@/hooks/tome";

interface TomeAutomationProps {
  configId: string;
}

const TomeAutomation: React.FC<TomeAutomationProps> = ({ configId }) => {
  const { categories, isLoading: isLoadingCategories } = useCategoriesKeywords(configId);
  const { isLoading: isLoadingLocalities } = useLocalities(configId);
  
  const {
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
    hasNecessaryData
  } = useTomeAutomation(configId);

  const isLoading = isLoadingCategories || isLoadingLocalities;

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-32">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Publication automation</CardTitle>
        <CardDescription>
          Configure automatic draft generation with random keywords and localities
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <AutomationStatus
          isEnabled={isEnabled}
          onEnabledChange={setIsEnabled}
          hasNecessaryData={hasNecessaryData}
          isSubmitting={isSubmitting}
          lastAutomationCheck={lastAutomationCheck}
          onRefresh={() => checkAutomationSettings(true)}
        />

        <FrequencySelector
          frequency={frequency}
          onFrequencyChange={setFrequency}
          isEnabled={isEnabled}
          isSubmitting={isSubmitting}
        />

        <WarningMessage hasNecessaryData={hasNecessaryData} />
      </CardContent>
      <CardFooter>
        <AutomationActions
          onGenerateRandomDraft={generateRandomDraft}
          onForceRunScheduler={forceRunScheduler}
          onSaveSettings={saveAutomationSettings}
          hasNecessaryData={hasNecessaryData}
          isSubmitting={isSubmitting}
        />
      </CardFooter>
    </Card>
  );
};

export default TomeAutomation;
