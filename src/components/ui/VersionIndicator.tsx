
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { CheckCircle, RefreshCw } from 'lucide-react';
import { useServiceWorker } from '@/hooks/useServiceWorker';

const VersionIndicator = () => {
  const { checkForUpdates, getVersion, getBuildDate } = useServiceWorker();
  
  // Version basée sur la date de build
  const version = import.meta.env.MODE === 'development' ? 'dev' : getVersion();
  const buildDate = getBuildDate();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          onClick={checkForUpdates}
          className="fixed bottom-4 right-4 z-30 md:bottom-6 md:right-6"
        >
          <Badge 
            variant="outline" 
            className="flex items-center gap-1.5 px-2 py-1 text-xs font-medium transition-all duration-200 hover:scale-105 cursor-pointer bg-green-100 text-green-800 border-green-200"
          >
            <CheckCircle className="h-3 w-3 text-green-500" />
            <span>v{version}</span>
            <RefreshCw className="h-3 w-3 opacity-60" />
          </Badge>
        </button>
      </TooltipTrigger>
      <TooltipContent side="left" className="text-sm">
        <div className="text-center">
          <p className="font-semibold">Auto-reload activé</p>
          <p className="text-xs opacity-75">Version {version}</p>
          <p className="text-xs opacity-75">Build: {buildDate}</p>
          <p className="text-xs opacity-60 mt-1">Cliquez pour vérifier</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
};

export default VersionIndicator;
