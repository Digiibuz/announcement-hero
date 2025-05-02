
import React from "react";
import { Button } from "@/components/ui/button";
import { RefreshCcw, WifiOff, Loader2 } from "lucide-react";

interface NetworkErrorBannerProps {
  isRetrying: boolean;
  onRetry: () => Promise<void>;
}

export const NetworkErrorBanner: React.FC<NetworkErrorBannerProps> = ({ isRetrying, onRetry }) => {
  return (
    <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md flex items-center justify-between">
      <div className="flex items-center space-x-2">
        <WifiOff className="h-5 w-5 text-red-500" />
        <span className="text-sm text-red-600 dark:text-red-400">Problème de connexion au serveur</span>
      </div>
      <Button 
        variant="outline" 
        size="sm" 
        className="h-8 border-red-200 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-800/50"
        onClick={onRetry}
        disabled={isRetrying}
      >
        {isRetrying ? (
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
        ) : (
          <RefreshCcw className="h-4 w-4 mr-1" />
        )}
        Réessayer
      </Button>
    </div>
  );
};
