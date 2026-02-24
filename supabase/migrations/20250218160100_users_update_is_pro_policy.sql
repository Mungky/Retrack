-- =============================================================================
-- RLS: Allow users to update own is_pro (untuk flow upgrade)
-- =============================================================================
-- Catatan: Di production dengan payment real, pertimbangkan menggunakan
-- service role client dari webhook payment, dan batasi policy ini.
-- =============================================================================

DROP POLICY IF EXISTS "Users can update own is_pro" ON public.users;
CREATE POLICY "Users can update own is_pro"
  ON public.users FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
