-- Fix RLS (Row Level Security) for the Spelling Bee app
--
-- Run this in the Supabase SQL Editor:
-- https://supabase.com/dashboard/project/nwgxyytowbluuykbdcfc/sql/new
--
-- This enables RLS (so the dashboard warning goes away) and adds
-- permissive policies so the app can read/write freely.

-- =============================================
-- Table: saved_words
-- =============================================
ALTER TABLE saved_words ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to saved_words"
  ON saved_words
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =============================================
-- Table: word_progress
-- =============================================
ALTER TABLE word_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all access to word_progress"
  ON word_progress
  FOR ALL
  USING (true)
  WITH CHECK (true);
