
import React from "react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Info } from "lucide-react";

interface WarningMessageProps {
  hasNecessaryData: boolean;
  logs?: string[];
}

const WarningMessage: React.FC<WarningMessageProps> = ({ 
  hasNecessaryData,
  logs = []
}) => {
  if (hasNecessaryData && logs.length === 0) return null;
  
  return (
    <div className="space-y-4">
      {!hasNecessaryData && (
        <Alert variant="destructive" className="bg-amber-100 text-amber-800 border-amber-200">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Configuration requise</AlertTitle>
          <AlertDescription>
            Vous devez ajouter des catégories et des mots-clés avant de pouvoir utiliser l'automatisation.
          </AlertDescription>
        </Alert>
      )}
      
      {logs.length > 0 && (
        <div className="bg-slate-100 p-3 rounded-md text-sm border border-slate-200 max-h-48 overflow-y-auto">
          <div className="flex items-center gap-2 mb-2 text-slate-700">
            <Info className="h-4 w-4" />
            <span className="font-medium">Journal d'activité</span>
          </div>
          {logs.map((log, index) => (
            <div key={index} className="text-xs py-1 border-t border-slate-200 first:border-t-0">
              <span className="text-slate-500">{new Date().toLocaleTimeString()}: </span>
              <span className="text-slate-700">{log}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default WarningMessage;
