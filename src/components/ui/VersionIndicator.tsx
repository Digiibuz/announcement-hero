
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useServiceWorker } from '@/hooks/useServiceWorker';

const VersionIndicator = () => {
  const { updateAvailable, checkForUpdates } = useServiceWorker();
  
  // Version basée sur la date de build
  const version = import.meta.env.MODE === 'development' ? 'dev' : '1.0.0';
  const buildDate = new Date().toLocaleDateString('fr-FR');

  const getStatusIcon = () => {
    if (updateAvailable) {
      return <AlertCircle className="h-3 w-3 text-orange-500" />;
    }
    return <CheckCircle className="h-3 w-3 text-green-500" />;
  };

  const getStatusText = () => {
    if (updateAvailable) {
      return 'Mise à jour disponible';
    }
    return 'À jour';
  };

  const getStatusColor = () => {
    if (updateAvailable) {
      return 'bg-orange-100 text-orange-800 border-orange-200';
    }
    return 'bg-green-100 text-green-800 border-green-200';
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={checkForUpdates}
          className="fixed bottom-4 right-4 z-30 md:bottom-6 md:right-6"
        >
          <Badge 
            variant="outline" 
            className={`flex items-center gap-1.5 px-2 py-1 text-xs font-medium transition-all duration-200 hover:scale-105 cursor-pointer ${getStatusColor()}`}
          >
            {getStatusIcon()}
            <span>v{version}</span>
            <RefreshCw className="h-3 w-3 opacity-60" />
          </Badge>
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" className="text-sm">
        <div className="text-center">
          <p className="font-semibold">{getStatusText()}</p>
          <p className="text-xs opacity-75">Version {version}</p>
          <p className="text-xs opacity-75">Build: {buildDate}</p>
          <p className="text-xs opacity-60 mt-1">Cliquez pour vérifier</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default VersionIndicator;
