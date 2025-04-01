
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import 'https://deno.land/x/xhr@0.1.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Help debug Edge Function execution
const debugLog = (message: string, data?: any) => {
  if (data) {
    console.log(`[tome-scheduler] ${message}:`, JSON.stringify(data));
  } else {
    console.log(`[tome-scheduler] ${message}`);
  }
};

// Helper function to determine if content should be generated based on last generation time and frequency
function shouldGenerateContent(lastGeneration: any[], frequency: number): boolean {
  // If no previous generations, always generate
  if (!lastGeneration || lastGeneration.length === 0) {
    debugLog("No previous generations found, will generate content");
    return true;
  }

  const lastGenerationDate = new Date(lastGeneration[0].created_at);
  const now = new Date();
  
  // Calculate time difference in milliseconds
  const diffTime = Math.abs(now.getTime() - lastGenerationDate.getTime());
  
  // If frequency is less than 1, it represents fractions of a day
  // For example, 0.0007 ~ 1 minute (1/1440 day), 0.01 ~ 15 minutes (15/1440 day)
  if (frequency < 1) {
    // Convert to minutes for better readability in logs
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const frequencyMinutes = Math.floor(frequency * 24 * 60); // Convert to minutes
    
    debugLog(`Last generation ${diffMinutes} minutes ago, configured frequency: ${frequencyMinutes} minutes (${frequency} days)`);
    
    // Compare minutes directly instead of fractional days
    return diffMinutes >= frequencyMinutes;
  }
  
  // For frequencies in days
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  debugLog(`Last generation ${diffDays} days ago, configured frequency: ${frequency} days`);
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
  let debug = false;
  let timestamp = new Date().getTime(); // Current timestamp for logging/debugging
  
  try {
    const body = await req.json();
    isConfigCheck = body.configCheck === true;
    forceGeneration = body.forceGeneration === true;
    apiKey = body.api_key;
    debug = body.debug === true;
    timestamp = body.timestamp || timestamp;
    debugLog("Request body:", body);
  } catch (e) {
    // If no JSON body or parsing error, not a config check
    debugLog("No JSON body or parsing error, assuming regular execution");
  }
  
  debugLog("Parameter values - isConfigCheck:", isConfigCheck, "forceGeneration:", forceGeneration, "timestamp:", timestamp, "debug:", debug);
  
  return { isConfigCheck, forceGeneration, apiKey, timestamp, debug };
}

// Validate API key if provided and force generation for that specific config
async function validateApiKey(supabase, apiKey) {
  if (!apiKey) return { valid: true, forceGeneration: false };
  
  // Check if API key corresponds to an automation
  const { data: automationWithKey, error: apiKeyError } = await supabase
    .from('tome_automation')
    .select('*')
    .eq('api_key', apiKey)
    .single();
    
  if (apiKeyError || !automationWithKey) {
    debugLog("Invalid API key:", apiKey);
    throw new Error('Invalid API key');
  }
  
  debugLog("Valid API key for automation:", automationWithKey.id);
  
  // If API key is valid but automation is disabled
  if (!automationWithKey.is_enabled) {
    return { 
      valid: false, 
      message: 'Automation is disabled for this API key',
      forceGeneration: false
    };
  }
  
  // If API key is valid, force generation for this specific config
  return { valid: true, forceGeneration: true, automationWithKey };
}

// Get enabled automation settings
async function getEnabledAutomationSettings(supabase) {
  const { data: automationSettings, error: automationError } = await supabase
    .from('tome_automation')
    .select('*')
    .eq('is_enabled', true);

  if (automationError) {
    debugLog("Error fetching automation settings:", automationError);
    throw new Error('Error fetching automation settings: ' + automationError.message);
  }

  debugLog(`Found ${automationSettings?.length || 0} automation settings:`, automationSettings);
  return automationSettings || [];
}

// Perform a configuration check without generating content
function handleConfigCheck(automationSettings) {
  return {
    success: true,
    message: 'Configuration check completed successfully',
    automationSettings,
    timestamp: new Date().toISOString()
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
    debugLog(`Error fetching last generation for config ${wordpressConfigId}:`, lastGenError);
    return null;
  }

  debugLog(`Last generation for config ${wordpressConfigId}:`, lastGeneration);
  return lastGeneration;
}

// Fetch categories for a WordPress config
async function getCategories(supabase, wordpressConfigId) {
  const { data: categories, error: categoriesError } = await supabase
    .from('categories_keywords')
    .select('category_id, category_name')
    .eq('wordpress_config_id', wordpressConfigId)
    .limit(50); // Get more to ensure we have enough unique categories

  if (categoriesError) {
    debugLog(`Error fetching categories for config ${wordpressConfigId}:`, categoriesError);
    return null;
  }

  // Get unique categories by ID
  const uniqueCategories = Array.from(
    new Map(categories?.map(cat => [cat.category_id, cat])).values()
  );

  debugLog(`Found ${uniqueCategories.length} unique categories for config ${wordpressConfigId}`);
  return uniqueCategories;
}

// Fetch keywords for a WordPress config category
async function getKeywordsForCategory(supabase, wordpressConfigId, categoryId) {
  const { data: keywords, error: keywordsError } = await supabase
    .from('categories_keywords')
    .select('*')
    .eq('wordpress_config_id', wordpressConfigId)
    .eq('category_id', categoryId);

  if (keywordsError) {
    debugLog(`Error fetching keywords for category ${categoryId}:`, keywordsError);
    return null;
  }

  debugLog(`Found ${keywords?.length || 0} keywords for category ${categoryId}`);
  return keywords || [];
}

// Fetch active localities for a WordPress config
async function getLocalities(supabase, wordpressConfigId) {
  const { data: localities, error: localitiesError } = await supabase
    .from('localities')
    .select('*')
    .eq('wordpress_config_id', wordpressConfigId)
    .eq('active', true);

  if (localitiesError) {
    debugLog(`Error fetching localities for config ${wordpressConfigId}:`, localitiesError);
    return null;
  }

  debugLog(`Found ${localities?.length || 0} active localities for config ${wordpressConfigId}`);
  return localities || [];
}

// Create a new generation with random content selections
async function createGeneration(supabase, wordpressConfigId, categoryId, keywordId, localityId) {
  debugLog(`Creating generation for config ${wordpressConfigId}`, {
    categoryId,
    keywordId: keywordId || 'none',
    localityId: localityId || 'none'
  });

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
    debugLog(`Error creating generation for config ${wordpressConfigId}:`, generationError);
    return null;
  }

  debugLog(`Successfully created generation ${generation.id} for WordPress config ${wordpressConfigId}`);
  return generation;
}

// Generate a draft using the tome-generate-draft function
async function generateDraft(supabase, generationId, debug = false) {
  try {
    debugLog(`Invoking tome-generate-draft for generation ${generationId}`);
    const { data: draftData, error: draftError } = await supabase.functions.invoke('tome-generate-draft', {
      body: { 
        generationId,
        timestamp: new Date().getTime(), // Add timestamp to avoid caching
        debug
      }
    });
    
    if (draftError) {
      debugLog(`Error generating draft for generation ${generationId}:`, draftError);
      await updateGenerationStatus(supabase, generationId, 'failed', draftError.message || 'Error invoking tome-generate-draft');
      return false;
    }
    
    if (draftData && draftData.error) {
      debugLog(`Draft API returned error for generation ${generationId}:`, draftData.error);
      await updateGenerationStatus(supabase, generationId, 'failed', draftData.error);
      return false;
    }

    debugLog(`Successfully generated draft for generation ${generationId}`);
    return true;
  } catch (error) {
    debugLog(`Exception when generating draft for ${generationId}:`, error);
    await updateGenerationStatus(supabase, generationId, 'failed', error.message || 'Exception in tome-generate-draft');
    return false;
  }
}

// Update generation status in case of error
async function updateGenerationStatus(supabase, generationId, status, errorMessage = null) {
  const updateData: any = { status };
  if (errorMessage) {
    updateData.error_message = errorMessage.substring(0, 255); // Limit the length
  }
  
  debugLog(`Updating generation ${generationId} status to ${status}${errorMessage ? ' with error' : ''}`);
  
  await supabase
    .from('tome_generations')
    .update(updateData)
    .eq('id', generationId);
}

// Process a single automation setting
async function processAutomationSetting(supabase, setting, apiKeyUsed, forceGeneration, debug = false) {
  const processingResult = {
    configId: setting.wordpress_config_id,
    result: 'skipped',
    reason: '',
    success: false
  };

  const wordpressConfigId = setting.wordpress_config_id;
  const frequency = setting.frequency;
  
  // If an API key was used, only process the corresponding automation
  if (apiKeyUsed && setting.api_key !== apiKeyUsed) {
    debugLog(`Skipping automation for WordPress config ${wordpressConfigId}, not matching API key`);
    processingResult.reason = 'api_key_mismatch';
    return processingResult;
  }

  debugLog(`Processing automation for WordPress config ${wordpressConfigId} with frequency ${frequency}`);

  try {
    // Check if it's time to generate content based on frequency
    const lastGeneration = await getLastGeneration(supabase, wordpressConfigId);
    
    // ALWAYS generate content if forceGeneration is true
    const shouldGenerate = forceGeneration || shouldGenerateContent(lastGeneration, frequency);
    
    if (!shouldGenerate) {
      debugLog(`Skipping generation for config ${wordpressConfigId}, not due yet`);
      processingResult.reason = 'frequency_not_reached';
      return processingResult;
    }

    debugLog(`Generating content for WordPress config ${wordpressConfigId}`);
    processingResult.result = 'processing';

    // Get categories for content generation
    const categories = await getCategories(supabase, wordpressConfigId);
    if (!categories || categories.length === 0) {
      debugLog(`No categories found for config ${wordpressConfigId}`);
      processingResult.result = 'failed';
      processingResult.reason = 'no_categories';
      return processingResult;
    }

    // Randomly select a category
    const randomCategoryIndex = Math.floor(Math.random() * categories.length);
    const selectedCategory = categories[randomCategoryIndex];
    const categoryId = selectedCategory.category_id;
    
    debugLog(`Selected category ${selectedCategory.category_name} (${categoryId}) for config ${wordpressConfigId}`);

    // Get keywords for the selected category
    const categoryKeywords = await getKeywordsForCategory(supabase, wordpressConfigId, categoryId);
    
    // Select random keyword if available
    let keywordId = null;
    if (categoryKeywords && categoryKeywords.length > 0) {
      const randomKeywordIndex = Math.floor(Math.random() * categoryKeywords.length);
      keywordId = categoryKeywords[randomKeywordIndex].id;
      debugLog(`Selected keyword "${categoryKeywords[randomKeywordIndex].keyword}" (${keywordId})`);
    } else {
      debugLog(`No keywords found for category ${categoryId}`);
    }
    
    // Get localities for the config
    const localities = await getLocalities(supabase, wordpressConfigId);
    
    // Select random locality if available
    let localityId = null;
    if (localities && localities.length > 0) {
      const randomLocalityIndex = Math.floor(Math.random() * localities.length);
      localityId = localities[randomLocalityIndex].id;
      debugLog(`Selected locality "${localities[randomLocalityIndex].name}" (${localityId})`);
    } else {
      debugLog(`No localities found for config ${wordpressConfigId}`);
    }

    // Create a new generation entry
    const generation = await createGeneration(supabase, wordpressConfigId, categoryId, keywordId, localityId);
    if (!generation) {
      processingResult.result = 'failed';
      processingResult.reason = 'generation_creation_failed';
      return processingResult;
    }

    // Generate the draft content
    const generationSuccess = await generateDraft(supabase, generation.id, debug);
    
    if (generationSuccess) {
      debugLog(`Successfully generated content for config ${wordpressConfigId}`);
      processingResult.result = 'success';
      processingResult.success = true;
    } else {
      debugLog(`Failed to generate content for config ${wordpressConfigId}`);
      processingResult.result = 'failed';
      processingResult.reason = 'content_generation_failed';
    }
    
    return processingResult;
  } catch (error) {
    debugLog(`Error processing automation for config ${wordpressConfigId}:`, error);
    processingResult.result = 'error';
    processingResult.reason = error.message || 'unknown_error';
    return processingResult;
  }
}

// Main function to run the scheduler
async function runScheduler(supabase, automationSettings, apiKey, forceGeneration, debug = false) {
  let generationsCreated = 0;
  const processingDetails = [];

  // Process each automation setting
  for (const setting of automationSettings) {
    try {
      const result = await processAutomationSetting(supabase, setting, apiKey, forceGeneration, debug);
      processingDetails.push(result);
      
      if (result.success) {
        generationsCreated++;
      }
    } catch (error) {
      debugLog(`Error processing automation for config ${setting.wordpress_config_id}:`, error);
      processingDetails.push({
        configId: setting.wordpress_config_id,
        result: 'error',
        reason: error.message || 'unknown_error',
        success: false
      });
      // Continue with other settings
    }
  }

  return { generationsCreated, processingDetails };
}

// Main handler for the edge function
serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    debugLog("Tome-scheduler function starting execution");
    
    // Initialize Supabase client
    const supabase = initSupabaseClient();
    
    // Parse request parameters
    const { isConfigCheck, forceGeneration, apiKey, timestamp, debug } = await parseRequestParams(req);
    
    // Validate API key if provided
    let effectiveForceGeneration = forceGeneration;
    let targetConfigId = null;
    
    if (apiKey) {
      const validation = await validateApiKey(supabase, apiKey);
      
      if (!validation.valid) {
        return new Response(
          JSON.stringify({
            success: false,
            message: validation.message,
            timestamp: new Date().toISOString()
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403,
          }
        );
      }
      
      effectiveForceGeneration = validation.forceGeneration;
      if (validation.automationWithKey) {
        targetConfigId = validation.automationWithKey.wordpress_config_id;
      }
    }

    // Get enabled automation settings
    let automationSettings = await getEnabledAutomationSettings(supabase);
    
    // If using API key with a specific config, filter settings
    if (targetConfigId) {
      automationSettings = automationSettings.filter(s => s.wordpress_config_id === targetConfigId);
      debugLog(`Filtered settings to only include config ${targetConfigId}`);
    }

    if (!automationSettings || automationSettings.length === 0) {
      debugLog("No enabled automation settings found");
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No enabled automation settings found',
          generationsCreated: 0,
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    debugLog(`Found ${automationSettings.length} enabled automation settings`);
    
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
    const { generationsCreated, processingDetails } = await runScheduler(
      supabase, 
      automationSettings, 
      apiKey, 
      effectiveForceGeneration,
      debug
    );

    // Return successful response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Scheduler run completed. Created ${generationsCreated} generations.`,
        generationsCreated,
        processingDetails: debug ? processingDetails : undefined,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    debugLog('Error in tome-scheduler function:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'An error occurred during scheduling',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
