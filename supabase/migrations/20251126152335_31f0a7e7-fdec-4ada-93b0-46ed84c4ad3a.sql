-- Supprimer l'ancienne contrainte CHECK sur le rôle si elle existe
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

-- Ajouter une nouvelle contrainte CHECK qui inclut le rôle testeur
ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('admin', 'editor', 'client', 'commercial', 'testeur'));