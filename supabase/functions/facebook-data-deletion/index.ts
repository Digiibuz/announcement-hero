import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';
import { createHmac } from 'https://deno.land/std@0.168.0/node/crypto.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function base64UrlDecode(input: string): string {
  // Replace URL-safe characters
  const base64 = input.replace(/-/g, '+').replace(/_/g, '/');
  // Decode base64
  return atob(base64);
}

function parseSignedRequest(signedRequest: string, appSecret: string): any {
  const [encodedSig, payload] = signedRequest.split('.', 2);
  
  // Decode the data
  const sig = base64UrlDecode(encodedSig);
  const data = JSON.parse(base64UrlDecode(payload));
  
  // Verify the signature using HMAC-SHA256
  const expectedSig = createHmac('sha256', appSecret)
    .update(payload)
    .digest();
  
  const sigBuffer = new TextEncoder().encode(sig);
  
  // Compare signatures
  if (sigBuffer.length !== expectedSig.length) {
    throw new Error('Invalid signature length');
  }
  
  for (let i = 0; i < sigBuffer.length; i++) {
    if (sigBuffer[i] !== expectedSig[i]) {
      throw new Error('Bad Signed JSON signature!');
    }
  }
  
  return data;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const facebookAppSecret = Deno.env.get('FACEBOOK_APP_SECRET')!;
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Facebook sends POST with signed_request in the body
    const formData = await req.formData();
    const signedRequest = formData.get('signed_request') as string;
    
    if (!signedRequest) {
      console.error('Missing signed_request parameter');
      return new Response(
        JSON.stringify({ error: 'Missing signed_request parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse and verify the signed request from Facebook
    let parsedData;
    try {
      parsedData = parseSignedRequest(signedRequest, facebookAppSecret);
    } catch (error) {
      console.error('Failed to parse signed request:', error);
      return new Response(
        JSON.stringify({ error: 'Invalid signed_request' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const facebookUserId = parsedData.user_id;
    console.log('Demande de suppression de données Facebook pour l\'utilisateur:', facebookUserId);
    console.log('Parsed data:', parsedData);

    // Generate a unique confirmation code
    const confirmationCode = crypto.randomUUID();

    // Delete all Facebook connections for this Facebook user ID
    // Note: We're searching by page_id which might contain the Facebook user ID
    const { data: connections, error: fetchError } = await supabase
      .from('facebook_connections')
      .select('*')
      .eq('page_id', facebookUserId);

    if (fetchError) {
      console.error('Erreur lors de la récupération des connexions:', fetchError);
    }

    if (connections && connections.length > 0) {
      const { error: deleteError } = await supabase
        .from('facebook_connections')
        .delete()
        .eq('page_id', facebookUserId);

      if (deleteError) {
        console.error('Erreur lors de la suppression des connexions Facebook:', deleteError);
        throw deleteError;
      }

      console.log(`${connections.length} connexion(s) Facebook supprimée(s) pour l'utilisateur:`, facebookUserId);
    } else {
      console.log('Aucune connexion Facebook trouvée pour l\'utilisateur:', facebookUserId);
    }

    // Return the confirmation code and status URL as required by Meta
    return new Response(
      JSON.stringify({
        url: `https://app.digiibuz.fr/facebook-data-deletion?id=${confirmationCode}`,
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
