-- Fix Supabase Storage Bucket RLS Issues
-- Run this in Supabase SQL Editor

-- Option 1: Drop all existing policies on storage.objects
DROP POLICY IF EXISTS "Public Read" ON storage.objects;
DROP POLICY IF EXISTS "Public Write" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
DROP POLICY IF EXISTS "Allow public download" ON storage.objects;
DROP POLICY IF EXISTS "Allow public uploads" ON storage.objects;

-- Option 2: Create simple permissive policies
CREATE POLICY "Allow all reads" ON storage.objects FOR SELECT USING (true);
CREATE POLICY "Allow all inserts" ON storage.objects FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow all updates" ON storage.objects FOR UPDATE USING (true);
CREATE POLICY "Allow all deletes" ON storage.objects FOR DELETE USING (true);

-- Verify policies
SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'objects' AND schemaname = 'storage';
