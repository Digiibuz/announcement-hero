
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

// Fonction pour vérifier le mot de passe original avec Supabase
async function verifyOriginalPassword(email: string, password: string) {
  try {
    // Créer un client temporaire pour la vérification
    const tempAuthClient = createClient(supabaseUrl, supabaseKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Tenter une connexion administrateur pour vérifier les identifiants
    const { data, error } = await tempAuthClient.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error("Échec de vérification:", error.message);
      return { success: false, error: error.message };
    }

    return { success: true, user: data.user };
  } catch (error) {
    console.error("Erreur lors de la vérification:", error.message);
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
    
    if (!password) {
      return new Response(
        JSON.stringify({ error: "Mot de passe requis" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Si l'email est fourni, vérifier le mot de passe original
    if (email) {
      console.log("Vérification du mot de passe original pour:", email);
      const verification = await verifyOriginalPassword(email, password);
      
      if (!verification.success) {
        return new Response(
          JSON.stringify({ error: "Identifiants invalides", details: verification.error }),
          {
            status: 401,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      // Mot de passe vérifié, maintenant renforcer avec un suffixe pour la session
      const securedPassword = securePassword(password);
      console.log("Mot de passe vérifié et renforcé avec succès");
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          securedPassword,
          user: verification.user 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      // Cas où seul le mot de passe est fourni (création/modification utilisateur)
      const securedPassword = securePassword(password);
      
      return new Response(
        JSON.stringify({ securedPassword }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Erreur:", error.message);
    
    return new Response(
      JSON.stringify({ error: "Erreur lors du traitement de la demande" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
