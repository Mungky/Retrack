-- Stop duplicate categories on new user signup
-- Run in Supabase: Dashboard > SQL Editor > New query
--
-- Trigger confirmed: on_auth_user_created
-- Users should use Global Categories (user_id = NULL) instead.

-- Drop the trigger (stops duplicate categories on signup)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function it used (optional - clean up)
DROP FUNCTION IF EXISTS public.handle_new_user();
