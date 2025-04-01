
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

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL or key not found');
    }

    // Initialize Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("Tome-scheduler function starting execution");

    // Parse the request to check if this is just a configuration check
    let isConfigCheck = false;
    try {
      const body = await req.json();
      isConfigCheck = body.configCheck === true;
      console.log("Request body:", body);
    } catch (e) {
      // Si pas de body JSON ou erreur de parsing, ce n'est pas une vérification de config
      console.log("No JSON body or parsing error, assuming regular execution");
    }

    // Get all automation settings that are enabled
    const { data: automationSettings, error: automationError } = await supabase
      .from('tome_automation')
      .select('*')
      .eq('is_enabled', true);

    if (automationError) {
      console.error("Error fetching automation settings:", automationError);
      throw new Error('Error fetching automation settings: ' + automationError.message);
    }

    console.log(`Found ${automationSettings?.length || 0} automation settings:`, automationSettings);

    if (!automationSettings || automationSettings.length === 0) {
      console.log("No enabled automation settings found");
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No enabled automation settings found',
          generationsCreated: 0
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log(`Found ${automationSettings.length} enabled automation settings`);
    
    // Si c'est juste une vérification de configuration, ne pas générer de contenu
    if (isConfigCheck) {
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Configuration check completed successfully',
          automationSettings
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }
    
    let generationsCreated = 0;

    // Process each automation setting
    for (const setting of automationSettings) {
      const wordpressConfigId = setting.wordpress_config_id;
      const frequency = setting.frequency;

      console.log(`Processing automation for WordPress config ${wordpressConfigId} with frequency ${frequency}`);

      // Check if it's time to generate content based on frequency
      const { data: lastGeneration, error: lastGenError } = await supabase
        .from('tome_generations')
        .select('created_at')
        .eq('wordpress_config_id', wordpressConfigId)
        .order('created_at', { ascending: false })
        .limit(1);

      if (lastGenError) {
        console.error(`Error fetching last generation for config ${wordpressConfigId}:`, lastGenError);
        continue;
      }

      console.log(`Last generation for config ${wordpressConfigId}:`, lastGeneration);

      const shouldGenerate = shouldGenerateContent(lastGeneration, frequency);
      
      if (!shouldGenerate) {
        console.log(`Skipping generation for config ${wordpressConfigId}, not due yet`);
        continue;
      }

      console.log(`Generating content for WordPress config ${wordpressConfigId}`);

      // Get categories for this WordPress config
      const { data: categories, error: categoriesError } = await supabase
        .from('categories_keywords')
        .select('category_id')
        .eq('wordpress_config_id', wordpressConfigId)
        .limit(1);

      if (categoriesError || !categories || categories.length === 0) {
        console.error(`No categories found for config ${wordpressConfigId}`);
        continue;
      }

      // Get all keywords for this WordPress config
      const { data: keywords, error: keywordsError } = await supabase
        .from('categories_keywords')
        .select('*')
        .eq('wordpress_config_id', wordpressConfigId);

      if (keywordsError) {
        console.error(`Error fetching keywords for config ${wordpressConfigId}:`, keywordsError);
        continue;
      }

      // Get all active localities for this WordPress config
      const { data: localities, error: localitiesError } = await supabase
        .from('localities')
        .select('*')
        .eq('wordpress_config_id', wordpressConfigId)
        .eq('active', true);

      if (localitiesError) {
        console.error(`Error fetching localities for config ${wordpressConfigId}:`, localitiesError);
        continue;
      }

      // Select random category, keyword, and locality
      const categoryId = categories[0].category_id;
      
      // Filter keywords by category
      const categoryKeywords = keywords.filter(k => k.category_id === categoryId);
      
      // Select random keyword if available
      let keywordId = null;
      if (categoryKeywords && categoryKeywords.length > 0) {
        const randomKeywordIndex = Math.floor(Math.random() * categoryKeywords.length);
        keywordId = categoryKeywords[randomKeywordIndex].id;
      }
      
      // Select random locality if available
      let localityId = null;
      if (localities && localities.length > 0) {
        const randomLocalityIndex = Math.floor(Math.random() * localities.length);
        localityId = localities[randomLocalityIndex].id;
      }

      // Create a new generation entry
      const { data: generation, error: generationError } = await supabase
        .from('tome_generations')
        .insert({
          wordpress_config_id: wordpressConfigId,
          category_id: categoryId,
          keyword_id: keywordId,
          locality_id: localityId,
          status: 'pending'
        })
        .select()
        .single();

      if (generationError) {
        console.error(`Error creating generation for config ${wordpressConfigId}:`, generationError);
        continue;
      }

      console.log(`Created generation ${generation.id} for WordPress config ${wordpressConfigId}`);

      // Call tome-generate-draft to create the content (using AI) but NOT publish
      const { error: draftError } = await supabase.functions.invoke('tome-generate-draft', {
        body: { generationId: generation.id }
      });
      
      if (draftError) {
        console.error(`Error generating draft for generation ${generation.id}:`, draftError);
        continue;
      }

      console.log(`Successfully generated draft for generation ${generation.id}`);
      generationsCreated++;
    }

    // Return successful response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Scheduler run completed. Created ${generationsCreated} generations.`,
        generationsCreated
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Error in tome-scheduler function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An error occurred during scheduling'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});

// Helper function to determine if content should be generated based on last generation time and frequency
function shouldGenerateContent(lastGeneration: any[], frequency: number): boolean {
  // If no previous generations, always generate
  if (!lastGeneration || lastGeneration.length === 0) {
    console.log("No previous generations found, will generate content");
    return true;
  }

  const lastGenerationDate = new Date(lastGeneration[0].created_at);
  const now = new Date();
  
  // Calculate time difference in milliseconds
  const diffTime = Math.abs(now.getTime() - lastGenerationDate.getTime());
  
  // Si la fréquence est inférieure à 1, cela représente des fractions de jour
  // Par exemple, 0.0007 ~ 1 minute (1/1440 jour), 0.01 ~ 15 minutes (15/1440 jour)
  if (frequency < 1) {
    // Convertir en minutes pour plus de lisibilité dans les logs
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const frequencyMinutes = Math.floor(frequency * 24 * 60); // Convertir en minutes
    
    console.log(`Dernière génération il y a ${diffMinutes} minutes, fréquence configurée à ${frequencyMinutes} minutes (${frequency} jours)`);
    
    // Comparer directement les minutes au lieu de jours fractionnés
    return diffMinutes >= frequencyMinutes;
  }
  
  // Pour les fréquences en jours
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  console.log(`Dernière génération il y a ${diffDays} jours, fréquence configurée à ${frequency} jours`);
  return diffDays >= frequency;
}
