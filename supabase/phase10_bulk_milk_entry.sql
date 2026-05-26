-- Phase 10: Overall daily milk entry pricing and quality fields
-- Run this after Phase 9.

ALTER TABLE milk_records
ALTER COLUMN cow_id DROP NOT NULL;

ALTER TABLE milk_records DROP COLUMN IF EXISTS total_litres;

ALTER TABLE milk_records DROP COLUMN IF EXISTS total_amount;

ALTER TABLE milk_records
ALTER COLUMN morning_litres TYPE NUMERIC(10,2),
ALTER COLUMN evening_litres TYPE NUMERIC(10,2);

ALTER TABLE milk_records
ADD COLUMN IF NOT EXISTS price_per_litre NUMERIC(6,2) DEFAULT 0 CHECK (price_per_litre IS NULL OR price_per_litre >= 0);

ALTER TABLE milk_records
ADD COLUMN IF NOT EXISTS morning_price_per_litre NUMERIC(6,2) CHECK (morning_price_per_litre IS NULL OR morning_price_per_litre >= 0);

ALTER TABLE milk_records
ADD COLUMN IF NOT EXISTS evening_price_per_litre NUMERIC(6,2) CHECK (evening_price_per_litre IS NULL OR evening_price_per_litre >= 0);

ALTER TABLE milk_records
ADD COLUMN total_litres NUMERIC(10,2)
GENERATED ALWAYS AS (COALESCE(morning_litres, 0) + COALESCE(evening_litres, 0)) STORED;

-- total_amount is derived data. Dropping/recreating keeps this migration correct.
ALTER TABLE milk_records
ADD COLUMN total_amount NUMERIC(12,2)
GENERATED ALWAYS AS (
  (COALESCE(morning_litres, 0) * COALESCE(morning_price_per_litre, price_per_litre, 0)) +
  (COALESCE(evening_litres, 0) * COALESCE(evening_price_per_litre, price_per_litre, 0))
) STORED;

ALTER TABLE milk_records
ADD COLUMN IF NOT EXISTS snf_value NUMERIC(4,2) CHECK (snf_value IS NULL OR snf_value >= 0);

ALTER TABLE milk_records
ADD COLUMN IF NOT EXISTS degree_reading NUMERIC(5,2) CHECK (degree_reading IS NULL OR degree_reading >= 0);

ALTER TABLE milk_records
ADD COLUMN IF NOT EXISTS morning_fat_percentage NUMERIC(4,2) CHECK (morning_fat_percentage IS NULL OR morning_fat_percentage >= 0);

ALTER TABLE milk_records
ADD COLUMN IF NOT EXISTS evening_fat_percentage NUMERIC(4,2) CHECK (evening_fat_percentage IS NULL OR evening_fat_percentage >= 0);

ALTER TABLE milk_records
ADD COLUMN IF NOT EXISTS morning_snf_value NUMERIC(4,2) CHECK (morning_snf_value IS NULL OR morning_snf_value >= 0);

ALTER TABLE milk_records
ADD COLUMN IF NOT EXISTS evening_snf_value NUMERIC(4,2) CHECK (evening_snf_value IS NULL OR evening_snf_value >= 0);

ALTER TABLE milk_records
ADD COLUMN IF NOT EXISTS morning_degree_reading NUMERIC(5,2) CHECK (morning_degree_reading IS NULL OR morning_degree_reading >= 0);

ALTER TABLE milk_records
ADD COLUMN IF NOT EXISTS evening_degree_reading NUMERIC(5,2) CHECK (evening_degree_reading IS NULL OR evening_degree_reading >= 0);

CREATE UNIQUE INDEX IF NOT EXISTS milk_records_farm_date_overall_unique
ON milk_records (farm_id, date)
WHERE cow_id IS NULL;
