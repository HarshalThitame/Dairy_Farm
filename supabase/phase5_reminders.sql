ALTER TABLE reminders
ADD COLUMN IF NOT EXISTS done_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS skipped BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS reminders_done_month_idx ON reminders (is_done, done_at);
