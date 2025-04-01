
import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Zap, RotateCcw, Save, Terminal } from "lucide-react";
import { 
  Dialog,
  DialogContent, 
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from "@/components/ui/dialog";

interface AutomationActionsProps {
  onGenerateRandomDraft: () => Promise<boolean>;
  onForceRunScheduler: () => Promise<boolean>;
  onSaveSettings: () => Promise<boolean>;
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
    <div className="space-y-4">
      <div className="flex justify-between flex-wrap gap-2">
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={onGenerateRandomDraft}
            disabled={!hasNecessaryData || isSubmitting}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
            Générer un brouillon
          </Button>
          <Button 
            variant="outline" 
            onClick={onForceRunScheduler}
            disabled={!hasNecessaryData || isSubmitting}
          >
            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RotateCcw className="h-4 w-4 mr-2" />}
            Exécuter maintenant
          </Button>
        </div>
        <Button 
          onClick={onSaveSettings}
          disabled={isSubmitting}
        >
          {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Sauvegarder
        </Button>
      </div>

      <Dialog>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full text-xs text-muted-foreground">
            <Terminal className="h-3 w-3 mr-1" /> 
            Voir les logs détaillés ({logs.length})
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>Journal d'exécution détaillé</span>
              <Button variant="outline" size="sm" onClick={onClearLogs}>Effacer</Button>
            </DialogTitle>
          </DialogHeader>
          <div className="bg-slate-950 text-slate-300 p-4 rounded font-mono text-xs overflow-y-auto max-h-[60vh]">
            {logs.length === 0 ? (
              <div className="text-slate-500 italic">Aucun log disponible</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">
                  <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span> {log}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AutomationActions;
