import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Facebook sends the signed_request parameter
    const url = new URL(req.url);
    const signedRequest = url.searchParams.get('signed_request');
    
    if (!signedRequest) {
      return new Response(
        JSON.stringify({ error: 'Missing signed_request parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the signed request from Facebook
    // Format: encoded_signature.payload
    const parts = signedRequest.split('.');
    if (parts.length !== 2) {
      return new Response(
        JSON.stringify({ error: 'Invalid signed_request format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Decode the payload (base64url)
    const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
    const userId = payload.user_id; // Facebook User ID

    console.log('Demande de suppression de données Facebook pour l\'utilisateur:', userId);

    // Generate a unique confirmation code
    const confirmationCode = crypto.randomUUID();

    // Delete all Facebook connections for this Facebook user ID
    const { error: deleteError } = await supabase
      .from('facebook_connections')
      .delete()
      .eq('page_id', userId); // Assuming page_id stores the Facebook user ID

    if (deleteError) {
      console.error('Erreur lors de la suppression des connexions Facebook:', deleteError);
      throw deleteError;
    }

    console.log('Connexions Facebook supprimées avec succès pour l\'utilisateur:', userId);

    // Return the confirmation code and status URL as required by Meta
    return new Response(
      JSON.stringify({
        url: `${supabaseUrl}/functions/v1/facebook-data-deletion-status?id=${confirmationCode}`,
        confirmation_code: confirmationCode,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Erreur dans facebook-data-deletion:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
