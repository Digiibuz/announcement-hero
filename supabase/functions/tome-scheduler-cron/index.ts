
import 'https://deno.land/x/xhr@0.1.0/mod.ts';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get API keys from environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL or key not found');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Tome-scheduler-cron function starting execution");

    // Ce point de terminaison peut être appelé par un vrai CRON (par exemple, avec cron.schedule de Supabase)
    // ou manuellement pour tester.
    // Il appelle l'autre fonction tome-scheduler avec pingOnly = true

    const { data, error } = await supabase.functions.invoke('tome-scheduler', {
      body: { pingOnly: true }
    });

    if (error) {
      throw new Error(`Error calling tome-scheduler: ${error.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cron job executed successfully. Generations created: ${data.generationsCreated || 0}`,
        data
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in tome-scheduler-cron function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An error occurred during cron execution'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
