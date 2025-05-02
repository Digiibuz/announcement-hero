
import React from 'react';
import { RefreshCw } from 'lucide-react';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from "@/components/ui/tooltip";
import { cn } from '@/lib/utils';
import { NetworkIcon } from './network-icon';
import { NetworkTooltipContent } from './network-tooltip-content';
import { useNetworkStatus } from '@/hooks/use-network-status';

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
  const { 
    isOnline, 
    networkInfo, 
    getQualityColor, 
    getNetworkTypeLabel,
    updateNetworkInfo 
  } = useNetworkStatus();

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
              <NetworkIcon isOnline={isOnline} quality={networkInfo.quality} />
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
          <NetworkTooltipContent
            isOnline={isOnline}
            networkType={getNetworkTypeLabel()}
            downlink={networkInfo.downlink}
            rtt={networkInfo.rtt}
            quality={networkInfo.quality}
          />
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
