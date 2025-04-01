
import React, { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useTomeAutomation } from "@/hooks/tome/useTomeAutomation";
import { useTomeScheduler } from "@/hooks/tome/useTomeScheduler";
import { useCategoriesKeywords } from "@/hooks/tome/useCategoriesKeywords";
import AutomationActions from "./automation/AutomationActions";
import AutomationStatus from "./automation/AutomationStatus";
import FrequencySelector from "./automation/FrequencySelector";
import WarningMessage from "./automation/WarningMessage";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

interface TomeAutomationProps {
  configId: string;
}

const TomeAutomation: React.FC<TomeAutomationProps> = ({ configId }) => {
  const { 
    isEnabled, 
    frequency, 
    isSubmitting: savingStatus,
    lastAutomationCheck,
    checkAutomationSettings,
    setIsEnabled,
    setFrequency,
    saveAutomationSettings,
    generateRandomDraft,
    forceRunScheduler,
    hasNecessaryData
  } = useTomeAutomation(configId);
  
  const { 
    categories, 
    keywords, 
    isLoading: isCategoriesLoading 
  } = useCategoriesKeywords(configId);
  
  const { 
    isRunning, 
    runScheduler, 
    checkSchedulerConfig,
    logs,
    addLog
  } = useTomeScheduler();

  const [showApiKey, setShowApiKey] = useState(false);
  const [checkingConfig, setCheckingConfig] = useState(true);
  const [apiKey, setApiKey] = useState<string | null>(null);
  
  // Check if there are categories and keywords available
  const hasKeywordsAndCategories = categories.length > 0 && 
    categories.some(cat => 
      keywords.some(kw => kw.category_id === cat.id)
    );

  // Check scheduler configuration on component mount and every 5 minutes
  useEffect(() => {
    if (!configId) return;

    const checkConfig = async () => {
      setCheckingConfig(true);
      try {
        await checkSchedulerConfig();
      } finally {
        setCheckingConfig(false);
      }
    };

    // Do initial check
    checkConfig();

    // Set up interval for checking configuration
    const intervalId = setInterval(checkConfig, 5 * 60 * 1000); // Check every 5 minutes
    
    return () => clearInterval(intervalId);
  }, [configId, checkSchedulerConfig]);
  
  // Log configuration changes
  useEffect(() => {
    if (isEnabled !== null && frequency !== null) {
      addLog(`Automation status: ${isEnabled ? 'Enabled' : 'Disabled'}, Frequency: ${frequency} days`);
    }
  }, [isEnabled, frequency, addLog]);

  // Trigger scheduler check after settings are saved
  useEffect(() => {
    if (savingStatus === 'success') {
      addLog("Settings saved, checking scheduler configuration...");
      const timer = setTimeout(() => {
        checkSchedulerConfig();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [savingStatus, checkSchedulerConfig, addLog]);

  const handleRunScheduler = (forceGeneration: boolean) => {
    runScheduler(forceGeneration);
  };

  const handleRefreshStatus = async () => {
    addLog("Refreshing automation status...");
    await checkAutomationSettings();
    await checkSchedulerConfig();
  };

  if (isCategoriesLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-32">
            <div className="animate-pulse text-muted-foreground">
              Chargement des données...
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-6">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-medium mb-4">Configuration de l'automatisation</h3>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefreshStatus}
              disabled={savingStatus === 'loading' || checkingConfig}
            >
              {(savingStatus === 'loading' || checkingConfig) ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Rafraîchir
            </Button>
          </div>
          
          <WarningMessage 
            hasNecessaryData={hasKeywordsAndCategories} 
            automationLogs={logs}
          />
          
          <div className="space-y-4">
            <AutomationStatus 
              isEnabled={isEnabled} 
              onEnabledChange={setIsEnabled} 
              hasNecessaryData={hasKeywordsAndCategories}
              isSubmitting={savingStatus === 'loading'}
              lastAutomationCheck={lastAutomationCheck}
              onRefresh={handleRefreshStatus}
            />
            
            <FrequencySelector 
              frequency={frequency} 
              onFrequencyChange={setFrequency} 
              isEnabled={isEnabled}
              isSubmitting={savingStatus === 'loading'}
            />
            
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">API Key pour intégration</h4>
              <div className="flex items-center space-x-2">
                <code className="bg-slate-100 px-2 py-1 rounded text-sm flex-1 overflow-x-auto">
                  {showApiKey ? apiKey : apiKey ? '••••••••••••••••••••••••••••••' : 'Aucune clé générée'}
                </code>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => setShowApiKey(!showApiKey)}
                  disabled={!apiKey}
                >
                  {showApiKey ? 'Cacher' : 'Afficher'}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Utilisez cette clé pour déclencher l'automatisation depuis des systèmes externes
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <AutomationActions 
        onGenerateRandomDraft={generateRandomDraft}
        onForceRunScheduler={forceRunScheduler}
        onSaveSettings={saveAutomationSettings}
        hasNecessaryData={hasKeywordsAndCategories}
        isSubmitting={savingStatus === 'loading' || isRunning}
      />
    </div>
  );
};

export default TomeAutomation;
