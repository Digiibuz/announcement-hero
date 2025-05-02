
import React, { useEffect, useState } from 'react';
import { LoadingIndicator } from './loading-indicator';
import { useSupabaseConfig } from '@/context/SupabaseConfigContext';
import { cn } from '@/lib/utils';
import { sanitizeErrorMessage } from '@/utils/security';
import { AlertCircle } from 'lucide-react';
import { isValidDate } from '@/utils/dateUtils';

interface StartupScreenProps {
  className?: string;
}

export const StartupScreen: React.FC<StartupScreenProps> = ({ className }) => {
  const { isLoading, error, client } = useSupabaseConfig();
  const [loadingTime, setLoadingTime] = useState(0);
  const [showDebug, setShowDebug] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  
  // Mesurer le temps de chargement
  useEffect(() => {
    if (!isLoading) return;
    
    const startTime = Date.now();
    const interval = setInterval(() => {
      setLoadingTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [isLoading]);
  
  // Si le client est prêt, ne rien afficher (laisser passer au reste de l'app)
  if (!isLoading && client) {
    return null;
  }
  
  const toggleDebug = () => setShowDebug(prev => !prev);
  
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    // Forcer un rechargement complet pour éviter les erreurs de cache
    window.location.reload();
  };
  
  // Extraire le message d'erreur principal
  const getMainErrorMessage = () => {
    if (!error) return null;
    
    const message = error.message || "Erreur d'initialisation inconnue";
    
    // Vérifier si l'erreur est liée à une valeur de temps invalide
    if (message.includes('time') || message.includes('date') || message.includes('Invalid')) {
      return "Problème de synchronisation horaire. Veuillez réessayer.";
    }
    
    // Rendre le message plus convivial
    if (message.includes('network') || message.includes('fetch') || message.includes('réseau')) {
      return "Problème de connexion au serveur. Vérifiez votre connexion internet.";
    }
    
    return message;
  };
  
  return (
    <div className={cn(
      "fixed inset-0 z-50 flex flex-col items-center justify-center bg-background",
      className
    )}>
      <div className="w-full max-w-md p-6 text-center">
        <img 
          src="/lovable-uploads/2c24c6a4-9faf-497a-9be8-27907f99af47.png" 
          alt="DigiiBuz" 
          className="h-16 w-auto mx-auto mb-4"
        />
        
        {error ? (
          <div className="mt-8 rounded-lg border p-6">
            <div className="flex justify-center mb-4">
              <AlertCircle className="h-10 w-10 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold mb-3">Erreur d'initialisation</h2>
            <p className="mb-4 text-muted-foreground">
              {getMainErrorMessage() || sanitizeErrorMessage(error.message) || "Impossible de charger la configuration de l'application."}
            </p>
            <button 
              onClick={handleRetry}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Réessayer
            </button>
            
            <button 
              onClick={toggleDebug}
              className="px-4 py-2 ml-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
            >
              {showDebug ? "Masquer détails" : "Afficher détails"}
            </button>
            
            {showDebug && (
              <div className="mt-4 p-3 bg-muted text-left rounded-md overflow-auto max-h-56 text-xs">
                <p className="mb-2 font-medium">Informations de débogage:</p>
                <p className="mb-1">Tentative de récupération: {retryCount}</p>
                <p className="mb-1">Temps d'attente: {loadingTime}s</p>
                <p className="mb-3">Type d'erreur: {error.name}</p>
                <pre className="whitespace-pre-wrap">{sanitizeErrorMessage(JSON.stringify(error, null, 2))}</pre>
              </div>
            )}
            
            {loadingTime > 10 && (
              <p className="mt-4 text-sm text-muted-foreground">
                Si le problème persiste, veuillez contacter le support technique.
              </p>
            )}
          </div>
        ) : (
          <>
            <LoadingIndicator variant="dots" size={48} className="mt-8" />
            <p className="mt-4 text-lg font-medium">Initialisation de l'application</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Chargement de la configuration sécurisée...
            </p>
            
            {loadingTime > 5 && (
              <p className="mt-4 text-xs text-muted-foreground">
                Le chargement prend plus de temps que prévu. Veuillez patienter...
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
