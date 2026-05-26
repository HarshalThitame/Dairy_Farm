-- Classify feed expenses by accounting period.
--
-- Monthly expenses:
-- - कॅटल फीड / खाद्य
-- - इतर चारा खर्च
-- - all normal finance expenses
--
-- Annual / irregular expenses:
-- - मुरघास
-- - भुसा

BEGIN;

ALTER TABLE public.feed_expenses
ADD COLUMN IF NOT EXISTS accounting_period TEXT;

ALTER TABLE public.finance_records
ADD COLUMN IF NOT EXISTS accounting_period TEXT;

ALTER TABLE public.feed_expenses
DROP CONSTRAINT IF EXISTS feed_expenses_accounting_period_check;

ALTER TABLE public.feed_expenses
DROP CONSTRAINT IF EXISTS feed_expenses_accounting_period_section_check;

ALTER TABLE public.finance_records
DROP CONSTRAINT IF EXISTS finance_records_accounting_period_check;

UPDATE public.feed_expenses
SET accounting_period = CASE
  WHEN section IN ('मुरघास', 'भुसा') THEN 'annual'
  ELSE 'monthly'
END
WHERE accounting_period IS NULL
   OR accounting_period NOT IN ('monthly', 'annual')
   OR (section IN ('मुरघास', 'भुसा') AND accounting_period <> 'annual')
   OR (section NOT IN ('मुरघास', 'भुसा') AND accounting_period <> 'monthly');

UPDATE public.finance_records
SET accounting_period = 'monthly'
WHERE accounting_period IS NULL
   OR accounting_period NOT IN ('monthly', 'annual');

UPDATE public.finance_records finance
SET accounting_period = feed.accounting_period
FROM public.feed_expenses feed
WHERE finance.id = feed.finance_record_id
  AND feed.finance_record_id IS NOT NULL;

UPDATE public.finance_records
SET accounting_period = 'annual'
WHERE type = 'खर्च'
  AND category = 'चारा'
  AND (
    BTRIM(COALESCE(description, '')) LIKE 'मुरघास%'
    OR BTRIM(COALESCE(description, '')) LIKE 'भुसा%'
  );

UPDATE public.finance_records
SET accounting_period = 'monthly'
WHERE type <> 'खर्च';

ALTER TABLE public.feed_expenses
ALTER COLUMN accounting_period SET DEFAULT 'monthly';

ALTER TABLE public.feed_expenses
ALTER COLUMN accounting_period SET NOT NULL;

ALTER TABLE public.finance_records
ALTER COLUMN accounting_period SET DEFAULT 'monthly';

ALTER TABLE public.finance_records
ALTER COLUMN accounting_period SET NOT NULL;

ALTER TABLE public.feed_expenses
ADD CONSTRAINT feed_expenses_accounting_period_check
CHECK (accounting_period IN ('monthly', 'annual'));

ALTER TABLE public.feed_expenses
ADD CONSTRAINT feed_expenses_accounting_period_section_check
CHECK (
  (
    section IN ('मुरघास', 'भुसा')
    AND accounting_period = 'annual'
  )
  OR (
    section NOT IN ('मुरघास', 'भुसा')
    AND accounting_period = 'monthly'
  )
);

ALTER TABLE public.finance_records
ADD CONSTRAINT finance_records_accounting_period_check
CHECK (accounting_period IN ('monthly', 'annual'));

CREATE INDEX IF NOT EXISTS idx_feed_expenses_farm_period_date
ON public.feed_expenses(farm_id, accounting_period, date DESC);

CREATE INDEX IF NOT EXISTS idx_finance_records_farm_period_date
ON public.finance_records(farm_id, accounting_period, date DESC);

COMMIT;
