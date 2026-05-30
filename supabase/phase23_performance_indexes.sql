-- Performance indexes for mobile dashboard, reminders, milk, accounting, and reports.
-- Safe to run multiple times.

CREATE INDEX IF NOT EXISTS idx_cows_farm_active_status
ON public.cows (farm_id, is_active, status);

CREATE INDEX IF NOT EXISTS idx_milk_records_farm_cow_date
ON public.milk_records (farm_id, cow_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_milk_records_farm_date_overall
ON public.milk_records (farm_id, date DESC)
WHERE cow_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_reminders_farm_done_date
ON public.reminders (farm_id, is_done, reminder_date, created_at);

CREATE INDEX IF NOT EXISTS idx_calves_farm_status_raised
ON public.calves (farm_id, status, is_raised);

CREATE INDEX IF NOT EXISTS idx_finance_records_farm_date_type
ON public.finance_records (farm_id, date DESC, type);

CREATE INDEX IF NOT EXISTS idx_health_records_farm_date_cost
ON public.health_records (farm_id, date DESC)
WHERE cost > 0;

CREATE INDEX IF NOT EXISTS idx_monthly_expenses_farm_date
ON public.monthly_expenses (farm_id, expense_date DESC);

CREATE INDEX IF NOT EXISTS idx_dairy_settlements_farm_date
ON public.dairy_settlements (farm_id, settlement_date DESC);

CREATE INDEX IF NOT EXISTS idx_dairy_slips_farm_date_session
ON public.dairy_slips (farm_id, slip_date DESC, session);
