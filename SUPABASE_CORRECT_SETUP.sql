-- =============================================================================
-- ClassSync - Resources Table Setup (CORRECTED - Snake Case)
-- =============================================================================
-- Run this in Supabase SQL Editor to create/reset resources table
-- IMPORTANT: This uses snake_case column names (Supabase standard)
-- =============================================================================

-- STEP 1: Drop existing table (deletes all data)
DROP TABLE IF EXISTS "resources" CASCADE;

-- STEP 2: Create Resources Table with snake_case column names
CREATE TABLE "resources" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Resource metadata
  title VARCHAR(255) NOT NULL,
  description TEXT,
  topic VARCHAR(100),
  course VARCHAR(100),
  type VARCHAR(50) NOT NULL,
  
  -- File/URL information
  file_url TEXT,
  filename VARCHAR(255),
  file_size INTEGER,
  
  -- User information
  username VARCHAR(100),
  uploaded_by UUID,
  
  -- Organization
  section_id VARCHAR(255),
  tags TEXT[],
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_resources_topic ON resources(topic);
CREATE INDEX idx_resources_course ON resources(course);
CREATE INDEX idx_resources_type ON resources(type);
CREATE INDEX idx_resources_created_at ON resources(created_at DESC);
CREATE INDEX idx_resources_section ON resources(section_id);

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-update
CREATE TRIGGER update_resources_updated_at
BEFORE UPDATE ON resources
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions (if using RLS)
ALTER TABLE "resources" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read" ON "resources"
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow authenticated insert" ON "resources"
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update" ON "resources"
  FOR UPDATE TO authenticated WITH CHECK (true);

-- Verify table created successfully
SELECT 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'resources'
ORDER BY ordinal_position;
