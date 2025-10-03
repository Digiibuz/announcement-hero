
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
      // Génération de description optimisée SEO avec structure HTML
      const toneInstructions = getToneInstructions(aiSettings?.tone || "convivial");
      const lengthInstructions = getLengthInstructions(aiSettings?.length || "standard");
      
      systemMessage = `Tu es un rédacteur web SEO expert spécialisé dans la création de contenu optimisé pour les moteurs de recherche. Tu dois rédiger un contenu structuré avec des balises HTML (h2, h3, p, ul, li, a) qui sera publié sur un site WordPress. ${toneInstructions.system} IMPORTANT: Fournis UNIQUEMENT le HTML généré, sans préface ni commentaire.`;
      
      prompt = `Titre principal de l'annonce: "${title}".
      ${description ? `Informations complémentaires: "${description}"` : ""}
      
      Rédige un article web complet et optimisé SEO ${lengthInstructions.target} en HTML qui servira de contenu principal pour cette annonce WordPress.
      
      📋 STRUCTURE HTML OBLIGATOIRE:
      - Commencer par 1-2 paragraphes d'introduction engageants et détaillés
      - Inclure 3-4 sections avec des sous-titres <h2> pertinents contenant des mots-clés
      - Utiliser des <h3> pour les sous-sections si nécessaire
      - Chaque section doit avoir 2-3 paragraphes <p> développés (4-5 phrases minimum par paragraphe)
      - Utiliser <ul> et <li> pour les listes à puces (maximum 1 liste par section)
      - Inclure 1-2 liens externes <a href="https://..." target="_blank" rel="noopener noreferrer"> vers des sources d'autorité
      - Terminer par un paragraphe de conclusion avec call-to-action
      
      🎯 OPTIMISATION SEO ET QUALITÉ:
      - ${toneInstructions.style}
      - Intégrer naturellement le mot-clé principal ("${title}") 3-5 fois dans le texte
      - ${lengthInstructions.structure}
      - Développer chaque point avec des détails concrets, exemples et bénéfices clients
      - Utiliser des synonymes et termes connexes pour enrichir le champ sémantique
      - Les paragraphes doivent être substantiels (4-6 lignes chacun)
      - Les titres H2 doivent être informatifs et contenir des mots-clés stratégiques
      - Éviter les listes trop courtes - privilégier le texte développé
      
      🔗 LIENS EXTERNES:
      - Inclure 1-2 liens vers des sites d'autorité pertinents (Wikipedia, sites gouvernementaux, médias reconnus, blogs experts du secteur)
      - Les liens doivent enrichir le contenu et apporter de la valeur
      - Format: <a href="URL" target="_blank" rel="noopener noreferrer">texte du lien</a>
      
      ⚡ EXEMPLE DE STRUCTURE (à adapter au sujet):
      <p>Premier paragraphe d'introduction détaillé qui présente le contexte et capte l'attention. Ce paragraphe doit faire au moins 4-5 phrases pour bien introduire le sujet.</p>
      
      <p>Deuxième paragraphe qui approfondit et pose la problématique ou les enjeux. Là encore, développer avec des détails concrets.</p>
      
      <h2>Premier titre de section avec mot-clé</h2>
      <p>Paragraphe développé qui explique en détail le premier point. Apporter des informations concrètes, des chiffres si pertinent, des exemples réels. Minimum 4-5 phrases.</p>
      
      <p>Deuxième paragraphe de cette section qui développe un autre aspect ou approfondit. Continuer à apporter de la valeur.</p>
      
      <ul>
        <li>Point clé 1 développé avec explication</li>
        <li>Point clé 2 développé avec explication</li>
        <li>Point clé 3 développé avec explication</li>
      </ul>
      
      <h2>Deuxième titre de section pertinent</h2>
      <p>Paragraphe substantiel avec des détails, potentiellement un <a href="https://exemple.com" target="_blank" rel="noopener noreferrer">lien externe pertinent</a> qui enrichit le propos. Développer le sujet en profondeur.</p>
      
      <p>Suite de l'explication avec encore plus de détails, d'exemples concrets, de bénéfices pour le lecteur.</p>
      
      <h2>Troisième section si nécessaire</h2>
      <p>Continuer à développer le sujet avec des informations utiles et pertinentes...</p>
      
      <p>Paragraphe de conclusion engageant qui résume les points clés et contient un call-to-action clair et motivant.</p>
      
      IMPORTANT: 
      - Chaque paragraphe doit faire AU MINIMUM 4-5 phrases
      - Le contenu total doit être substantiel et informatif ${lengthInstructions.target}
      - Éviter les phrases creuses, apporter de vraies informations utiles
      - Ne PAS utiliser de balises <strong> ou <b> - le texte doit être en format normal
      
      Génère maintenant le contenu HTML optimisé SEO (sans balise html, head ou body, uniquement le contenu):`;

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
        // Pour les descriptions SEO : nettoyer les préfaces et supprimer les balises <strong> et <b>
        optimizedContent = optimizedContent
          // Supprime les phrases d'introduction comme "Voici" ou "Bien sûr"
          .replace(/^(Bien sûr !|Voici|Certainement|D'accord|Absolument|Voilà|Avec plaisir)[^\n]*\n+/i, '')
          // Supprime les commentaires finaux commençant par des tirets ou des remarques
          .replace(/\n+(-{2,}|Remarque|Note|Cette version|N'oubliez)[^\n]*$/i, '')
          // Supprime les blocs de code markdown si présents
          .replace(/```html\n?/g, '')
          .replace(/```\n?/g, '')
          // Supprime les balises <strong> et <b> pour éviter le gras non voulu
          .replace(/<strong>(.*?)<\/strong>/g, '$1')
          .replace(/<b>(.*?)<\/b>/g, '$1')
          // Supprime les doubles <br> consécutifs
          .replace(/(<br\s*\/?>){2,}/gi, '')
          // Supprime les <br> inutiles avant ou après les balises de bloc
          .replace(/<br\s*\/?>\s*(<h[23]>)/gi, '$1')
          .replace(/(<\/h[23]>)\s*<br\s*\/?>/gi, '$1')
          .replace(/<br\s*\/?>\s*(<p>)/gi, '$1')
          .replace(/(<\/p>)\s*<br\s*\/?>/gi, '$1')
          .replace(/(<\/ul>)\s*<br\s*\/?>/gi, '$1')
          .replace(/<br\s*\/?>\s*(<ul>)/gi, '$1')
          // Supprime les multiples espaces blancs
          .replace(/\n{3,}/g, '\n\n')
          // Supprime les espaces au début et fin des paragraphes
          .replace(/<p>\s+/g, '<p>')
          .replace(/\s+<\/p>/g, '</p>')
          // Supprime les emojis mais garde le HTML
          .replace(/:[a-z_]+:|🔍|✅|⚠️|❗|📝|💡|🔑|📊|🎯|⭐|👉|✨|🚀|💪|⚡|📌|🔖|📢|🔔|📋/g, '')
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
        target: "d'environ 300-400 mots",
        structure: "Aller à l'essentiel tout en développant suffisamment chaque point avec des phrases complètes et informatives"
      };
    case "detaille":
      return {
        target: "d'environ 600-800 mots",
        structure: "Développer en profondeur avec de nombreux exemples concrets, détails techniques, bénéfices clients et cas d'usage"
      };
    case "standard":
    default:
      return {
        target: "d'environ 450-550 mots",
        structure: "Équilibrer les informations importantes avec une lecture fluide, en développant chaque section de manière substantielle"
      };
  }
}
