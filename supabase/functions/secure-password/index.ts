
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Variables d'environnement pour Supabase
const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

// Créer un client Supabase avec la clé de service role
const supabase = createClient(supabaseUrl, supabaseKey);

// Fonction pour générer un suffixe aléatoire
function generateRandomSuffix(minLength = 5, maxLength = 10) {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  const length = Math.floor(Math.random() * (maxLength - minLength + 1)) + minLength;
  let result = "";
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

// Fonction pour vérifier les identifiants avec signInWithPassword
async function verifyCredentials(email: string, password: string) {
  try {
    // Essayer de se connecter avec les identifiants fournis
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error(`Échec de connexion: ${error.message}`);
      return { success: false, error: error.message };
    }

    if (!data || !data.user) {
      console.error("Aucun utilisateur trouvé après connexion");
      return { success: false, error: "Aucun utilisateur trouvé" };
    }

    console.log(`Vérification des identifiants réussie pour: ${email}`);
    
    // Délogger immédiatement l'utilisateur après vérification
    await supabase.auth.admin.signOut(data.user.id);
    
    return { 
      success: true, 
      user: data.user, 
      session: data.session 
    };
  } catch (error: any) {
    console.error(`Erreur lors de la vérification: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// Fonction pour renforcer un mot de passe avec un suffixe
export function securePassword(password: string): string {
  if (!password) return password;
  
  const suffix = generateRandomSuffix();
  console.log(`Renforcement du mot de passe avec suffixe de ${suffix.length} caractères`);
  return `${password}${suffix}`;
}

serve(async (req) => {
  // Gérer les requêtes CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    // Récupérer les données de la requête
    const { email, password } = await req.json();
    
    if (!email || !password) {
      console.error("Email ou mot de passe manquant");
      return new Response(
        JSON.stringify({ error: "Email et mot de passe requis" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`Vérification des identifiants pour: ${email}`);
    
    // Vérifier les identifiants
    const verification = await verifyCredentials(email, password);
    
    if (!verification.success) {
      console.error(`Échec de vérification pour ${email}: ${verification.error}`);
      return new Response(
        JSON.stringify({ 
          error: "Identifiants invalides", 
          details: verification.error 
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Les identifiants sont corrects, renforcer le mot de passe avec un suffixe pour la session
    console.log(`Identifiants vérifiés avec succès pour ${email}, génération du suffixe`);
    const securedPassword = securePassword(password);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        securedPassword,
        user: verification.user,
        originalPassword: password // Inclure le mot de passe original pour faciliter l'authentification
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error(`Erreur serveur: ${error.message}`);
    
    return new Response(
      JSON.stringify({ error: "Erreur lors du traitement de la demande", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
