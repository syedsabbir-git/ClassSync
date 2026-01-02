-- =============================================================================
-- ClassSync - Resources Table Setup
-- =============================================================================
-- Run this in Supabase SQL Editor to create/reset resources table
-- =============================================================================

-- STEP 1: Drop existing table (deletes all data)
DROP TABLE IF EXISTS "resources" CASCADE;

-- STEP 2: Create Resources Table
CREATE TABLE "resources" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Resource metadata
  title VARCHAR(255) NOT NULL,
  description TEXT,
  topic VARCHAR(100),
  course VARCHAR(100),
  type VARCHAR(50) NOT NULL,
  
  -- File/URL information
  fileURL TEXT,
  filename VARCHAR(255),
  fileSize INTEGER,
  
  -- User information
  username VARCHAR(100),
  uploadedBy UUID,
  
  -- Organization
  sectionId VARCHAR(255),
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
CREATE INDEX idx_resources_section ON resources(sectionId);

-- Auto-update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-update
CREATE TRIGGER update_resources_updated_at
BEFORE UPDATE ON resources
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Done! Table is ready to use.

