
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
    
    // On appelle directement la fonction tome-scheduler avec forceGeneration=true
    // Cela permet de générer un brouillon sans vérifier les fréquences
    const { data, error } = await supabase.functions.invoke('tome-scheduler', {
      body: { forceGeneration: true }
    });
    
    if (error) {
      console.error("Erreur lors de l'appel au planificateur:", error);
      throw new Error('Erreur lors de l\'appel au planificateur: ' + error.message);
    }
    
    console.log("Résultat de l'exécution planifiée:", data);
    
    // Retourner une réponse réussie
    return new Response(
      JSON.stringify({
        success: true,
        message: `Planification exécutée avec succès. ${data?.generationsCreated || 0} génération(s) créée(s).`,
        generationsCreated: data?.generationsCreated || 0
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
