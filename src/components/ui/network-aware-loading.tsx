
import React from 'react';
import { LoadingIndicator } from './loading-indicator';
import { useNetworkAwareLoading } from '@/hooks/use-network-aware-loading';
import { useSupabaseConfig } from '@/context/SupabaseConfigContext';

export interface NetworkAwareLoadingProps {
  message?: string;
  className?: string;
  children?: React.ReactNode;
  // Making these props optional since they were causing type errors
  isLoading?: boolean;
  minDelay?: number;
  showSlowNetworkWarning?: boolean;
  slowNetworkMessage?: string;
  loadingMessage?: string;
  variant?: string;
  size?: number;
}

export const NetworkAwareLoading: React.FC<NetworkAwareLoadingProps> = ({
  message,
  className,
  children,
}) => {
  const networkState = useNetworkAwareLoading();
  const isOnline = networkState?.isOnline ?? true;
  const loadingTime = networkState?.loadDuration ?? 0;
  const networkQuality = networkState?.isSlowNetwork ? 'slow' : 'normal';
  const { error: configError } = useSupabaseConfig();
  
  // Handle configuration error
  if (configError) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[200px] p-4 text-center ${className || ''}`}>
        <div className="rounded-lg border p-6 max-w-md">
          <h2 className="text-lg font-semibold mb-2">Configuration Error</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {configError.message || "Unable to load required configuration."}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Show children if provided and no errors
  if (children) {
    return <>{children}</>;
  }

  // Display loading message based on network state
  let displayMessage = message;
  if (!displayMessage) {
    if (!isOnline) {
      displayMessage = "Offline mode...";
    } else if (networkQuality === 'slow') {
      displayMessage = "Loading on slow connection...";
    } else if (loadingTime > 10) {
      displayMessage = "Loading is taking longer than expected...";
    } else if (loadingTime > 5) {
      displayMessage = "Loading in progress...";
    } else {
      displayMessage = "Loading...";
    }
  }

  return (
    <div className={`flex flex-col items-center justify-center min-h-[200px] p-4 ${className || ''}`}>
      <LoadingIndicator variant="dots" size={30} />
      <p className="mt-3 text-sm text-muted-foreground">{displayMessage}</p>
    </div>
  );
};
