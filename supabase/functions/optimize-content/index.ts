
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Fonction optimize-content appelée");
    
    const { type, title, description, aiSettings } = await req.json();
    
    console.log(`Paramètres reçus - Type: ${type}, Titre: "${title.substring(0, 20)}..."`);
    if (description) {
      console.log(`Description: "${description.substring(0, 30)}..."`);
    }
    if (aiSettings) {
      console.log(`Options IA: Ton=${aiSettings.tone}, Longueur=${aiSettings.length}`);
    }
    
    let systemMessage: string;
    let prompt: string;
    
    // Différencier entre génération de description et contenu social
    if (type === "generateDescription") {
      // Génération de description classique (sans emojis)
      const toneInstructions = getToneInstructions(aiSettings?.tone || "convivial");
      const lengthInstructions = getLengthInstructions(aiSettings?.length || "standard");
      
      systemMessage = `Tu es un rédacteur professionnel spécialisé dans la création de contenu pour des annonces. Rédige un texte informatif, structuré et engageant ${lengthInstructions.target} basé sur le titre fourni. ${toneInstructions.system} IMPORTANT: Fournis UNIQUEMENT le texte généré, sans préface ni commentaire.`;
      
      prompt = `Titre de l'annonce: "${title}".
      ${description ? `Voici un exemple de contenu ou notes: "${description}"` : ""}
      
      Rédige un texte structuré, informatif et engageant ${lengthInstructions.target} qui servira de description pour cette annonce. 
      Ton texte doit:
      - Avoir une structure claire avec des paragraphes
      - ${toneInstructions.style}
      - ${lengthInstructions.structure}
      - Ne pas contenir de titre ni sous-titres
      - Ne pas inclure de formatage spécial (pas de gras, italique...)
      
      Renvoie uniquement le texte généré sans aucune introduction ou commentaire supplémentaire.`;

    } else if (type === "generateSocialContent") {
      // Génération de contenu spécialement pour Instagram avec emojis
      systemMessage = `Tu es un expert en création de contenu pour Instagram. Tu dois transformer le contenu fourni en une publication engageante avec des emojis, des bullet points et une structure optimisée pour Instagram. IMPORTANT: Fournis UNIQUEMENT le contenu Instagram généré, sans préface ni commentaire.`;
      
      prompt = `Titre: "${title}"
      ${description ? `Description: "${description}"` : ""}
      
      Transforme ce contenu en une publication optimisée pour Instagram en respectant ces règles:
      
      🎯 STRUCTURE OBLIGATOIRE:
      - Commencer par un emoji et un titre accrocheur
      - Utiliser des bullet points avec emojis appropriés (❌, ✅, 👉, 💡, 🚀, etc.)
      - Inclure un call-to-action à la fin avec emoji
      - Maximum 300 mots pour garder l'engagement
      
      📝 STYLE:
      - Ton engageant et professionnel
      - Emojis pertinents pour illustrer chaque point
      - Phrases courtes et percutantes
      - Interpeller directement le lecteur
      
      ⚡ EXEMPLE DE FORMAT:
      "🌟 [Titre accrocheur]
      
      [Phrase d'accroche engageante] 😊
      
      ✅ Point clé 1
      👉 Bénéfice ou explication
      
      ✅ Point clé 2  
      👉 Bénéfice ou explication
      
      🚀 [Call-to-action avec emoji]"
      
      Génère maintenant la publication pour Instagram:`;

    } else if (type === "generateFacebookContent") {
      // Génération de contenu spécialement pour Facebook avec hashtags intégrés
      systemMessage = `Tu es un expert en création de contenu pour Facebook. Tu dois transformer le contenu fourni en une publication engageante avec des emojis, des hashtags intégrés naturellement dans le texte, et une structure optimisée pour Facebook. IMPORTANT: Fournis UNIQUEMENT le contenu Facebook généré, sans préface ni commentaire.`;
      
      prompt = `Titre: "${title}"
      ${description ? `Description: "${description}"` : ""}
      
      Transforme ce contenu en une publication optimisée pour Facebook en respectant ces règles:
      
      🎯 STRUCTURE OBLIGATOIRE:
      - Commencer par un emoji et un titre accrocheur
      - Intégrer 3-5 hashtags pertinents NATURELLEMENT dans le texte (pas à la fin en liste)
      - Utiliser des emojis pour illustrer les points clés
      - Inclure un call-to-action à la fin
      - Maximum 400 mots pour une lecture agréable
      
      📝 STYLE:
      - Ton convivial et engageant
      - Hashtags intégrés de façon fluide (#MonHashtag dans une phrase naturelle)
      - Emojis pertinents mais sans en abuser
      - Phrases courtes et impactantes
      - Interpeller directement le lecteur
      
      ⚡ EXEMPLE DE FORMAT:
      "🌟 [Titre accrocheur]
      
      [Phrase d'accroche qui intègre un #hashtag naturellement] 😊
      
      Voici pourquoi c'est important pour votre #projet :
      
      ✅ Point clé 1 avec #mot-clé intégré
      💡 Point clé 2
      
      🚀 [Call-to-action]"
      
      IMPORTANT: Les hashtags doivent être intégrés DANS le texte, pas listés à la fin !
      
      Génère maintenant la publication pour Facebook:`;

    } else {
      throw new Error(`Type d'opération non supporté: ${type}`);
    }

    console.log(`Génération de contenu, appel à OpenAI en cours...`);

    if (!openAIApiKey) {
      throw new Error("Clé API OpenAI manquante. Veuillez configurer la variable d'environnement OPENAI_API_KEY.");
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAIApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'system', content: systemMessage },
            { role: 'user', content: prompt }
          ],
          temperature: 0.8,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Erreur OpenAI:", error);
        
        // Gestion spécifique des erreurs de quotas
        if (error.error && error.error.message && (
            error.error.message.includes("quota") || 
            error.error.message.includes("rate") || 
            error.error.message.includes("limit") ||
            error.error.code === "insufficient_quota"
        )) {
          return new Response(JSON.stringify({ 
            success: false, 
            error: "Limite d'utilisation de l'API OpenAI atteinte. Veuillez vérifier votre abonnement ou réessayer plus tard.",
            details: error.error.message
          }), {
            status: 429, // Too Many Requests
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        throw new Error(`Erreur OpenAI: ${error.error?.message || 'Erreur inconnue'}`);
      }

      const data = await response.json();
      console.log("Réponse OpenAI reçue avec succès");
      
      let optimizedContent = data.choices[0].message.content;
      
      // Post-traitement différent selon le type
      if (type === "generateDescription") {
        // Pour les descriptions classiques : supprimer emojis et formatage
        optimizedContent = optimizedContent
          // Supprime les phrases d'introduction comme "Voici" ou "Bien sûr"
          .replace(/^(Bien sûr !|Voici|Certainement|D'accord|Absolument|Voilà|Avec plaisir)[^\n]*\n+/i, '')
          // Supprime les commentaires finaux commençant par des tirets ou des remarques
          .replace(/\n+(-{2,}|Remarque|Note|Cette version)[^\n]*$/i, '')
          // Supprime les guillemets qui pourraient entourer la réponse
          .replace(/^["\s]+|["\s]+$/g, '')
          // Supprime les titres (lignes suivies de ':' ou lignes avec # au début)
          .replace(/^#+\s+.*$|^\s*[\w\s]+\s*:\s*$/gm, '')
          // Supprime les exemples entre parenthèses ou qui commencent par "Exemple :"
          .replace(/\(exemple.*?\)|exemple\s*:.*?(\n|$)/gi, '')
          // Supprime toutes les mises en gras (balises Markdown ** ou __)
          .replace(/(\*\*|__)(.*?)(\*\*|__)/g, "$2")
          // Supprime les marqueurs d'icônes et symboles courants
          .replace(/:[a-z_]+:|🔍|✅|⚠️|❗|📝|💡|🔑|📊|🎯|⭐|👉|✨|🚀|💪|⚡|📌|🔖|📢|🔔/g, '')
          .trim();
      } else if (type === "generateSocialContent" || type === "generateFacebookContent") {
        // Pour le contenu social : garder les emojis et hashtags mais nettoyer les commentaires
        optimizedContent = optimizedContent
          // Supprime les phrases d'introduction comme "Voici" ou "Bien sûr"
          .replace(/^(Bien sûr !|Voici|Certainement|D'accord|Absolument|Voilà|Avec plaisir)[^\n]*\n+/i, '')
          // Supprime les commentaires finaux commençant par des tirets ou des remarques
          .replace(/\n+(-{2,}|Remarque|Note|Cette version)[^\n]*$/i, '')
          // Supprime les guillemets qui pourraient entourer la réponse
          .replace(/^["\s]+|["\s]+$/g, '')
          .trim();
      }

      console.log("Contenu généré traité: ", optimizedContent.substring(0, 100) + "...");

      return new Response(JSON.stringify({ 
        success: true, 
        content: optimizedContent 
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } catch (openAIError) {
      console.error("Erreur lors de l'appel à OpenAI:", openAIError);
      
      // Vérifiez si c'est une erreur de dépassement de quota
      if (openAIError.message && (
          openAIError.message.includes("quota") || 
          openAIError.message.includes("rate") || 
          openAIError.message.includes("limit")
      )) {
        return new Response(JSON.stringify({ 
          success: false, 
          error: "Limite d'utilisation de l'API OpenAI atteinte. Veuillez vérifier votre abonnement ou réessayer plus tard.",
          details: openAIError.message
        }), {
          status: 429, // Too Many Requests
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      
      throw openAIError;
    }
  } catch (error) {
    console.error('Erreur dans la fonction optimize-content:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message || "Une erreur inconnue s'est produite"
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

// Fonctions utilitaires pour les instructions de ton
function getToneInstructions(tone: string) {
  switch (tone) {
    case "professionnel":
      return {
        system: "Adopte un ton professionnel, formel et expertisé.",
        style: "Utiliser un vocabulaire technique approprié et un ton formel qui inspire confiance"
      };
    case "commercial":
      return {
        system: "Adopte un ton commercial, persuasif et vendeur.",
        style: "Inclure des arguments de vente convaincants et des appels à l'action motivants"
      };
    case "informatif":
      return {
        system: "Adopte un ton informatif, neutre et descriptif.",
        style: "Présenter les informations de manière factuelle et objective, sans langue de bois"
      };
    case "convivial":
    default:
      return {
        system: "Adopte un ton convivial, chaleureux et accessible.",
        style: "Utiliser un langage accessible et chaleureux qui met en confiance"
      };
  }
}

// Fonctions utilitaires pour les instructions de longueur
function getLengthInstructions(length: string) {
  switch (length) {
    case "concis":
      return {
        target: "d'environ 100 mots",
        structure: "Aller à l'essentiel avec des phrases courtes et percutantes"
      };
    case "detaille":
      return {
        target: "d'environ 300 mots",
        structure: "Développer en détail avec des exemples concrets et des bénéfices clients"
      };
    case "standard":
    default:
      return {
        target: "d'environ 200 mots",
        structure: "Équilibrer les informations importantes avec une lecture fluide"
      };
  }
}
