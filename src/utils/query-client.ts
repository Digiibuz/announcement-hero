
import { QueryClient } from "@tanstack/react-query";

// Configuration de React Query avec optimisations réseau
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Paramètres généraux
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 minutes
      
      // Stratégie de retry adaptative au réseau
      retry: (failureCount, error: any) => {
        // Limiter le nombre de retries sur réseau lent
        const isSlowNetwork = window.isOnSlowNetwork ? window.isOnSlowNetwork() : false;
        const maxRetries = isSlowNetwork ? 2 : 3;
        
        // Ne pas réessayer pour certaines erreurs comme 404, 401, etc.
        if (error?.response?.status === 404 || error?.response?.status === 401) {
          return false;
        }
        
        return failureCount < maxRetries;
      },
      
      // Temps entre les retries adapté au réseau
      retryDelay: (attemptIndex) => {
        const isSlowNetwork = window.isOnSlowNetwork ? window.isOnSlowNetwork() : false;
        const baseDelay = isSlowNetwork ? 2000 : 1000;
        return Math.min(baseDelay * (2 ** attemptIndex), 30000);
      },
    },
  },
});
