-- =============================================================================
-- Add theme column to users - Single Source of Truth for cross-device sync
-- =============================================================================
-- Valid values: default, sultan, forest
-- Sultan & forest require is_pro = true (validated at application layer)
-- =============================================================================

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS theme TEXT NOT NULL DEFAULT 'default';

COMMENT ON COLUMN public.users.theme IS 'User theme preference. Values: default, sultan, forest. Synced across devices.';

-- Ensure existing rows have default theme
UPDATE public.users SET theme = 'default' WHERE theme IS NULL OR theme NOT IN ('default', 'sultan', 'forest');
