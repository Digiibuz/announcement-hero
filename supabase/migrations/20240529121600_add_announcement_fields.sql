
-- Add publishing date and WordPress category ID fields to the announcements table
ALTER TABLE public.announcements 
ADD COLUMN publish_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN wordpress_category_id TEXT;
