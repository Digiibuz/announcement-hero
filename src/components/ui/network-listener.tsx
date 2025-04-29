
import { useEffect } from 'react';
import { toast } from 'sonner';

export const NetworkListener = () => {
  useEffect(() => {
    const handleConnectionChange = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      
      if (detail?.online === false) {
        toast.warning("Connexion internet perdue", {
          description: "Vous êtes hors ligne. Certaines fonctionnalités peuvent être limitées.",
          duration: 5000,
        });
      } else if (detail?.online === true) {
        toast.success("Connexion internet rétablie", {
          duration: 3000,
        });
      }
    };
    
    window.addEventListener('connectionchange', handleConnectionChange);
    
    // Nettoyer l'écouteur
    return () => {
      window.removeEventListener('connectionchange', handleConnectionChange);
    };
  }, []);
  
  return null;
};
