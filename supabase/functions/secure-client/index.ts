
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

// Configuration pour CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

serve(async (req) => {
  // Gérer les requêtes préliminaires CORS
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    // Récupérer les variables d'environnement Supabase (stockées dans les secrets des Edge Functions)
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    // Vérifier que les variables d'environnement sont définies
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Variables d'environnement Supabase manquantes");
      throw new Error("Configuration serveur incomplète");
    }

    // Créer un client Supabase avec les clés de service (sécurisé car côté serveur uniquement)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    // Analyser la requête entrante
    const { path, method, body, table, query } = await req.json();
    
    console.log(`Requête reçue: ${method} ${path}`);
    console.log(`Table: ${table}, Query:`, query);
    
    // Valider les entrées pour éviter les injections
    if (!table || typeof table !== "string") {
      throw new Error("Paramètre 'table' invalide ou manquant");
    }
    
    let result;
    
    // Traiter la requête en fonction de la méthode HTTP
    switch (method.toUpperCase()) {
      case "GET":
        const selectQuery = supabase.from(table).select();
        
        // Appliquer les filtres et autres options de requête si fournis
        if (query) {
          if (query.filters) {
            query.filters.forEach(filter => {
              if (filter.column && filter.operator && filter.value !== undefined) {
                // @ts-ignore - L'opérateur dynamique est intentionnel ici
                selectQuery.filter(filter.column, filter.operator, filter.value);
              }
            });
          }
          
          if (query.order && query.order.column) {
            selectQuery.order(query.order.column, { 
              ascending: query.order.ascending ?? true 
            });
          }
          
          if (query.limit) {
            selectQuery.limit(query.limit);
          }
          
          if (query.offset) {
            selectQuery.range(query.offset, query.offset + (query.limit || 10) - 1);
          }
          
          if (query.single) {
            result = await selectQuery.maybeSingle();
          } else {
            result = await selectQuery;
          }
        } else {
          result = await selectQuery;
        }
        break;
        
      case "POST":
        if (!body) {
          throw new Error("Corps de requête manquant pour POST");
        }
        result = await supabase.from(table).insert(body);
        break;
        
      case "PUT":
        if (!body || !query || !query.filters) {
          throw new Error("Corps de requête ou filtres manquants pour PUT");
        }
        
        const updateQuery = supabase.from(table).update(body);
        query.filters.forEach(filter => {
          if (filter.column && filter.operator && filter.value !== undefined) {
            // @ts-ignore - L'opérateur dynamique est intentionnel ici
            updateQuery.filter(filter.column, filter.operator, filter.value);
          }
        });
        
        result = await updateQuery;
        break;
        
      case "DELETE":
        if (!query || !query.filters) {
          throw new Error("Filtres manquants pour DELETE");
        }
        
        const deleteQuery = supabase.from(table).delete();
        query.filters.forEach(filter => {
          if (filter.column && filter.operator && filter.value !== undefined) {
            // @ts-ignore - L'opérateur dynamique est intentionnel ici
            deleteQuery.filter(filter.column, filter.operator, filter.value);
          }
        });
        
        result = await deleteQuery;
        break;
        
      default:
        throw new Error(`Méthode non supportée: ${method}`);
    }
    
    // Renvoyer le résultat au client
    return new Response(
      JSON.stringify(result),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        },
        status: 200 
      }
    );
    
  } catch (error) {
    console.error("Erreur dans l'Edge Function:", error);
    
    // Renvoyer une réponse d'erreur
    return new Response(
      JSON.stringify({ 
        error: error.message || "Une erreur s'est produite lors du traitement de la requête" 
      }),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        },
        status: 400
      }
    );
  }
});
