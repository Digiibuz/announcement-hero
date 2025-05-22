
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

    console.log(`Authentification pour: ${email}`);
    
    // Vérification DIRECTE avec le client Supabase
    try {
      console.log(`Tentative de vérification directe pour ${email}`);
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email,
        password: password
      });
      
      if (error) {
        console.error(`Échec de la vérification directe: ${error.message}`);
        return new Response(
          JSON.stringify({ 
            error: "Identifiants invalides", 
            details: error.message 
          }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      if (!data.user) {
        console.error("Aucun utilisateur retourné après vérification");
        return new Response(
          JSON.stringify({ error: "Erreur d'authentification" }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      // Si on arrive ici, le mot de passe est correct
      // Déconnecter la session temporaire
      try {
        await supabase.auth.admin.signOut(data.user.id);
        console.log("Session temporaire déconnectée");
      } catch (signOutError) {
        console.warn("Erreur lors de la déconnexion de la session temporaire:", signOutError);
        // Continuer même si la déconnexion échoue
      }
      
      // Les identifiants sont corrects, générer un suffixe pour la session
      console.log(`Identifiants vérifiés avec succès pour ${email}, génération du suffixe`);
      const securedPassword = securePassword(password);
      
      console.log(`Mot de passe renforcé créé avec succès pour ${email}`);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          securedPassword,
          user: data.user,
          originalPassword: password
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
      
    } catch (authError: any) {
      console.error(`Erreur lors de l'authentification: ${authError.message}`);
      return new Response(
        JSON.stringify({ 
          error: "Erreur lors de la vérification des identifiants", 
          details: authError.message 
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
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
