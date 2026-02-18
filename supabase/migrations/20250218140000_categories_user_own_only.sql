-- =============================================================================
-- CATEGORIES: User-Owned Only (No Global in Frontend)
-- =============================================================================
-- 1. Add is_custom column if missing
-- 2. Trigger: On new user signup, COPY template categories (user_id IS NULL)
--    to new user with their user_id
-- 3. RLS: User can ONLY access own categories (user_id = auth.uid())
-- =============================================================================

-- 1. Ensure is_custom column exists
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_custom BOOLEAN NOT NULL DEFAULT false;

-- 2. Create function to copy template categories to new user
CREATE OR REPLACE FUNCTION public.handle_new_user_categories()
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
    false  -- Template copies are NOT custom (user can edit/delete, but they're from template)
  FROM public.categories
  WHERE user_id IS NULL;
  RETURN NEW;
END;
$$;

-- 3. Drop old trigger if exists (from disable_new_user_category_trigger or previous setup)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 4. Create trigger on auth.users (fires when new user signs up)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_categories();

-- 5. Backfill: For EXISTING users who have no categories yet, copy template to them
--    (Run once for migration - users created before this trigger existed)
INSERT INTO public.categories (user_id, name, type, icon, color, is_custom)
SELECT DISTINCT
  u.id,
  c.name,
  c.type,
  c.icon,
  c.color,
  false
FROM auth.users u
CROSS JOIN public.categories c
WHERE c.user_id IS NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.categories c2
    WHERE c2.user_id = u.id
  );

-- 6. Update RLS - User can ONLY access own categories (no more reading global)
DROP POLICY IF EXISTS "Users can read own and global categories" ON categories;
CREATE POLICY "Users can read own categories"
  ON categories FOR SELECT
  USING (auth.uid() = user_id);

-- Ensure other policies are strict (own only)
DROP POLICY IF EXISTS "Users can insert own categories" ON categories;
CREATE POLICY "Users can insert own categories"
  ON categories FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own categories" ON categories;
CREATE POLICY "Users can update own categories"
  ON categories FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own categories" ON categories;
CREATE POLICY "Users can delete own categories"
  ON categories FOR DELETE
  USING (auth.uid() = user_id);
