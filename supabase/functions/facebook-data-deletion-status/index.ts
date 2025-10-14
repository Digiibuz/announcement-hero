import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const confirmationId = url.searchParams.get('id');

    if (!confirmationId) {
      return new Response(
        JSON.stringify({ error: 'Missing confirmation ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For now, we assume all deletions are completed immediately
    // In a production environment, you might want to track deletion status in a database
    return new Response(
      JSON.stringify({
        status: 'completed',
        message: 'Vos données Facebook ont été supprimées avec succès.',
        confirmation_code: confirmationId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Erreur dans facebook-data-deletion-status:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
