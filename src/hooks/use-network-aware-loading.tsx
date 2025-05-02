
import { useState, useEffect } from 'react';

interface NetworkAwareLoadingProps {
  // Délai minimum avant de montrer un état de chargement (ms)
  minDelay?: number;
  // Délai supplémentaire sur réseau lent (ms)
  slowNetworkExtraDelay?: number;
  // Délai maximum avant de montrer l'UI de chargement (ms)
  maxDelay?: number;
  // Délai avant de montrer l'UI d'avertissement réseau lent (ms)
  slowNetworkWarningDelay?: number;
  // Si true, l'état de chargement persiste jusqu'à isLoading === false
  persistUntilLoaded?: boolean;
}

export function useNetworkAwareLoading(
  isLoading: boolean,
  {
    minDelay = 300,
    slowNetworkExtraDelay = 700,
    maxDelay = 5000,
    slowNetworkWarningDelay = 3000,
    persistUntilLoaded = true,
  }: NetworkAwareLoadingProps = {}
) {
  const [showLoading, setShowLoading] = useState<boolean>(false);
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [loadStartTime, setLoadStartTime] = useState<number | null>(null);
  const [isSlowNetwork, setIsSlowNetwork] = useState<boolean>(
    window.isOnSlowNetwork ? window.isOnSlowNetwork() : false
  );

  useEffect(() => {
    // Vérifier si nous sommes sur un réseau lent
    const checkNetworkSpeed = async () => {
      if (window.isOnSlowNetwork) {
        setIsSlowNetwork(window.isOnSlowNetwork());
      }
    };
    
    checkNetworkSpeed();
    
    const handleNetworkChange = () => {
      checkNetworkSpeed();
    };
    
    window.addEventListener('networkchange', handleNetworkChange);
    return () => {
      window.removeEventListener('networkchange', handleNetworkChange);
    };
  }, []);

  useEffect(() => {
    let loadingTimer: number | null = null;
    let warningTimer: number | null = null;
    
    // Lorsque le chargement démarre
    if (isLoading && !showLoading && !loadStartTime) {
      // Enregistrer le début du chargement
      const startTime = Date.now();
      setLoadStartTime(startTime);
      
      // Calculer le délai avant d'afficher l'indicateur de chargement
      const effectiveDelay = isSlowNetwork 
        ? Math.min(minDelay + slowNetworkExtraDelay, maxDelay)
        : minDelay;
      
      // Programmer l'affichage de l'indicateur de chargement
      loadingTimer = window.setTimeout(() => {
        if (persistUntilLoaded || isLoading) {
          setShowLoading(true);
        }
      }, effectiveDelay);
      
      // Sur réseau lent, programmer l'affichage de l'avertissement après un délai plus long
      if (isSlowNetwork) {
        warningTimer = window.setTimeout(() => {
          if (persistUntilLoaded || isLoading) {
            setShowWarning(true);
          }
        }, slowNetworkWarningDelay);
      }
    }
    
    // Lorsque le chargement se termine
    if (!isLoading && loadStartTime) {
      // Calculer combien de temps a duré le chargement
      const loadDuration = Date.now() - loadStartTime;
      
      // Pour les chargements très courts, masquer l'indicateur immédiatement
      if (loadDuration < minDelay || !showLoading) {
        setShowLoading(false);
        setShowWarning(false);
        setLoadStartTime(null);
      } else {
        // Pour les chargements plus longs, prévoir une transition en douceur
        const minimumVisibleTime = 500; // ms
        const remainingTime = Math.max(0, minimumVisibleTime - (loadDuration % minimumVisibleTime));
        
        setTimeout(() => {
          setShowLoading(false);
          setShowWarning(false);
          setLoadStartTime(null);
        }, remainingTime);
      }
    }
    
    return () => {
      if (loadingTimer !== null) clearTimeout(loadingTimer);
      if (warningTimer !== null) clearTimeout(warningTimer);
    };
  }, [
    isLoading, 
    showLoading, 
    loadStartTime, 
    minDelay, 
    maxDelay, 
    slowNetworkExtraDelay, 
    slowNetworkWarningDelay, 
    isSlowNetwork, 
    persistUntilLoaded
  ]);

  return {
    isSlowNetwork,
    showLoading,
    showSlowNetworkWarning: showWarning,
    loadDuration: loadStartTime ? Date.now() - loadStartTime : 0,
  };
}
