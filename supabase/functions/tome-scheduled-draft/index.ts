
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.1';
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import 'https://deno.land/x/xhr@0.1.0/mod.ts';

// Cette fonction sera exécutée selon une planification cron
serve(async (req) => {
  console.log("Démarrage de la génération de brouillon planifiée");
  
  try {
    // Récupérer les clés d'API des variables d'environnement
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase URL ou clé non trouvée');
    }

    // Initialiser le client Supabase
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Récupérer toutes les configurations WordPress actives qui ont l'automatisation activée
    const { data: automationSettings, error: automationError } = await supabase
      .from('tome_automation')
      .select('wordpress_config_id, frequency')
      .eq('is_enabled', true);

    if (automationError) {
      console.error("Erreur lors de la récupération des paramètres d'automatisation:", automationError);
      throw new Error('Erreur lors de la récupération des paramètres d\'automatisation: ' + automationError.message);
    }

    console.log(`Trouvé ${automationSettings?.length || 0} paramètres d'automatisation actifs:`, automationSettings);

    if (!automationSettings || automationSettings.length === 0) {
      console.log("Aucun paramètre d'automatisation activé trouvé");
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Aucun paramètre d\'automatisation activé trouvé',
          generationsCreated: 0
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }

    let generationsCreated = 0;

    // Traiter chaque paramètre d'automatisation
    for (const setting of automationSettings) {
      const wordpressConfigId = setting.wordpress_config_id;
      
      console.log(`Traitement de l'automatisation pour WordPress config ${wordpressConfigId}`);
      
      // Vérifier si des catégories et mots-clés sont disponibles
      const { data: categories, error: categoriesError } = await supabase
        .from('categories_keywords')
        .select('category_id')
        .eq('wordpress_config_id', wordpressConfigId)
        .limit(1);

      if (categoriesError || !categories || categories.length === 0) {
        console.error(`Aucune catégorie trouvée pour config ${wordpressConfigId}`);
        continue;
      }

      // Obtenir tous les mots-clés pour cette configuration WordPress
      const { data: keywords, error: keywordsError } = await supabase
        .from('categories_keywords')
        .select('*')
        .eq('wordpress_config_id', wordpressConfigId);

      if (keywordsError) {
        console.error(`Erreur lors de la récupération des mots-clés pour config ${wordpressConfigId}:`, keywordsError);
        continue;
      }

      // Obtenir toutes les localités actives pour cette configuration WordPress
      const { data: localities, error: localitiesError } = await supabase
        .from('localities')
        .select('*')
        .eq('wordpress_config_id', wordpressConfigId)
        .eq('active', true);

      if (localitiesError) {
        console.error(`Erreur lors de la récupération des localités pour config ${wordpressConfigId}:`, localitiesError);
        continue;
      }

      // Sélectionner une catégorie, un mot-clé et une localité aléatoires
      const categoryId = categories[0].category_id;
      
      // Filtrer les mots-clés par catégorie
      const categoryKeywords = keywords.filter(k => k.category_id === categoryId);
      
      // Sélectionner un mot-clé aléatoire si disponible
      let keywordId = null;
      if (categoryKeywords && categoryKeywords.length > 0) {
        const randomKeywordIndex = Math.floor(Math.random() * categoryKeywords.length);
        keywordId = categoryKeywords[randomKeywordIndex].id;
      }
      
      // Sélectionner une localité aléatoire si disponible
      let localityId = null;
      if (localities && localities.length > 0) {
        const randomLocalityIndex = Math.floor(Math.random() * localities.length);
        localityId = localities[randomLocalityIndex].id;
      }

      // Créer une nouvelle entrée de génération
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
        console.error(`Erreur lors de la création de la génération pour config ${wordpressConfigId}:`, generationError);
        continue;
      }

      console.log(`Génération ${generation.id} créée pour WordPress config ${wordpressConfigId}`);

      // Appeler tome-generate-draft pour créer le contenu (utilisant l'IA) mais PAS pour publier
      const { error: draftError } = await supabase.functions.invoke('tome-generate-draft', {
        body: { generationId: generation.id }
      });
      
      if (draftError) {
        console.error(`Erreur lors de la génération du brouillon pour génération ${generation.id}:`, draftError);
        continue;
      }

      console.log(`Brouillon généré avec succès pour génération ${generation.id}`);
      generationsCreated++;
    }

    // Retourner une réponse réussie
    return new Response(
      JSON.stringify({
        success: true,
        message: `Exécution du planificateur terminée. Créé ${generationsCreated} génération(s).`,
        generationsCreated
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error: any) {
    console.error('Erreur dans la fonction tome-scheduled-draft:', error);
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || 'Une erreur est survenue pendant la planification'
      }),
      {
        headers: { 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
