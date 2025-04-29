
import React, { useEffect, useState } from 'react';
import { LoadingIndicator } from './loading-indicator';
import { useSupabaseConfig } from '@/context/SupabaseConfigContext';
import { cn } from '@/lib/utils';

interface StartupScreenProps {
  className?: string;
}

export const StartupScreen: React.FC<StartupScreenProps> = ({ className }) => {
  const { isLoading, error, client } = useSupabaseConfig();
  const [loadingTime, setLoadingTime] = useState(0);
  const [showDebug, setShowDebug] = useState(false);
  
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

  // Fonction pour masquer les informations sensibles dans les messages d'erreur
  const sanitizeErrorMessage = (message: string) => {
    if (!message) return "Erreur inconnue";
    
    // Masquer les URLs de projet Supabase potentielles
    message = message.replace(/https:\/\/[a-z0-9]+\.supabase\.co/gi, "https://[PROJET].supabase.co");
    
    // Masquer les jetons potentiels
    message = message.replace(/eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, "[JETON_MASQUÉ]");
    
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
            <h2 className="text-xl font-semibold mb-3">Erreur d'initialisation</h2>
            <p className="mb-4 text-muted-foreground">
              {sanitizeErrorMessage(error.message) || "Impossible de charger la configuration de l'application."}
            </p>
            <button 
              onClick={() => window.location.reload()}
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
                <pre>{sanitizeErrorMessage(JSON.stringify(error, null, 2))}</pre>
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
