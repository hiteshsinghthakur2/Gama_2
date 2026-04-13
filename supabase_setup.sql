-- Run this script in your Supabase SQL Editor to set up the database for the app.

-- 1. Create the user_data table
CREATE TABLE IF NOT EXISTS user_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  key_id TEXT NOT NULL,
  content JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, key_id)
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- 3. Create RLS Policies
-- Allow users to select only their own data
CREATE POLICY "Users can view their own data" 
ON user_data FOR SELECT 
USING (auth.uid() = user_id);

-- Allow users to insert their own data
CREATE POLICY "Users can insert their own data" 
ON user_data FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own data
CREATE POLICY "Users can update their own data" 
ON user_data FOR UPDATE 
USING (auth.uid() = user_id);

-- Allow users to delete their own data
CREATE POLICY "Users can delete their own data" 
ON user_data FOR DELETE 
USING (auth.uid() = user_id);
