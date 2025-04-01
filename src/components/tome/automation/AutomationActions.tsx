
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Code, Wand2, Trash } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
                onClick={onForceRunScheduler}
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
              <p>Force l'exécution immédiate du planificateur (paramètres: forceGeneration=true, configCheck=false)</p>
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
