-- Phase 35: Store printed 15-day settlement session totals.
-- These printed totals are the final source for accounting reports.

ALTER TABLE dairy_settlements
  ADD COLUMN IF NOT EXISTS morning_total_liters NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS evening_total_liters NUMERIC(10,2),
  ADD COLUMN IF NOT EXISTS session_totals JSONB DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS daily_entries JSONB DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_dairy_settlements_session_totals
  ON dairy_settlements(farm_id, period_end);
