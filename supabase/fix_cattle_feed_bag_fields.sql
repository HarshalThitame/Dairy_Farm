-- Normalize feed expense rows to the current app model.
--
-- Cattle feed:
-- - total bags + rate, fixed unit "बॅग", and no labor/transport/direct amount extras.
--
-- Murghas:
-- - new bags count/rate, plastic inner count/rate, filled bags count/per-bag labor.
-- - no transport cost for Murghas.
--
-- General notes:
-- - The app never had a persisted "direct amount" column for feed_expenses; it only sent
--   direct amount as an API input that became total_cost.
-- - If an old cattle feed row has quantity + rate, total_cost is recalculated as bags_count * rate.
-- - If old rows have no count/rate details, total_cost is preserved to avoid data loss.

BEGIN;

-- Drop the bad section constraint even if it was created by an older script.
DO $$
DECLARE
  section_constraint RECORD;
BEGIN
  FOR section_constraint IN
    SELECT conname
    FROM pg_constraint
    WHERE conrelid = 'public.feed_expenses'::regclass
      AND contype = 'c'
      AND (
        conname = 'feed_expenses_section_check'
        OR pg_get_constraintdef(oid) LIKE '%Murghas%'
        OR pg_get_constraintdef(oid) LIKE '%Cattle Feed%'
        OR pg_get_constraintdef(oid) LIKE '%मुरघास खर्च%'
        OR pg_get_constraintdef(oid) LIKE '%कॅटल फीड खर्च%'
        OR pg_get_constraintdef(oid) LIKE '%खाद्य%'
      )
      AND conname NOT IN (
        'feed_expenses_cattle_feed_bags_check',
        'feed_expenses_murghas_bag_cost_check'
      )
  LOOP
    EXECUTE format('ALTER TABLE public.feed_expenses DROP CONSTRAINT IF EXISTS %I', section_constraint.conname);
  END LOOP;
END $$;

ALTER TABLE public.feed_expenses
ADD COLUMN IF NOT EXISTS farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE;

ALTER TABLE public.feed_expenses
ADD COLUMN IF NOT EXISTS finance_record_id UUID REFERENCES public.finance_records(id) ON DELETE SET NULL;

UPDATE public.feed_expenses
SET section = CASE
  WHEN BTRIM(section) IN ('Murghas', 'Murghas Cost', 'मुरघास खर्च') THEN 'मुरघास'
  WHEN BTRIM(section) IN ('Cattle Feed', 'Cattle Feed Cost', 'खाद्य', 'कॅटल फीड खर्च') THEN 'कॅटल फीड'
  WHEN BTRIM(section) IN ('Bhusa', 'Bhusa Cost', 'भुसा खर्च') THEN 'भुसा'
  WHEN BTRIM(section) IN ('Other', 'Other Expenses', 'इतर खर्च') THEN 'इतर'
  ELSE 'इतर'
END;

ALTER TABLE public.feed_expenses
ADD CONSTRAINT feed_expenses_section_check
CHECK (section IN ('मुरघास', 'कॅटल फीड', 'भुसा', 'इतर'));

ALTER TABLE public.feed_expenses
ADD COLUMN IF NOT EXISTS murghas_new_bags_count INTEGER CHECK (murghas_new_bags_count IS NULL OR murghas_new_bags_count >= 0);

ALTER TABLE public.feed_expenses
ADD COLUMN IF NOT EXISTS murghas_new_bag_rate NUMERIC(10,2) CHECK (murghas_new_bag_rate IS NULL OR murghas_new_bag_rate >= 0);

ALTER TABLE public.feed_expenses
ADD COLUMN IF NOT EXISTS murghas_inner_count INTEGER CHECK (murghas_inner_count IS NULL OR murghas_inner_count >= 0);

ALTER TABLE public.feed_expenses
ADD COLUMN IF NOT EXISTS murghas_inner_rate NUMERIC(10,2) CHECK (murghas_inner_rate IS NULL OR murghas_inner_rate >= 0);

ALTER TABLE public.feed_expenses
ADD COLUMN IF NOT EXISTS murghas_filled_bags_count INTEGER CHECK (murghas_filled_bags_count IS NULL OR murghas_filled_bags_count >= 0);

ALTER TABLE public.feed_expenses
ADD COLUMN IF NOT EXISTS murghas_filling_labor_rate NUMERIC(10,2) CHECK (murghas_filling_labor_rate IS NULL OR murghas_filling_labor_rate >= 0);

ALTER TABLE public.feed_expenses
DROP CONSTRAINT IF EXISTS feed_expenses_murghas_bag_cost_check;

UPDATE public.feed_expenses
SET
  murghas_filled_bags_count = COALESCE(murghas_filled_bags_count, bags_count),
  murghas_filling_labor_rate = CASE
    WHEN murghas_filling_labor_rate IS NULL
      AND COALESCE(murghas_filled_bags_count, bags_count) > 0
      AND labor_cost IS NOT NULL
      THEN ROUND(labor_cost / COALESCE(murghas_filled_bags_count, bags_count), 2)
    ELSE murghas_filling_labor_rate
  END,
  transport_cost = 0
WHERE section = 'मुरघास';

UPDATE public.finance_records finance
SET
  amount = feed.total_cost,
  description = CONCAT_WS(
    ' | ',
    feed.section,
    feed.item_name,
    CASE
      WHEN feed.murghas_new_bags_count IS NOT NULL THEN feed.murghas_new_bags_count::TEXT || ' नवीन बॅग'
      ELSE NULL
    END,
    CASE
      WHEN feed.murghas_inner_count IS NOT NULL THEN feed.murghas_inner_count::TEXT || ' इनर'
      ELSE NULL
    END,
    CASE
      WHEN COALESCE(feed.murghas_filled_bags_count, feed.bags_count) IS NOT NULL
        THEN COALESCE(feed.murghas_filled_bags_count, feed.bags_count)::TEXT || ' भरलेल्या बॅग'
      ELSE NULL
    END,
    CASE
      WHEN NULLIF(BTRIM(feed.supplier_name), '') IS NOT NULL THEN 'पुरवठादार: ' || BTRIM(feed.supplier_name)
      ELSE NULL
    END,
    NULLIF(BTRIM(feed.notes), '')
  )
FROM public.feed_expenses feed
WHERE finance.id = feed.finance_record_id
  AND feed.section = 'मुरघास';

ALTER TABLE public.feed_expenses
ADD CONSTRAINT feed_expenses_murghas_bag_cost_check
CHECK (
  section <> 'मुरघास'
  OR COALESCE(transport_cost, 0) = 0
);

ALTER TABLE public.feed_expenses
DROP CONSTRAINT IF EXISTS feed_expenses_cattle_feed_bags_check;

UPDATE public.feed_expenses
SET
  bags_count = COALESCE(bags_count, ROUND(quantity)::INTEGER),
  quantity = NULL,
  unit = 'बॅग',
  inner_material_cost = 0,
  labor_cost = 0,
  transport_cost = 0,
  other_cost = 0,
  total_cost = CASE
    WHEN COALESCE(bags_count, ROUND(quantity)::INTEGER) IS NOT NULL AND rate IS NOT NULL
      THEN COALESCE(bags_count, ROUND(quantity)::INTEGER) * rate
    ELSE total_cost
  END
WHERE section = 'कॅटल फीड';

UPDATE public.finance_records finance
SET
  amount = feed.total_cost,
  description = CONCAT_WS(
    ' | ',
    feed.section,
    feed.item_name,
    CASE
      WHEN feed.bags_count IS NOT NULL THEN feed.bags_count::TEXT || ' बॅग'
      ELSE NULL
    END,
    CASE
      WHEN NULLIF(BTRIM(feed.supplier_name), '') IS NOT NULL THEN 'पुरवठादार: ' || BTRIM(feed.supplier_name)
      ELSE NULL
    END,
    NULLIF(BTRIM(feed.notes), '')
  )
FROM public.feed_expenses feed
WHERE finance.id = feed.finance_record_id
  AND feed.section = 'कॅटल फीड';

ALTER TABLE public.feed_expenses
ADD CONSTRAINT feed_expenses_cattle_feed_bags_check
CHECK (
  section <> 'कॅटल फीड'
  OR (
    quantity IS NULL
    AND unit = 'बॅग'
    AND COALESCE(inner_material_cost, 0) = 0
    AND COALESCE(labor_cost, 0) = 0
    AND COALESCE(transport_cost, 0) = 0
    AND COALESCE(other_cost, 0) = 0
  )
);

-- Verify the live table accepts the values the app now sends.
DO $$
DECLARE
  test_feed_id UUID;
  test_farm_id UUID;
BEGIN
  SELECT id INTO test_farm_id
  FROM public.farms
  LIMIT 1;

  INSERT INTO public.feed_expenses (
    farm_id,
    date,
    section,
    item_name,
    quantity,
    unit,
    rate,
    bags_count,
    inner_material_cost,
    labor_cost,
    transport_cost,
    other_cost,
    total_cost
  )
  VALUES (
    test_farm_id,
    CURRENT_DATE,
    'कॅटल फीड',
    'constraint verification',
    NULL,
    'बॅग',
    1,
    1,
    0,
    0,
    0,
    0,
    1
  )
  RETURNING id INTO test_feed_id;

  DELETE FROM public.feed_expenses
  WHERE id = test_feed_id;

  INSERT INTO public.feed_expenses (
    farm_id,
    date,
    section,
    item_name,
    quantity,
    unit,
    rate,
    bags_count,
    murghas_new_bags_count,
    murghas_new_bag_rate,
    murghas_inner_count,
    murghas_inner_rate,
    murghas_filled_bags_count,
    murghas_filling_labor_rate,
    inner_material_cost,
    labor_cost,
    transport_cost,
    other_cost,
    total_cost
  )
  VALUES (
    test_farm_id,
    CURRENT_DATE,
    'मुरघास',
    'constraint verification',
    NULL,
    'बॅग',
    NULL,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    0,
    0,
    2
  )
  RETURNING id INTO test_feed_id;

  DELETE FROM public.feed_expenses
  WHERE id = test_feed_id;
END $$;

COMMIT;

SELECT 'feed_expenses repair complete' AS status;

SELECT
  conname,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.feed_expenses'::regclass
  AND conname IN (
    'feed_expenses_section_check',
    'feed_expenses_cattle_feed_bags_check',
    'feed_expenses_murghas_bag_cost_check'
  )
ORDER BY conname;

-- Review rows that still need manual count/rate details because they were old
-- direct-amount or total-only entries and cannot be inferred safely.
SELECT
  id,
  date,
  section,
  item_name,
  murghas_new_bags_count,
  murghas_new_bag_rate,
  murghas_inner_count,
  murghas_inner_rate,
  murghas_filled_bags_count,
  murghas_filling_labor_rate,
  bags_count,
  rate,
  total_cost,
  finance_record_id
FROM public.feed_expenses
WHERE (section = 'कॅटल फीड' AND (bags_count IS NULL OR rate IS NULL))
   OR (
    section = 'मुरघास'
    AND (
      murghas_new_bags_count IS NULL
      OR murghas_new_bag_rate IS NULL
      OR murghas_inner_count IS NULL
      OR murghas_inner_rate IS NULL
      OR murghas_filled_bags_count IS NULL
      OR murghas_filling_labor_rate IS NULL
    )
  )
ORDER BY date DESC, created_at DESC;
