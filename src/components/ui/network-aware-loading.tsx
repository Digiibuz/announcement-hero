
import React from 'react';
import { LoadingIndicator } from './loading-indicator';
import { useNetworkAwareLoading } from '@/hooks/use-network-aware-loading';
import { useSupabaseConfig } from '@/context/SupabaseConfigContext';

export interface NetworkAwareLoadingProps {
  message?: string;
  className?: string;
  children?: React.ReactNode;
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
  isLoading,
  minDelay,
  showSlowNetworkWarning,
  slowNetworkMessage,
  loadingMessage,
  variant = "dots",
  size = 30
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
          <h2 className="text-lg font-semibold mb-2">Erreur de configuration</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {configError.message || "Impossible de charger la configuration requise."}
          </p>
          <button 
            onClick={() => window.location.reload()}
            className="px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
          >
            Réessayer
          </button>
        </div>
      </div>
    );
  }

  // Show children if provided and no errors
  if (children) {
    return <>{children}</>;
  }

  // Use provided loading state if available
  const showLoading = isLoading !== undefined ? isLoading : true;
  
  if (!showLoading) {
    return null;
  }

  // Display loading message based on network state
  let displayMessage = message;
  if (!displayMessage) {
    if (!isOnline) {
      displayMessage = "Mode hors connexion...";
    } else if (networkQuality === 'slow') {
      displayMessage = slowNetworkMessage || "Chargement sur connexion lente...";
    } else if (loadingTime > 10) {
      displayMessage = "Le chargement prend plus de temps que prévu...";
    } else if (loadingTime > 5) {
      displayMessage = "Chargement en cours...";
    } else {
      displayMessage = loadingMessage || "Chargement...";
    }
  }

  return (
    <div className={`flex flex-col items-center justify-center min-h-[200px] p-4 ${className || ''}`}>
      <LoadingIndicator variant={variant as any} size={size} />
      <p className="mt-3 text-sm text-muted-foreground">{displayMessage}</p>
    </div>
  );
};
