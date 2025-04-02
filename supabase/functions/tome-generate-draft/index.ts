
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import 'https://deno.land/x/xhr@0.1.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Debug logging function
const debugLog = (message: string, data?: any) => {
  if (data) {
    console.log(`[tome-generate-draft] ${message}:`, JSON.stringify(data));
  } else {
    console.log(`[tome-generate-draft] ${message}`);
  }
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    debugLog("Fonction tome-generate-draft démarrée");
    
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

    // Parse request body
    const reqClone = req.clone();
    let reqBody;
    try {
      reqBody = await reqClone.json();
      debugLog("Corps de la requête reçue:", reqBody);
    } catch (parseError) {
      debugLog("Erreur d'analyse du corps de la requête:", parseError);
      throw new Error("Impossible d'analyser le corps de la requête JSON");
    }

    const { generationId, debug = false } = reqBody;

    if (!generationId) {
      debugLog("Erreur: generationId manquant dans la requête");
      throw new Error('Generation ID is required');
    }

    debugLog(`Starting content generation for generation ID: ${generationId}`);

    // Get generation data
    const { data: generation, error: generationError } = await supabase
      .from('tome_generations')
      .select('*')
      .eq('id', generationId)
      .single();

    if (generationError || !generation) {
      debugLog(`Erreur lors de la récupération de generation ${generationId}:`, generationError);
      throw new Error('Generation not found: ' + (generationError?.message || 'Unknown error'));
    }

    debugLog(`Retrieved generation data`, generation);

    // Update status to processing
    await supabase
      .from('tome_generations')
      .update({ status: 'processing' })
      .eq('id', generationId);

    debugLog(`Updated generation status to 'processing'`);

    // Get WordPress config
    const { data: wpConfig, error: wpConfigError } = await supabase
      .from('wordpress_configs')
      .select('*')
      .eq('id', generation.wordpress_config_id)
      .single();

    if (wpConfigError || !wpConfig) {
      debugLog(`Erreur: Configuration WordPress non trouvée pour ${generation.wordpress_config_id}:`, wpConfigError);
      throw new Error('WordPress config not found');
    }

    debugLog(`Retrieved WordPress config: ${wpConfig.name}`);

    // Get category and keyword data
    let categoryName = "Non spécifiée";
    let keyword = null;
    
    if (generation.keyword_id) {
      const { data: categoryKeyword, error: categoryError } = await supabase
        .from('categories_keywords')
        .select('category_name, keyword')
        .eq('id', generation.keyword_id)
        .single();

      if (!categoryError && categoryKeyword) {
        categoryName = categoryKeyword.category_name || categoryName;
        keyword = categoryKeyword.keyword || null;
        debugLog(`Using category: ${categoryName}, keyword: ${keyword}`);
      } else if (categoryError) {
        debugLog(`Error fetching category keyword: ${categoryError.message}`);
      }
    } else {
      // Attempt to get category name directly
      const { data: categoryData, error: catError } = await supabase
        .from('categories_keywords')
        .select('category_name')
        .eq('category_id', generation.category_id)
        .single();
        
      if (!catError && categoryData) {
        categoryName = categoryData.category_name || categoryName;
        debugLog(`Using category: ${categoryName} (from direct lookup)`);
      } else if (catError) {
        debugLog(`Error fetching category name: ${catError.message}`);
      }
    }

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
        debugLog(`Using locality: ${localityName}`);
      } else if (localityError) {
        debugLog(`Error fetching locality: ${localityError.message}`);
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
    
    if (debug) {
      debugLog("Prompt complet pour OpenAI:", prompt);
    } else {
      debugLog("Prompt préparé pour OpenAI (aperçu):", prompt.substring(0, 100) + "...");
    }
    
    try {
      // Generate content with OpenAI
      debugLog("Envoi de la requête à OpenAI");
      const openAiRequestBody = {
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
      };
      
      debugLog("Corps de la requête OpenAI:", openAiRequestBody);
      
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(openAiRequestBody),
      });

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        debugLog(`OpenAI API returned error: ${openaiResponse.status}`, errorText);
        throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
      }

      const completion = await openaiResponse.json();
      debugLog("Received response from OpenAI:", completion);
      
      if (!completion.choices || completion.choices.length === 0) {
        throw new Error('Failed to generate content with OpenAI: No choices returned');
      }
      
      const generatedContent = completion.choices[0].message.content;
      
      // Extract title from the generated content
      let title = "Nouveau contenu généré";
      const titleMatch = generatedContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
      if (titleMatch && titleMatch[1]) {
        title = titleMatch[1].replace(/<[^>]*>/g, '').trim();
        debugLog(`Extracted title: ${title}`);
      } else {
        debugLog("Could not extract title from content");
      }
      
      // Update the generation with content but keep as draft
      const { error: updateError } = await supabase
        .from('tome_generations')
        .update({ 
          status: 'draft',
          title: title,
          content: generatedContent
        })
        .eq('id', generationId);
        
      if (updateError) {
        debugLog(`Error updating generation: ${updateError.message}`);
        throw new Error(`Error updating generation: ${updateError.message}`);
      }
      
      debugLog(`Successfully updated generation with content, status set to 'draft'`);
      
      // Return successful response
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Content generated successfully as draft',
          generationId
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    } catch (openaiError: any) {
      debugLog(`Error with OpenAI API: ${openaiError.message}`);
      throw new Error(`OpenAI error: ${openaiError.message}`);
    }
  } catch (error: any) {
    debugLog('Error in tome-generate-draft function:', error);
    
    let errorMessage = error.message || 'An error occurred during generation';
    
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
              error_message: errorMessage.substring(0, 255) // Limit the length
            })
            .eq('id', generationId);
            
          debugLog(`Updated generation status to 'failed'`);
        }
      }
    } catch (updateError) {
      debugLog('Error updating generation status:', updateError);
    }
    
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
