-- Fix RLS policies on profiles table to properly secure user data
-- Drop the problematic policies that create security gaps
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

-- Update the main admin policy to be more restrictive and avoid duplication
DROP POLICY IF EXISTS "Les administrateurs peuvent voir tous les profils" ON public.profiles;
DROP POLICY IF EXISTS "Les administrateurs peuvent créer des profils" ON public.profiles;
DROP POLICY IF EXISTS "Les administrateurs peuvent mettre à jour tous les profils" ON public.profiles;
DROP POLICY IF EXISTS "Les administrateurs peuvent supprimer des profils" ON public.profiles;

-- Create secure, non-overlapping RLS policies
-- 1. Allow users to view only their own profile
CREATE POLICY "Users can view their own profile only" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- 2. Allow users to update only their own profile (limited fields)
CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = id);

-- 3. Admin policies using security definer function
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (is_admin_user());

CREATE POLICY "Admins can create profiles" 
ON public.profiles 
FOR INSERT 
WITH CHECK (is_admin_user());

CREATE POLICY "Admins can update all profiles" 
ON public.profiles 
FOR UPDATE 
USING (is_admin_user());

CREATE POLICY "Admins can delete profiles" 
ON public.profiles 
FOR DELETE 
USING (is_admin_user());

-- Ensure the is_admin_user function is secure and uses proper search_path
CREATE OR REPLACE FUNCTION public.is_admin_user()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role 
  FROM public.profiles 
  WHERE id = auth.uid();
  
  RETURN user_role = 'admin';
END;
$$;