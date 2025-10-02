-- Create announcement-images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('announcement-images', 'announcement-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload announcement images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'announcement-images');

-- Allow public read access to announcement images
CREATE POLICY "Public can read announcement images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'announcement-images');

-- Allow authenticated users to update their own images
CREATE POLICY "Authenticated users can update announcement images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'announcement-images');

-- Allow authenticated users to delete images
CREATE POLICY "Authenticated users can delete announcement images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'announcement-images');