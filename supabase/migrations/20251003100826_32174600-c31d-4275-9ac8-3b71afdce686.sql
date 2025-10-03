-- Ajouter les colonnes pour Instagram dans la table announcements
ALTER TABLE public.announcements
ADD COLUMN IF NOT EXISTS create_instagram_post BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS instagram_content TEXT,
ADD COLUMN IF NOT EXISTS instagram_hashtags TEXT[],
ADD COLUMN IF NOT EXISTS instagram_images TEXT[],
ADD COLUMN IF NOT EXISTS instagram_publication_status TEXT CHECK (instagram_publication_status IN ('pending', 'success', 'error')),
ADD COLUMN IF NOT EXISTS instagram_published_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS instagram_error_message TEXT,
ADD COLUMN IF NOT EXISTS instagram_post_id TEXT,
ADD COLUMN IF NOT EXISTS instagram_url TEXT;