-- Supabase Storage Setup for ClassSync Resources
-- Run these commands in Supabase SQL Editor

-- 1. Create the storage bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public)
VALUES ('resources', 'resources', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable public access for the resources bucket
UPDATE storage.buckets
SET public = true
WHERE id = 'resources';

-- 3. Create policy to allow public downloads
CREATE POLICY "Public Download" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'resources');

-- 4. Create policy to allow authenticated uploads
CREATE POLICY "Authenticated Upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'resources');

-- 5. Create policy to allow authenticated deletes
CREATE POLICY "Authenticated Delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'resources');

-- Verify bucket was created
SELECT id, name, public FROM storage.buckets WHERE id = 'resources';
