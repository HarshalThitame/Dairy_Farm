-- Fix settlement accounting period.
-- 15-day settlement income and dairy feed deductions must be counted in the
-- month of the slip period end date, not the month when the slip was uploaded.

CREATE INDEX IF NOT EXISTS idx_dairy_settlements_farm_period_end
ON public.dairy_settlements (farm_id, period_end DESC);
