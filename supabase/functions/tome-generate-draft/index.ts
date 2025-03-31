
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

    // Clone the request before reading it to avoid "Body already consumed" error
    const reqClone = req.clone();
    const { generationId, skipPublishing = true } = await reqClone.json();

    if (!generationId) {
      throw new Error('Generation ID is required');
    }

    // Get generation data directly without complex joins
    const { data: generation, error: generationError } = await supabase
      .from('tome_generations')
      .select('*')
      .eq('id', generationId)
      .single();

    if (generationError || !generation) {
      throw new Error('Generation not found: ' + (generationError?.message || 'Unknown error'));
    }

    // Get additional data separately
    const [categoryResult, keywordResult, localityResult] = await Promise.all([
      // Get category name
      supabase
        .from('categories_keywords')
        .select('category_name')
        .eq('id', generation.category_id)
        .single()
        .then(({ data }) => data?.category_name || 'Non spécifiée'),

      // Get keyword if exists
      generation.keyword_id 
        ? supabase
            .from('categories_keywords')
            .select('keyword')
            .eq('id', generation.keyword_id)
            .single()
            .then(({ data }) => data?.keyword || null)
        : Promise.resolve(null),

      // Get locality if exists
      generation.locality_id
        ? supabase
            .from('localities')
            .select('name, region')
            .eq('id', generation.locality_id)
            .single()
            .then(({ data }) => data || null)
        : Promise.resolve(null)
    ]);

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

    const categoryName = categoryResult || 'Non spécifiée';
    const keyword = keywordResult || null;
    const localityName = localityResult?.name || null;
    const localityRegion = localityResult?.region || null;
    const fullLocalityName = localityName && localityRegion ? `${localityName} (${localityRegion})` : localityName;

    // Format the prompt
    let prompt = wpConfig.prompt || "Vous êtes un expert en rédaction de contenu SEO.";
    prompt += "\n\nVeuillez créer un contenu optimisé pour une page web sur le sujet suivant:";
    prompt += `\n- Catégorie: ${categoryName}`;
    
    if (keyword) {
      prompt += `\n- Mot-clé principal: ${keyword}`;
    }
    
    if (fullLocalityName) {
      prompt += `\n- Localité: ${fullLocalityName}`;
    }

    // Ajouter la description personnalisée si disponible
    if (generation.description) {
      prompt += `\n\nInstructions supplémentaires: ${generation.description}`;
    }
    
    prompt += "\n\nLe contenu doit:";
    prompt += "\n- Être optimisé pour le SEO";
    prompt += "\n- Contenir entre 500 et 800 mots";
    prompt += "\n- Inclure un titre H1 accrocheur";
    prompt += "\n- Avoir une structure avec des sous-titres H2 et H3";
    prompt += "\n- Être écrit en français courant";
    
    if (fullLocalityName) {
      prompt += `\n- Être localisé pour ${fullLocalityName}`;
    }
    
    prompt += "\n\nFormat souhaité: HTML avec balises pour les titres (h1, h2, h3), paragraphes (p) et listes (ul, li).";
    
    console.log("Sending prompt to OpenAI:", prompt.substring(0, 100) + "...");
    
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
    let title = generation.title || "Nouveau contenu généré";
    const titleMatch = generatedContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].replace(/<[^>]*>/g, '').trim();
    }

    // Pour les brouillons, on sauvegarde le contenu généré mais on ne publie pas
    if (skipPublishing) {
      await supabase
        .from('tome_generations')
        .update({ 
          status: 'draft',
          title: title,
          content: generatedContent
        })
        .eq('id', generationId);
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Content generated successfully and saved as draft',
          generationId,
          title,
          content: generatedContent
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }
    
    // Si on arrive ici, c'est qu'on veut aussi publier, ce qui n'est pas dans la portée de ce Edge Function
    throw new Error('Publishing not implemented in this function');
    
  } catch (error) {
    console.error('Error in tome-generate-draft function:', error);
    
    let errorMessage = error.message || 'An error occurred during generation';
    let friendlyMessage = errorMessage;
    
    // Try to update generation status to failed
    try {
      // Clone the request again to read generationId for status update
      const reqClone2 = req.clone();
      const { generationId } = await reqClone2.json();
      
      if (generationId) {
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          await supabase
            .from('tome_generations')
            .update({ 
              status: 'failed',
              error_message: friendlyMessage.substring(0, 255) // Limiter la taille
            })
            .eq('id', generationId);
        }
      }
    } catch (updateError) {
      console.error('Error updating generation status:', updateError);
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: friendlyMessage,
        technicalError: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
