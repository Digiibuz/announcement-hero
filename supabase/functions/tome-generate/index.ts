import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import 'https://deno.land/x/xhr@0.1.0/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Amélioration pour les logs
const debugLog = (message: string, data?: any) => {
  try {
    if (data) {
      console.log(`[tome-generate] ${message}:`, JSON.stringify(data));
    } else {
      console.log(`[tome-generate] ${message}`);
    }
  } catch (e) {
    console.log(`[tome-generate] ${message} (données non affichables)`);
  }
};

serve(async (req) => {
  debugLog("Fonction tome-generate démarrée");
  
  if (req.method === 'OPTIONS') {
    debugLog("Requête OPTIONS reçue - CORS");
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // IMPORTANT: Log complet du corps de la requête
    const reqRaw = await req.text();
    debugLog("Corps de la requête brut:", reqRaw);
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL or key not found');
    }

    if (!openaiApiKey) {
      throw new Error('OpenAI API key not found');
    }

    debugLog("Variables d'environnement validées");
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Parser le corps à nouveau
    let requestBody;
    try {
      requestBody = JSON.parse(reqRaw);
    } catch (e) {
      debugLog("Erreur de parsing JSON, nouvelle tentative avec req.json()");
      const reqClone = new Request(req.url, {
        method: req.method,
        headers: req.headers,
        body: reqRaw
      });
      requestBody = await reqClone.json();
    }
    
    const { generationId } = requestBody;
    
    debugLog("Corps de la requête parsé", requestBody);

    if (!generationId) {
      throw new Error('Generation ID is required');
    }

    debugLog(`Récupération des données pour la génération ${generationId}`);
    const { data: generation, error: generationError } = await supabase
      .from('tome_generations')
      .select('*')
      .eq('id', generationId)
      .single();

    if (generationError || !generation) {
      debugLog("Erreur lors de la récupération de la génération", generationError);
      throw new Error('Generation not found: ' + (generationError?.message || 'Unknown error'));
    }

    debugLog(`Génération trouvée`, generation);
    await supabase
      .from('tome_generations')
      .update({ status: 'processing' })
      .eq('id', generationId);
    debugLog(`Statut mis à jour à 'processing'`);

    const { data: wpConfig, error: wpConfigError } = await supabase
      .from('wordpress_configs')
      .select('*')
      .eq('id', generation.wordpress_config_id)
      .single();

    if (wpConfigError || !wpConfig) {
      debugLog("Erreur lors de la récupération de la config WordPress", wpConfigError);
      throw new Error('WordPress config not found');
    }

    debugLog(`Configuration WordPress trouvée`, {
      configId: wpConfig.id,
      siteUrl: wpConfig.site_url
    });

    const { data: categoryKeyword, error: categoryError } = await supabase
      .from('categories_keywords')
      .select('category_name, keyword')
      .eq('id', generation.keyword_id)
      .single();

    if (categoryError) {
      debugLog('Error fetching category:', categoryError.message);
    }

    const categoryName = categoryKeyword?.category_name || 'Non spécifiée';
    const keyword = categoryKeyword?.keyword || null;
    debugLog(`Catégorie: ${categoryName}, Mot-clé: ${keyword || 'aucun'}`);

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
        debugLog(`Localité: ${localityName}`);
      }
    }

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
    
    debugLog("Appel à l'API OpenAI");
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
    debugLog("Réponse reçue de OpenAI", { status: completion.error ? 'error' : 'success' });
    
    if (!completion.choices || completion.choices.length === 0) {
      debugLog("Erreur: Pas de contenu généré par OpenAI", completion);
      throw new Error('Failed to generate content with OpenAI');
    }
    
    const generatedContent = completion.choices[0].message.content;
    debugLog("Contenu généré avec succès");
    
    let title = "Nouveau contenu généré";
    const titleMatch = generatedContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
    if (titleMatch && titleMatch[1]) {
      title = titleMatch[1].replace(/<[^>]*>/g, '').trim();
      debugLog(`Titre extrait: ${title}`);
    }

    const siteUrl = wpConfig.site_url.endsWith('/')
      ? wpConfig.site_url.slice(0, -1)
      : wpConfig.site_url;
    
    let apiEndpoint = '/wp-json/wp/v2/pages';
    debugLog(`URL WordPress: ${siteUrl}`);
    
    const browserLikeHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'application/json, text/plain, */*',
      'Accept-Language': 'fr,fr-FR;q=0.9,en-US;q=0.8,en;q=0.7',
      'Referer': siteUrl,
      'Origin': siteUrl,
      'DNT': '1',
      'Connection': 'keep-alive',
      'Sec-Fetch-Dest': 'empty',
      'Sec-Fetch-Mode': 'cors',
      'Sec-Fetch-Site': 'same-origin',
    };
    
    if (wpConfig.app_username && wpConfig.app_password) {
      const credentials = btoa(`${wpConfig.app_username}:${wpConfig.app_password}`);
      browserLikeHeaders['Authorization'] = `Basic ${credentials}`;
      debugLog("Authentification Basic configurée");
    } else {
      debugLog("ERREUR: Identifiants WordPress non configurés");
      throw new Error('WordPress API credentials not configured');
    }
    
    const postData = {
      title: title,
      content: generatedContent,
      status: 'publish',
      categoryId: generation.category_id,
    };
    
    debugLog("Données à publier préparées", { title, categoryId: generation.category_id, status: 'publish' });
    
    try {
      debugLog("Attente de 3 secondes avant de contacter WordPress...");
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      debugLog("Test de l'API DipiPixel...");
      const testResponse = await fetch(`${siteUrl}/wp-json/wp/v2/dipi_cpt_category`, {
        method: 'HEAD',
        headers: browserLikeHeaders
      });
      
      debugLog(`Test DipiPixel: ${testResponse.status}`);
      
      if (testResponse.status !== 404) {
        debugLog("DipiPixel détecté, utilisation de l'API dipi_cpt");
        apiEndpoint = '/wp-json/wp/v2/dipi_cpt';
        postData["dipi_cpt_category"] = [parseInt(generation.category_id)];
      }
    } catch (error) {
      debugLog("Error checking for DipiPixel:", error);
    }
    
    try {
      debugLog(`Publication sur WordPress: ${siteUrl}${apiEndpoint}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);
      
      const wpResponse = await fetch(`${siteUrl}${apiEndpoint}`, {
        method: 'POST',
        headers: browserLikeHeaders,
        body: JSON.stringify(postData),
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);
      
      if (!wpResponse.ok) {
        const errorText = await wpResponse.text();
        debugLog(`Erreur API WordPress: ${wpResponse.status}`, errorText);
        throw new Error(`WordPress API error: ${wpResponse.status} - ${errorText}`);
      }
      
      const wpData = await wpResponse.json();
      debugLog("Publication WordPress réussie", { postId: wpData.id, link: wpData.link });
      
      await supabase
        .from('tome_generations')
        .update({ 
          status: 'published',
          wordpress_post_id: wpData.id,
          published_at: new Date().toISOString()
        })
        .eq('id', generationId);
      
      debugLog("Mise à jour du statut à 'published' dans la base de données");
      
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
    } catch (wpError) {
      debugLog("WordPress API error:", wpError);
      
      const errorMessage = wpError.message || "";
      if (errorMessage.includes("<!DOCTYPE HTML>") || errorMessage.includes("<html")) {
        debugLog("Erreur: Le pare-feu WordPress (WAF) a bloqué notre requête");
        throw new Error("Le pare-feu WordPress (WAF) a bloqué notre requête. Veuillez essayer depuis l'interface d'administration WordPress.");
      }
      
      throw wpError;
    }
  } catch (error) {
    debugLog('Error in tome-generate function:', error);
    
    let errorMessage = error.message || 'An error occurred during generation';
    let friendlyMessage = errorMessage;
    
    if (errorMessage.includes("WAF") || errorMessage.includes("pare-feu")) {
      friendlyMessage = "Le pare-feu WordPress (WAF) bloque notre requête. Vous devrez peut-être publier manuellement depuis WordPress.";
    } else if (errorMessage.includes("timeout") || errorMessage.includes("abort")) {
      friendlyMessage = "Délai d'attente dépassé lors de la connexion à WordPress. Veuillez vérifier l'URL et les identifiants.";
    } else if (errorMessage.includes("503")) {
      friendlyMessage = "Le serveur WordPress est temporairement indisponible (erreur 503). Veuillez réessayer plus tard.";
    }
    
    try {
      const reqClone2 = req.clone();
      const { generationId } = await reqClone2.json();
      
      if (generationId) {
        debugLog(`Mise à jour du statut de la génération ${generationId} à 'failed'`);
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
        
        if (supabaseUrl && supabaseKey) {
          const supabase = createClient(supabaseUrl, supabaseKey);
          await supabase
            .from('tome_generations')
            .update({ 
              status: 'failed',
              error_message: friendlyMessage.substring(0, 255)
            })
            .eq('id', generationId);
        }
      }
    } catch (updateError) {
      debugLog('Error updating generation status:', updateError);
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
