-- =============================================================================
-- LIFETIME ONLY: Add is_pro column to users for Lifetime Access subscription
-- =============================================================================
-- Kolom is_pro menandai user yang telah membeli Lifetime Access (beli putus).
-- =============================================================================

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS is_pro BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.users.is_pro IS 'User has Lifetime Access (one-time purchase). No monthly subscription.';
