-- Create the transformation_assessments table in your Supabase project
-- Go to your Supabase Dashboard -> SQL Editor -> New Query
-- Copy and paste this SQL and run it

CREATE TABLE IF NOT EXISTS transformation_assessments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  company_name TEXT,
  industry TEXT,
  company_size TEXT,
  responses JSONB NOT NULL,
  proposal TEXT,
  completion_percentage INTEGER DEFAULT 0,
  mode TEXT NOT NULL CHECK (mode IN ('chat', 'form')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- If the table already exists, add the new columns
ALTER TABLE transformation_assessments 
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS industry TEXT,
ADD COLUMN IF NOT EXISTS company_size TEXT,
ADD COLUMN IF NOT EXISTS proposal TEXT;

-- Create an index on client_email for faster queries
CREATE INDEX IF NOT EXISTS idx_transformation_assessments_email 
ON transformation_assessments(client_email);

-- Create an index on timestamp for faster sorting
CREATE INDEX IF NOT EXISTS idx_transformation_assessments_timestamp 
ON transformation_assessments(timestamp DESC);

-- Create an index on industry for analytics queries
CREATE INDEX IF NOT EXISTS idx_transformation_assessments_industry 
ON transformation_assessments(industry);

-- Create an updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_transformation_assessments_updated_at ON transformation_assessments;

CREATE TRIGGER update_transformation_assessments_updated_at
  BEFORE UPDATE ON transformation_assessments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE transformation_assessments ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable insert for all users" ON transformation_assessments;
DROP POLICY IF EXISTS "Enable read access for all users" ON transformation_assessments;
DROP POLICY IF EXISTS "Enable update for all users" ON transformation_assessments;

-- Create a policy that allows anyone to insert (you can modify this based on your needs)
CREATE POLICY "Enable insert for all users" ON transformation_assessments
  FOR INSERT WITH CHECK (true);

-- Create a policy that allows anyone to read (you can modify this based on your needs)
CREATE POLICY "Enable read access for all users" ON transformation_assessments
  FOR SELECT USING (true);

-- Optional: Create a policy for updates (modify based on your needs)
CREATE POLICY "Enable update for all users" ON transformation_assessments
  FOR UPDATE USING (true);

