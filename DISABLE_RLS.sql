-- Disable Row Level Security for resources table
-- This allows full access without RLS restrictions
-- Run this in Supabase SQL Editor

ALTER TABLE "resources" DISABLE ROW LEVEL SECURITY;

-- Verify RLS is disabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'resources';

-- Should show: resources | f (false = RLS disabled)
