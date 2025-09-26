-- Ajouter le champ zapier_webhook_url à la table profiles
ALTER TABLE public.profiles 
ADD COLUMN zapier_webhook_url TEXT;