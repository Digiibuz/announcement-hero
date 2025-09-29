import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    const { 
      announcement_id, 
      status, 
      platform,
      error_message,
      facebook_post_id,
      facebook_url 
    } = await req.json()

    console.log('Zapier callback received:', { 
      announcement_id, 
      status, 
      platform, 
      error_message 
    })

    // Mettre à jour le statut de publication dans la base de données
    const updateData: any = {
      [`${platform}_publication_status`]: status,
      [`${platform}_published_at`]: status === 'success' ? new Date().toISOString() : null
    }

    if (error_message) {
      updateData[`${platform}_error_message`] = error_message
    }

    if (facebook_post_id) {
      updateData.facebook_post_id = facebook_post_id
    }

    if (facebook_url) {
      updateData.facebook_url = facebook_url
    }

    const { error } = await supabaseClient
      .from('announcements')
      .update(updateData)
      .eq('id', announcement_id)

    if (error) {
      console.error('Error updating announcement:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to update announcement' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `${platform} publication status updated` 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in zapier-callback:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})