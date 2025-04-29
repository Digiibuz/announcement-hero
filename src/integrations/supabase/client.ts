
// Ne pas modifier directement ce fichier - il est généré dynamiquement.
import { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

// La variable supabase sera définie par le contexte SupabaseConfigContext
let supabase: SupabaseClient<Database> | null = null;

// Cette fonction sera utilisée pour définir le client Supabase
export function setSupabaseClient(client: SupabaseClient<Database> | null): void {
  supabase = client;
}

// Fonction pour accéder au client Supabase
export function getSupabase(): SupabaseClient<Database> {
  if (!supabase) {
    throw new Error('Client Supabase non initialisé. Assurez-vous que SupabaseConfigProvider est correctement configuré.');
  }
  return supabase;
}

// Export de la façon traditionnelle pour maintenir la compatibilité avec le code existant
// Proxy pour éviter l'erreur "undefined" lors de l'initialisation
export const supabase = new Proxy({} as SupabaseClient<Database>, {
  get(target, prop) {
    const client = getSupabase();
    // @ts-ignore - nous savons que prop est une clé valide de SupabaseClient
    return client[prop];
  }
});
