-- Add pdf_data column to resources table for storing base64 PDF content
-- This bypasses storage bucket RLS issues by storing files in the database

ALTER TABLE resources ADD COLUMN IF NOT EXISTS pdf_data TEXT;

-- For YouTube links and other resources, file_url still works
-- For PDFs, we'll store the base64 data in pdf_data column

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'resources' 
ORDER BY ordinal_position;
