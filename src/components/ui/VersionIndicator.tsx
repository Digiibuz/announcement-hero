
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, RefreshCw } from 'lucide-react';
import { useServiceWorker } from '@/hooks/useServiceWorker';

const VersionIndicator = () => {
  const { checkForUpdates, getVersion, getBuildDate } = useServiceWorker();
  
  // Version basée sur la date de build
  const version = import.meta.env.MODE === 'development' ? 'dev' : getVersion();
  const buildDate = getBuildDate();

  return (
    <button
      onClick={checkForUpdates}
      className="fixed bottom-4 right-4 z-30 md:bottom-6 md:right-6 group"
      title={`Auto-reload activé - Version ${version} - Build: ${buildDate} - Cliquez pour vérifier`}
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
  );
};

export default VersionIndicator;
