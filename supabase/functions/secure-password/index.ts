
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

// Fonction pour renforcer un mot de passe avec un suffixe
export function securePassword(password: string): string {
  if (!password) return password;
  
  const suffix = generateRandomSuffix();
  console.log(`Renforcement du mot de passe avec suffixe de ${suffix.length} caractères`);
  return `${password}${suffix}`;
}

// Fonction pour vérifier les identifiants directement sans renforcer le mot de passe
// Cette fonction vérifie uniquement si les identifiants sont valides
async function verifyCredentials(email: string, password: string): Promise<boolean> {
  try {
    console.log(`Vérification directe des identifiants pour: ${email}`);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });
    
    if (error) {
      console.error(`Échec de la vérification des identifiants: ${error.message}`);
      return false;
    }
    
    console.log(`Identifiants vérifiés avec succès pour: ${email}`);
    
    // N'oubliez pas de déconnecter cette session temporaire
    try {
      await supabase.auth.admin.signOut(data.session.access_token);
    } catch (err) {
      console.warn("Erreur lors de la déconnexion temporaire:", err);
    }
    
    return true;
  } catch (error) {
    console.error(`Erreur lors de la vérification des identifiants: ${error}`);
    return false;
  }
}

serve(async (req) => {
  // Gérer les requêtes CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  
  try {
    console.log("=== Début de la fonction secure-password ===");
    
    // Récupérer les données de la requête
    const requestBody = await req.json();
    const { email, password } = requestBody;
    
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

    console.log(`Authentification pour: ${email} avec mot de passe: ${password.substr(0, 3)}***`);
    
    // Vérifier directement les identifiants
    const credentialsValid = await verifyCredentials(email, password);
    
    if (!credentialsValid) {
      console.error(`Identifiants invalides pour: ${email}`);
      return new Response(
        JSON.stringify({ 
          error: "Identifiants invalides", 
          details: "Email ou mot de passe incorrect",
          code: 401
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Si on arrive ici, les identifiants sont corrects
    // Récupérer l'utilisateur
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error(`Erreur lors de la récupération de l'utilisateur: ${userError.message}`);
      return new Response(
        JSON.stringify({ error: "Erreur serveur" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    const user = userData?.users.find(u => u.email === email);
    
    if (!user) {
      console.error(`Utilisateur non trouvé après vérification: ${email}`);
      return new Response(
        JSON.stringify({ error: "Utilisateur non trouvé" }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
    
    // Génération d'un mot de passe sécurisé pour la session
    const securedPassword = securePassword(password);
    
    console.log(`Mot de passe renforcé créé avec succès pour ${email}: ${securedPassword.substr(0, 3)}***`);
    
    return new Response(
      JSON.stringify({ 
        success: true, 
        securedPassword,
        user,
        originalPassword: password
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error(`Erreur serveur: ${error.message}`);
    console.error(`Stack trace: ${error.stack}`);
    
    return new Response(
      JSON.stringify({ error: "Erreur lors du traitement de la demande", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } finally {
    console.log("=== Fin de la fonction secure-password ===");
  }
});
