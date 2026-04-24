-- Create notebooks table for permanent storage
-- Run this SQL in your Supabase SQL Editor to set up the database schema

CREATE TABLE IF NOT EXISTS notebooks (
  id TEXT PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  sources JSONB DEFAULT '[]',
  notes TEXT DEFAULT '',
  chat_history JSONB DEFAULT '[]',
  summary_data TEXT DEFAULT '',
  quiz_data JSONB DEFAULT '[]',
  flashcards_data JSONB DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS notebooks_user_id_idx ON notebooks(user_id);
CREATE INDEX IF NOT EXISTS notebooks_updated_at_idx ON notebooks(updated_at);

-- Enable RLS (Row Level Security) for notebooks table
ALTER TABLE notebooks ENABLE ROW LEVEL SECURITY;

-- Create RLS policy: Users can only see their own notebooks
CREATE POLICY "Users can view their own notebooks"
  ON notebooks
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create RLS policy: Users can only insert their own notebooks
CREATE POLICY "Users can insert their own notebooks"
  ON notebooks
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: Users can only update their own notebooks
CREATE POLICY "Users can update their own notebooks"
  ON notebooks
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Create RLS policy: Users can only delete their own notebooks
CREATE POLICY "Users can delete their own notebooks"
  ON notebooks
  FOR DELETE
  USING (auth.uid() = user_id);
