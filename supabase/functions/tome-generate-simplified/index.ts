
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import 'https://deno.land/x/xhr@0.1.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 200 // Ensure we return 200 for OPTIONS
    });
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
    const { generationId, userId } = await reqClone.json();

    console.log(`Processing generation ID: ${generationId} for user ID: ${userId}`);

    if (!generationId) {
      throw new Error('Generation ID is required');
    }

    if (!userId) {
      throw new Error('User ID is required');
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

    console.log("Found generation:", generation);

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

    console.log("Found WordPress config:", wpConfig.name);

    // Get category name - FIX: Uses text category_id, not UUID
    try {
      let categoryName = "Non spécifiée";
      
      // Si category_id est un nombre ou un texte (pas un UUID), il s'agit peut-être d'un ID WordPress direct
      if (generation.category_id && !generation.category_id.includes('-')) {
        // Essayer de récupérer depuis categories_keywords en utilisant la correspondance exacte sur category_id
        const { data: categoryData } = await supabase
          .from('categories_keywords')
          .select('category_name')
          .eq('category_id', generation.category_id)
          .eq('wordpress_config_id', generation.wordpress_config_id)
          .maybeSingle();
          
        if (categoryData) {
          categoryName = categoryData.category_name;
        } else {
          // Utiliser l'ID directement comme nom de catégorie si on ne trouve pas de correspondance
          categoryName = `Catégorie ${generation.category_id}`;
        }
      } else {
        // C'est probablement un UUID, on essaie avec l'approche originale
        const { data: category, error: categoryError } = await supabase
          .from('categories_keywords')
          .select('category_name')
          .eq('id', generation.category_id)
          .maybeSingle();
        
        if (category) {
          categoryName = category.category_name;
        }
      }
      
      // Get keyword data
      let keyword = null;
      if (generation.keyword_id) {
        const { data: keywordData, error: keywordError } = await supabase
          .from('categories_keywords')
          .select('keyword')
          .eq('id', generation.keyword_id)
          .maybeSingle();
          
        if (!keywordError && keywordData) {
          keyword = keywordData.keyword;
        }
      }

      // Get locality data
      let localityName = null;
      let localityRegion = null;
      if (generation.locality_id) {
        const { data: locality, error: localityError } = await supabase
          .from('localities')
          .select('name, region')
          .eq('id', generation.locality_id)
          .maybeSingle();

        if (!localityError && locality) {
          localityName = locality.name;
          localityRegion = locality.region;
        }
      }

      // Format the prompt
      let prompt = "Vous êtes un expert en rédaction de contenu SEO optimisé pour le web.";
      
      if (wpConfig.prompt) {
        prompt = wpConfig.prompt;
      }
      
      prompt += "\n\nVeuillez créer un contenu optimisé pour une page web sur le sujet suivant:";
      prompt += `\n- Catégorie: ${categoryName}`;
      
      if (keyword) {
        prompt += `\n- Mot-clé principal: ${keyword}`;
      }
      
      if (localityName) {
        prompt += `\n- Localité: ${localityName}`;
        if (localityRegion) {
          prompt += ` (${localityRegion})`;
        }
      }
      
      prompt += "\n\nLe contenu doit:";
      prompt += "\n- Être optimisé pour le SEO";
      prompt += "\n- Contenir entre 600 et 900 mots";
      prompt += "\n- Inclure un titre H1 accrocheur";
      prompt += "\n- Avoir une structure avec des sous-titres H2 et H3";
      prompt += "\n- Être écrit en français courant";
      
      if (localityName) {
        prompt += `\n- Être localisé pour ${localityName}`;
        if (localityRegion) {
          prompt += ` dans la région ${localityRegion}`;
        }
      }
      
      prompt += "\n\nFormat souhaité: HTML avec balises pour les titres (h1, h2, h3), paragraphes (p) et listes (ul, li).";
      
      console.log("Prompt prepared, calling OpenAI...");
      
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

      if (!openaiResponse.ok) {
        const errorText = await openaiResponse.text();
        throw new Error(`OpenAI API error: ${openaiResponse.status} - ${errorText}`);
      }

      const completion = await openaiResponse.json();
      
      if (!completion.choices || completion.choices.length === 0) {
        throw new Error('Failed to generate content with OpenAI');
      }
      
      console.log("Content generated from OpenAI");
      
      const generatedContent = completion.choices[0].message.content;
      
      // Extract title from the generated content
      let title = "Nouveau contenu généré";
      const titleMatch = generatedContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
      if (titleMatch && titleMatch[1]) {
        title = titleMatch[1].replace(/<[^>]*>/g, '').trim();
      }

      // Approche simplifiée similaire aux annonces
      try {
        console.log("Preparing WordPress publication data");
        
        // Obtenir les données de profil de l'utilisateur
        const { data: userProfile, error: userProfileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
          
        if (userProfileError) {
          throw new Error('Profil utilisateur non trouvé: ' + userProfileError.message);
        }
        
        // Préparer les données pour WordPress en utilisant une approche similaire aux annonces
        const wpPostData = {
          title: title,
          content: generatedContent,
          status: 'publish',
          categoryId: generation.category_id
        };
        
        console.log("Updating generation with content");
        
        // Mettre à jour la génération avec le contenu généré
        await supabase
          .from('tome_generations')
          .update({ 
            title: title,
            content: generatedContent,
            status: 'ready', // Prêt à être publié manuellement
            published_at: null // Sera mis à jour à la publication
          })
          .eq('id', generationId);
        
        // Retourner une réponse réussie
        return new Response(
          JSON.stringify({
            success: true,
            message: 'Contenu généré avec succès',
            generationId
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      } catch (wpError) {
        console.error("WordPress preparation error:", wpError);
        throw wpError;
      }
    } catch (categoryError) {
      console.error("Error processing category:", categoryError);
      throw new Error("Erreur lors du traitement de la catégorie: " + categoryError.message);
    }
    
  } catch (error) {
    console.error('Error in tome-generate-simplified function:', error);
    
    let errorMessage = error.message || 'An error occurred during generation';
    let friendlyMessage = errorMessage;
    
    // Améliorer les messages d'erreur pour l'utilisateur
    if (errorMessage.includes("WAF") || errorMessage.includes("pare-feu")) {
      friendlyMessage = "Le pare-feu WordPress (WAF) bloque notre requête. Vous devrez peut-être publier manuellement depuis WordPress.";
    } else if (errorMessage.includes("timeout") || errorMessage.includes("abort")) {
      friendlyMessage = "Délai d'attente dépassé lors de la connexion à WordPress. Veuillez vérifier l'URL et les identifiants.";
    } else if (errorMessage.includes("503")) {
      friendlyMessage = "Le serveur WordPress est temporairement indisponible (erreur 503). Veuillez réessayer plus tard.";
    }
    
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
              // Stocker le message d'erreur pour référence
              error_message: friendlyMessage.substring(0, 255) // Limiter la taille
            })
            .eq('id', generationId);
            
          console.log(`Updated generation ${generationId} to failed status with message: ${friendlyMessage}`);
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
