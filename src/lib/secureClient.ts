
/**
 * Client sécurisé pour interagir avec Supabase via une Edge Function
 * Ce client ne nécessite pas d'exposer l'URL ou la clé anon de Supabase
 */

type FilterOperator = 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'like' | 'ilike' | 'is' | 'in';

type QueryFilter = {
  column: string;
  operator: FilterOperator;
  value: any;
}

type QueryOptions = {
  filters?: QueryFilter[];
  order?: {
    column: string;
    ascending?: boolean;
  };
  limit?: number;
  offset?: number;
  single?: boolean;
}

/**
 * Client sécurisé pour Supabase qui passe par une Edge Function
 */
class SecureSupabaseClient {
  private functionEndpoint: string;

  constructor() {
    // URL de l'Edge Function - ne contient pas d'informations sensibles
    // Remplacez par votre URL de fonction déployée
    this.functionEndpoint = "https://rdwqedmvzicerwotjseg.supabase.co/functions/v1/secure-client";
  }

  /**
   * Effectue un appel à l'Edge Function
   */
  private async callEdgeFunction(method: string, table: string, body?: any, query?: QueryOptions) {
    try {
      const response = await fetch(this.functionEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          method,
          table,
          body,
          query,
          path: `/rest/v1/${table}`
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Erreur HTTP: ${response.status} - ${errorData.error || response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Erreur lors de l'appel à l'Edge Function (${method} ${table}):`, error);
      throw error;
    }
  }

  /**
   * Récupère des données d'une table
   */
  async select(table: string, options?: QueryOptions) {
    console.log(`Appel select sur ${table} avec options:`, options);
    return this.callEdgeFunction('GET', table, null, options);
  }

  /**
   * Insère des données dans une table
   */
  async insert(table: string, data: any) {
    console.log(`Appel insert sur ${table} avec données:`, data);
    return this.callEdgeFunction('POST', table, data);
  }

  /**
   * Met à jour des données dans une table
   */
  async update(table: string, data: any, options: QueryOptions) {
    console.log(`Appel update sur ${table} avec données:`, data, "et options:", options);
    return this.callEdgeFunction('PUT', table, data, options);
  }

  /**
   * Supprime des données d'une table
   */
  async delete(table: string, options: QueryOptions) {
    console.log(`Appel delete sur ${table} avec options:`, options);
    return this.callEdgeFunction('DELETE', table, null, options);
  }
}

// Exporter une instance du client
export const secureClient = new SecureSupabaseClient();

// Exemple d'utilisation:
// 
// // Récupérer tous les éléments d'une table
// const { data, error } = await secureClient.select('my_table');
//
// // Récupérer un élément spécifique
// const { data, error } = await secureClient.select('my_table', {
//   filters: [{ column: 'id', operator: 'eq', value: '123' }],
//   single: true
// });
//
// // Insérer un nouvel élément
// const { data, error } = await secureClient.insert('my_table', { name: 'Exemple', value: 42 });
//
// // Mettre à jour un élément
// const { data, error } = await secureClient.update('my_table', 
//   { name: 'Nouveau nom' }, 
//   { filters: [{ column: 'id', operator: 'eq', value: '123' }] }
// );
//
// // Supprimer un élément
// const { data, error } = await secureClient.delete('my_table', 
//   { filters: [{ column: 'id', operator: 'eq', value: '123' }] }
// );
