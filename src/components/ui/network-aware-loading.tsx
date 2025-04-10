
import React from 'react';
import { useNetworkAwareLoading } from '@/hooks/use-network-aware-loading';
import { LoadingIndicator } from './loading-indicator';
import { Alert, AlertDescription } from './alert';
import { AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface NetworkAwareLoadingProps {
  isLoading: boolean;
  className?: string;
  variant?: 'dots' | 'spinner' | 'pulse';
  size?: number;
  minDelay?: number;
  showSlowNetworkWarning?: boolean;
  slowNetworkMessage?: string;
  loadingMessage?: string | React.ReactNode;
  children?: React.ReactNode;
}

export function NetworkAwareLoading({
  isLoading,
  className,
  variant = 'dots',
  size = 32,
  minDelay = 300,
  showSlowNetworkWarning = true,
  slowNetworkMessage = "Connexion lente détectée. Chargement des données optimisé en cours...",
  loadingMessage,
  children
}: NetworkAwareLoadingProps) {
  const { 
    showLoading, 
    showSlowNetworkWarning, 
    isSlowNetwork,
    loadDuration 
  } = useNetworkAwareLoading(isLoading, {
    minDelay,
    slowNetworkWarningDelay: 3000
  });

  // Si rien à afficher, retourner les enfants ou null
  if (!showLoading) {
    return <>{children}</> || null;
  }

  // Affichage du message de chargement adapté au temps écoulé
  const getMessage = () => {
    if (loadingMessage) return loadingMessage;
    
    if (loadDuration > 8000) {
      return "Le chargement prend plus de temps que prévu. Merci de patienter...";
    }
    
    if (loadDuration > 3000) {
      return isSlowNetwork 
        ? "Chargement des données sur connexion lente..." 
        : "Chargement des données...";
    }
    
    return "Chargement...";
  };

  return (
    <div className={cn("flex flex-col items-center justify-center p-4", className)}>
      <LoadingIndicator 
        variant={variant} 
        size={size} 
      />
      
      <p className="mt-4 text-center text-muted-foreground">
        {getMessage()}
      </p>
      
      {showSlowNetworkWarning && isSlowNetwork && (
        <Alert className="mt-6 bg-amber-50 border-amber-200 dark:bg-amber-900/20 dark:border-amber-800/30 max-w-md">
          <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          <AlertDescription className="text-amber-800 dark:text-amber-300">
            {slowNetworkMessage}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
