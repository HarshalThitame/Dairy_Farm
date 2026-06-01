-- Remove Anamat functionality from live database.
-- This keeps settlement net-payable math stable by moving old anamat amounts into cattle_feed_deduction before dropping columns.
-- In this dairy workflow, the slip's "एकूण कपात" is treated as खाद्य कपात.

BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'dairy_settlements'
      AND column_name = 'anamat_cut'
  ) THEN
    UPDATE public.dairy_settlements
    SET cattle_feed_deduction = COALESCE(cattle_feed_deduction, 0) + COALESCE(anamat_cut, 0)
    WHERE COALESCE(anamat_cut, 0) <> 0;
  END IF;
END $$;

ALTER TABLE IF EXISTS public.dairy_settlements
  DROP COLUMN IF EXISTS anamat_cut,
  DROP COLUMN IF EXISTS total_deductions_before_anamat;

ALTER TABLE IF EXISTS public.monthly_summary
  DROP COLUMN IF EXISTS total_anamat_accumulated;

DROP TABLE IF EXISTS public.monthly_anamat_summary CASCADE;
DROP TABLE IF EXISTS public.anamat_transactions CASCADE;
DROP TABLE IF EXISTS public.anamat_tracking CASCADE;

UPDATE public.finance_records
SET category = 'इतर',
    description = COALESCE(NULLIF(description, ''), 'जुनी अनामत नोंद')
WHERE category IN ('अनामत परतावा', 'अनामत दावा', 'अनामत परिणाम', 'Anamat Return', 'Anamat Refund');

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

UPDATE public.finance_records
SET category = 'इतर',
    description = CONCAT_WS(
      ' | ',
      NULLIF(description, ''),
      CONCAT('जुना वर्ग: ', category)
    )
WHERE category IS NOT NULL
  AND category NOT IN (
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
  );

ALTER TABLE IF EXISTS public.finance_records
  ADD CONSTRAINT finance_records_category_check
  CHECK (category IS NULL OR category IN (
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
  ));

COMMIT;
