-- Phase 9: Super Admin platform management
-- Run this after Phase 7 and Phase 8 migrations.

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS super_admins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  mobile TEXT,
  is_active BOOLEAN DEFAULT true,
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMP,
  last_login TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_super_admins_email ON super_admins(email);
CREATE INDEX IF NOT EXISTS idx_super_admins_active ON super_admins(is_active);

CREATE TABLE IF NOT EXISTS admin_activity_log (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID REFERENCES super_admins(id) ON DELETE SET NULL,
  farm_id UUID REFERENCES farms(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_log_admin ON admin_activity_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_farm ON admin_activity_log(farm_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created ON admin_activity_log(created_at);
CREATE INDEX IF NOT EXISTS idx_activity_log_action ON admin_activity_log(action);

ALTER TABLE farms ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE farms ADD COLUMN IF NOT EXISTS suspended_reason TEXT;
ALTER TABLE farms ADD COLUMN IF NOT EXISTS suspended_at TIMESTAMP;
ALTER TABLE farms ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMP DEFAULT NOW();

CREATE TABLE IF NOT EXISTS platform_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stat_date DATE DEFAULT CURRENT_DATE UNIQUE,
  total_farms INTEGER DEFAULT 0,
  active_farms INTEGER DEFAULT 0,
  trial_farms INTEGER DEFAULT 0,
  total_cows INTEGER DEFAULT 0,
  total_milk_records INTEGER DEFAULT 0,
  total_users INTEGER DEFAULT 0,
  new_signups_today INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_platform_stats_date ON platform_stats(stat_date);

CREATE TABLE IF NOT EXISTS platform_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  label TEXT NOT NULL,
  type TEXT DEFAULT 'text',
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO platform_settings (key, value, label, type) VALUES
('default_trial_days', '30', 'Default trial period in days', 'number'),
('low_activity_threshold_days', '14', 'Low activity threshold in days', 'number'),
('email_notifications', 'false', 'Email notifications enabled', 'boolean')
ON CONFLICT (key) DO NOTHING;

CREATE OR REPLACE FUNCTION refresh_platform_stats()
RETURNS void AS $$
BEGIN
  INSERT INTO platform_stats (
    stat_date,
    total_farms,
    active_farms,
    trial_farms,
    total_cows,
    total_milk_records,
    total_users,
    new_signups_today
  ) VALUES (
    CURRENT_DATE,
    COALESCE((SELECT COUNT(*) FROM farms WHERE is_active = true), 0),
    COALESCE((SELECT COUNT(*) FROM farms WHERE is_active = true AND subscription_status = 'active'), 0),
    COALESCE((SELECT COUNT(*) FROM farms WHERE subscription_status = 'trial'), 0),
    COALESCE((SELECT SUM(total_cows) FROM farms WHERE is_active = true), 0),
    COALESCE((SELECT COUNT(*) FROM milk_records), 0),
    COALESCE((SELECT COUNT(*) FROM users), 0),
    COALESCE((SELECT COUNT(*) FROM farms WHERE DATE(created_at) = CURRENT_DATE), 0)
  )
  ON CONFLICT (stat_date) DO UPDATE SET
    total_farms = EXCLUDED.total_farms,
    active_farms = EXCLUDED.active_farms,
    trial_farms = EXCLUDED.trial_farms,
    total_cows = EXCLUDED.total_cows,
    total_milk_records = EXCLUDED.total_milk_records,
    total_users = EXCLUDED.total_users,
    new_signups_today = EXCLUDED.new_signups_today,
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Default login:
-- Email: your@email.com
-- Password: TempPass123!
-- Change both immediately after first login.
INSERT INTO super_admins (email, password_hash, name, mobile)
VALUES (
  'your@email.com',
  '$2b$10$X1tu1W06bRFORdIBeU39jOk3Qsm2b8yTlim8GyVicPKD4Ro01X22K',
  'Harshal',
  '9876543210'
)
ON CONFLICT (email) DO NOTHING;

-- Optional: run this separately after the migration if you want to seed today's
-- platform_stats row immediately.
-- SELECT refresh_platform_stats();
