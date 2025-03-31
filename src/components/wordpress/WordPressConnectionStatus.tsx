
import React, { useEffect, useState } from "react";
import { 
  useWordPressConnection, 
  ConnectionStatus 
} from "@/hooks/wordpress/useWordPressConnection";
import { AlertCircle, CheckCircle2, Loader2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface WordPressConnectionStatusProps {
  configId?: string;
}

const WordPressConnectionStatus = ({ configId }: WordPressConnectionStatusProps) => {
  const { status, isChecking, errorDetails, checkConnection } = useWordPressConnection();
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Vérifier la connexion au chargement du composant
  useEffect(() => {
    if (configId) {
      handleCheckConnection();
    }
  }, [configId]);

  const handleCheckConnection = async () => {
    if (configId) {
      await checkConnection(configId);
      setLastChecked(new Date());
    }
  };

  // Rendu du statut
  const renderStatus = () => {
    switch (status) {
      case "connected":
        return (
          <div className="flex items-center text-green-500 gap-1.5">
            <CheckCircle2 className="h-4 w-4" />
            <span>Connecté</span>
          </div>
        );
      case "disconnected":
        return (
          <div className="flex items-center text-destructive gap-1.5">
            <AlertCircle className="h-4 w-4" />
            <span>Déconnecté</span>
          </div>
        );
      case "checking":
        return (
          <div className="flex items-center text-muted-foreground gap-1.5">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Vérification...</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center text-muted-foreground gap-1.5">
            <span>Statut inconnu</span>
          </div>
        );
    }
  };

  return (
    <div className="flex flex-col space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {renderStatus()}
          {lastChecked && (
            <span className="text-xs text-muted-foreground ml-2">
              Dernière vérification: {lastChecked.toLocaleTimeString()}
            </span>
          )}
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleCheckConnection}
                disabled={isChecking || !configId}
                className="h-8 w-8"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Vérifier la connexion</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
      
      {errorDetails && status === "disconnected" && (
        <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
          <p className="font-medium mb-1">Erreur de connexion:</p>
          <p>{errorDetails}</p>
        </div>
      )}
    </div>
  );
};

export default WordPressConnectionStatus;
