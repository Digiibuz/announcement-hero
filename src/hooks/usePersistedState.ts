
import { useState, useEffect } from 'react';

/**
 * Hook personnalisé pour persister automatiquement un état React dans localStorage
 * 
 * @param key Clé unique pour stocker l'état dans localStorage
 * @param initialValue Valeur initiale ou fonction pour calculer la valeur initiale
 * @returns Un tuple [state, setState] similaire à useState
 */
export function usePersistedState<T>(key: string, initialValue: T | (() => T)) {
  // Initialiser l'état en vérifiant d'abord localStorage
  const [state, setState] = useState<T>(() => {
    try {
      // Tenter de récupérer une valeur existante depuis localStorage
      const storedValue = localStorage.getItem(key);
      
      // Si une valeur existe, la parser et l'utiliser comme état initial
      if (storedValue !== null) {
        return JSON.parse(storedValue);
      }
      
      // Sinon utiliser la valeur initiale (ou appeler la fonction si c'en est une)
      return initialValue instanceof Function ? initialValue() : initialValue;
    } catch (error) {
      // En cas d'erreur (par ex. JSON invalide), utiliser la valeur initiale
      localStorage.setItem('usePersistedState_error', error instanceof Error ? error.message : 'Erreur inconnue');
      return initialValue instanceof Function ? initialValue() : initialValue;
    }
  });

  // Mettre à jour localStorage à chaque changement d'état
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      // En cas d'erreur (par ex. quota dépassé), enregistrer silencieusement
      localStorage.setItem('usePersistedState_error_update', 
        error instanceof Error ? error.message : 'Erreur inconnue lors du stockage');
    }
  }, [key, state]);

  return [state, setState] as const;
}
