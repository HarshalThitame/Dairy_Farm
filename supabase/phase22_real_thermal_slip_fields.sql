BEGIN;

-- Real Maharashtra thermal-printer dairy slips include time, milk type, code number,
-- and numeric CLR. Keep existing columns for compatibility with current app reports.

ALTER TABLE public.dairy_slips
ADD COLUMN IF NOT EXISTS slip_time TIME,
ADD COLUMN IF NOT EXISTS milk_type TEXT DEFAULT 'cow',
ADD COLUMN IF NOT EXISTS dairy_member_code TEXT,
ADD COLUMN IF NOT EXISTS clr_score NUMERIC(5,1);

ALTER TABLE public.milk_records
ADD COLUMN IF NOT EXISTS slip_time TIME,
ADD COLUMN IF NOT EXISTS milk_type TEXT DEFAULT 'cow',
ADD COLUMN IF NOT EXISTS dairy_member_code TEXT,
ADD COLUMN IF NOT EXISTS clr_score NUMERIC(5,1);

UPDATE public.dairy_slips
SET
  milk_type = COALESCE(NULLIF(milk_type, ''), 'cow'),
  dairy_member_code = COALESCE(NULLIF(dairy_member_code, ''), NULLIF(dairy_member_number, '')),
  clr_score = COALESCE(clr_score, clr_degree)
WHERE milk_type IS NULL
   OR dairy_member_code IS NULL
   OR clr_score IS NULL;

UPDATE public.milk_records
SET
  milk_type = COALESCE(NULLIF(milk_type, ''), 'cow'),
  clr_score = COALESCE(clr_score, degree_reading)
WHERE milk_type IS NULL
   OR clr_score IS NULL;

ALTER TABLE public.dairy_slips
DROP CONSTRAINT IF EXISTS dairy_slips_milk_type_check,
DROP CONSTRAINT IF EXISTS dairy_slips_clr_score_check;

ALTER TABLE public.milk_records
DROP CONSTRAINT IF EXISTS milk_records_milk_type_check,
DROP CONSTRAINT IF EXISTS milk_records_clr_score_check;

ALTER TABLE public.dairy_slips
ADD CONSTRAINT dairy_slips_milk_type_check
CHECK (milk_type IS NULL OR milk_type IN ('cow', 'buffalo')),
ADD CONSTRAINT dairy_slips_clr_score_check
CHECK (clr_score IS NULL OR (clr_score >= 0 AND clr_score <= 100));

ALTER TABLE public.milk_records
ADD CONSTRAINT milk_records_milk_type_check
CHECK (milk_type IS NULL OR milk_type IN ('cow', 'buffalo')),
ADD CONSTRAINT milk_records_clr_score_check
CHECK (clr_score IS NULL OR (clr_score >= 0 AND clr_score <= 100));

COMMIT;
