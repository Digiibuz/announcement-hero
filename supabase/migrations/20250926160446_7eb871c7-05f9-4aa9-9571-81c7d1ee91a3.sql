-- Ajouter les champs pour la publication Facebook aux annonces
ALTER TABLE public.announcements 
ADD COLUMN IF NOT EXISTS create_facebook_post boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS social_content text,
ADD COLUMN IF NOT EXISTS social_hashtags text[];