-- Disable RLS for storage.objects to allow PDF uploads
-- Run this in Supabase SQL Editor

-- 1. Drop existing policies (if any)
DROP POLICY IF EXISTS "Public Download" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;

-- 2. Disable RLS on storage.objects
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 3. Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- Should show: objects | f (false = RLS disabled)
