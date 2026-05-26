-- Convert milk_records from cow-wise daily entries to one farm-level daily entry.
-- The app now records total morning/evening milk for the whole farm, not per cow.

BEGIN;

ALTER TABLE public.milk_records
ALTER COLUMN cow_id DROP NOT NULL;

ALTER TABLE public.milk_records
DROP COLUMN IF EXISTS total_litres;

ALTER TABLE public.milk_records
DROP COLUMN IF EXISTS total_amount;

ALTER TABLE public.milk_records
ALTER COLUMN morning_litres TYPE NUMERIC(10,2),
ALTER COLUMN evening_litres TYPE NUMERIC(10,2);

ALTER TABLE public.milk_records
ADD COLUMN IF NOT EXISTS price_per_litre NUMERIC(6,2) DEFAULT 0 CHECK (price_per_litre IS NULL OR price_per_litre >= 0);

ALTER TABLE public.milk_records
ADD COLUMN IF NOT EXISTS morning_price_per_litre NUMERIC(6,2) CHECK (morning_price_per_litre IS NULL OR morning_price_per_litre >= 0);

ALTER TABLE public.milk_records
ADD COLUMN IF NOT EXISTS evening_price_per_litre NUMERIC(6,2) CHECK (evening_price_per_litre IS NULL OR evening_price_per_litre >= 0);

ALTER TABLE public.milk_records
ADD COLUMN IF NOT EXISTS morning_fat_percentage NUMERIC(4,2) CHECK (morning_fat_percentage IS NULL OR morning_fat_percentage >= 0);

ALTER TABLE public.milk_records
ADD COLUMN IF NOT EXISTS evening_fat_percentage NUMERIC(4,2) CHECK (evening_fat_percentage IS NULL OR evening_fat_percentage >= 0);

ALTER TABLE public.milk_records
ADD COLUMN IF NOT EXISTS snf_value NUMERIC(4,2) CHECK (snf_value IS NULL OR snf_value >= 0);

ALTER TABLE public.milk_records
ADD COLUMN IF NOT EXISTS morning_snf_value NUMERIC(4,2) CHECK (morning_snf_value IS NULL OR morning_snf_value >= 0);

ALTER TABLE public.milk_records
ADD COLUMN IF NOT EXISTS evening_snf_value NUMERIC(4,2) CHECK (evening_snf_value IS NULL OR evening_snf_value >= 0);

ALTER TABLE public.milk_records
ADD COLUMN IF NOT EXISTS degree_reading NUMERIC(5,2) CHECK (degree_reading IS NULL OR degree_reading >= 0);

ALTER TABLE public.milk_records
ADD COLUMN IF NOT EXISTS morning_degree_reading NUMERIC(5,2) CHECK (morning_degree_reading IS NULL OR morning_degree_reading >= 0);

ALTER TABLE public.milk_records
ADD COLUMN IF NOT EXISTS evening_degree_reading NUMERIC(5,2) CHECK (evening_degree_reading IS NULL OR evening_degree_reading >= 0);

DO $$
DECLARE
  milk_fk RECORD;
BEGIN
  FOR milk_fk IN
    SELECT constraint_name
    FROM information_schema.key_column_usage
    WHERE table_schema = 'public'
      AND table_name = 'milk_records'
      AND column_name = 'cow_id'
  LOOP
    EXECUTE format('ALTER TABLE public.milk_records DROP CONSTRAINT IF EXISTS %I', milk_fk.constraint_name);
  END LOOP;
END $$;

ALTER TABLE public.milk_records
ADD CONSTRAINT milk_records_cow_id_fkey
FOREIGN KEY (cow_id) REFERENCES public.cows(id) ON DELETE SET NULL;

CREATE TEMP TABLE milk_records_overall_migration AS
SELECT
  farm_id,
  date,
  SUM(COALESCE(morning_litres, 0))::NUMERIC(10,2) AS morning_litres,
  SUM(COALESCE(evening_litres, 0))::NUMERIC(10,2) AS evening_litres,
  NULL::NUMERIC(6,2) AS price_per_litre,
  ROUND(AVG(COALESCE(morning_price_per_litre, price_per_litre)) FILTER (
    WHERE COALESCE(morning_price_per_litre, price_per_litre) IS NOT NULL
  ), 2)::NUMERIC(6,2) AS morning_price_per_litre,
  ROUND(AVG(COALESCE(evening_price_per_litre, price_per_litre)) FILTER (
    WHERE COALESCE(evening_price_per_litre, price_per_litre) IS NOT NULL
  ), 2)::NUMERIC(6,2) AS evening_price_per_litre,
  NULL::NUMERIC(4,2) AS fat_percentage,
  ROUND(AVG(COALESCE(morning_fat_percentage, fat_percentage)) FILTER (
    WHERE COALESCE(morning_fat_percentage, fat_percentage) IS NOT NULL
  ), 2)::NUMERIC(4,2) AS morning_fat_percentage,
  ROUND(AVG(COALESCE(evening_fat_percentage, fat_percentage)) FILTER (
    WHERE COALESCE(evening_fat_percentage, fat_percentage) IS NOT NULL
  ), 2)::NUMERIC(4,2) AS evening_fat_percentage,
  NULL::NUMERIC(4,2) AS snf_value,
  ROUND(AVG(COALESCE(morning_snf_value, snf_value)) FILTER (
    WHERE COALESCE(morning_snf_value, snf_value) IS NOT NULL
  ), 2)::NUMERIC(4,2) AS morning_snf_value,
  ROUND(AVG(COALESCE(evening_snf_value, snf_value)) FILTER (
    WHERE COALESCE(evening_snf_value, snf_value) IS NOT NULL
  ), 2)::NUMERIC(4,2) AS evening_snf_value,
  NULL::NUMERIC(5,2) AS degree_reading,
  ROUND(AVG(COALESCE(morning_degree_reading, degree_reading)) FILTER (
    WHERE COALESCE(morning_degree_reading, degree_reading) IS NOT NULL
  ), 2)::NUMERIC(5,2) AS morning_degree_reading,
  ROUND(AVG(COALESCE(evening_degree_reading, degree_reading)) FILTER (
    WHERE COALESCE(evening_degree_reading, degree_reading) IS NOT NULL
  ), 2)::NUMERIC(5,2) AS evening_degree_reading,
  CASE
    WHEN COUNT(*) FILTER (WHERE cow_id IS NOT NULL) > 0
      THEN 'गायनिहाय दूध नोंदी एकत्रित केल्या.'
    ELSE MAX(notes)
  END AS notes
FROM public.milk_records
GROUP BY farm_id, date;

DELETE FROM public.milk_records;

INSERT INTO public.milk_records (
  farm_id,
  cow_id,
  date,
  morning_litres,
  evening_litres,
  price_per_litre,
  morning_price_per_litre,
  evening_price_per_litre,
  fat_percentage,
  morning_fat_percentage,
  evening_fat_percentage,
  snf_value,
  morning_snf_value,
  evening_snf_value,
  degree_reading,
  morning_degree_reading,
  evening_degree_reading,
  notes
)
SELECT
  farm_id,
  NULL,
  date,
  morning_litres,
  evening_litres,
  price_per_litre,
  morning_price_per_litre,
  evening_price_per_litre,
  fat_percentage,
  morning_fat_percentage,
  evening_fat_percentage,
  snf_value,
  morning_snf_value,
  evening_snf_value,
  degree_reading,
  morning_degree_reading,
  evening_degree_reading,
  notes
FROM milk_records_overall_migration;

ALTER TABLE public.milk_records
ADD COLUMN total_litres NUMERIC(10,2) GENERATED ALWAYS AS (
  COALESCE(morning_litres, 0) + COALESCE(evening_litres, 0)
) STORED;

ALTER TABLE public.milk_records
ADD COLUMN total_amount NUMERIC(12,2) GENERATED ALWAYS AS (
  (COALESCE(morning_litres, 0) * COALESCE(morning_price_per_litre, price_per_litre, 0)) +
  (COALESCE(evening_litres, 0) * COALESCE(evening_price_per_litre, price_per_litre, 0))
) STORED;

DROP INDEX IF EXISTS public.milk_records_farm_date_overall_unique;
CREATE UNIQUE INDEX milk_records_farm_date_overall_unique
ON public.milk_records (farm_id, date)
WHERE cow_id IS NULL;

COMMIT;

SELECT
  'overall milk migration complete' AS status,
  COUNT(*) AS daily_rows,
  COUNT(*) FILTER (WHERE cow_id IS NOT NULL) AS cow_wise_rows
FROM public.milk_records;
