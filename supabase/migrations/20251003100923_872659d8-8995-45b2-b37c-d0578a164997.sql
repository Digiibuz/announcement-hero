-- Ajouter les colonnes pour Facebook dans la table announcements
ALTER TABLE public.announcements
ADD COLUMN IF NOT EXISTS facebook_content TEXT,
ADD COLUMN IF NOT EXISTS facebook_hashtags TEXT[],
ADD COLUMN IF NOT EXISTS facebook_images TEXT[];