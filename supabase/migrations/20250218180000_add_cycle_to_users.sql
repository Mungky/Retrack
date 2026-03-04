-- =============================================================================
-- Add financial cycle columns for Paycheck vs Calendar cycle
-- =============================================================================
-- cycle_type: 'calendar' (1-30/31) or 'paycheck' (custom date range)
-- paycheck_date: day of month (1-31) when paycheck cycle starts
-- =============================================================================

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS cycle_type TEXT NOT NULL DEFAULT 'calendar';

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS paycheck_date SMALLINT NOT NULL DEFAULT 1;

COMMENT ON COLUMN public.users.cycle_type IS 'Financial cycle: calendar (1-31) or paycheck (custom range)';
COMMENT ON COLUMN public.users.paycheck_date IS 'Day of month (1-31) when paycheck cycle starts. Used when cycle_type=paycheck.';

-- Ensure valid cycle_type and paycheck_date
UPDATE public.users SET cycle_type = 'calendar' WHERE cycle_type IS NULL OR cycle_type NOT IN ('calendar', 'paycheck');
UPDATE public.users SET paycheck_date = 1 WHERE paycheck_date IS NULL OR paycheck_date < 1 OR paycheck_date > 31;
