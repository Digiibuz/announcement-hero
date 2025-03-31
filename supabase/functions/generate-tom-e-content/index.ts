
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.41.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RequestBody {
  prompt: string;
  category: string;
  keyword: string;
  locality: string;
  configId: string;
}

serve(async (req) => {
  // Gérer les requêtes OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Vérifier si la clé API OpenAI est configurée
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      return new Response(
        JSON.stringify({ error: "API key OpenAI non configurée" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Extraire le corps de la requête
    const { prompt, category, keyword, locality, configId } = await req.json() as RequestBody;

    if (!prompt || !category || !keyword || !locality) {
      return new Response(
        JSON.stringify({ error: "Paramètres manquants (prompt, catégorie, mot-clé ou localité)" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Génération de contenu pour : "${keyword}" à "${locality}" dans la catégorie "${category}"`);

    // Créer le client Supabase avec les variables d'environnement
    const supabaseUrl = Deno.env.get("SUPABASE_URL") as string;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") as string;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Construire le prompt pour l'IA
    const completePrompt = `
Tu es "Tom-E", un expert en rédaction de pages web SEO optimisées pour les entreprises locales. 
    
CONTEXTE : 
- Description de l'entreprise/activité : "${prompt}"
- Catégorie : "${category}"
- Mot-clé principal : "${keyword}"
- Localité : "${locality}"

TÂCHE :
Crée une page web complète et optimisée pour le référencement (SEO) pour cette activité dans cette localité.

FORMAT DE RÉPONSE (en JSON) :
{
  "title": "Titre SEO optimisé incluant le mot-clé et la localité, entre 50 et 60 caractères",
  "meta_description": "Description méta optimisée entre 120 et 158 caractères, incluant mot-clé et localité",
  "h1": "Titre H1 principal, incluant le mot-clé et la localité",
  "content": "Contenu HTML complet avec balises h2, h3, paragraphes, listes, etc. d'environ 800-1000 mots. Pour les balises HTML, n'utilise que h2, h3, p, ul, li, ol, strong, em. Le contenu doit être naturel, informatif et utile. Inclure des appels à l'action pertinents. Ne pas utiliser d'autres balises HTML.",
  "slug": "url-seo-optimisee-avec-le-mot-cle-et-localite"
}

CONSIGNES SEO :
- Intègre le mot-clé principal "${keyword}" dans le titre, H1, les premiers paragraphes et 3-4 fois dans le contenu.
- Mentionne la localité "${locality}" à plusieurs reprises de façon naturelle.
- Crée une structure avec des sous-titres (H2, H3) pertinents.
- Organise le contenu pour une lecture agréable (paragraphes courts, listes).
- Optimise pour un lecteur humain tout en respectant les bonnes pratiques SEO.
- Adapte ton style à la catégorie "${category}".
- Le contenu doit être 100% unique, informatif et utile.
- Inclus des appels à l'action pertinents.
`;

    // Appeler l'API OpenAI
    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4-turbo",
        messages: [
          { role: "system", content: "Tu es Tom-E, un expert en création de contenus SEO pour sites web." },
          { role: "user", content: completePrompt }
        ],
        temperature: 0.7,
        max_tokens: 2500,
      }),
    });

    if (!openAIResponse.ok) {
      const errorData = await openAIResponse.json();
      console.error("Erreur OpenAI:", errorData);
      return new Response(
        JSON.stringify({ error: "Erreur lors de la génération du contenu", details: errorData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const openAIData = await openAIResponse.json();
    const content = openAIData.choices[0].message.content;
    
    // Analyser le contenu JSON de la réponse
    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
    } catch (error) {
      console.error("Erreur lors de l'analyse de la réponse JSON:", error);
      return new Response(
        JSON.stringify({ error: "Erreur lors de l'analyse de la réponse", rawContent: content }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Renvoyer la réponse formatée
    return new Response(
      JSON.stringify(parsedContent),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Erreur:", error.message);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
