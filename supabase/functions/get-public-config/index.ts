
import { serve } from "std/server.ts";
import { corsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  console.log("GET-PUBLIC-CONFIG: Request received");
  
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders, status: 204 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("GET-PUBLIC-CONFIG: Missing environment variables");
      throw new Error("Configuration Supabase manquante");
    }

    // Return the configuration as JSON
    const config = {
      supabaseUrl,
      supabaseAnonKey
    };
    
    console.log("GET-PUBLIC-CONFIG: Returning config successfully");
    
    return new Response(
      JSON.stringify(config),
      { 
        headers: { 
          ...corsHeaders, 
          "Content-Type": "application/json" 
        }, 
        status: 200 
      }
    );
  } catch (error) {
    console.error("GET-PUBLIC-CONFIG: Error:", error);
    
    return new Response(
      JSON.stringify({ 
        error: "Failed to retrieve configuration" 
      }),
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
