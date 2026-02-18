-- =============================================================================
-- CATEGORIES TABLE: Ensure schema matches Premium-ready structure
-- =============================================================================
-- Columns: id, user_id, name, type, icon, color, is_custom
-- user_id nullable = kategori default sistem (global)
-- =============================================================================

-- Create categories table if it doesn't exist (e.g. fresh install)
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('EXPENSE', 'INCOME', 'expense', 'income')),
  icon TEXT,
  color TEXT,
  is_custom BOOLEAN NOT NULL DEFAULT false
);

-- Add is_custom if missing (for existing tables)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_custom BOOLEAN NOT NULL DEFAULT false;

-- Add color if missing
ALTER TABLE categories ADD COLUMN IF NOT EXISTS color TEXT;

-- Add type if missing (legacy)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS type TEXT;
-- Backfill type for existing rows
UPDATE categories SET type = 'expense' WHERE type IS NULL;
ALTER TABLE categories ALTER COLUMN type SET DEFAULT 'expense';
ALTER TABLE categories ALTER COLUMN type SET NOT NULL;

-- Add icon if missing
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon TEXT;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_categories_user_id ON categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON categories(type);

-- RLS (Row Level Security)
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Users can read: own categories + global (user_id IS NULL)
DROP POLICY IF EXISTS "Users can read own and global categories" ON categories;
CREATE POLICY "Users can read own and global categories"
  ON categories FOR SELECT
  USING (
    auth.uid() = user_id OR user_id IS NULL
  );

-- Users can insert own categories
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update own categories
DROP POLICY IF EXISTS "Users can update own categories" ON categories;
CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete own categories
DROP POLICY IF EXISTS "Users can delete own categories" ON categories;
CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id);
