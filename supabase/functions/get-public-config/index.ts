
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    // Nous renvoyons uniquement les valeurs publiques qui sont sûres à exposer
    // Ces valeurs sont définies comme des variables d'environnement dans la fonction Edge
    const config = {
      supabaseUrl: Deno.env.get("SUPABASE_URL"),
      supabaseAnonKey: Deno.env.get("SUPABASE_ANON_KEY"),
      projectId: Deno.env.get("PROJECT_ID"),
    };
    
    return new Response(
      JSON.stringify(config),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error) {
    console.error("Error getting public config:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "An unexpected error occurred" }),
      { 
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500
      }
    );
  }
});
