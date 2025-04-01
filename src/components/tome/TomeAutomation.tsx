
import React, { useEffect } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from "lucide-react";
import { useTomeAutomation } from "@/hooks/tome/useTomeAutomation";
import { useTomeScheduler } from "@/hooks/tome/useTomeScheduler";
import { useCategoriesKeywords } from "@/hooks/tome";
import AutomationStatus from "./automation/AutomationStatus";
import FrequencySelector from "./automation/FrequencySelector";
import WarningMessage from "./automation/WarningMessage";
import AutomationActions from "./automation/AutomationActions";
import NotificationDisplay from "./automation/NotificationDisplay";
import { toast } from "sonner";

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
  const { isLoading: isCategoriesLoading, categories } = useCategoriesKeywords(configId);

  useEffect(() => {
    // Informer l'utilisateur si les conditions pour l'automatisation ne sont pas réunies
    if (!hasNecessaryData && isEnabled) {
      toast.warning("Automatisation activée mais sans catégories", {
        description: "Veuillez ajouter des catégories et des mots-clés pour permettre la génération automatique",
        duration: 8000
      });
    }
  }, [hasNecessaryData, isEnabled]);

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
    <>
      <NotificationDisplay configId={configId} />
      <Card>
        <CardHeader>
          <CardTitle>Automatisation des publications</CardTitle>
          <CardDescription>
            Configurez la génération automatique de brouillons avec des mots-clés et localités aléatoires
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <AutomationStatus
            isEnabled={isEnabled}
            onEnabledChange={toggleAutomationStatus}
            hasNecessaryData={hasNecessaryData}
            isSubmitting={isSubmitting || savingStatus === 'loading'}
            lastAutomationCheck={lastAutomationCheck}
            onRefresh={refreshAutomationStatus}
          />

          <FrequencySelector
            frequency={frequency}
            onFrequencyChange={updateAutomationFrequency}
            isEnabled={isEnabled}
            isSubmitting={isSubmitting || savingStatus === 'loading'}
          />

          <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm text-amber-800">
            <p className="font-medium mb-1">Attention</p>
            <p>Pour que l'automatisation fonctionne correctement, vous devez:</p>
            <ol className="list-decimal list-inside mt-1 space-y-1">
              <li>Avoir au moins une catégorie avec des mots-clés (actuellement: {categories.length} catégories)</li>
              <li>Activer l'automatisation avec le bouton ci-dessus</li>
              <li>Définir une fréquence de génération</li>
              <li>Sauvegarder vos paramètres avec le bouton "Sauvegarder"</li>
              <li>Un brouillon sera généré selon la fréquence définie</li>
            </ol>
          </div>

          <WarningMessage 
            hasNecessaryData={hasNecessaryData} 
            logs={logs.slice(-5)} // Show only the last 5 logs
          />
        </CardContent>
        <CardFooter>
          <AutomationActions
            onGenerateRandomDraft={generateRandomDraft}
            onForceRunScheduler={forceRunScheduler}
            onSaveSettings={saveAutomationSettings}
            hasNecessaryData={hasNecessaryData}
            isSubmitting={isSubmitting || savingStatus === 'loading'}
            logs={logs}
            onClearLogs={clearLogs}
          />
        </CardFooter>
      </Card>
    </>
  );
};

export default TomeAutomation;
