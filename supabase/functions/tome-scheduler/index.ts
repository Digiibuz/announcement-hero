import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import 'https://deno.land/x/xhr@0.1.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function shouldGenerateContent(lastGeneration: any[], frequency: number): boolean {
  if (!lastGeneration || lastGeneration.length === 0) {
    console.log("No previous generations found, will generate content");
    return true;
  }

  const lastGenerationDate = new Date(lastGeneration[0].created_at);
  const now = new Date();
  
  const diffTime = Math.abs(now.getTime() - lastGenerationDate.getTime());
  
  if (frequency < 1) {
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const frequencyMinutes = Math.floor(frequency * 24 * 60);
    console.log(`Dernière génération il y a ${diffMinutes} minutes, fréquence configurée à ${frequencyMinutes} minutes (${frequency} jours)`);
    return diffMinutes >= frequencyMinutes;
  }
  
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  console.log(`Dernière génération il y a ${diffDays} jours, fréquence configurée à ${frequency} jours`);
  return diffDays >= frequency;
}

function initSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase URL or key not found');
  }

  return createClient(supabaseUrl, supabaseKey);
}

async function parseRequestParams(req: Request) {
  let isConfigCheck = false;
  let forceGeneration = false;
  let apiKey = null;
  let timestamp = new Date().getTime();

  try {
    const body = await req.json();
    isConfigCheck = body.configCheck === true;
    forceGeneration = body.forceGeneration === true;
    apiKey = body.api_key;
    timestamp = body.timestamp || timestamp;
    console.log("Request body:", body);
  } catch (e) {
    console.log("No JSON body or parsing error, assuming regular execution");
  }
  
  console.log("Parameter values - isConfigCheck:", isConfigCheck, "forceGeneration:", forceGeneration, "timestamp:", timestamp);
  
  return { isConfigCheck, forceGeneration, apiKey, timestamp };
}

async function validateApiKey(supabase, apiKey) {
  if (!apiKey) return { valid: true, forceGeneration: false };
  
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
  
  if (!automationWithKey.is_enabled) {
    return { 
      valid: false, 
      message: 'Automation is disabled for this API key',
      forceGeneration: false
    };
  }
  
  return { valid: true, forceGeneration: true, automationWithKey };
}

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

function handleConfigCheck(automationSettings) {
  return {
    success: true,
    message: 'Configuration check completed successfully',
    automationSettings
  };
}

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

async function generateDraft(supabase, generationId) {
  try {
    console.log(`Invoking tome-generate-draft for generation ${generationId}`);
    const { data: draftData, error: draftError } = await supabase.functions.invoke('tome-generate-draft', {
      body: { 
        generationId: generationId,
        timestamp: new Date().getTime()
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

async function updateGenerationStatus(supabase, generationId, status, errorMessage = null) {
  const updateData = { status };
  if (errorMessage) {
    updateData.error_message = errorMessage.substring(0, 255);
  }
  
  await supabase
    .from('tome_generations')
    .update(updateData)
    .eq('id', generationId);
}

async function processAutomationSetting(supabase, setting, apiKeyUsed, forceGeneration) {
  const wordpressConfigId = setting.wordpress_config_id;
  const frequency = setting.frequency;
  
  if (apiKeyUsed && setting.api_key !== apiKeyUsed) {
    console.log(`Skipping automation for WordPress config ${wordpressConfigId}, not matching API key`);
    return 0;
  }

  console.log(`Processing automation for WordPress config ${wordpressConfigId} with frequency ${frequency}`);

  const lastGeneration = await getLastGeneration(supabase, wordpressConfigId);
  if (!lastGeneration) return 0;

  const shouldGenerate = forceGeneration || shouldGenerateContent(lastGeneration, frequency);
  
  if (!shouldGenerate) {
    console.log(`Skipping generation for config ${wordpressConfigId}, not due yet`);
    return 0;
  }

  console.log(`Generating content for WordPress config ${wordpressConfigId}`);

  const categories = await getCategories(supabase, wordpressConfigId);
  if (!categories) return 0;

  const categoryId = categories[0].category_id;
  const categoryKeywords = await getKeywords(supabase, wordpressConfigId, categoryId);
  const localities = await getLocalities(supabase, wordpressConfigId);
  
  let keywordId = null;
  if (categoryKeywords && categoryKeywords.length > 0) {
    const randomKeywordIndex = Math.floor(Math.random() * categoryKeywords.length);
    keywordId = categoryKeywords[randomKeywordIndex].id;
  }
  
  let localityId = null;
  if (localities && localities.length > 0) {
    const randomLocalityIndex = Math.floor(Math.random() * localities.length);
    localityId = localities[randomLocalityIndex].id;
  }

  const generation = await createGeneration(supabase, wordpressConfigId, categoryId, keywordId, localityId);
  if (!generation) return 0;

  const success = await generateDraft(supabase, generation.id);
  
  return success ? 1 : 0;
}

async function runScheduler(supabase, automationSettings, apiKey, forceGeneration) {
  let generationsCreated = 0;
  const logs = [];

  for (const setting of automationSettings) {
    try {
      console.log(`Processing automation for WordPress config ${setting.wordpress_config_id} with frequency ${setting.frequency}`);
      
      if (apiKey && setting.api_key !== apiKey) {
        console.log(`Skipping automation for WordPress config ${setting.wordpress_config_id}, not matching API key`);
        logs.push(`Skipped processing for config ${setting.wordpress_config_id} (API key mismatch)`);
        continue;
      }

      const lastGeneration = await getLastGeneration(supabase, setting.wordpress_config_id);
      if (!lastGeneration) {
        logs.push(`No previous generations found for config ${setting.wordpress_config_id}`);
        continue;
      }

      const shouldGenerate = forceGeneration || shouldGenerateContent(lastGeneration, setting.frequency);
      
      if (!shouldGenerate) {
        console.log(`Skipping generation for config ${setting.wordpress_config_id}, not due yet`);
        
        const lastGenerationDate = new Date(lastGeneration[0].created_at);
        const nextGenerationDate = new Date(lastGenerationDate);
        
        if (setting.frequency < 1) {
          const minutesToAdd = Math.floor(setting.frequency * 24 * 60);
          nextGenerationDate.setMinutes(nextGenerationDate.getMinutes() + minutesToAdd);
        } else {
          nextGenerationDate.setDate(nextGenerationDate.getDate() + setting.frequency);
        }
        
        logs.push(`Skipped generation for config ${setting.wordpress_config_id}, next generation due at ${nextGenerationDate.toLocaleString()}`);
        continue;
      }

      logs.push(`Starting content generation for config ${setting.wordpress_config_id}`);
      console.log(`Generating content for WordPress config ${setting.wordpress_config_id}`);

      const categories = await getCategories(supabase, setting.wordpress_config_id);
      if (!categories) {
        logs.push(`Error: No categories found for config ${setting.wordpress_config_id}`);
        continue;
      }

      const categoryId = categories[0].category_id;
      const categoryKeywords = await getKeywords(supabase, setting.wordpress_config_id, categoryId);
      const localities = await getLocalities(supabase, setting.wordpress_config_id);
      
      let keywordId = null;
      if (categoryKeywords && categoryKeywords.length > 0) {
        const randomKeywordIndex = Math.floor(Math.random() * categoryKeywords.length);
        keywordId = categoryKeywords[randomKeywordIndex].id;
        logs.push(`Selected keyword ID: ${keywordId}`);
      }
      
      let localityId = null;
      if (localities && localities.length > 0) {
        const randomLocalityIndex = Math.floor(Math.random() * localities.length);
        localityId = localities[randomLocalityIndex].id;
        logs.push(`Selected locality ID: ${localityId}`);
      }

      const generation = await createGeneration(supabase, setting.wordpress_config_id, categoryId, keywordId, localityId);
      if (!generation) {
        logs.push(`Error: Failed to create generation record for config ${setting.wordpress_config_id}`);
        continue;
      }

      logs.push(`Created generation ${generation.id} for config ${setting.wordpress_config_id}`);
      
      logs.push(`Invoking draft generation for ID: ${generation.id}`);
      const success = await generateDraft(supabase, generation.id);
      
      if (success) {
        logs.push(`Successfully generated draft for ID: ${generation.id}`);
        generationsCreated++;
      } else {
        logs.push(`Failed to generate draft for ID: ${generation.id}`);
      }
    } catch (error) {
      console.error(`Error processing automation for config ${setting.wordpress_config_id}:`, error);
      logs.push(`Error processing config ${setting.wordpress_config_id}: ${error.message}`);
      // Continue with other settings
    }
  }

  return { generationsCreated, logs };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Tome-scheduler function starting execution");
    
    const supabase = initSupabaseClient();
    
    const { isConfigCheck, forceGeneration, apiKey, timestamp } = await parseRequestParams(req);
    
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

    const automationSettings = await getEnabledAutomationSettings(supabase);

    if (!automationSettings || automationSettings.length === 0) {
      console.log("No enabled automation settings found");
      return new Response(
        JSON.stringify({
          success: true,
          message: 'No enabled automation settings found',
          generationsCreated: 0,
          logs: ["No enabled automation settings found"]
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    console.log(`Found ${automationSettings.length} enabled automation settings`);
    
    if (isConfigCheck) {
      return new Response(
        JSON.stringify({
          ...handleConfigCheck(automationSettings),
          logs: [`Found ${automationSettings.length} automation settings`]
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }
    
    const { generationsCreated, logs } = await runScheduler(supabase, automationSettings, apiKey, effectiveForceGeneration);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Scheduler run completed. Created ${generationsCreated} generations.`,
        generationsCreated,
        logs,
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
        logs: [`Error: ${error.message || 'An error occurred during scheduling'}`],
        timestamp: new Date().getTime()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
