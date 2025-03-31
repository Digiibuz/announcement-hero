
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import 'https://deno.land/x/xhr@0.1.0/mod.ts';

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
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL or key not found');
    }

    if (!openaiApiKey) {
      throw new Error('OpenAI API key not found');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get request parameters
    const { generationId } = await req.json();

    if (!generationId) {
      throw new Error('Generation ID is required');
    }

    // Get generation data
    const { data: generation, error: generationError } = await supabase
      .from('tome_generations')
      .select('*')
      .eq('id', generationId)
      .single();

    if (generationError || !generation) {
      throw new Error('Generation not found: ' + (generationError?.message || 'Unknown error'));
    }

    // Update status to processing
    await supabase
      .from('tome_generations')
      .update({ status: 'processing' })
      .eq('id', generationId);

    // Get WordPress config
    const { data: wpConfig, error: wpConfigError } = await supabase
      .from('wordpress_configs')
      .select('*')
      .eq('id', generation.wordpress_config_id)
      .single();

    if (wpConfigError || !wpConfig) {
      throw new Error('WordPress config not found');
    }

    // Get category name
    const { data: categoryKeyword, error: categoryError } = await supabase
      .from('categories_keywords')
      .select('category_name, keyword')
      .eq('id', generation.keyword_id)
      .single();

    if (categoryError) {
      console.log('Error fetching category:', categoryError.message);
    }

    const categoryName = categoryKeyword?.category_name || 'Non spécifiée';
    const keyword = categoryKeyword?.keyword || null;

    // Get locality name
    let localityName = null;
    if (generation.locality_id) {
      const { data: locality, error: localityError } = await supabase
        .from('localities')
        .select('name, region')
        .eq('id', generation.locality_id)
        .single();

      if (!localityError && locality) {
        localityName = locality.name;
        if (locality.region) {
          localityName += ` (${locality.region})`;
        }
      }
    }

    // Format the prompt
    let prompt = wpConfig.prompt || "Vous êtes un expert en rédaction de contenu SEO.";
    prompt += "\n\nVeuillez créer un contenu optimisé pour une page web sur le sujet suivant:";
    prompt += `\n- Catégorie: ${categoryName}`;
    
    if (keyword) {
      prompt += `\n- Mot-clé principal: ${keyword}`;
    }
    
    if (localityName) {
      prompt += `\n- Localité: ${localityName}`;
    }
    
    prompt += "\n\nLe contenu doit:";
    prompt += "\n- Être optimisé pour le SEO";
    prompt += "\n- Contenir entre 500 et 800 mots";
    prompt += "\n- Inclure un titre H1 accrocheur";
    prompt += "\n- Avoir une structure avec des sous-titres H2 et H3";
    prompt += "\n- Être écrit en français courant";
    
    if (localityName) {
      prompt += `\n- Être localisé pour ${localityName}`;
    }
    
    prompt += "\n\nFormat souhaité: HTML avec balises pour les titres (h1, h2, h3), paragraphes (p) et listes (ul, li).";
    
    // Generate content with OpenAI
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Vous êtes un expert en rédaction web SEO qui génère du contenu HTML optimisé.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 1500,
        temperature: 0.7,
      }),
    });

    const completion = await openaiResponse.json();
    
    if (!completion.choices || completion.choices.length === 0) {
      throw new Error('Failed to generate content with OpenAI');
    }
    
    const generatedContent = completion.choices[0].message.content;
    
    // Extract title from the generated content
    let title = "Nouveau contenu généré";
    const titleMatch = generatedContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].replace(/<[^>]*>/g, '').trim();
    }

    // Now we need to publish to WordPress
    // Get the WordPress API URL
    const siteUrl = wpConfig.site_url.endsWith('/')
      ? wpConfig.site_url.slice(0, -1)
      : wpConfig.site_url;
    
    let apiEndpoint = '/wp-json/wp/v2/pages';
    
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Use Basic Auth with application password
    if (wpConfig.app_username && wpConfig.app_password) {
      const credentials = btoa(`${wpConfig.app_username}:${wpConfig.app_password}`);
      headers['Authorization'] = `Basic ${credentials}`;
    } else {
      throw new Error('WordPress API credentials not configured');
    }
    
    // Prepare the post data
    const postData = {
      title: title,
      content: generatedContent,
      status: 'publish',
      
      // If we have category ID, add it here
      // We'll use the categories from WordPress, if available
      categoryId: generation.category_id,
    };
    
    try {
      // Let's first check if we're dealing with a DipiPixel site with custom taxonomy
      const testResponse = await fetch(`${siteUrl}/wp-json/wp/v2/dipi_cpt_category`, {
        method: 'HEAD',
        headers: headers
      });
      
      if (testResponse.status !== 404) {
        // DipiPixel custom post type exists
        apiEndpoint = '/wp-json/wp/v2/dipi_cpt';
        // Add category using custom taxonomy
        postData["dipi_cpt_category"] = [parseInt(generation.category_id)];
      }
    } catch (error) {
      console.log("Error checking for DipiPixel:", error);
      // Continue with standard WordPress endpoint
    }
    
    // Publish to WordPress
    const wpResponse = await fetch(`${siteUrl}${apiEndpoint}`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(postData),
    });
    
    if (!wpResponse.ok) {
      const errorText = await wpResponse.text();
      throw new Error(`WordPress API error: ${wpResponse.status} - ${errorText}`);
    }
    
    const wpData = await wpResponse.json();
    
    // Update generation status in Supabase
    await supabase
      .from('tome_generations')
      .update({ 
        status: 'published',
        wordpress_post_id: wpData.id,
        published_at: new Date().toISOString()
      })
      .eq('id', generationId);
    
    // Return successful response
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Content generated and published successfully',
        generationId,
        wordpressPostId: wpData.id
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
    
  } catch (error) {
    console.error('Error in tome-generate function:', error);
    
    // If we have a generation ID, update its status to failed
    try {
      const { generationId } = await req.json();
      if (generationId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          await supabase
            .from('tome_generations')
            .update({ status: 'failed' })
            .eq('id', generationId);
        }
      }
    } catch (updateError) {
      console.error('Error updating generation status:', updateError);
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An error occurred during generation',
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
