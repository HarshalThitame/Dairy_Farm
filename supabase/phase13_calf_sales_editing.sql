BEGIN;

ALTER TABLE public.calves
ADD COLUMN IF NOT EXISTS sold_date DATE,
ADD COLUMN IF NOT EXISTS sale_amount NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS sale_notes TEXT,
ADD COLUMN IF NOT EXISTS finance_record_id UUID REFERENCES public.finance_records(id) ON DELETE SET NULL;

ALTER TABLE public.calves
DROP CONSTRAINT IF EXISTS calves_sale_amount_check;

ALTER TABLE public.calves
ADD CONSTRAINT calves_sale_amount_check
CHECK (sale_amount IS NULL OR sale_amount >= 0);

DO $$
DECLARE
  category_constraint TEXT;
BEGIN
  FOR category_constraint IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'finance_records'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) LIKE '%category%'
  LOOP
    EXECUTE format('ALTER TABLE public.finance_records DROP CONSTRAINT IF EXISTS %I', category_constraint);
  END LOOP;
END $$;

ALTER TABLE public.finance_records
ADD CONSTRAINT finance_records_category_check
CHECK (
  category IS NULL
  OR category IN (
    'दूध विक्री',
    'वासरू विक्री',
    'चारा',
    'खाद्य',
    'भूसा',
    'औषध',
    'AI खर्च',
    'रेतन खर्च',
    'पशुवैद्यक',
    'मजुरी',
    'वीज',
    'वाहतूक',
    'परिवहन',
    'इतर'
  )
);

CREATE INDEX IF NOT EXISTS calves_farm_sold_date_idx
ON public.calves(farm_id, sold_date DESC)
WHERE status = 'sold';

CREATE INDEX IF NOT EXISTS calves_finance_record_idx
ON public.calves(finance_record_id);

COMMIT;
