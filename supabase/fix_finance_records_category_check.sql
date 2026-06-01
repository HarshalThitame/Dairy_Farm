-- Fix finance_records_category_check when the live database has an old/corrupt
-- category constraint. This is required for annual feed expenses such as
-- मुरघास, because the app stores the linked finance row with category = 'चारा'.

BEGIN;

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

COMMIT;
