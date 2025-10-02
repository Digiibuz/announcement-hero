-- Supprimer la colonne zapier_webhook_url de la table profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS zapier_webhook_url;