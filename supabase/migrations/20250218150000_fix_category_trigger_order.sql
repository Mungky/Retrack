-- =============================================================================
-- FIX: Category seed trigger order - avoid FK violation
-- =============================================================================
-- Problem: Trigger on auth.users inserts categories before public.users row exists.
--          categories.user_id references public.users(id) -> FK violation.
-- Solution: Seed categories on public.users INSERT (not auth.users).
-- =============================================================================

-- ============ 1. CLEANUP: Drop old triggers & functions ============
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_sync ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_categories();

-- ============ 2. TRIGGER 1: Sync auth.users -> public.users ============
-- Ensure public.users table exists (id, email, raw_user_meta_data)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  raw_user_meta_data JSONB
);

-- Add columns if table existed with different structure
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS raw_user_meta_data JSONB;

-- Drop seed trigger if it exists (from previous run)
DROP TRIGGER IF EXISTS on_public_user_created_seed_categories ON public.users;

-- Enable RLS on public.users
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own row
DROP POLICY IF EXISTS "Users can read own profile" ON public.users;
CREATE POLICY "Users can read own profile"
  ON public.users FOR SELECT
  USING (auth.uid() = id);

-- Function: Insert new user into public.users when they sign up
CREATE OR REPLACE FUNCTION public.handle_new_user_sync()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, email, raw_user_meta_data)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    raw_user_meta_data = EXCLUDED.raw_user_meta_data;
  RETURN NEW;
END;
$$;

-- Trigger: After insert on auth.users -> sync to public.users
DROP TRIGGER IF EXISTS on_auth_user_created_sync ON auth.users;
CREATE TRIGGER on_auth_user_created_sync
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_sync();

-- ============ 3. TRIGGER 2: Seed categories on public.users insert ============
-- Function: Copy template categories to new user (runs when public.users row is inserted)
CREATE OR REPLACE FUNCTION public.seed_default_categories()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.categories (user_id, name, type, icon, color, is_custom)
  SELECT
    NEW.id,
    name,
    type,
    icon,
    color,
    false
  FROM public.categories
  WHERE user_id IS NULL;
  RETURN NEW;
END;
$$;

-- Trigger: After insert on public.users -> seed categories
DROP TRIGGER IF EXISTS on_public_user_created_seed_categories ON public.users;
CREATE TRIGGER on_public_user_created_seed_categories
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.seed_default_categories();

-- ============ 4. Backfill public.users for existing auth users ============
-- Sync any auth.users that don't have a row in public.users yet
INSERT INTO public.users (id, email, raw_user_meta_data)
SELECT au.id, au.email, au.raw_user_meta_data
FROM auth.users au
WHERE NOT EXISTS (SELECT 1 FROM public.users pu WHERE pu.id = au.id);
