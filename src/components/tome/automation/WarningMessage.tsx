
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Terminal, Info, Clock } from "lucide-react";

interface WarningMessageProps {
  hasNecessaryData: boolean;
  logs: string[];
}

const WarningMessage: React.FC<WarningMessageProps> = ({ hasNecessaryData, logs }) => {
  if (hasNecessaryData) {
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-muted-foreground flex items-center gap-1">
          <Terminal className="h-3.5 w-3.5" />
          <span>Journaux récents</span>
        </div>
        <div className="bg-slate-950 text-slate-300 p-3 rounded font-mono text-xs overflow-y-auto max-h-28">
          {logs.length === 0 ? (
            <div className="text-slate-500 flex flex-col gap-1">
              <div className="italic">Aucun journal disponible pour le moment</div>
              <div className="text-slate-400">
                Essayez de cliquer sur "Exécuter maintenant" pour générer des journaux 
                ou vérifiez que l'automatisation est correctement configurée.
              </div>
            </div>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">
                <span className="text-slate-500">[{new Date().toLocaleTimeString()}]</span> {log}
              </div>
            ))
          )}
        </div>
        
        {logs.length === 0 && (
          <Alert variant="default" className="bg-blue-50 text-blue-700 border-blue-200">
            <Info className="h-4 w-4" />
            <AlertTitle>Conseil</AlertTitle>
            <AlertDescription>
              Pour vérifier le fonctionnement de l'automatisation, cliquez sur le bouton "Exécuter maintenant".
              Ensuite, consultez les journaux détaillés en cliquant sur "Voir les logs détaillés".
            </AlertDescription>
          </Alert>
        )}
        
        <Alert variant="default" className="bg-amber-50 text-amber-700 border-amber-200">
          <Clock className="h-4 w-4" />
          <AlertTitle>Information importante</AlertTitle>
          <AlertDescription>
            L'automatisation s'exécute automatiquement toutes les 30 minutes environ pour vérifier si de nouveaux brouillons 
            doivent être générés selon la fréquence que vous avez définie. Une fois activée, il n'est pas nécessaire de cliquer manuellement.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <Alert variant="destructive" className="bg-amber-50 text-amber-700 border-amber-200">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Attention</AlertTitle>
      <AlertDescription>
        Pour l'automatisation, au moins une catégorie avec des mots-clés est requise.
        Veuillez d'abord configurer vos catégories et mots-clés.
      </AlertDescription>
    </Alert>
  );
};

export default WarningMessage;
