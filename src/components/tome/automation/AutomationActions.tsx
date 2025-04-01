
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AlertCircle, Download, Loader2, Play, RefreshCw, Trash, Zap } from "lucide-react";
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
import { toast } from "sonner";

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
  const [isActionInProgress, setIsActionInProgress] = useState(false);
  const [currentAction, setCurrentAction] = useState<string | null>(null);
  const [logUpdateTimeoutId, setLogUpdateTimeoutId] = useState<number | null>(null);

  useEffect(() => {
    const hasNewErrors = logs.some(log => 
      log.toLowerCase().includes('erreur') || 
      log.toLowerCase().includes('échec') || 
      log.toLowerCase().includes('error') ||
      log.toLowerCase().includes('shutdown') ||
      log.toLowerCase().includes('failed')
    );
    
    if (hasNewErrors && currentAction && !isLogsOpen) {
      if (logUpdateTimeoutId) {
        clearTimeout(logUpdateTimeoutId);
      }
      
      const timeoutId = window.setTimeout(() => {
        setIsLogsOpen(true);
      }, 500);
      
      setLogUpdateTimeoutId(timeoutId as unknown as number);
    }
    
    return () => {
      if (logUpdateTimeoutId) {
        clearTimeout(logUpdateTimeoutId);
      }
    };
  }, [logs, currentAction, isLogsOpen]);

  const handleGenerateRandomDraft = async () => {
    if (isActionInProgress) return;
    
    setCurrentAction("draft");
    setIsActionInProgress(true);
    
    try {
      await onGenerateRandomDraft();
      toast.success("Brouillon généré avec succès");
    } catch (error) {
      console.error("Erreur lors de la génération du brouillon:", error);
      toast.error("Échec de la génération du brouillon");
      setIsLogsOpen(true); // Automatically open logs on error
    } finally {
      setIsActionInProgress(false);
      setCurrentAction(null);
    }
  };

  const handleForceRunScheduler = async () => {
    if (isActionInProgress) return;
    
    setCurrentAction("scheduler");
    setIsActionInProgress(true);
    
    try {
      await onForceRunScheduler();
      toast.success("Planificateur exécuté avec succès");
    } catch (error) {
      console.error("Erreur lors de l'exécution du planificateur:", error);
      toast.error("Échec de l'exécution du planificateur");
      setIsLogsOpen(true); // Automatically open logs on error
    } finally {
      setTimeout(() => {
        setIsActionInProgress(false);
        setCurrentAction(null);
      }, 2000);
    }
  };

  const handleSaveSettings = async () => {
    if (isActionInProgress) return;
    
    setCurrentAction("save");
    setIsActionInProgress(true);
    
    try {
      await onSaveSettings();
      toast.success("Paramètres sauvegardés avec succès");
    } catch (error) {
      console.error("Erreur lors de la sauvegarde des paramètres:", error);
      toast.error("Échec de la sauvegarde des paramètres");
      setIsLogsOpen(true); // Automatically open logs on error
    } finally {
      setIsActionInProgress(false);
      setCurrentAction(null);
    }
  };

  const handleExportLogs = () => {
    try {
      const logsText = logs.join('\n');
      const blob = new Blob([logsText], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'tome-automation-logs.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Logs exportés avec succès");
    } catch (error) {
      console.error("Erreur lors de l'exportation des logs:", error);
      toast.error("Échec de l'exportation des logs");
    }
  };

  const hasErrors = logs.some(log => 
    log.toLowerCase().includes('erreur') || 
    log.toLowerCase().includes('échec') || 
    log.toLowerCase().includes('error') ||
    log.toLowerCase().includes('shutdown') ||
    log.toLowerCase().includes('failed')
  );

  const recentErrors = logs.slice(-10).filter(log => 
    log.toLowerCase().includes('erreur') || 
    log.toLowerCase().includes('échec') || 
    log.toLowerCase().includes('error') ||
    log.toLowerCase().includes('shutdown') ||
    log.toLowerCase().includes('failed')
  ).length;

  return (
    <div className="flex flex-wrap justify-between items-center w-full gap-2">
      <div className="space-x-2">
        <Button
          variant="outline"
          onClick={handleSaveSettings}
          disabled={isSubmitting || isActionInProgress}
        >
          {(isSubmitting || (isActionInProgress && currentAction === "save")) ? (
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
          onClick={handleGenerateRandomDraft}
          disabled={!hasNecessaryData || isSubmitting || isActionInProgress}
          title={
            !hasNecessaryData
              ? "Les catégories et mots-clés sont requis pour générer un brouillon"
              : "Générer un brouillon avec des sélections aléatoires"
          }
        >
          {(isActionInProgress && currentAction === "draft") ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Play className="mr-2 h-4 w-4" />
          )}
          Tester
        </Button>

        <Button
          variant="outline"
          onClick={handleForceRunScheduler}
          disabled={!hasNecessaryData || isSubmitting || isActionInProgress}
          title={
            !hasNecessaryData
              ? "Les catégories et mots-clés sont requis pour lancer le planificateur"
              : "Forcer l'exécution du planificateur maintenant"
          }
        >
          {(isActionInProgress && currentAction === "scheduler") ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Zap className="mr-2 h-4 w-4" />
          )}
          Exécuter
        </Button>
      </div>

      <Dialog open={isLogsOpen} onOpenChange={setIsLogsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm" 
            className={`relative ${hasErrors ? 'border-red-300 hover:border-red-400 bg-red-50' : ''}`}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${hasErrors ? 'text-red-500' : ''}`} />
            Logs
            {logs.length > 0 && (
              <span className={`absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full ${hasErrors ? 'bg-red-500' : 'bg-blue-500'} text-xs text-white`}>
                {logs.length > 99 ? "99+" : logs.length}
              </span>
            )}
            {recentErrors > 0 && (
              <span className="ml-2 text-xs rounded-full bg-red-100 text-red-700 px-2 py-0.5">
                {recentErrors} erreur(s)
              </span>
            )}
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[700px] max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-orange-500" />
              Logs d'automatisation
              {hasErrors && (
                <span className="ml-2 text-xs rounded-full bg-red-100 text-red-700 px-2 py-0.5">
                  Erreurs détectées
                </span>
              )}
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
                    {logs.map((log, index) => {
                      const isError = log.toLowerCase().includes('erreur') || 
                                      log.toLowerCase().includes('échec') || 
                                      log.toLowerCase().includes('error') ||
                                      log.toLowerCase().includes('shutdown') ||
                                      log.toLowerCase().includes('failed');
                      
                      const isImportant = log.toLowerCase().includes('généré avec succès') ||
                                          log.toLowerCase().includes('success') ||
                                          log.toLowerCase().includes('créée avec succès');
                                          
                      return (
                        <div 
                          key={index} 
                          className={`whitespace-pre-wrap break-words ${
                            isError 
                              ? 'text-red-600 font-semibold bg-red-50 p-1 rounded' 
                              : isImportant 
                                ? 'text-green-600 font-semibold bg-green-50 p-1 rounded'
                                : ''
                          }`}
                        >
                          {log}
                        </div>
                      );
                    })}
                  </div>
                )}
              </ScrollArea>
            </Card>
          </div>
          <DialogFooter className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="ghost" 
                onClick={onClearLogs}
                disabled={logs.length === 0}
                size="sm"
              >
                <Trash className="h-4 w-4 mr-1" /> Effacer
              </Button>
              
              <Button
                variant="ghost" 
                onClick={handleExportLogs}
                disabled={logs.length === 0}
                size="sm"
              >
                <Download className="h-4 w-4 mr-1" /> Exporter
              </Button>
            </div>
            
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
