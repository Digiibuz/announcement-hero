import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface FacebookPageData {
  id: string;
  name: string;
  access_token: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { accessToken, userId } = await req.json();

    if (!accessToken || !userId) {
      throw new Error('Missing required parameters: accessToken or userId');
    }

    console.log('Processing native Facebook OAuth for user:', userId);

    // Debug token
    const debugUrl = `https://graph.facebook.com/debug_token?input_token=${accessToken}&access_token=${accessToken}`;
    const debugResponse = await fetch(debugUrl);
    const debugData = await debugResponse.json();
    console.log('Token debug info:', debugData);

    // Get user pages
    const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${accessToken}`;
    const pagesResponse = await fetch(pagesUrl);
    
    if (!pagesResponse.ok) {
      const errorText = await pagesResponse.text();
      console.error('Facebook API error:', errorText);
      throw new Error(`Facebook API error: ${errorText}`);
    }

    const pagesData = await pagesResponse.json();
    console.log('Pages data:', pagesData);

    if (!pagesData.data || pagesData.data.length === 0) {
      throw new Error('No Facebook pages found');
    }

    // Initialize Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const connections = [];

    for (const page of pagesData.data) {
      const { data: existingConnection } = await supabase
        .from('facebook_connections')
        .select('*')
        .eq('user_id', userId)
        .eq('page_id', page.id)
        .single();

      if (existingConnection) {
        const { error: updateError } = await supabase
          .from('facebook_connections')
          .update({
            page_access_token: page.access_token,
            access_token: accessToken,
            updated_at: new Date().toISOString()
          })
          .eq('id', existingConnection.id);

        if (updateError) {
          console.error('Error updating connection:', updateError);
        } else {
          connections.push(existingConnection);
        }
      } else {
        const { data: newConnection, error: insertError } = await supabase
          .from('facebook_connections')
          .insert({
            user_id: userId,
            page_id: page.id,
            page_name: page.name,
            access_token: accessToken,
            page_access_token: page.access_token
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error creating connection:', insertError);
        } else {
          connections.push(newConnection);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        connections: connections.length,
        message: `${connections.length} page(s) connectée(s) avec succès`
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in facebook-oauth-native:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
