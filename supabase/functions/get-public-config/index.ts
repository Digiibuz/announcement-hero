
// Import from URL instead of using relative imports
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.1";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }
  
  try {
    // Get project ID from config
    const projectId = Deno.env.get("SUPABASE_PROJECT_ID") || "";
    
    // Create a public response with basic configuration
    const publicConfig = {
      projectId,
      apiUrl: `https://${projectId}.supabase.co`,
      version: "1.0.0",
      environment: Deno.env.get("ENVIRONMENT") || "production",
      features: {
        auth: true,
        storage: true,
        database: true,
        functions: true
      }
    };
    
    return new Response(
      JSON.stringify(publicConfig),
      { 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        },
        status: 200 
      }
    );
  } catch (error) {
    console.error("Error in get-public-config:", error);
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { 
          ...corsHeaders,
          "Content-Type": "application/json" 
        },
        status: 500 
      }
    );
  }
});
