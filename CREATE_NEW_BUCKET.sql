-- Create new storage bucket WITHOUT RLS
-- Run this in Supabase SQL Editor

-- 1. Create a new bucket called 'classsync-files' (without RLS)
INSERT INTO storage.buckets (id, name, public)
VALUES ('classsync-files', 'classsync-files', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Verify bucket was created
SELECT id, name, public FROM storage.buckets WHERE id = 'classsync-files';

-- That's it! This bucket has no RLS by default, so uploads will work immediately.
