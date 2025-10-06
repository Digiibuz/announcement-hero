-- Add endpoint_type column to wordpress_configs table
ALTER TABLE public.wordpress_configs 
ADD COLUMN IF NOT EXISTS endpoint_type text DEFAULT 'pages';

-- Add comment to explain the column
COMMENT ON COLUMN public.wordpress_configs.endpoint_type IS 'Type of WordPress endpoint to use: pages, dipi_cpt, or dipicpt';

-- Add endpoint_checked_at column to track when the endpoint was last checked
ALTER TABLE public.wordpress_configs 
ADD COLUMN IF NOT EXISTS endpoint_checked_at timestamp with time zone;

COMMENT ON COLUMN public.wordpress_configs.endpoint_checked_at IS 'Timestamp of the last endpoint detection check';