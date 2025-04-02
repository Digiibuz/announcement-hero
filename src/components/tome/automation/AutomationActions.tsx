
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2, Play, RefreshCw, Trash, Zap } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  const [isLogsOpen, setIsLogsOpen] = useState(false);

  return (
    <div className="flex flex-wrap justify-between items-center w-full gap-2">
      <div className="space-x-2">
        <Button
          variant="outline"
          onClick={onSaveSettings}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Sauvegarde...
            </>
          ) : (
            "Sauvegarder"
          )}
        </Button>

        <Button
          variant="outline"
          onClick={onGenerateRandomDraft}
          disabled={!hasNecessaryData || isSubmitting}
          title={
            !hasNecessaryData
              ? "Les catégories et mots-clés sont requis pour générer un brouillon"
              : "Générer un brouillon avec des sélections aléatoires"
          }
        >
          <Play className="mr-2 h-4 w-4" />
          Tester
        </Button>

        <Button
          variant="outline"
          onClick={onForceRunScheduler}
          disabled={!hasNecessaryData || isSubmitting}
          title={
            !hasNecessaryData
              ? "Les catégories et mots-clés sont requis pour lancer le planificateur"
              : "Forcer l'exécution du planificateur maintenant"
          }
        >
          <Zap className="mr-2 h-4 w-4" />
          Exécuter
        </Button>
      </div>

      <Dialog open={isLogsOpen} onOpenChange={setIsLogsOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="relative">
            <RefreshCw className="mr-2 h-4 w-4" />
            Logs
            {logs.length > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-xs text-white">
                {logs.length > 99 ? "99+" : logs.length}
              </span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-orange-500" />
              Logs d'automatisation
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <Card className="relative">
              <ScrollArea className="h-[400px] rounded-md border p-4">
                {logs.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    Aucun log disponible. Lancez une génération pour voir les résultats.
                  </div>
                ) : (
                  <div className="space-y-1 font-mono text-sm">
                    {logs.map((log, index) => (
                      <div key={index} className="whitespace-pre-wrap break-words">
                        {log}
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </Card>
          </div>
          <DialogFooter className="flex items-center justify-between">
            <Button
              variant="ghost" 
              onClick={onClearLogs}
              disabled={logs.length === 0}
              size="sm"
            >
              <Trash className="h-4 w-4 mr-1" /> Effacer
            </Button>
            
            <DialogClose asChild>
              <Button type="button">Fermer</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AutomationActions;
