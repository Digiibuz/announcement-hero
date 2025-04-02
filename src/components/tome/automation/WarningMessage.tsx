
import React from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

interface WarningMessageProps {
  hasNecessaryData: boolean;
  logs: string[];
}

const WarningMessage: React.FC<WarningMessageProps> = ({ hasNecessaryData }) => {
  if (!hasNecessaryData) {
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
  }
  
  return null;
};

export default WarningMessage;
