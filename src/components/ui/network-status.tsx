
import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertTriangle, Check, RefreshCw } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';

interface NetworkStatusProps {
  className?: string;
  showDetailedInfo?: boolean;
  onRetry?: () => void;
}

export function NetworkStatus({ 
  className, 
  showDetailedInfo = false,
  onRetry
}: NetworkStatusProps) {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkInfo, setNetworkInfo] = useState<{
    type: string;
    quality: 'slow' | 'medium' | 'fast';
    downlink: number;
    rtt: number;
  }>({
    type: 'unknown',
    quality: 'medium',
    downlink: 0,
    rtt: 0
  });

  // Fonction pour mettre à jour les informations réseau
  const updateNetworkInfo = async () => {
    if (window.checkNetworkStatus) {
      const status = await window.checkNetworkStatus();
      setNetworkInfo({
        type: status.type,
        quality: window.getNetworkQuality(),
        downlink: status.downlink,
        rtt: status.rtt
      });
    }
  };

  useEffect(() => {
    // État initial
    setIsOnline(navigator.onLine);
    updateNetworkInfo();

    // Gérer les changements d'état de connexion
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    // Écouter les changements de type de réseau
    const handleNetworkChange = () => {
      updateNetworkInfo();
    };

    window.addEventListener('networkchange', handleNetworkChange);
    
    // Mettre à jour périodiquement sur les réseaux lents
    let intervalId: NodeJS.Timeout | null = null;
    
    if (window.isOnSlowNetwork && window.isOnSlowNetwork()) {
      intervalId = setInterval(updateNetworkInfo, 10000); // 10s sur réseau lent
    }
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('networkchange', handleNetworkChange);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);

  // Helper pour obtenir la couleur en fonction de la qualité
  const getQualityColor = () => {
    if (!isOnline) return 'text-destructive';
    
    switch(networkInfo.quality) {
      case 'slow':
        return 'text-amber-500';
      case 'medium':
        return 'text-amber-400';
      case 'fast': 
        return 'text-green-500';
      default:
        return 'text-primary';
    }
  };

  // Icon en fonction de l'état
  const NetworkIcon = () => {
    if (!isOnline) return <WifiOff className="h-4 w-4" />;
    
    if (networkInfo.quality === 'slow') {
      return <AlertTriangle className="h-4 w-4" />;
    } else if (networkInfo.quality === 'medium') {
      return <Wifi className="h-4 w-4" />;
    } else {
      return <Check className="h-4 w-4" />;
    }
  };

  const getNetworkTypeLabel = () => {
    if (!isOnline) return 'Hors ligne';
    
    const type = networkInfo.type;
    if (type === 'wifi') return 'WiFi';
    if (type === 'cellular') {
      // Pour les connexions mobiles, essayer d'être plus précis
      if (networkInfo.quality === 'slow') return 'EDGE/2G';
      if (networkInfo.quality === 'medium') return '3G/H+';
      return '4G/5G';
    }
    
    // Fallback sur effectiveType
    if (type === '2g') return 'EDGE/2G';
    if (type === '3g') return '3G/H+';
    if (type === '4g') return '4G/LTE';
    
    return type;
  };

  const handleRetry = () => {
    updateNetworkInfo();
    if (onRetry) onRetry();
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <div className={cn(
            "flex items-center gap-1.5 text-xs rounded px-2 py-1 cursor-default",
            isOnline ? "bg-background border" : "bg-destructive/10 border-destructive/20 border",
            className
          )}>
            <span className={getQualityColor()}>
              <NetworkIcon />
            </span>
            
            {showDetailedInfo ? (
              <div className="flex flex-col">
                <span className="font-medium">{getNetworkTypeLabel()}</span>
                {isOnline && (
                  <span className="text-xs opacity-80">
                    {networkInfo.downlink > 0 
                      ? `${networkInfo.downlink.toFixed(1)} Mbps` 
                      : ''}
                  </span>
                )}
              </div>
            ) : (
              <span className="font-medium">{getNetworkTypeLabel()}</span>
            )}
            
            {onRetry && (
              <button
                onClick={handleRetry}
                className="ml-1 hover:text-primary transition-colors"
                aria-label="Vérifier la connexion"
              >
                <RefreshCw className="h-3 w-3" />
              </button>
            )}
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-[200px]">
          {isOnline ? (
            <div className="text-xs">
              <p className="font-medium">{getNetworkTypeLabel()}</p>
              {networkInfo.downlink > 0 && (
                <p>Débit: {networkInfo.downlink.toFixed(1)} Mbps</p>
              )}
              {networkInfo.rtt > 0 && (
                <p>Latence: {networkInfo.rtt} ms</p>
              )}
              <p className="mt-1 text-xs opacity-80">
                Qualité de connexion: {
                  networkInfo.quality === 'slow' ? 'Faible' :
                  networkInfo.quality === 'medium' ? 'Moyenne' : 'Bonne'
                }
              </p>
            </div>
          ) : (
            <div className="text-xs">
              <p>Vous êtes actuellement hors ligne.</p>
              <p className="mt-1">Les fonctionnalités sont limitées.</p>
            </div>
          )}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
