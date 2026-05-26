BEGIN;

ALTER TABLE farms ALTER COLUMN owner_email DROP NOT NULL;
ALTER TABLE farms ADD COLUMN IF NOT EXISTS mobile_verified BOOLEAN DEFAULT false;
ALTER TABLE farms ADD COLUMN IF NOT EXISTS verification_code TEXT;
ALTER TABLE farms ADD COLUMN IF NOT EXISTS verification_expires_at TIMESTAMP;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'unique_owner_mobile'
      AND conrelid = 'public.farms'::regclass
  ) THEN
    ALTER TABLE farms ADD CONSTRAINT unique_owner_mobile UNIQUE (owner_mobile);
  END IF;
END $$;

ALTER TABLE users ALTER COLUMN email DROP NOT NULL;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

CREATE TABLE IF NOT EXISTS signup_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mobile TEXT NOT NULL,
  pin_hash TEXT NOT NULL,
  farm_name TEXT NOT NULL,
  owner_name TEXT NOT NULL,
  village_name TEXT,
  district_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  requested_at TIMESTAMP DEFAULT NOW(),
  approved_at TIMESTAMP,
  rejected_reason TEXT
);

CREATE INDEX IF NOT EXISTS idx_signup_mobile ON signup_requests(mobile);

COMMIT;
