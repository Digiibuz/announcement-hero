
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { topic, keywords, targetLength } = await req.json();
    
    if (!topic) {
      return new Response(
        JSON.stringify({ error: "Le sujet est requis" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Generating content for topic: ${topic}, keywords: ${keywords || 'none'}, length: ${targetLength || 500}`);

    if (!OPENAI_API_KEY) {
      throw new Error("La clé API OpenAI n'est pas configurée");
    }

    const systemPrompt = `Vous êtes un expert en rédaction de contenu web optimisé pour le SEO. 
    Créez un article bien structuré sur le sujet fourni, en utilisant les mots-clés mentionnés de manière naturelle dans le texte. 
    L'article doit avoir environ ${targetLength || 500} mots, inclure un titre H1 accrocheur, des sous-titres H2 et H3 pertinents, 
    et être formaté en HTML avec des paragraphes bien structurés. 
    Incluez également une meta description SEO de 150-160 caractères maximum.`;

    const userPrompt = `Sujet: ${topic}${keywords ? `\nMots-clés à inclure: ${keywords}` : ''}`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt }
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Erreur OpenAI: ${error.error?.message || JSON.stringify(error)}`);
    }

    const data = await response.json();
    const completionText = data.choices[0].message.content;

    // Extraction du titre, de la meta description et du contenu
    let title = "";
    let metaDescription = "";
    let content = "";

    // Extraction de la meta description (format "Meta description: texte")
    const metaMatch = completionText.match(/Meta description:?\s*(.*?)(?:\n|$)/i);
    if (metaMatch && metaMatch[1]) {
      metaDescription = metaMatch[1].trim();
    }

    // Extraction du titre H1
    const h1Match = completionText.match(/<h1>(.*?)<\/h1>/i);
    if (h1Match && h1Match[1]) {
      title = h1Match[1].trim();
    } else {
      // Fallback pour le titre
      const titleMatch = completionText.match(/^#\s*(.*?)(?:\n|$)/m);
      if (titleMatch && titleMatch[1]) {
        title = titleMatch[1].trim();
      }
    }

    // Le contenu est tout le texte, mais on peut nettoyer les parties meta
    content = completionText
      .replace(/Meta description:?\s*(.*?)(?:\n|$)/i, "")
      .trim();

    // Si le titre n'a pas été trouvé, utiliser les premiers mots du sujet
    if (!title) {
      title = `${topic.substring(0, 50)}${topic.length > 50 ? '...' : ''}`;
    }

    // Si la meta description n'a pas été trouvée, en générer une à partir des premiers mots du contenu
    if (!metaDescription) {
      const plainText = content.replace(/<[^>]*>/g, '');
      metaDescription = plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
    }

    const result = {
      title,
      metaDescription,
      content
    };

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating content:", error);
    
    return new Response(
      JSON.stringify({ error: error.message || "Une erreur s'est produite lors de la génération du contenu" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
