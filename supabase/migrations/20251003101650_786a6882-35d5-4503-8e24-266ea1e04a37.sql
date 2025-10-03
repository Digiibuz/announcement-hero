-- Ajouter la colonne pour autoriser la publication sur les réseaux sociaux
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS can_publish_social_media BOOLEAN DEFAULT false;