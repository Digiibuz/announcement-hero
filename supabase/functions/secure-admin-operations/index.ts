
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Créer un client Supabase avec la clé de service (sécurisé, côté serveur uniquement)
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";
    
    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Variables d\'environnement Supabase manquantes');
    }
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Vérifier l'authentification
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('En-tête d\'autorisation manquant');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Accès non autorisé');
    }

    // Vérifier si l'utilisateur est administrateur
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profileError) {
      throw new Error('Erreur lors de la vérification du profil utilisateur');
    }
    
    if (profile?.role !== 'admin') {
      throw new Error('Accès non autorisé - rôle admin requis');
    }

    // Récupérer l'opération à partir de la requête
    const { operation, data } = await req.json();

    // Effectuer l'opération demandée de manière sécurisée
    let result;
    switch (operation) {
      case 'getUsersWithRoles':
        // Exemple d'opération administrative sécurisée
        const { data: users, error: usersError } = await supabase.auth.admin.listUsers();
        
        if (usersError) throw usersError;
        
        // Récupérer les profils correspondants pour obtenir les rôles
        const userIds = users.users.map(user => user.id);
        
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, role, name, email')
          .in('id', userIds);
          
        if (profilesError) throw profilesError;
        
        result = { users: users.users, profiles };
        break;
        
      // Ajoutez d'autres opérations sécurisées selon vos besoins
        
      default:
        throw new Error(`Opération inconnue: ${operation}`);
    }

    // Renvoyer le résultat
    return new Response(
      JSON.stringify(result),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );
  } catch (error) {
    console.error('Erreur dans les opérations sécurisées:', error);
    
    return new Response(
      JSON.stringify({ error: error.message || 'Une erreur inattendue s\'est produite' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: error.message === 'Accès non autorisé' ? 401 : 500
      }
    );
  }
});
