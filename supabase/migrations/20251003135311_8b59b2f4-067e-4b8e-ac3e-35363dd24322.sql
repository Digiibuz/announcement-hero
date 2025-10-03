-- Corriger toutes les fonctions sans search_path sécurisé

CREATE OR REPLACE FUNCTION public.update_tome_automation_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_notification_templates_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_notification_preferences_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_notification_read_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.is_read = true AND OLD.is_read = false THEN
    NEW.read_at = NOW();
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_commercial_clients_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_wordpress_config_categories_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_keywords_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    keywords_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO keywords_count
    FROM public.categories_keywords
    WHERE wordpress_config_id = NEW.wordpress_config_id 
    AND category_id = NEW.category_id;
    
    IF TG_OP = 'UPDATE' THEN
        keywords_count = keywords_count - 1;
    END IF;
    
    IF keywords_count >= 10 THEN
        RAISE EXCEPTION 'Une catégorie ne peut pas avoir plus de 10 mots-clés';
    END IF;
    
    RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_maintenance_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_monthly_ai_count(p_user_id UUID)
RETURNS TABLE(generation_count INTEGER, max_limit INTEGER, remaining INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year INTEGER := EXTRACT(YEAR FROM now());
  current_month INTEGER := EXTRACT(MONTH FROM now());
  gen_count INTEGER := 0;
  max_lim INTEGER := 50;
BEGIN
  SELECT COALESCE(mal.generation_count, 0), COALESCE(mal.max_limit, 50)
  INTO gen_count, max_lim
  FROM public.monthly_ai_limits mal
  WHERE mal.user_id = p_user_id 
    AND mal.year = current_year 
    AND mal.month = current_month;
    
  IF NOT FOUND THEN
    gen_count := 0;
    max_lim := 50;
  END IF;
  
  RETURN QUERY SELECT gen_count, max_lim, (max_lim - gen_count);
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_monthly_ai_count(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year INTEGER := EXTRACT(YEAR FROM now());
  current_month INTEGER := EXTRACT(MONTH FROM now());
BEGIN
  INSERT INTO public.monthly_ai_limits (user_id, year, month, generation_count)
  VALUES (p_user_id, current_year, current_month, 1)
  ON CONFLICT (user_id, year, month) 
  DO UPDATE SET 
    generation_count = monthly_ai_limits.generation_count + 1,
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.update_monthly_ai_limits_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_monthly_publication_count(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year INTEGER := EXTRACT(YEAR FROM now());
  current_month INTEGER := EXTRACT(MONTH FROM now());
BEGIN
  INSERT INTO public.monthly_publication_limits (user_id, year, month, published_count)
  VALUES (p_user_id, current_year, current_month, 1)
  ON CONFLICT (user_id, year, month) 
  DO UPDATE SET 
    published_count = monthly_publication_limits.published_count + 1,
    updated_at = now();
END;
$$;

CREATE OR REPLACE FUNCTION public.get_monthly_publication_count(p_user_id UUID)
RETURNS TABLE(published_count INTEGER, max_limit INTEGER, remaining INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_year INTEGER := EXTRACT(YEAR FROM now());
  current_month INTEGER := EXTRACT(MONTH FROM now());
  pub_count INTEGER := 0;
  max_lim INTEGER := 20;
BEGIN
  SELECT COALESCE(mpl.published_count, 0), COALESCE(mpl.max_limit, 20)
  INTO pub_count, max_lim
  FROM public.monthly_publication_limits mpl
  WHERE mpl.user_id = p_user_id 
    AND mpl.year = current_year 
    AND mpl.month = current_month;
    
  IF NOT FOUND THEN
    pub_count := 0;
    max_lim := 20;
  END IF;
  
  RETURN QUERY SELECT pub_count, max_lim, (max_lim - pub_count);
END;
$$;

CREATE OR REPLACE FUNCTION public.update_user_google_business_profiles_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_profile_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_wordpress_configs_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_announcements_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_facebook_connections_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Créer le trigger si manquant
DROP TRIGGER IF EXISTS update_facebook_connections_updated_at ON public.facebook_connections;
CREATE TRIGGER update_facebook_connections_updated_at
BEFORE UPDATE ON public.facebook_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_facebook_connections_updated_at();