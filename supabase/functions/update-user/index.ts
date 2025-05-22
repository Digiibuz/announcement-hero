
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
function securePassword(password: string): string {
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
    console.log("Démarrage de la fonction update-user");
    
    // Créer un client Supabase avec la clé de service
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Récupérer les données de la requête
    const requestData = await req.json();
    console.log("Données reçues:", JSON.stringify(requestData));
    
    const { userId, email, name, role, wordpressConfigId, password } = requestData;

    // Vérifier les données requises
    if (!userId) {
      console.log("ID utilisateur manquant");
      return new Response(
        JSON.stringify({ error: "ID utilisateur manquant" }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Sécuriser le mot de passe si fourni
    const securedPassword = password ? securePassword(password) : undefined;
    
    // Déterminer si wordpressConfigId doit être utilisé
    const needsWordPressConfig = role === "client";

    // Mettre à jour l'utilisateur dans auth
    const updateData: any = {
      user_metadata: {
        name,
        role,
        wordpressConfigId: needsWordPressConfig ? wordpressConfigId : null,
      }
    };

    // Ajouter l'email et/ou le mot de passe s'ils sont fournis
    if (email) {
      updateData.email = email;
      updateData.email_confirm = true;
    }

    if (securedPassword) {
      updateData.password = securedPassword;
      console.log("Mot de passe sécurisé ajouté à la mise à jour");
    }

    const { data: updateAuthData, error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      updateData
    );

    if (updateAuthError) {
      console.log("Erreur lors de la mise à jour de l'utilisateur:", updateAuthError.message);
      throw updateAuthError;
    }

    console.log("Utilisateur mis à jour avec succès dans auth");

    return new Response(
      JSON.stringify({ success: true }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Erreur:", error.message, error.stack);
    return new Response(
      JSON.stringify({ error: error.message || "Une erreur est survenue" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
