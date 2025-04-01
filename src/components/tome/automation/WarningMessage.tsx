
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Terminal } from "lucide-react";

interface WarningMessageProps {
  hasNecessaryData: boolean;
  logs: string[];
}

const WarningMessage: React.FC<WarningMessageProps> = ({ hasNecessaryData, logs }) => {
  if (hasNecessaryData) {
    return (
      <div className="space-y-2">
        <div className="text-sm font-medium text-muted-foreground">Journaux récents</div>
        <div className="bg-slate-950 text-slate-300 p-3 rounded font-mono text-xs overflow-y-auto max-h-20">
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
