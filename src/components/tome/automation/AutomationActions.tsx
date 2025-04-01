
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Clock, Clock3Icon, RefreshCw, Trash2, Wrench } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from "@/components/ui/dialog";
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
  const [logsOpen, setLogsOpen] = useState(false);
  
  // Filter logs to identify errors
  const errorLogs = logs.filter(log => 
    log.toLowerCase().includes('erreur') || 
    log.toLowerCase().includes('échec') ||
    log.toLowerCase().includes('error') ||
    log.toLowerCase().includes('failed')
  );
  
  // Count recent errors (last 5 logs)
  const recentErrorCount = logs.slice(-5).filter(log => 
    log.toLowerCase().includes('erreur') || 
    log.toLowerCase().includes('échec') ||
    log.toLowerCase().includes('error') ||
    log.toLowerCase().includes('failed')
  ).length;

  return (
    <div className="flex flex-col sm:flex-row gap-2 w-full justify-end">
      <div className="flex flex-wrap gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onSaveSettings}
          disabled={isSubmitting}
          className="flex-1 sm:flex-none"
        >
          {isSubmitting ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Clock3Icon className="h-4 w-4 mr-2" />
          )}
          Sauvegarder
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onGenerateRandomDraft}
          disabled={!hasNecessaryData || isSubmitting}
          className="flex-1 sm:flex-none"
        >
          {isSubmitting ? (
            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Clock className="h-4 w-4 mr-2" />
          )}
          Générer maintenant
        </Button>
        
        <div className="relative">
          <Button
            variant="default"
            size="sm"
            onClick={onForceRunScheduler}
            disabled={isSubmitting}
            className="flex-1 sm:flex-none"
          >
            {isSubmitting ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Wrench className="h-4 w-4 mr-2" />
            )}
            Exécuter planificateur
          </Button>
          
          {recentErrorCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-[10px] font-medium text-white">
              {recentErrorCount}
            </span>
          )}
        </div>
      </div>
      
      <Dialog open={logsOpen} onOpenChange={setLogsOpen}>
        <DialogTrigger asChild>
          <Button 
            variant="outline" 
            size="sm"
            className={errorLogs.length > 0 ? "bg-red-50 text-red-600 hover:bg-red-100 border-red-200" : ""}
          >
            {errorLogs.length > 0 ? (
              <AlertTriangle className="h-4 w-4 mr-2 text-red-500" />
            ) : (
              <Clock className="h-4 w-4 mr-2" />
            )}
            Logs ({logs.length})
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex justify-between items-center">
              <span>Logs du planificateur</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onClearLogs}
                className="h-8"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Effacer
              </Button>
            </DialogTitle>
            <DialogDescription>
              Dernières opérations d'automatisation
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="h-[60vh] border rounded-md p-4">
            {logs.length === 0 ? (
              <div className="text-center text-muted-foreground p-4">
                Aucun log disponible
              </div>
            ) : (
              <div className="space-y-1 font-mono text-sm">
                {logs.map((log, i) => (
                  <div 
                    key={i} 
                    className={`py-1 border-b border-dashed border-gray-100 ${
                      log.toLowerCase().includes('erreur') || 
                      log.toLowerCase().includes('échec') || 
                      log.toLowerCase().includes('error') || 
                      log.toLowerCase().includes('failed') 
                        ? 'text-red-600 bg-red-50 px-2 rounded' 
                        : log.toLowerCase().includes('success') || log.toLowerCase().includes('succès')
                          ? 'text-green-600 bg-green-50 px-2 rounded'
                          : ''
                    }`}
                  >
                    {log}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
          
          <DialogClose asChild>
            <Button variant="outline">Fermer</Button>
          </DialogClose>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AutomationActions;
