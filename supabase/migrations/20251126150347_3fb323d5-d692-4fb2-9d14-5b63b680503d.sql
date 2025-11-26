-- Créer le compte de test Apple pour le mode démo

-- Note: Vous devrez créer manuellement le compte dans Supabase Auth avec:
-- Email: apple-test@digiibuz.fr
-- Mot de passe: DigiiBuz2025Test!
-- 
-- Une fois le compte créé dans Auth, récupérez son UUID et exécutez ces commandes:

-- Exemple de création de profil (remplacez 'USER_UUID_HERE' par l'UUID réel)
-- INSERT INTO public.profiles (id, name, email, role, can_publish_social_media)
-- VALUES (
--   'USER_UUID_HERE'::uuid,
--   'Apple Test Account',
--   'apple-test@digiibuz.fr',
--   'editor',
--   true
-- );

-- Ajouter le rôle editor
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('USER_UUID_HERE'::uuid, 'editor');

-- Configuration: Ce compte n'aura PAS de wordpress_config_id pour éviter les appels API
-- Les catégories seront mockées côté frontend grâce au mode démo

-- Commentaire explicatif pour les admins
COMMENT ON TABLE profiles IS 'Table des profils utilisateurs. Le compte apple-test@digiibuz.fr est un compte de test spécial qui active le mode démo (catégories mockées, publications simulées).';