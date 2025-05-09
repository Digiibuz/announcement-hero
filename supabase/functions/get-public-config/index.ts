
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Récupère uniquement les informations publiques qui peuvent être partagées avec le client
    const config = {
      supabaseUrl: Deno.env.get('SUPABASE_URL'),
      supabaseAnonKey: Deno.env.get('SUPABASE_ANON_KEY'),
    }
    
    return new Response(
      JSON.stringify(config),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        },
        status: 200
      }
    )
  } catch (error) {
    console.error('Erreur dans get-public-config:', error)
    
    return new Response(
      JSON.stringify({ error: error.message || 'Une erreur inattendue s\'est produite' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
