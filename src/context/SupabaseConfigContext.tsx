
import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { SupabaseClient } from '@supabase/supabase-js';
import { initializeSupabase, ConfigState } from '../services/supabaseConfig';
import type { Database } from '../integrations/supabase/types';

// État initial de la configuration
const initialConfigState: ConfigState = {
  isLoading: true,
  error: null,
  client: null
};

// Création du contexte avec l'état initial
const SupabaseConfigContext = createContext<ConfigState>(initialConfigState);

// Props du provider
interface SupabaseConfigProviderProps {
  children: ReactNode;
}

/**
 * Provider qui initialise et fournit le client Supabase à l'application
 */
export function SupabaseConfigProvider({ children }: SupabaseConfigProviderProps) {
  const [configState, setConfigState] = useState<ConfigState>(initialConfigState);

  // Effet pour initialiser le client Supabase au chargement de l'application
  useEffect(() => {
    async function loadConfig() {
      try {
        // Initialiser Supabase et mettre à jour l'état
        const state = await initializeSupabase();
        setConfigState(state);
      } catch (error) {
        console.error("Erreur lors du chargement de la configuration:", error);
        setConfigState({
          isLoading: false,
          error: error instanceof Error ? error : new Error('Erreur inconnue'),
          client: null
        });
      }
    }

    loadConfig();
  }, []);

  return (
    <SupabaseConfigContext.Provider value={configState}>
      {children}
    </SupabaseConfigContext.Provider>
  );
}

/**
 * Hook pour accéder au client Supabase depuis n'importe quel composant
 */
export function useSupabaseConfig(): ConfigState {
  const context = useContext(SupabaseConfigContext);
  
  if (context === undefined) {
    throw new Error('useSupabaseConfig doit être utilisé à l\'intérieur de SupabaseConfigProvider');
  }
  
  return context;
}
