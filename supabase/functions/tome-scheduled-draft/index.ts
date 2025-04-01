
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
    
    // Vérifier s'il y a des générations planifiées à exécuter maintenant
    const now = new Date();
    const { data: automations, error: fetchError } = await supabase
      .from('tome_automation')
      .select('*')
      .eq('is_enabled', true)
      .not('next_generation_time', 'is', null)
      .lt('next_generation_time', now.toISOString());
    
    if (fetchError) {
      throw new Error(`Erreur lors de la recherche d'automatisations à exécuter: ${fetchError.message}`);
    }
    
    console.log(`Trouvé ${automations?.length || 0} automatisations à exécuter`);
    
    if (!automations || automations.length === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          message: "Aucune automatisation à exécuter pour le moment",
          generationsCreated: 0
        }),
        {
          headers: { 'Content-Type': 'application/json' },
          status: 200,
        }
      );
    }
    
    let generationsCreated = 0;
    
    // Exécuter chaque automatisation due
    for (const automation of automations) {
      console.log(`Exécution de l'automatisation pour ${automation.wordpress_config_id}`);
      
      // Mettre à jour la prochaine heure de génération
      if (automation.frequency) {
        const nextGenerationTime = new Date(Date.now() + (automation.frequency * 60 * 1000)).toISOString();
        
        await supabase
          .from('tome_automation')
          .update({ next_generation_time: nextGenerationTime })
          .eq('id', automation.id);
          
        console.log(`Prochaine génération pour ${automation.wordpress_config_id} planifiée à ${nextGenerationTime}`);
      }
      
      // Appeler tome-scheduler pour générer le contenu
      const { data, error } = await supabase.functions.invoke('tome-scheduler', {
        body: { 
          forceGeneration: true,
          configId: automation.wordpress_config_id 
        }
      });
      
      if (error) {
        console.error(`Erreur lors de l'appel au planificateur pour ${automation.wordpress_config_id}:`, error);
        continue;
      }
      
      console.log(`Génération pour ${automation.wordpress_config_id} terminée:`, data);
      generationsCreated += data?.generationsCreated || 0;
    }
    
    // Retourner une réponse réussie
    return new Response(
      JSON.stringify({
        success: true,
        message: `Planification exécutée avec succès. ${generationsCreated} génération(s) créée(s).`,
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
