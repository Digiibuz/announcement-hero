
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Code, Wand2, Trash, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface AutomationActionsProps {
  onGenerateRandomDraft: () => Promise<void>;
  onForceRunScheduler: () => Promise<void>;
  onSaveSettings: () => Promise<void>;
  hasNecessaryData: boolean;
  isSubmitting: boolean;
  logs: string[];
  onClearLogs: () => void;
}

const AutomationActions: React.FC<AutomationActionsProps> = ({
  onGenerateRandomDraft,
  onForceRunScheduler,
  onSaveSettings,
  hasNecessaryData,
  isSubmitting,
  logs,
  onClearLogs
}) => {
  // État local pour suivre le dernier corps de requête envoyé
  const [lastRequestParams, setLastRequestParams] = useState<string>("");
  
  // Wrapper pour onForceRunScheduler qui capture les paramètres
  const handleForceRun = async () => {
    // STANDARDISATION: Paramètres standardisés pour les exécutions manuelles 
    // Ces paramètres doivent être identiques à ceux utilisés dans tome-scheduler et useTomeScheduler
    const params = {
      forceGeneration: true,     // TOUJOURS true pour exécution manuelle
      configCheck: false,        // TOUJOURS false pour exécution manuelle
      timestamp: new Date().getTime(),
      debug: true,
      requestId: `manual-${Date.now()}-${Math.random().toString(36).substring(2, 9)}` // ID unique pour traçage
    };
    
    // Afficher les paramètres dans les logs et l'état local
    console.log("Paramètres d'exécution du planificateur:", params);
    setLastRequestParams(JSON.stringify(params, null, 2));
    
    // Exécuter la fonction originale
    await onForceRunScheduler();
  };

  return (
    <div className="flex flex-wrap gap-2 w-full justify-between">
      <div className="flex gap-2 flex-wrap">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                disabled={!hasNecessaryData || isSubmitting}
                onClick={onGenerateRandomDraft}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Wand2 className="h-4 w-4 mr-2" />
                )}
                Générer un brouillon aléatoire
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Génère un brouillon avec des mots-clés et localités sélectionnés aléatoirement</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="outline" 
                size="sm"
                onClick={handleForceRun}
                disabled={!hasNecessaryData || isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Exécuter le planificateur
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Force l'exécution immédiate du planificateur avec paramètres standardisés</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button 
                variant="default" 
                size="sm"
                onClick={onSaveSettings}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Code className="h-4 w-4 mr-2" />
                )}
                Enregistrer les paramètres
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">
              <p>Enregistre la configuration d'automatisation</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        
        {lastRequestParams && (
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="ml-1">
                <Info className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-2">
                <h4 className="font-medium">Derniers paramètres envoyés</h4>
                <pre className="bg-muted p-2 rounded-md text-xs overflow-auto max-h-32">
                  {lastRequestParams}
                </pre>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
      
      {logs.length > 0 && (
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={onClearLogs}
        >
          <Trash className="h-4 w-4 mr-2" />
          Effacer les logs
        </Button>
      )}
    </div>
  );
};

export default AutomationActions;
