-- Table de cache pour les catégories WordPress
CREATE TABLE IF NOT EXISTS public.wordpress_categories_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wordpress_config_id uuid NOT NULL REFERENCES public.wordpress_configs(id) ON DELETE CASCADE,
  category_id text NOT NULL,
  category_name text NOT NULL,
  category_slug text,
  category_count integer DEFAULT 0,
  raw_data jsonb,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(wordpress_config_id, category_id)
);

-- Index pour les recherches rapides
CREATE INDEX IF NOT EXISTS idx_wordpress_categories_cache_config 
  ON public.wordpress_categories_cache(wordpress_config_id);

-- RLS policies pour la table cache
ALTER TABLE public.wordpress_categories_cache ENABLE ROW LEVEL SECURITY;

-- Les admins peuvent tout faire
CREATE POLICY "Admins can manage categories cache"
  ON public.wordpress_categories_cache
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Les utilisateurs peuvent voir le cache de leur config
CREATE POLICY "Users can view their config categories cache"
  ON public.wordpress_categories_cache
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.wordpress_config_id = wordpress_categories_cache.wordpress_config_id
    )
  );

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_wordpress_categories_cache_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER update_wordpress_categories_cache_updated_at_trigger
  BEFORE UPDATE ON public.wordpress_categories_cache
  FOR EACH ROW
  EXECUTE FUNCTION update_wordpress_categories_cache_updated_at();