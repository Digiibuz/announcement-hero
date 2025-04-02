
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
  // Si pas de génération précédente, toujours générer
  if (!lastGeneration || lastGeneration.length === 0) {
    debugLog("Aucune génération précédente trouvée, contenu sera généré");
    return true;
  }

  const lastGenerationDate = new Date(lastGeneration[0].created_at);
  const now = new Date();
  
  // Calculer la différence de temps en millisecondes
  const diffTime = Math.abs(now.getTime() - lastGenerationDate.getTime());
  
  // Si la fréquence est inférieure à 1, elle représente des fractions de jour
  // Par exemple, 0.0007 ~ 1 minute (1/1440 jour), 0.01 ~ 15 minutes (15/1440 jour)
  if (frequency < 1) {
    // Convertir en minutes pour une meilleure lisibilité dans les logs
    const diffMinutes = Math.floor(diffTime / (1000 * 60));
    const frequencyMinutes = Math.floor(frequency * 24 * 60); // Convertir en minutes
    
    debugLog(`Dernière génération il y a ${diffMinutes} minutes, fréquence configurée: ${frequencyMinutes} minutes (${frequency} jours)`);
    
    // Comparer les minutes directement au lieu des jours fractionnaires
    return diffMinutes >= frequencyMinutes;
  }
  
  // Pour les fréquences en jours
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  debugLog(`Dernière génération il y a ${diffDays} jours, fréquence configurée: ${frequency} jours`);
  return diffDays >= frequency;
}

// Initialiser le client Supabase avec les variables d'environnement
function initSupabaseClient() {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('URL ou clé Supabase non trouvée');
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
    debugLog("Corps de la requête:", body);
  } catch (e) {
    // If no JSON body or parsing error, not a config check
    debugLog("Pas de corps JSON ou erreur d'analyse, exécution régulière supposée");
  }
  
  debugLog("Valeurs des paramètres - isConfigCheck:", isConfigCheck, "forceGeneration:", forceGeneration, "timestamp:", timestamp, "debug:", debug);
  
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
    debugLog("Clé API invalide:", apiKey);
    throw new Error('Clé API invalide');
  }
  
  debugLog("Clé API valide pour l'automatisation:", automationWithKey.id);
  
  // If API key is valid but automation is disabled
  if (!automationWithKey.is_enabled) {
    return { 
      valid: false, 
      message: 'L\'automatisation est désactivée pour cette clé API',
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
    debugLog("Erreur lors de la récupération des paramètres d'automatisation:", automationError);
    throw new Error('Erreur lors de la récupération des paramètres d\'automatisation: ' + automationError.message);
  }

  debugLog(`Trouvé ${automationSettings?.length || 0} paramètres d'automatisation:`, automationSettings);
  return automationSettings || [];
}

// Perform a configuration check without generating content
function handleConfigCheck(automationSettings) {
  return {
    success: true,
    message: 'Vérification de la configuration terminée avec succès',
    automationSettings,
    timestamp: new Date().toISOString()
  };
}

// Fetch the last generation for a config
async function getLastGeneration(supabase, wordpressConfigId) {
  try {
    const { data: lastGeneration, error: lastGenError } = await supabase
      .from('tome_generations')
      .select('created_at')
      .eq('wordpress_config_id', wordpressConfigId)
      .order('created_at', { ascending: false })
      .limit(1);

    if (lastGenError) {
      debugLog(`Erreur lors de la récupération de la dernière génération pour la config ${wordpressConfigId}:`, lastGenError);
      return null;
    }

    debugLog(`Dernière génération pour la config ${wordpressConfigId}:`, lastGeneration);
    return lastGeneration;
  } catch (error) {
    debugLog(`Exception lors de la récupération de la dernière génération pour la config ${wordpressConfigId}:`, error);
    return null;
  }
}

// Fetch categories for a WordPress config
async function getCategories(supabase, wordpressConfigId) {
  try {
    const { data: categories, error: categoriesError } = await supabase
      .from('categories_keywords')
      .select('category_id, category_name')
      .eq('wordpress_config_id', wordpressConfigId)
      .limit(50); // Get more to ensure we have enough unique categories

    if (categoriesError) {
      debugLog(`Erreur lors de la récupération des catégories pour la config ${wordpressConfigId}:`, categoriesError);
      return null;
    }

    // Get unique categories by ID
    const uniqueCategories = Array.from(
      new Map(categories?.map(cat => [cat.category_id, cat])).values()
    );

    debugLog(`Trouvé ${uniqueCategories.length} catégories uniques pour la config ${wordpressConfigId}`);
    return uniqueCategories;
  } catch (error) {
    debugLog(`Exception lors de la récupération des catégories pour la config ${wordpressConfigId}:`, error);
    return null;
  }
}

// Fetch keywords for a WordPress config category
async function getKeywordsForCategory(supabase, wordpressConfigId, categoryId) {
  try {
    const { data: keywords, error: keywordsError } = await supabase
      .from('categories_keywords')
      .select('*')
      .eq('wordpress_config_id', wordpressConfigId)
      .eq('category_id', categoryId);

    if (keywordsError) {
      debugLog(`Erreur lors de la récupération des mots-clés pour la catégorie ${categoryId}:`, keywordsError);
      return null;
    }

    debugLog(`Trouvé ${keywords?.length || 0} mots-clés pour la catégorie ${categoryId}`);
    return keywords || [];
  } catch (error) {
    debugLog(`Exception lors de la récupération des mots-clés pour la catégorie ${categoryId}:`, error);
    return null;
  }
}

// Fetch active localities for a WordPress config
async function getLocalities(supabase, wordpressConfigId) {
  try {
    const { data: localities, error: localitiesError } = await supabase
      .from('localities')
      .select('*')
      .eq('wordpress_config_id', wordpressConfigId)
      .eq('active', true);

    if (localitiesError) {
      debugLog(`Erreur lors de la récupération des localités pour la config ${wordpressConfigId}:`, localitiesError);
      return null;
    }

    debugLog(`Trouvé ${localities?.length || 0} localités actives pour la config ${wordpressConfigId}`);
    return localities || [];
  } catch (error) {
    debugLog(`Exception lors de la récupération des localités pour la config ${wordpressConfigId}:`, error);
    return null;
  }
}

// Create a new generation with random content selections
async function createGeneration(supabase, wordpressConfigId, categoryId, keywordId, localityId) {
  try {
    debugLog(`Création d'une génération pour la config ${wordpressConfigId}`, {
      categoryId,
      keywordId: keywordId || 'aucun',
      localityId: localityId || 'aucune'
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
      debugLog(`Erreur lors de la création d'une génération pour la config ${wordpressConfigId}:`, generationError);
      return null;
    }

    debugLog(`Génération ${generation.id} créée avec succès pour la config WordPress ${wordpressConfigId}`);
    return generation;
  } catch (error) {
    debugLog(`Exception lors de la création d'une génération pour la config ${wordpressConfigId}:`, error);
    return null;
  }
}

// Generate a draft using the tome-generate-draft function
async function generateDraft(supabase, generationId, debug = false) {
  try {
    debugLog(`Appel de tome-generate-draft pour la génération ${generationId}`);
    
    // Utiliser setTimeout pour laisser un peu de temps au système entre les opérations
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const { data: draftData, error: draftError } = await supabase.functions.invoke('tome-generate-draft', {
      body: { 
        generationId,
        timestamp: new Date().getTime(), // Add timestamp to avoid caching
        debug
      }
    });
    
    if (draftError) {
      debugLog(`Erreur lors de la génération du brouillon pour ${generationId}:`, draftError);
      await updateGenerationStatus(supabase, generationId, 'failed', draftError.message || 'Erreur lors de l\'appel à tome-generate-draft');
      return false;
    }
    
    if (draftData && draftData.error) {
      debugLog(`L'API de brouillon a retourné une erreur pour ${generationId}:`, draftData.error);
      await updateGenerationStatus(supabase, generationId, 'failed', draftData.error);
      return false;
    }

    debugLog(`Brouillon généré avec succès pour ${generationId}`);
    return true;
  } catch (error) {
    debugLog(`Exception lors de la génération du brouillon pour ${generationId}:`, error);
    await updateGenerationStatus(supabase, generationId, 'failed', error.message || 'Exception dans tome-generate-draft');
    return false;
  }
}

// Update generation status in case of error
async function updateGenerationStatus(supabase, generationId, status, errorMessage = null) {
  try {
    const updateData: any = { status };
    if (errorMessage) {
      updateData.error_message = errorMessage.substring(0, 255); // Limit the length
    }
    
    debugLog(`Mise à jour du statut de la génération ${generationId} à ${status}${errorMessage ? ' avec erreur' : ''}`);
    
    await supabase
      .from('tome_generations')
      .update(updateData)
      .eq('id', generationId);
  } catch (error) {
    debugLog(`Erreur lors de la mise à jour du statut pour ${generationId}:`, error);
  }
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
    debugLog(`Ignorer l'automatisation pour la config WordPress ${wordpressConfigId}, clé API non correspondante`);
    processingResult.reason = 'api_key_mismatch';
    return processingResult;
  }

  debugLog(`Traitement de l'automatisation pour la config WordPress ${wordpressConfigId} avec fréquence ${frequency}`);

  try {
    // Check if it's time to generate content based on frequency
    const lastGeneration = await getLastGeneration(supabase, wordpressConfigId);
    
    // ALWAYS generate content if forceGeneration is true
    const shouldGenerate = forceGeneration || shouldGenerateContent(lastGeneration, frequency);
    
    if (!shouldGenerate) {
      debugLog(`Ignorer la génération pour la config ${wordpressConfigId}, pas encore dû selon la fréquence`);
      processingResult.reason = 'frequency_not_reached';
      return processingResult;
    }

    debugLog(`Génération de contenu pour la config WordPress ${wordpressConfigId}`);
    processingResult.result = 'processing';

    // Get categories for content generation
    const categories = await getCategories(supabase, wordpressConfigId);
    if (!categories || categories.length === 0) {
      debugLog(`Aucune catégorie trouvée pour la config ${wordpressConfigId}`);
      processingResult.result = 'failed';
      processingResult.reason = 'no_categories';
      return processingResult;
    }

    // Randomly select a category
    const randomCategoryIndex = Math.floor(Math.random() * categories.length);
    const selectedCategory = categories[randomCategoryIndex];
    const categoryId = selectedCategory.category_id;
    
    debugLog(`Catégorie sélectionnée ${selectedCategory.category_name} (${categoryId}) pour la config ${wordpressConfigId}`);

    // Get keywords for the selected category
    const categoryKeywords = await getKeywordsForCategory(supabase, wordpressConfigId, categoryId);
    
    // Select random keyword if available
    let keywordId = null;
    if (categoryKeywords && categoryKeywords.length > 0) {
      const randomKeywordIndex = Math.floor(Math.random() * categoryKeywords.length);
      keywordId = categoryKeywords[randomKeywordIndex].id;
      debugLog(`Mot-clé sélectionné "${categoryKeywords[randomKeywordIndex].keyword}" (${keywordId})`);
    } else {
      debugLog(`Aucun mot-clé trouvé pour la catégorie ${categoryId}`);
    }
    
    // Get localities for the config
    const localities = await getLocalities(supabase, wordpressConfigId);
    
    // Select random locality if available
    let localityId = null;
    if (localities && localities.length > 0) {
      const randomLocalityIndex = Math.floor(Math.random() * localities.length);
      localityId = localities[randomLocalityIndex].id;
      debugLog(`Localité sélectionnée "${localities[randomLocalityIndex].name}" (${localityId})`);
    } else {
      debugLog(`Aucune localité trouvée pour la config ${wordpressConfigId}`);
    }

    // Create a new generation entry
    const generation = await createGeneration(supabase, wordpressConfigId, categoryId, keywordId, localityId);
    if (!generation) {
      processingResult.result = 'failed';
      processingResult.reason = 'generation_creation_failed';
      return processingResult;
    }

    // Pour éviter le timeout, retourner un résultat de succès immédiatement
    // et utiliser setTimeout pour lancer la génération en arrière-plan
    debugLog(`Lancement de la génération du brouillon pour ${generation.id} en arrière-plan`);
    
    // Si nous sommes dans un environnement Edge, utiliser Deno.EventSource.waitUntil
    if (typeof EdgeRuntime !== 'undefined') {
      debugLog("Utilisation de EdgeRuntime.waitUntil pour la génération du brouillon");
      EdgeRuntime.waitUntil((async () => {
        try {
          await generateDraft(supabase, generation.id, debug);
          debugLog(`Génération en arrière-plan terminée pour ${generation.id}`);
        } catch (e) {
          debugLog(`Erreur lors de la génération en arrière-plan pour ${generation.id}:`, e);
        }
      })());
    } else {
      // Sinon, utiliser setTimeout, mais cela ne garantit pas l'achèvement
      setTimeout(async () => {
        try {
          await generateDraft(supabase, generation.id, debug);
          debugLog(`Génération par setTimeout terminée pour ${generation.id}`);
        } catch (e) {
          debugLog(`Erreur lors de la génération par setTimeout pour ${generation.id}:`, e);
        }
      }, 100);
    }
    
    processingResult.result = 'success';
    processingResult.success = true;
    return processingResult;
  } catch (error) {
    debugLog(`Erreur lors du traitement de l'automatisation pour la config ${wordpressConfigId}:`, error);
    processingResult.result = 'error';
    processingResult.reason = error.message || 'unknown_error';
    return processingResult;
  }
}

// Main function to run the scheduler
async function runScheduler(supabase, automationSettings, apiKey, forceGeneration, debug = false) {
  let generationsCreated = 0;
  const processingDetails = [];

  debugLog(`Lancement du planificateur - forceGeneration: ${forceGeneration}, settings: ${automationSettings.length}`);

  try {
    // Pour éviter les timeouts, limiter le nombre de traitements simultanés
    const maxConcurrentProcessing = 1;
    
    // Traiter par lots pour éviter les timeouts
    for (let i = 0; i < automationSettings.length; i += maxConcurrentProcessing) {
      const batch = automationSettings.slice(i, i + maxConcurrentProcessing);
      debugLog(`Traitement du lot ${i / maxConcurrentProcessing + 1}, taille: ${batch.length}`);
      
      // Process each automation setting in the batch
      const results = await Promise.all(
        batch.map(setting => 
          processAutomationSetting(supabase, setting, apiKey, forceGeneration, debug)
        )
      );
      
      results.forEach(result => {
        processingDetails.push(result);
        if (result.success) {
          generationsCreated++;
        }
      });
      
      // Ajouter un petit délai entre les lots
      if (i + maxConcurrentProcessing < automationSettings.length) {
        debugLog(`Pause entre les lots de traitement (${i + maxConcurrentProcessing}/${automationSettings.length})`);
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
  } catch (error) {
    debugLog("Erreur lors de l'exécution du planificateur:", error);
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
    debugLog("Démarrage de la fonction tome-scheduler");
    
    // Début du minuteur pour le suivi des performances
    const startTime = performance.now();
    
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
      debugLog(`Filtrage des paramètres pour n'inclure que la config ${targetConfigId}`);
    }

    if (!automationSettings || automationSettings.length === 0) {
      debugLog("Aucun paramètre d'automatisation actif trouvé");
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Aucun paramètre d\'automatisation actif trouvé',
          generationsCreated: 0,
          timestamp: new Date().toISOString()
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    debugLog(`Trouvé ${automationSettings.length} paramètres d'automatisation actifs`);
    
    // If just a configuration check, don't generate content
    if (isConfigCheck) {
      const checkResult = handleConfigCheck(automationSettings);
      const elapsedTime = performance.now() - startTime;
      debugLog(`Vérification de la configuration terminée en ${elapsedTime.toFixed(1)}ms`);
      
      return new Response(
        JSON.stringify(checkResult),
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

    const elapsedTime = performance.now() - startTime;
    debugLog(`Exécution du planificateur terminée en ${elapsedTime.toFixed(1)}ms. ${generationsCreated} génération(s) créée(s).`);
    
    // Return successful response
    return new Response(
      JSON.stringify({
        success: true,
        message: `Exécution du planificateur terminée. ${generationsCreated} génération(s) créée(s).`,
        generationsCreated,
        processingDetails: debug ? processingDetails : undefined,
        executionTime: elapsedTime.toFixed(1),
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    debugLog('Erreur dans la fonction tome-scheduler:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Une erreur est survenue pendant la planification',
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
