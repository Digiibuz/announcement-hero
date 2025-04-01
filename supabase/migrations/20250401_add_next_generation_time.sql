
-- Add next_generation_time to tome_automation table
ALTER TABLE IF EXISTS "public"."tome_automation" 
ADD COLUMN IF NOT EXISTS "next_generation_time" TIMESTAMPTZ;
