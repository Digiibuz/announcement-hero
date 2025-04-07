
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Gestion des requêtes CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Création du client Supabase
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        global: {
          headers: { Authorization: req.headers.get("Authorization")! },
        },
        auth: {
          persistSession: false,
        },
      }
    );

    // Récupération du corps de la requête
    const requestBody = await req.json();
    const { 
      userId, 
      templateId, 
      title, 
      content, 
      type, 
      metadata, 
      sendToAll 
    } = requestBody;

    console.log("Request received:", {
      sendToAll,
      userId: userId || "N/A",
      templateId: templateId || "N/A",
      hasTitle: !!title,
      hasContent: !!content
    });

    // Validation des paramètres
    if (!sendToAll && !userId) {
      return new Response(
        JSON.stringify({ error: "L'ID de l'utilisateur est requis lorsque sendToAll est false" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if ((!templateId && (!title || !content || !type))) {
      return new Response(
        JSON.stringify({ 
          error: "Soit templateId, soit title, content et type sont requis" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Vérifier que le type est valide si fourni
    if (type && !["reminder", "alert", "info"].includes(type)) {
      return new Response(
        JSON.stringify({ 
          error: "Le type doit être 'reminder', 'alert' ou 'info'" 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Si un templateId est fourni, récupérer les détails du template
    let notificationData = {};
    
    if (templateId) {
      const { data: template, error: templateError } = await supabaseClient
        .from("notification_templates")
        .select("*")
        .eq("id", templateId)
        .single();

      if (templateError) {
        return new Response(
          JSON.stringify({ 
            error: "Erreur lors de la récupération du template", 
            details: templateError 
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      notificationData = {
        title: template.title,
        content: template.content,
        type: template.type,
        template_id: templateId
      };
    } else {
      notificationData = {
        title,
        content,
        type
      };
    }

    console.log("Notification data prepared:", notificationData);

    // Traitement des notifications selon que c'est pour tous les utilisateurs ou un seul
    if (sendToAll) {
      // Récupérer tous les utilisateurs
      const { data: profiles, error: profilesError } = await supabaseClient
        .from("profiles")
        .select("id");

      if (profilesError) {
        return new Response(
          JSON.stringify({ 
            error: "Erreur lors de la récupération des utilisateurs", 
            details: profilesError 
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // MODIFICATION: Préparation d'un tableau de notifications en une seule fois
      // sans boucler lors de l'insertion
      const userIds = profiles.map(profile => profile.id);
      console.log(`Preparing notifications for ${userIds.length} users`);
      
      // Créer un tableau d'objets pour l'insertion en batch
      const notifications = userIds.map(uid => ({
        user_id: uid,
        title: notificationData.title,
        content: notificationData.content,
        type: notificationData.type,
        template_id: notificationData.template_id || null,
        metadata: metadata || null
      }));

      // Insertion en batch - en une seule requête
      const { error: insertError, count } = await supabaseClient
        .from("user_notifications")
        .insert(notifications);

      if (insertError) {
        console.error("Error inserting notifications:", insertError);
        return new Response(
          JSON.stringify({ 
            error: "Erreur lors de l'insertion des notifications", 
            details: insertError 
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log(`Successfully sent ${notifications.length} notifications (one per user)`);

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: `Notifications envoyées à ${notifications.length} utilisateurs`,
          count: notifications.length
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      // Vérifier les préférences de notification de l'utilisateur
      const { data: preferences, error: preferencesError } = await supabaseClient
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .single();

      if (preferencesError && preferencesError.code !== "PGRST116") {
        console.error("Erreur lors de la récupération des préférences:", preferencesError);
      }

      // Si l'utilisateur a désactivé ce type de notification, ne pas l'envoyer
      if (preferences) {
        const typeEnabledField = `${notificationData.type}_enabled`;
        if (preferences[typeEnabledField] === false) {
          return new Response(
            JSON.stringify({ 
              message: "L'utilisateur a désactivé ce type de notification" 
            }),
            {
              status: 200,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      }

      console.log(`Sending notification to user: ${userId}`);

      // Insérer la notification dans la base de données
      const { data: notification, error: insertError } = await supabaseClient
        .from("user_notifications")
        .insert({
          user_id: userId,
          title: notificationData.title,
          content: notificationData.content,
          type: notificationData.type,
          template_id: notificationData.template_id || null,
          metadata: metadata || null
        })
        .select()
        .single();

      if (insertError) {
        console.error("Error inserting notification:", insertError);
        return new Response(
          JSON.stringify({ 
            error: "Erreur lors de l'insertion de la notification", 
            details: insertError 
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      console.log("Notification sent successfully");

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Notification envoyée avec succès", 
          notification 
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  } catch (error) {
    console.error("Erreur inattendue:", error);
    return new Response(
      JSON.stringify({ error: "Une erreur inattendue s'est produite" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
