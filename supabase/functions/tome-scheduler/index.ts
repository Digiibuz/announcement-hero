
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import 'https://deno.land/x/xhr@0.1.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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

// Initialize Supabase client with environment variables
function initSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL or key not found');
  }

  return createClient(supabaseUrl, supabaseKey);
}

// Parse request parameters from the request body
async function parseRequestParams(req: Request) {
  let isConfigCheck = false;
  let forceGeneration = false;
  let apiKey = null;
  let timestamp = new Date().getTime(); // Current timestamp for logging/debugging
  
  try {
    const body = await req.json();
    isConfigCheck = body.configCheck === true;
    forceGeneration = body.forceGeneration === true;
    apiKey = body.api_key;
    timestamp = body.timestamp || timestamp;
    console.log("Request body:", body);
  } catch (e) {
    // Si pas de body JSON ou erreur de parsing, ce n'est pas une vérification de config
    console.log("No JSON body or parsing error, assuming regular execution");
  }
  
  console.log("Parameter values - isConfigCheck:", isConfigCheck, "forceGeneration:", forceGeneration, "timestamp:", timestamp);
  
  return { isConfigCheck, forceGeneration, apiKey, timestamp };
}

// Validate API key if provided and force generation for that specific config
async function validateApiKey(supabase, apiKey) {
  if (!apiKey) return { valid: true, forceGeneration: false };
  
  // Vérifier si l'API key correspond à une automatisation
  const { data: automationWithKey, error: apiKeyError } = await supabase
    .from('tome_automation')
    .select('*')
    .eq('api_key', apiKey)
    .single();
    
  if (apiKeyError || !automationWithKey) {
    console.error("Invalid API key:", apiKey);
    throw new Error('Invalid API key');
  }
  
  console.log("Valid API key for automation:", automationWithKey.id);
  
  // Si l'API key est valide mais que l'automatisation est désactivée
  if (!automationWithKey.is_enabled) {
    return { 
      valid: false, 
      message: 'Automation is disabled for this API key',
      forceGeneration: false
    };
  }
  
  // Si l'API key est valide, on force la génération pour cette config spécifique
  return { valid: true, forceGeneration: true, automationWithKey };
}

// Get enabled automation settings
async function getEnabledAutomationSettings(supabase) {
  const { data: automationSettings, error: automationError } = await supabase
    .from('tome_automation')
    .select('*')
    .eq('is_enabled', true);

  if (automationError) {
    console.error("Error fetching automation settings:", automationError);
    throw new Error('Error fetching automation settings: ' + automationError.message);
  }

  console.log(`Found ${automationSettings?.length || 0} automation settings:`, automationSettings);
  return automationSettings || [];
}

// Perform a configuration check without generating content
function handleConfigCheck(automationSettings) {
  return {
    success: true,
    message: 'Configuration check completed successfully',
    automationSettings
  };
}

// Fetch the last generation for a config
async function getLastGeneration(supabase, wordpressConfigId) {
  const { data: lastGeneration, error: lastGenError } = await supabase
    .from('tome_generations')
    .select('created_at')
    .eq('wordpress_config_id', wordpressConfigId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (lastGenError) {
    console.error(`Error fetching last generation for config ${wordpressConfigId}:`, lastGenError);
    return null;
  }

  console.log(`Last generation for config ${wordpressConfigId}:`, lastGeneration);
  return lastGeneration;
}

// Fetch categories for a WordPress config
async function getCategories(supabase, wordpressConfigId) {
  const { data: categories, error: categoriesError } = await supabase
    .from('categories_keywords')
    .select('category_id')
    .eq('wordpress_config_id', wordpressConfigId)
    .limit(1);

  if (categoriesError || !categories || categories.length === 0) {
    console.error(`No categories found for config ${wordpressConfigId}`);
    return null;
  }

  return categories;
}

// Fetch keywords for a WordPress config
async function getKeywords(supabase, wordpressConfigId, categoryId) {
  const { data: keywords, error: keywordsError } = await supabase
    .from('categories_keywords')
    .select('*')
    .eq('wordpress_config_id', wordpressConfigId);

  if (keywordsError) {
    console.error(`Error fetching keywords for config ${wordpressConfigId}:`, keywordsError);
    return null;
  }

  return keywords?.filter(k => k.category_id === categoryId) || [];
}

// Fetch active localities for a WordPress config
async function getLocalities(supabase, wordpressConfigId) {
  const { data: localities, error: localitiesError } = await supabase
    .from('localities')
    .select('*')
    .eq('wordpress_config_id', wordpressConfigId)
    .eq('active', true);

  if (localitiesError) {
    console.error(`Error fetching localities for config ${wordpressConfigId}:`, localitiesError);
    return null;
  }

  return localities || [];
}

// Create a new generation with random content selections
async function createGeneration(supabase, wordpressConfigId, categoryId, keywordId, localityId) {
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
    return null;
  }

  console.log(`Created generation ${generation.id} for WordPress config ${wordpressConfigId}`);
  return generation;
}

// Generate a draft using the tome-generate-draft function
async function generateDraft(supabase, generationId) {
  try {
    console.log(`Invoking tome-generate-draft for generation ${generationId}`);
    const { data: draftData, error: draftError } = await supabase.functions.invoke('tome-generate-draft', {
      body: { 
        generationId: generationId,
        timestamp: new Date().getTime() // Add timestamp to avoid caching
      }
    });
    
    if (draftError) {
      console.error(`Error generating draft for generation ${generationId}:`, draftError);
      await updateGenerationStatus(supabase, generationId, 'failed', draftError.message || 'Error invoking tome-generate-draft');
      return false;
    }
    
    if (draftData && draftData.error) {
      console.error(`Draft API returned error for generation ${generationId}:`, draftData.error);
      await updateGenerationStatus(supabase, generationId, 'failed', draftData.error);
      return false;
    }

    console.log(`Successfully generated draft for generation ${generationId}`);
    return true;
  } catch (error) {
    console.error(`Exception when generating draft for ${generationId}:`, error);
    await updateGenerationStatus(supabase, generationId, 'failed', error.message || 'Exception in tome-generate-draft');
    return false;
  }
}

// Update generation status in case of error
async function updateGenerationStatus(supabase, generationId, status, errorMessage = null) {
  const updateData = { status };
  if (errorMessage) {
    updateData.error_message = errorMessage.substring(0, 255); // Limit the length
  }
  
  await supabase
    .from('tome_generations')
    .update(updateData)
    .eq('id', generationId);
}

// Process a single automation setting
async function processAutomationSetting(supabase, setting, apiKeyUsed, forceGeneration) {
  const wordpressConfigId = setting.wordpress_config_id;
  const frequency = setting.frequency;
  
  // Si une API key a été utilisée, on ne traite que l'automatisation correspondante
  if (apiKeyUsed && setting.api_key !== apiKeyUsed) {
    console.log(`Skipping automation for WordPress config ${wordpressConfigId}, not matching API key`);
    return 0;
  }

  console.log(`Processing automation for WordPress config ${wordpressConfigId} with frequency ${frequency}`);

  // Check if it's time to generate content based on frequency
  const lastGeneration = await getLastGeneration(supabase, wordpressConfigId);
  if (!lastGeneration) return 0;

  // TOUJOURS générer du contenu si forceGeneration est vrai
  const shouldGenerate = forceGeneration || shouldGenerateContent(lastGeneration, frequency);
  
  if (!shouldGenerate) {
    console.log(`Skipping generation for config ${wordpressConfigId}, not due yet`);
    return 0;
  }

  console.log(`Generating content for WordPress config ${wordpressConfigId}`);

  // Get necessary data for content generation
  const categories = await getCategories(supabase, wordpressConfigId);
  if (!categories) return 0;

  const categoryId = categories[0].category_id;
  const categoryKeywords = await getKeywords(supabase, wordpressConfigId, categoryId);
  const localities = await getLocalities(supabase, wordpressConfigId);
  
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

  // Create a new generation
  const generation = await createGeneration(supabase, wordpressConfigId, categoryId, keywordId, localityId);
  if (!generation) return 0;

  // Generate the draft
  const success = await generateDraft(supabase, generation.id);
  
  return success ? 1 : 0;
}

// Main function to run the scheduler
async function runScheduler(supabase, automationSettings, apiKey, forceGeneration) {
  let generationsCreated = 0;

  // Process each automation setting
  for (const setting of automationSettings) {
    try {
      const successCount = await processAutomationSetting(supabase, setting, apiKey, forceGeneration);
      generationsCreated += successCount;
    } catch (error) {
      console.error(`Error processing automation for config ${setting.wordpress_config_id}:`, error);
      // Continue with other settings
    }
  }

  return generationsCreated;
}

// Main handler for the edge function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Tome-scheduler function starting execution");
    
    // Initialize Supabase client
    const supabase = initSupabaseClient();
    
    // Parse request parameters
    const { isConfigCheck, forceGeneration, apiKey, timestamp } = await parseRequestParams(req);
    
    // Validate API key if provided
    let effectiveForceGeneration = forceGeneration;
    if (apiKey) {
      const validation = await validateApiKey(supabase, apiKey);
      
      if (!validation.valid) {
        return new Response(
          JSON.stringify({
            success: false,
            message: validation.message,
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403,
          }
        );
      }
      
      effectiveForceGeneration = validation.forceGeneration;
    }

    // Get enabled automation settings
    const automationSettings = await getEnabledAutomationSettings(supabase);

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
    
    // If just a configuration check, don't generate content
    if (isConfigCheck) {
      return new Response(
        JSON.stringify(handleConfigCheck(automationSettings)),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }
    
    // Run the scheduler to process automation settings
    const generationsCreated = await runScheduler(supabase, automationSettings, apiKey, effectiveForceGeneration);

    // Return successful response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Scheduler run completed. Created ${generationsCreated} generations.`,
        generationsCreated,
        timestamp
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
        error: error.message || 'An error occurred during scheduling',
        timestamp: new Date().getTime()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
