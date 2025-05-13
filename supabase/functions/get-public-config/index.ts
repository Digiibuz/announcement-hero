
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Content-Type": "application/json"
};

// Configuration Supabase hardcodée pour cet Edge Function uniquement
// Ces valeurs sont déjà publiques et sont destinées à être utilisées côté client
const supabaseConfig = {
  supabaseUrl: "https://rdwqedmvzicerwotjseg.supabase.co",
  supabaseAnonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJkd3FlZG12emljZXJ3b3Rqc2VnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMwNzg4MzEsImV4cCI6MjA1ODY1NDgzMX0.Ohle_vVvdoCvsObP9A_AdyM52XdzisIvHvH1D1a88zk",
  projectId: "rdwqedmvzicerwotjseg"
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }
  
  if (req.method !== "GET") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }), 
      { headers: corsHeaders, status: 405 }
    );
  }
  
  try {
    // Au lieu d'utiliser Deno.env.get(), on retourne directement les valeurs hardcodées
    // Cette approche est acceptable car ces valeurs sont déjà publiques (clé anon)
    return new Response(
      JSON.stringify(supabaseConfig),
      { headers: corsHeaders, status: 200 }
    );
  } catch (error) {
    console.error("Error getting public config:", error);
    
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred", details: error.message }),
      { headers: corsHeaders, status: 500 }
    );
  }
});
