-- Create a table to track user activity
CREATE TABLE IF NOT EXISTS public.user_activity (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  last_activity_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  activity_type TEXT NOT NULL DEFAULT 'login',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Policy for users to update their own activity
CREATE POLICY "Users can update their own activity"
ON public.user_activity
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy for users to view their own activity
CREATE POLICY "Users can view their own activity"
ON public.user_activity
FOR SELECT
USING (auth.uid() = user_id);

-- Policy for admins to view all activity
CREATE POLICY "Admins can view all activity"
ON public.user_activity
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = auth.uid()
    AND profiles.role = 'admin'
  )
);

-- Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_last_activity ON public.user_activity(last_activity_at DESC);

-- Create a unique index to ensure only one record per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_user_activity_unique_user ON public.user_activity(user_id);

-- Create a function to upsert user activity
CREATE OR REPLACE FUNCTION public.update_user_activity()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_activity (user_id, last_activity_at, activity_type)
  VALUES (auth.uid(), now(), 'activity')
  ON CONFLICT (user_id)
  DO UPDATE SET
    last_activity_at = now(),
    updated_at = now();
END;
$$;