
import { useEffect, useState } from 'react';
import { LoadingIndicator } from "./loading-indicator";

interface LoadingFallbackProps {
  message?: string;
}

export const LoadingFallback = ({ message }: LoadingFallbackProps) => {
  const [loadingTime, setLoadingTime] = useState(0);
  const [isSlowNetwork, setIsSlowNetwork] = useState(false);
  
  useEffect(() => {
    // Détecter si sur réseau lent
    if (window.isOnSlowNetwork) {
      setIsSlowNetwork(window.isOnSlowNetwork());
    }
    
    // Minuteur pour mesurer le temps de chargement
    const startTime = Date.now();
    const interval = setInterval(() => {
      setLoadingTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  // Affichage adapté selon le temps de chargement
  const getLoadingMessage = () => {
    if (!message) {
      if (isSlowNetwork) {
        return "Chargement sur connexion lente...";
      }
      
      if (loadingTime > 10) {
        return "Le chargement prend plus de temps que prévu. Merci de patienter...";
      }
      
      if (loadingTime > 5) {
        return "Chargement en cours...";
      }
      
      return "Chargement...";
    }
    
    return message;
  };
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <LoadingIndicator variant="dots" size={42} />
      <p className="mt-4 text-center text-muted-foreground">
        {getLoadingMessage()}
      </p>
      
      {isSlowNetwork && loadingTime > 3 && (
        <p className="max-w-xs text-center text-xs text-muted-foreground mt-2">
          Connexion lente détectée. Optimisation des ressources en cours...
        </p>
      )}
      
      {loadingTime > 15 && (
        <button 
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 text-sm rounded-md bg-muted hover:bg-muted/80"
        >
          Recharger la page
        </button>
      )}
    </div>
  );
};
