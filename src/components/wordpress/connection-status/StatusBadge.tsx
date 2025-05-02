
import React from "react";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ConnectionStatus } from "@/hooks/wordpress/useWordPressConnection";

interface StatusBadgeProps {
  status: ConnectionStatus;
  isChecking: boolean;
  errorDetails: string | null;
  lastChecked: Date | null;
  configDetails: { name?: string, site_url?: string };
}

const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  isChecking,
  errorDetails,
  lastChecked,
  configDetails
}) => {
  const formatTime = (date: Date | null) => {
    if (!date) return "";
    return new Intl.DateTimeFormat('fr-FR', { 
      hour: '2-digit', 
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  const getStatusContent = () => {
    if (isChecking) {
      return (
        <Badge variant="outline" className="bg-slate-100">
          <Loader2 className="h-3 w-3 animate-spin mr-1" />
          <span>Vérification...</span>
        </Badge>
      );
    }

    switch (status) {
      case "connected":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            <span>Connecté</span>
          </Badge>
        );
      case "disconnected":
        return (
          <Badge variant="outline" className="bg-red-100 text-red-800 border-red-200">
            <XCircle className="h-3 w-3 mr-1" />
            <span>Déconnecté</span>
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 border-yellow-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            <span>Statut inconnu</span>
          </Badge>
        );
    }
  };

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div>
            {getStatusContent()}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>État de la connexion WordPress{configDetails.name ? ` (${configDetails.name})` : ''}</p>
          {lastChecked && (
            <p className="text-xs text-muted-foreground mt-1">
              Dernière vérification: {formatTime(lastChecked)}
            </p>
          )}
          {errorDetails && (
            <p className="text-xs text-red-500 mt-1">{errorDetails}</p>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default StatusBadge;
