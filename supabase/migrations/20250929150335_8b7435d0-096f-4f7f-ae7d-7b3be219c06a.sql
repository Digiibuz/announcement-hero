-- Ajouter les colonnes pour le suivi des publications sur les réseaux sociaux
ALTER TABLE public.announcements 
ADD COLUMN facebook_publication_status TEXT CHECK (facebook_publication_status IN ('pending', 'success', 'error')),
ADD COLUMN facebook_published_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN facebook_error_message TEXT,
ADD COLUMN facebook_post_id TEXT,
ADD COLUMN facebook_url TEXT;