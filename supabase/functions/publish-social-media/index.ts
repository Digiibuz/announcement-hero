import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PublishRequest {
  announcementId: string;
  userId: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { announcementId, userId }: PublishRequest = await req.json();
    
    console.log('📢 Publication réseaux sociaux démarrée:', { announcementId, userId });

    // Récupérer l'annonce
    const { data: announcement, error: announcementError } = await supabase
      .from('announcements')
      .select('*')
      .eq('id', announcementId)
      .single();

    if (announcementError || !announcement) {
      console.error('❌ Annonce non trouvée:', announcementError);
      throw new Error('Annonce non trouvée');
    }

    const results: any = { facebook: null, instagram: null };

    // Publication Facebook
    if (announcement.create_facebook_post && announcement.facebook_content) {
      console.log('📘 Début publication Facebook...');
      
      try {
        // Récupérer la connexion Facebook de l'utilisateur
        const { data: fbConnection, error: fbError } = await supabase
          .from('facebook_connections')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (fbError || !fbConnection) {
          throw new Error('Connexion Facebook non trouvée');
        }

        console.log('📘 Connexion Facebook trouvée:', fbConnection.page_name);

        // Préparer le message avec hashtags et lien WordPress
        let message = announcement.facebook_content;
        if (announcement.facebook_hashtags && announcement.facebook_hashtags.length > 0) {
          message += '\n\n' + announcement.facebook_hashtags.join(' ');
        }
        // Ajouter le lien WordPress à la fin
        if (announcement.wordpress_url) {
          message += '\n\n' + announcement.wordpress_url;
        }

        let fbPostId = null;

        // Si on a des images, publier d'abord les photos
        if (announcement.facebook_images && announcement.facebook_images.length > 0) {
          const photoIds: string[] = [];
          
          // Uploader chaque photo sur Facebook
          for (const imageUrl of announcement.facebook_images) {
            const photoApiUrl = `https://graph.facebook.com/v21.0/${fbConnection.page_id}/photos`;
            const photoBody = {
              url: imageUrl,
              published: false, // Ne pas publier directement
              access_token: fbConnection.page_access_token,
            };

            const photoResponse = await fetch(photoApiUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(photoBody),
            });

            const photoData = await photoResponse.json();
            if (photoResponse.ok && photoData.id) {
              photoIds.push(photoData.id);
              console.log('📘 Photo uploadée:', photoData.id);
            }
          }

          // Publier le post avec toutes les photos
          const fbApiUrl = `https://graph.facebook.com/v21.0/${fbConnection.page_id}/feed`;
          const fbBody: any = {
            message: message,
            access_token: fbConnection.page_access_token,
          };

          // Ajouter les photos attachées
          if (photoIds.length > 0) {
            fbBody.attached_media = photoIds.map(id => ({ media_fbid: id }));
          }

          console.log('📘 Publication du post avec', photoIds.length, 'photos');
          
          const fbResponse = await fetch(fbApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fbBody),
          });

          const fbData = await fbResponse.json();
          console.log('📘 Réponse Facebook:', fbData);

          if (!fbResponse.ok) {
            throw new Error(fbData.error?.message || 'Erreur lors de la publication Facebook');
          }

          fbPostId = fbData.id;
        } else {
          // Publier un post texte seulement
          const fbApiUrl = `https://graph.facebook.com/v21.0/${fbConnection.page_id}/feed`;
          const fbBody = {
            message: message,
            access_token: fbConnection.page_access_token,
          };

          console.log('📘 Publication du post texte');
          
          const fbResponse = await fetch(fbApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fbBody),
          });

          const fbData = await fbResponse.json();
          console.log('📘 Réponse Facebook:', fbData);

          if (!fbResponse.ok) {
            throw new Error(fbData.error?.message || 'Erreur lors de la publication Facebook');
          }

          fbPostId = fbData.id;
        }

        // Mettre à jour l'annonce avec les infos de publication Facebook
        await supabase
          .from('announcements')
          .update({
            facebook_publication_status: 'success',
            facebook_post_id: fbPostId,
            facebook_url: `https://www.facebook.com/${fbPostId}`,
            facebook_published_at: new Date().toISOString(),
          })
          .eq('id', announcementId);

        results.facebook = { success: true, postId: fbPostId };
        console.log('✅ Publication Facebook réussie:', fbPostId);

      } catch (fbError: any) {
        console.error('❌ Erreur Facebook:', fbError);
        
        // Mettre à jour avec l'erreur
        await supabase
          .from('announcements')
          .update({
            facebook_publication_status: 'error',
            facebook_error_message: fbError.message,
          })
          .eq('id', announcementId);

        results.facebook = { success: false, error: fbError.message };
      }
    }

    // Publication Instagram
    if (announcement.create_instagram_post && announcement.instagram_content) {
      console.log('📷 Début publication Instagram...');
      
      try {
        // Récupérer la connexion Facebook (qui contient aussi Instagram)
        const { data: fbConnection, error: fbError } = await supabase
          .from('facebook_connections')
          .select('*')
          .eq('user_id', userId)
          .single();

        if (fbError || !fbConnection) {
          throw new Error('Connexion Instagram non trouvée');
        }

        // Vérifier si la page a un compte Instagram Business
        const pageInfoUrl = `https://graph.facebook.com/v21.0/${fbConnection.page_id}?fields=instagram_business_account&access_token=${fbConnection.page_access_token}`;
        const pageInfoResponse = await fetch(pageInfoUrl);
        const pageInfo = await pageInfoResponse.json();

        if (!pageInfo.instagram_business_account) {
          throw new Error('Aucun compte Instagram Business lié à cette page Facebook');
        }

        const instagramAccountId = pageInfo.instagram_business_account.id;
        console.log('📷 Compte Instagram trouvé:', instagramAccountId);

        // Instagram nécessite une image
        if (!announcement.instagram_images || announcement.instagram_images.length === 0) {
          throw new Error('Une image est requise pour publier sur Instagram');
        }

        // Préparer la caption avec hashtags et lien WordPress
        let caption = announcement.instagram_content;
        if (announcement.instagram_hashtags && announcement.instagram_hashtags.length > 0) {
          caption += '\n\n' + announcement.instagram_hashtags.join(' ');
        }
        // Ajouter le lien WordPress
        if (announcement.wordpress_url) {
          caption += '\n\n' + announcement.wordpress_url;
        }

        // Étape 1: Créer le container média
        const createContainerUrl = `https://graph.facebook.com/v21.0/${instagramAccountId}/media`;
        const containerBody: any = {
          image_url: announcement.instagram_images[0],
          caption: caption,
          access_token: fbConnection.page_access_token,
        };

        console.log('📷 URL de l\'image:', announcement.instagram_images[0]);

        console.log('📷 Création du container Instagram...');
        const containerResponse = await fetch(createContainerUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(containerBody),
        });

        const containerData = await containerResponse.json();
        console.log('📷 Réponse container:', containerData);

        if (!containerResponse.ok) {
          throw new Error(containerData.error?.message || 'Erreur lors de la création du container Instagram');
        }

        // Étape 2: Publier le container
        const publishUrl = `https://graph.facebook.com/v21.0/${instagramAccountId}/media_publish`;
        const publishBody = {
          creation_id: containerData.id,
          access_token: fbConnection.page_access_token,
        };

        console.log('📷 Publication sur Instagram...');
        const publishResponse = await fetch(publishUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(publishBody),
        });

        const publishData = await publishResponse.json();
        console.log('📷 Réponse publication:', publishData);

        if (!publishResponse.ok) {
          throw new Error(publishData.error?.message || 'Erreur lors de la publication Instagram');
        }

        // Mettre à jour l'annonce avec les infos de publication Instagram
        await supabase
          .from('announcements')
          .update({
            instagram_publication_status: 'success',
            instagram_post_id: publishData.id,
            instagram_url: `https://www.instagram.com/p/${publishData.id}/`,
            instagram_published_at: new Date().toISOString(),
          })
          .eq('id', announcementId);

        results.instagram = { success: true, postId: publishData.id };
        console.log('✅ Publication Instagram réussie:', publishData.id);

      } catch (igError: any) {
        console.error('❌ Erreur Instagram:', igError);
        
        // Mettre à jour avec l'erreur
        await supabase
          .from('announcements')
          .update({
            instagram_publication_status: 'error',
            instagram_error_message: igError.message,
          })
          .eq('id', announcementId);

        results.instagram = { success: false, error: igError.message };
      }
    }

    console.log('✅ Publication réseaux sociaux terminée:', results);

    return new Response(
      JSON.stringify({ success: true, results }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('❌ Erreur générale:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
