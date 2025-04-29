
import { useQuery, UseQueryOptions, UseQueryResult } from '@tanstack/react-query';
import { useState, useEffect } from 'react';

export interface NetworkAwareQueryOptions<TData, TError> extends UseQueryOptions<TData, TError> {
  // Si true, utilisera une version mise en cache même si elle est périmée sur un réseau lent
  preferCacheOnSlowNetwork?: boolean;
  // Si true, réduira la fréquence de refetch sur les réseaux lents
  adaptRefetchToNetwork?: boolean;
  // Fonction pour obtenir des données réduites sur réseau lent
  getLightweightData?: () => Promise<Partial<TData>>;
  // Délai (ms) avant de montrer l'indicateur de chargement sur réseau lent
  slowNetworkLoadingDelay?: number;
}

export function useNetworkAwareQuery<TData, TError>(
  options: NetworkAwareQueryOptions<TData, TError>
): UseQueryResult<TData, TError> & { isSlowNetwork: boolean; isOffline: boolean } {
  const [isSlowNetwork, setIsSlowNetwork] = useState<boolean>(false);
  const [isOffline, setIsOffline] = useState<boolean>(!navigator.onLine);
  const [showSlowNetworkUI, setShowSlowNetworkUI] = useState<boolean>(false);

  // Adapter les options de requête en fonction de la qualité réseau
  const getAdaptedOptions = (): UseQueryOptions<TData, TError> => {
    const adaptedOptions = { ...options };
    
    // Sur réseau lent, préférer le cache si l'option est activée
    if (isSlowNetwork && options.preferCacheOnSlowNetwork) {
      adaptedOptions.staleTime = Infinity; // Considérer les données comme toujours fraîches
    }
    
    // Adapter la fréquence de refetch au réseau
    if (options.adaptRefetchToNetwork) {
      if (isSlowNetwork) {
        adaptedOptions.refetchInterval = false; // Désactiver le refetch automatique
        adaptedOptions.refetchOnWindowFocus = false; // Désactiver le refetch lors du focus
      }
    }
    
    // Délai pour montrer le chargement sur réseau lent
    if (isSlowNetwork && options.slowNetworkLoadingDelay) {
      adaptedOptions.refetchOnWindowFocus = false; 
    }
    
    return adaptedOptions;
  };

  // Surveillance de l'état du réseau
  useEffect(() => {
    // Fonction de mise à jour de l'état du réseau
    const updateNetworkStatus = async () => {
      // Mettre à jour l'état de connexion
      setIsOffline(!navigator.onLine);
      
      // Mettre à jour la qualité du réseau si la fonction est disponible
      if (window.isOnSlowNetwork) {
        const slowNet = window.isOnSlowNetwork();
        setIsSlowNetwork(slowNet);
        
        if (slowNet && !showSlowNetworkUI) {
          // Attendre un peu avant de montrer l'UI réseau lent pour éviter des flashs
          const timer = setTimeout(() => {
            setShowSlowNetworkUI(true);
          }, options.slowNetworkLoadingDelay || 1000);
          
          return () => clearTimeout(timer);
        } else if (!slowNet && showSlowNetworkUI) {
          setShowSlowNetworkUI(false);
        }
      }
    };
    
    // Initialiser l'état
    updateNetworkStatus();
    
    // Surveiller les changements d'état réseau
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    window.addEventListener('networkchange', updateNetworkStatus);
    
    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
      window.removeEventListener('networkchange', updateNetworkStatus);
    };
  }, [options.slowNetworkLoadingDelay, showSlowNetworkUI]);

  // Effectuer la requête avec les options adaptées
  const query = useQuery<TData, TError>(getAdaptedOptions());

  // Si nous avons une fonction pour les données légères et sommes sur réseau lent
  useEffect(() => {
    // Si nous sommes sur un réseau lent, la fonction getData est disponible,
    // on a des données en cache mais elles sont périmées, et nous voulons rafraîchir
    if (
      isSlowNetwork && 
      options.getLightweightData && 
      query.isStale && 
      !query.isFetching
    ) {
      // Tenter d'obtenir la version légère des données
      const fetchLightData = async () => {
        try {
          const lightData = await options.getLightweightData!();
          console.log("Données légères récupérées pour réseau lent:", lightData);
          
          // Mettre à jour les données localement si pertinent
          if (lightData && Object.keys(lightData).length > 0) {
            // Note: ceci utilisera setQueryData en interne
            query.refetch();
          }
        } catch (error) {
          console.error("Erreur lors de la récupération des données légères:", error);
        }
      };
      
      fetchLightData();
    }
  }, [isSlowNetwork, query.isStale, options.getLightweightData, query]);

  // Ajouter des métadonnées réseau au résultat de la requête
  return {
    ...query,
    isSlowNetwork,
    isOffline,
  };
}
