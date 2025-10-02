-- Create table for Facebook connections
CREATE TABLE public.facebook_connections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  page_id TEXT NOT NULL,
  page_name TEXT NOT NULL,
  page_access_token TEXT NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, page_id)
);

-- Enable RLS
ALTER TABLE public.facebook_connections ENABLE ROW LEVEL SECURITY;

-- Users can view their own connections
CREATE POLICY "Users can view their own Facebook connections"
ON public.facebook_connections
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own connections
CREATE POLICY "Users can insert their own Facebook connections"
ON public.facebook_connections
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own connections
CREATE POLICY "Users can update their own Facebook connections"
ON public.facebook_connections
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own connections
CREATE POLICY "Users can delete their own Facebook connections"
ON public.facebook_connections
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for updated_at
CREATE TRIGGER update_facebook_connections_updated_at
BEFORE UPDATE ON public.facebook_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_profile_updated_at();