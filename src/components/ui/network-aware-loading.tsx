
import React from 'react';
import { LoadingIndicator } from './loading-indicator';
import { useNetworkAwareLoading } from '@/hooks/use-network-aware-loading';
import { useSupabaseConfig } from '@/context/SupabaseConfigContext';

interface NetworkAwareLoadingProps {
  message?: string;
  className?: string;
  children?: React.ReactNode;
}

export const NetworkAwareLoading: React.FC<NetworkAwareLoadingProps> = ({
  message,
  className,
  children,
}) => {
  const { isOnline, loadingTime, networkQuality } = useNetworkAwareLoading();
  const { error: configError } = useSupabaseConfig();
  
  // En cas d'erreur de configuration Supabase
  if (configError) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[200px] p-4 text-center ${className || ''}`}>
        <div className="rounded-lg border p-6 max-w-md">
          <h2 className="text-lg font-semibold mb-2">Erreur de configuration</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            {configError.message || "Impossible de charger la configuration nécessaire."}
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

  // Si des enfants sont fournis et qu'il n'y a pas d'erreur, les afficher
  if (children) {
    return <>{children}</>;
  }

  // Afficher le message de chargement en fonction de l'état du réseau
  let displayMessage = message;
  if (!displayMessage) {
    if (!isOnline) {
      displayMessage = "Mode hors ligne...";
    } else if (networkQuality === 'slow') {
      displayMessage = "Chargement sur connexion lente...";
    } else if (loadingTime > 10) {
      displayMessage = "Le chargement prend plus de temps que prévu...";
    } else if (loadingTime > 5) {
      displayMessage = "Chargement en cours...";
    } else {
      displayMessage = "Chargement...";
    }
  }

  return (
    <div className={`flex flex-col items-center justify-center min-h-[200px] p-4 ${className || ''}`}>
      <LoadingIndicator variant="dots" size={30} />
      <p className="mt-3 text-sm text-muted-foreground">{displayMessage}</p>
    </div>
  );
};
