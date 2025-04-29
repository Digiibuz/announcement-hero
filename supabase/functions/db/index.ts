
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";
import { sanitizeErrorMessage } from "../utils/sanitizer.ts";

// En-têtes CORS
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};

// Fonction principale qui traite les requêtes
serve(async (req) => {
  // Gestion CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
      status: 204,
    });
  }

  try {
    // Variables d'environnement
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Variables d'environnement manquantes");
      return new Response(
        JSON.stringify({ error: "Configuration du serveur incorrecte" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Vérification du token d'autorisation
    const authHeader = req.headers.get("Authorization");
    
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Token d'autorisation manquant ou invalide" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extraction du token JWT
    const token = authHeader.replace("Bearer ", "");
    
    // Création du client Supabase avec la clé de service
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          "X-Client-Info": "edge-function-db-access",
          "Authorization": `Bearer ${token}`,
        },
      },
    });

    // Vérifier que le token est valide
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Erreur d'authentification (détails masqués)");
      return new Response(
        JSON.stringify({ error: "Token invalide ou expiré" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extraction du nom de la table depuis l'URL
    const url = new URL(req.url);
    const pathSegments = url.pathname.split("/");
    // Le format attendu est /db/table_name
    if (pathSegments.length < 3) {
      return new Response(
        JSON.stringify({ error: "Nom de table non spécifié" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    const tableName = pathSegments[2]; // index 2 car [0] est vide, [1] est 'db'
    
    // Vérification du nom de table (sécurité basique)
    if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
      return new Response(
        JSON.stringify({ error: "Nom de table invalide" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Récupération du corps de la requête pour POST/PATCH
    let requestBody = null;
    if (req.method === "POST" || req.method === "PATCH") {
      try {
        requestBody = await req.json();
      } catch (e) {
        return new Response(
          JSON.stringify({ error: "Format de données invalide" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Exécution de la requête appropriée en fonction de la méthode HTTP
    let result;
    switch (req.method) {
      case "GET":
        result = await supabase.from(tableName).select();
        break;
      case "POST":
        result = await supabase.from(tableName).insert(requestBody);
        break;
      case "PATCH":
        // On suppose que l'ID est dans le corps de la requête
        if (!requestBody || !requestBody.id) {
          return new Response(
            JSON.stringify({ error: "ID requis pour la mise à jour" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        const { id, ...updates } = requestBody;
        result = await supabase.from(tableName).update(updates).eq("id", id);
        break;
      case "DELETE":
        // On suppose que l'ID est passé en paramètre de requête
        const idToDelete = url.searchParams.get("id");
        if (!idToDelete) {
          return new Response(
            JSON.stringify({ error: "ID requis pour la suppression" }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        result = await supabase.from(tableName).delete().eq("id", idToDelete);
        break;
      default:
        return new Response(
          JSON.stringify({ error: "Méthode HTTP non supportée" }),
          {
            status: 405,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
    }

    // Gestion des erreurs PostgreSQL/Supabase
    if (result.error) {
      // Log sécurisé
      console.error("Erreur base de données (détails masqués)");
      
      // Message d'erreur générique
      return new Response(
        JSON.stringify({ error: "Erreur lors de l'opération sur la base de données" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Succès - renvoyer les données
    return new Response(
      JSON.stringify({ data: result.data }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    // Masquer les détails de l'erreur
    const safeErrorMessage = sanitizeErrorMessage(String(err));
    console.error("Erreur générique dans l'Edge Function db:", safeErrorMessage);
    
    return new Response(
      JSON.stringify({ error: "Erreur interne du serveur" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
