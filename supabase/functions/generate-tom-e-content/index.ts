
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  try {
    const { prompt, category, keyword, locality, configId } = await req.json();

    console.log("Params:", { prompt, category, keyword, locality, configId });

    if (!prompt) {
      throw new Error("Prompt is required");
    }

    if (!category) {
      throw new Error("Category is required");
    }

    if (!keyword) {
      throw new Error("Keyword is required");
    }

    if (!locality) {
      throw new Error("Locality is required");
    }

    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not defined in environment variables");
    }

    // Build the prompt for content generation
    const contentPrompt = `
      En tant qu'expert SEO et rédacteur pour ${prompt}, je dois créer une page optimisée.
      
      La page concerne: ${keyword} à ${locality}
      La catégorie est: ${category}
      
      Génère-moi un contenu de page SEO complet avec:
      1. Un titre SEO (55-60 caractères)
      2. Une meta description attractive (150-160 caractères)
      3. Un H1 accrocheur
      4. Un contenu HTML structuré d'environ 500 mots, avec des balises h2, h3, des paragraphes et une liste à puces
      5. Un slug URL optimisé pour le SEO (format: mot-cle-localite)
      
      Le contenu doit:
      - Être naturel, sans sur-optimisation de mots-clés
      - Être informatif et utile pour les utilisateurs
      - Inclure des appels à l'action pertinents
      - Mentionner "nos services à ${locality}" dans le contenu
      - Répondre à l'intention de recherche liée à "${keyword}"
    `;

    // Call OpenAI API
    const openAIResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "Tu es un expert SEO et rédacteur web, tu crées du contenu optimisé pour des pages web.",
          },
          {
            role: "user",
            content: contentPrompt,
          },
        ],
        temperature: 0.7,
      }),
    });

    if (!openAIResponse.ok) {
      const error = await openAIResponse.text();
      console.error("OpenAI API error:", error);
      throw new Error(`OpenAI API error: ${error}`);
    }

    const openAIData = await openAIResponse.json();
    const generatedText = openAIData.choices[0].message.content;

    // Parse the generated content
    const titleMatch = generatedText.match(/titre seo[^\n]*:([^\n]*)/i);
    const metaDescMatch = generatedText.match(/meta description[^\n]*:([^\n]*)/i);
    const h1Match = generatedText.match(/h1[^\n]*:([^\n]*)/i);
    const slugMatch = generatedText.match(/slug[^\n]*:([^\n]*)/i);
    
    // Extract content - everything after the metadata sections
    let contentMatch = generatedText.split(/slug[^\n]*:[^\n]*/i)[1];
    if (!contentMatch) {
      contentMatch = generatedText.split(/h1[^\n]*:[^\n]*/i)[1];
    }

    const content = {
      title: titleMatch ? titleMatch[1].trim() : `${keyword} à ${locality}`,
      meta_description: metaDescMatch ? metaDescMatch[1].trim() : `Découvrez nos services de ${keyword} à ${locality}. Experts professionnels, devis gratuit, intervention rapide.`,
      h1: h1Match ? h1Match[1].trim() : `${keyword} à ${locality} - Services professionnels`,
      content: contentMatch ? contentMatch.trim() : generatedText,
      slug: slugMatch ? slugMatch[1].trim().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-") : `${keyword.toLowerCase().replace(/\s+/g, "-")}-${locality.toLowerCase().replace(/\s+/g, "-")}`,
    };

    return new Response(JSON.stringify(content), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
