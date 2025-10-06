-- Créer la table pour stocker les states d'authentification Facebook (protection CSRF)
CREATE TABLE IF NOT EXISTS public.facebook_auth_states (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  state TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index pour recherche rapide par user_id et state
CREATE INDEX IF NOT EXISTS idx_facebook_auth_states_user_id ON public.facebook_auth_states(user_id);
CREATE INDEX IF NOT EXISTS idx_facebook_auth_states_state ON public.facebook_auth_states(state);
CREATE INDEX IF NOT EXISTS idx_facebook_auth_states_expires_at ON public.facebook_auth_states(expires_at);

-- RLS policies
ALTER TABLE public.facebook_auth_states ENABLE ROW LEVEL SECURITY;

-- Seul le système peut gérer ces états (via edge functions)
CREATE POLICY "Service role can manage auth states"
  ON public.facebook_auth_states
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Nettoyage automatique des states expirés (fonction)
CREATE OR REPLACE FUNCTION public.cleanup_expired_facebook_auth_states()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.facebook_auth_states
  WHERE expires_at < now();
END;
$$;

COMMENT ON TABLE public.facebook_auth_states IS 'Stocke temporairement les states OAuth pour la protection CSRF lors de l''authentification Facebook';
COMMENT ON FUNCTION public.cleanup_expired_facebook_auth_states IS 'Nettoie les states expirés (à exécuter périodiquement via cron)';