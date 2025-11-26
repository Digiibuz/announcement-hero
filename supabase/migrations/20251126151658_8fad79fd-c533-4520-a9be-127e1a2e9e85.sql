-- Fonction pour vérifier si l'utilisateur est un testeur
CREATE OR REPLACE FUNCTION public.is_tester()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'testeur')
$$;

-- Permissions pour les testeurs sur la table profiles
CREATE POLICY "Testeurs peuvent voir leur propre profil"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id AND public.is_tester());

-- Permissions pour les testeurs sur la table announcements
CREATE POLICY "Testeurs peuvent voir leurs propres annonces"
ON public.announcements
FOR SELECT
TO authenticated
USING (auth.uid() = user_id AND public.is_tester());

CREATE POLICY "Testeurs peuvent créer leurs propres annonces"
ON public.announcements
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND public.is_tester());

CREATE POLICY "Testeurs peuvent modifier leurs propres annonces"
ON public.announcements
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND public.is_tester());

CREATE POLICY "Testeurs peuvent supprimer leurs propres annonces"
ON public.announcements
FOR DELETE
TO authenticated
USING (auth.uid() = user_id AND public.is_tester());

-- Permissions pour les testeurs sur monthly_ai_limits
CREATE POLICY "Testeurs peuvent voir leurs propres limites IA"
ON public.monthly_ai_limits
FOR SELECT
TO authenticated
USING (auth.uid() = user_id AND public.is_tester());

CREATE POLICY "Testeurs peuvent créer leurs propres limites IA"
ON public.monthly_ai_limits
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND public.is_tester());

CREATE POLICY "Testeurs peuvent modifier leurs propres limites IA"
ON public.monthly_ai_limits
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND public.is_tester());

-- Permissions pour les testeurs sur monthly_publication_limits
CREATE POLICY "Testeurs peuvent voir leurs propres limites de publication"
ON public.monthly_publication_limits
FOR SELECT
TO authenticated
USING (auth.uid() = user_id AND public.is_tester());

CREATE POLICY "Testeurs peuvent créer leurs propres limites de publication"
ON public.monthly_publication_limits
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id AND public.is_tester());

CREATE POLICY "Testeurs peuvent modifier leurs propres limites de publication"
ON public.monthly_publication_limits
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id AND public.is_tester());