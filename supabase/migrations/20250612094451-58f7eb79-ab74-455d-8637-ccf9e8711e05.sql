
-- Créer une table pour stocker les catégories autorisées par configuration WordPress
CREATE TABLE public.wordpress_config_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  wordpress_config_id UUID REFERENCES public.wordpress_configs(id) ON DELETE CASCADE NOT NULL,
  category_id TEXT NOT NULL,
  category_name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(wordpress_config_id, category_id)
);

-- Activer RLS sur la table
ALTER TABLE public.wordpress_config_categories ENABLE ROW LEVEL SECURITY;

-- Politique RLS pour permettre aux admins de gérer les catégories
CREATE POLICY "Admins can manage config categories" 
  ON public.wordpress_config_categories 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Politique RLS pour permettre aux utilisateurs de voir les catégories de leur config
CREATE POLICY "Users can view their config categories" 
  ON public.wordpress_config_categories 
  FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() 
      AND wordpress_config_id = wordpress_config_categories.wordpress_config_id
    )
  );

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION public.update_wordpress_config_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_wordpress_config_categories_updated_at
  BEFORE UPDATE ON public.wordpress_config_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_wordpress_config_categories_updated_at();
