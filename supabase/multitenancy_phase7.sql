BEGIN;

CREATE TABLE IF NOT EXISTS farms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  owner_mobile TEXT UNIQUE NOT NULL,
  owner_email TEXT UNIQUE,
  village_name TEXT,
  taluka_name TEXT,
  district_name TEXT DEFAULT 'पुणे',
  state_name TEXT DEFAULT 'महाराष्ट्र',
  farm_address TEXT,
  dairy_name TEXT,
  dairy_member_number TEXT,
  vet_name TEXT,
  vet_mobile TEXT,
  subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'expired', 'cancelled')),
  trial_ends_at TIMESTAMP DEFAULT NOW() + INTERVAL '30 days',
  subscription_started_at TIMESTAMP,
  subscription_ends_at TIMESTAMP,
  total_cows INTEGER DEFAULT 0,
  milk_rate_default NUMERIC(6,2) DEFAULT 32.00,
  morning_session_time TEXT DEFAULT '06:00',
  evening_session_time TEXT DEFAULT '17:00',
  show_marathi_numbers BOOLEAN DEFAULT true,
  low_milk_alert_litres NUMERIC(5,2) DEFAULT 5.00,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_farms_mobile ON farms(owner_mobile);
CREATE INDEX IF NOT EXISTS idx_farms_email ON farms(owner_email);
CREATE INDEX IF NOT EXISTS idx_farms_active ON farms(is_active);

ALTER TABLE users ADD COLUMN IF NOT EXISTS farm_id UUID REFERENCES farms(id) ON DELETE CASCADE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE users ALTER COLUMN pin_hash DROP NOT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_farm_owner BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_pin BOOLEAN DEFAULT false;
CREATE INDEX IF NOT EXISTS idx_users_farm_id ON users(farm_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

ALTER TABLE cows ADD COLUMN IF NOT EXISTS farm_id UUID REFERENCES farms(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_cows_farm_id ON cows(farm_id);

ALTER TABLE ai_records ADD COLUMN IF NOT EXISTS farm_id UUID REFERENCES farms(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_ai_records_farm_id ON ai_records(farm_id);

ALTER TABLE calving_records ADD COLUMN IF NOT EXISTS farm_id UUID REFERENCES farms(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_calving_records_farm_id ON calving_records(farm_id);

ALTER TABLE milk_records ADD COLUMN IF NOT EXISTS farm_id UUID REFERENCES farms(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_milk_records_farm_id ON milk_records(farm_id);

ALTER TABLE health_records ADD COLUMN IF NOT EXISTS farm_id UUID REFERENCES farms(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_health_records_farm_id ON health_records(farm_id);

ALTER TABLE finance_records ADD COLUMN IF NOT EXISTS farm_id UUID REFERENCES farms(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_finance_records_farm_id ON finance_records(farm_id);

ALTER TABLE reminders ADD COLUMN IF NOT EXISTS farm_id UUID REFERENCES farms(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_reminders_farm_id ON reminders(farm_id);

DO $$
DECLARE
  default_farm_id UUID;
  existing_farm_name TEXT := 'आमची गोशाळा';
  existing_owner_name TEXT := 'मालक';
  existing_mobile TEXT := '9999999999';
  existing_district TEXT := 'पुणे';
BEGIN
  IF to_regclass('public.farm_settings') IS NOT NULL THEN
    SELECT COALESCE((SELECT value FROM farm_settings WHERE key = 'farm_name'), existing_farm_name) INTO existing_farm_name;
    SELECT COALESCE((SELECT value FROM farm_settings WHERE key = 'owner_name'), existing_owner_name) INTO existing_owner_name;
    SELECT COALESCE(NULLIF((SELECT value FROM farm_settings WHERE key = 'farm_mobile'), ''), existing_mobile) INTO existing_mobile;
    SELECT COALESCE((SELECT value FROM farm_settings WHERE key = 'district_name'), existing_district) INTO existing_district;
  END IF;

  SELECT id INTO default_farm_id FROM farms ORDER BY created_at LIMIT 1;

  IF default_farm_id IS NULL THEN
    INSERT INTO farms (
      farm_name,
      owner_name,
      owner_mobile,
      district_name,
      is_active
    ) VALUES (
      existing_farm_name,
      existing_owner_name,
      existing_mobile,
      existing_district,
      true
    ) RETURNING id INTO default_farm_id;
  END IF;

  UPDATE users SET farm_id = default_farm_id WHERE farm_id IS NULL;
  UPDATE users
    SET is_farm_owner = true,
        role = 'admin',
        email = COALESCE(email, 'owner@goshala.local'),
        password_hash = COALESCE(password_hash, '$2b$10$P1vB5zXLSodBSmXBTEP66.1VyM7s/MqfDJg2P1FBJpyWHpDG4EUcu'),
        pin_hash = COALESCE(pin_hash, '$2b$10$FpgtX3FvQ90Eo7QEFddWgOtP6y3lMbZIFS/E2KIOFCayKlVg3K82u')
    WHERE id = (SELECT id FROM users WHERE farm_id = default_farm_id ORDER BY created_at LIMIT 1);

  UPDATE cows SET farm_id = default_farm_id WHERE farm_id IS NULL;
  UPDATE ai_records SET farm_id = default_farm_id WHERE farm_id IS NULL;
  UPDATE calving_records SET farm_id = default_farm_id WHERE farm_id IS NULL;
  UPDATE milk_records SET farm_id = default_farm_id WHERE farm_id IS NULL;
  UPDATE health_records SET farm_id = default_farm_id WHERE farm_id IS NULL;
  UPDATE finance_records SET farm_id = default_farm_id WHERE farm_id IS NULL;
  UPDATE reminders SET farm_id = default_farm_id WHERE farm_id IS NULL;

  UPDATE farms
    SET total_cows = (SELECT COUNT(*) FROM cows WHERE farm_id = default_farm_id AND is_active = true),
        updated_at = NOW()
    WHERE id = default_farm_id;
END $$;

ALTER TABLE users ALTER COLUMN farm_id SET NOT NULL;
ALTER TABLE cows ALTER COLUMN farm_id SET NOT NULL;
ALTER TABLE ai_records ALTER COLUMN farm_id SET NOT NULL;
ALTER TABLE calving_records ALTER COLUMN farm_id SET NOT NULL;
ALTER TABLE milk_records ALTER COLUMN farm_id SET NOT NULL;
ALTER TABLE health_records ALTER COLUMN farm_id SET NOT NULL;
ALTER TABLE finance_records ALTER COLUMN farm_id SET NOT NULL;
ALTER TABLE reminders ALTER COLUMN farm_id SET NOT NULL;

DROP TABLE IF EXISTS farm_settings;

ALTER TABLE farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE cows ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE calving_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE milk_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE finance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own farm" ON farms;
CREATE POLICY "Users can view their own farm"
  ON farms FOR SELECT
  USING (id IN (SELECT farm_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Farm owners can update their own farm" ON farms;
CREATE POLICY "Farm owners can update their own farm"
  ON farms FOR UPDATE
  USING (id IN (SELECT farm_id FROM users WHERE id = auth.uid() AND is_farm_owner = true));

DROP POLICY IF EXISTS "Users can view users in their farm" ON users;
CREATE POLICY "Users can view users in their farm"
  ON users FOR SELECT
  USING (farm_id IN (SELECT farm_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Farm owners can manage users in their farm" ON users;
CREATE POLICY "Farm owners can manage users in their farm"
  ON users FOR ALL
  USING (farm_id IN (SELECT farm_id FROM users WHERE id = auth.uid() AND is_farm_owner = true))
  WITH CHECK (farm_id IN (SELECT farm_id FROM users WHERE id = auth.uid() AND is_farm_owner = true));

DROP POLICY IF EXISTS "Users can access cows in their farm" ON cows;
CREATE POLICY "Users can access cows in their farm"
  ON cows FOR ALL
  USING (farm_id IN (SELECT farm_id FROM users WHERE id = auth.uid()))
  WITH CHECK (farm_id IN (SELECT farm_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can access ai records in their farm" ON ai_records;
CREATE POLICY "Users can access ai records in their farm"
  ON ai_records FOR ALL
  USING (farm_id IN (SELECT farm_id FROM users WHERE id = auth.uid()))
  WITH CHECK (farm_id IN (SELECT farm_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can access calving records in their farm" ON calving_records;
CREATE POLICY "Users can access calving records in their farm"
  ON calving_records FOR ALL
  USING (farm_id IN (SELECT farm_id FROM users WHERE id = auth.uid()))
  WITH CHECK (farm_id IN (SELECT farm_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can access milk records in their farm" ON milk_records;
CREATE POLICY "Users can access milk records in their farm"
  ON milk_records FOR ALL
  USING (farm_id IN (SELECT farm_id FROM users WHERE id = auth.uid()))
  WITH CHECK (farm_id IN (SELECT farm_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can access health records in their farm" ON health_records;
CREATE POLICY "Users can access health records in their farm"
  ON health_records FOR ALL
  USING (farm_id IN (SELECT farm_id FROM users WHERE id = auth.uid()))
  WITH CHECK (farm_id IN (SELECT farm_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can access finance records in their farm" ON finance_records;
CREATE POLICY "Users can access finance records in their farm"
  ON finance_records FOR ALL
  USING (farm_id IN (SELECT farm_id FROM users WHERE id = auth.uid()))
  WITH CHECK (farm_id IN (SELECT farm_id FROM users WHERE id = auth.uid()));

DROP POLICY IF EXISTS "Users can access reminders in their farm" ON reminders;
CREATE POLICY "Users can access reminders in their farm"
  ON reminders FOR ALL
  USING (farm_id IN (SELECT farm_id FROM users WHERE id = auth.uid()))
  WITH CHECK (farm_id IN (SELECT farm_id FROM users WHERE id = auth.uid()));

COMMIT;
