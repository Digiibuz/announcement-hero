-- Créer une fonction qui met à jour l'activité utilisateur
CREATE OR REPLACE FUNCTION public.update_user_activity_on_announcement()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Mettre à jour ou insérer l'activité de l'utilisateur
  INSERT INTO public.user_activity (user_id, last_activity_at, activity_type)
  VALUES (NEW.user_id, NOW(), 'announcement_action')
  ON CONFLICT (user_id)
  DO UPDATE SET
    last_activity_at = NOW(),
    activity_type = 'announcement_action',
    updated_at = NOW();
  
  RETURN NEW;
END;
$$;

-- Créer un trigger sur les INSERT d'annonces
CREATE TRIGGER track_user_activity_on_announcement_insert
AFTER INSERT ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.update_user_activity_on_announcement();

-- Créer un trigger sur les UPDATE d'annonces
CREATE TRIGGER track_user_activity_on_announcement_update
AFTER UPDATE ON public.announcements
FOR EACH ROW
EXECUTE FUNCTION public.update_user_activity_on_announcement();

-- Peupler la table user_activity avec les données historiques
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN 
    SELECT id, last_sign_in_at 
    FROM auth.users 
    WHERE last_sign_in_at IS NOT NULL
  LOOP
    INSERT INTO public.user_activity (user_id, last_activity_at, activity_type, created_at, updated_at)
    VALUES (
      user_record.id,
      user_record.last_sign_in_at,
      'login',
      user_record.last_sign_in_at,
      user_record.last_sign_in_at
    )
    ON CONFLICT (user_id) DO NOTHING;
  END LOOP;
END $$;