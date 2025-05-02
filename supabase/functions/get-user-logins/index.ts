
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders, errorResponse, handleCorsOptions } from "../utils/errorHandling.ts";

serve(async (req) => {
  // Gestion des requêtes CORS preflight
  if (req.method === 'OPTIONS') {
    return handleCorsOptions();
  }

  try {
    // Créer un client Supabase avec la clé de service de façon sécurisée
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Vérifier que la requête provient d'un utilisateur admin authentifié
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error('Unauthorized');
    }
    
    // Vérifier si l'utilisateur est admin
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile || profile.role !== 'admin') {
      throw new Error('Unauthorized - admin access required');
    }

    // Récupérer les utilisateurs et leurs derniers temps de connexion
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      throw authError;
    }
    
    // Retourner uniquement les informations nécessaires
    const usersWithLastLogin = authUsers.users.map(user => ({
      id: user.id,
      last_sign_in_at: user.last_sign_in_at
    }));

    return new Response(
      JSON.stringify(usersWithLastLogin),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );
  } catch (error) {
    // Utilise notre système de gestion d'erreurs sécurisé
    const status = error.message === 'Unauthorized' ? 401 : 500;
    return errorResponse(error, status);
  }
});
