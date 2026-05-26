-- Phase 11: Chara / feed cost management
-- Run this after Phase 10.

CREATE TABLE IF NOT EXISTS feed_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  section TEXT NOT NULL CHECK (section IN ('मुरघास', 'कॅटल फीड', 'भुसा', 'इतर')),
  item_name TEXT NOT NULL,
  quantity NUMERIC(10,2) CHECK (quantity IS NULL OR quantity >= 0),
  unit TEXT,
  rate NUMERIC(10,2) CHECK (rate IS NULL OR rate >= 0),
  bags_count INTEGER CHECK (bags_count IS NULL OR bags_count >= 0),
  murghas_new_bags_count INTEGER CHECK (murghas_new_bags_count IS NULL OR murghas_new_bags_count >= 0),
  murghas_new_bag_rate NUMERIC(10,2) CHECK (murghas_new_bag_rate IS NULL OR murghas_new_bag_rate >= 0),
  murghas_inner_count INTEGER CHECK (murghas_inner_count IS NULL OR murghas_inner_count >= 0),
  murghas_inner_rate NUMERIC(10,2) CHECK (murghas_inner_rate IS NULL OR murghas_inner_rate >= 0),
  murghas_filled_bags_count INTEGER CHECK (murghas_filled_bags_count IS NULL OR murghas_filled_bags_count >= 0),
  murghas_filling_labor_rate NUMERIC(10,2) CHECK (murghas_filling_labor_rate IS NULL OR murghas_filling_labor_rate >= 0),
  inner_material_cost NUMERIC(10,2) DEFAULT 0 CHECK (inner_material_cost >= 0),
  labor_cost NUMERIC(10,2) DEFAULT 0 CHECK (labor_cost >= 0),
  transport_cost NUMERIC(10,2) DEFAULT 0 CHECK (transport_cost >= 0),
  other_cost NUMERIC(10,2) DEFAULT 0 CHECK (other_cost >= 0),
  total_cost NUMERIC(10,2) NOT NULL CHECK (total_cost >= 0),
  accounting_period TEXT NOT NULL DEFAULT 'monthly' CHECK (accounting_period IN ('monthly', 'annual')),
  supplier_name TEXT,
  notes TEXT,
  finance_record_id UUID REFERENCES finance_records(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT feed_expenses_cattle_feed_bags_check CHECK (
    section <> 'कॅटल फीड'
    OR (
      quantity IS NULL
      AND unit = 'बॅग'
      AND COALESCE(inner_material_cost, 0) = 0
      AND COALESCE(labor_cost, 0) = 0
      AND COALESCE(transport_cost, 0) = 0
      AND COALESCE(other_cost, 0) = 0
    )
  ),
  CONSTRAINT feed_expenses_murghas_bag_cost_check CHECK (
    section <> 'मुरघास'
    OR COALESCE(transport_cost, 0) = 0
  )
);

ALTER TABLE feed_expenses
ADD COLUMN IF NOT EXISTS farm_id UUID REFERENCES farms(id) ON DELETE CASCADE;

ALTER TABLE feed_expenses
ADD COLUMN IF NOT EXISTS finance_record_id UUID REFERENCES finance_records(id) ON DELETE SET NULL;

ALTER TABLE feed_expenses
ADD COLUMN IF NOT EXISTS accounting_period TEXT DEFAULT 'monthly';

ALTER TABLE finance_records
ADD COLUMN IF NOT EXISTS accounting_period TEXT DEFAULT 'monthly';

ALTER TABLE feed_expenses
ADD COLUMN IF NOT EXISTS murghas_new_bags_count INTEGER CHECK (murghas_new_bags_count IS NULL OR murghas_new_bags_count >= 0);

ALTER TABLE feed_expenses
ADD COLUMN IF NOT EXISTS murghas_new_bag_rate NUMERIC(10,2) CHECK (murghas_new_bag_rate IS NULL OR murghas_new_bag_rate >= 0);

ALTER TABLE feed_expenses
ADD COLUMN IF NOT EXISTS murghas_inner_count INTEGER CHECK (murghas_inner_count IS NULL OR murghas_inner_count >= 0);

ALTER TABLE feed_expenses
ADD COLUMN IF NOT EXISTS murghas_inner_rate NUMERIC(10,2) CHECK (murghas_inner_rate IS NULL OR murghas_inner_rate >= 0);

ALTER TABLE feed_expenses
ADD COLUMN IF NOT EXISTS murghas_filled_bags_count INTEGER CHECK (murghas_filled_bags_count IS NULL OR murghas_filled_bags_count >= 0);

ALTER TABLE feed_expenses
ADD COLUMN IF NOT EXISTS murghas_filling_labor_rate NUMERIC(10,2) CHECK (murghas_filling_labor_rate IS NULL OR murghas_filling_labor_rate >= 0);

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

UPDATE feed_expenses
SET section = CASE
  WHEN btrim(section) IN ('Murghas', 'Murghas Cost', 'मुरघास खर्च') THEN 'मुरघास'
  WHEN btrim(section) IN ('Cattle Feed', 'Cattle Feed Cost', 'खाद्य', 'कॅटल फीड खर्च') THEN 'कॅटल फीड'
  WHEN btrim(section) IN ('Bhusa', 'Bhusa Cost', 'भुसा खर्च') THEN 'भुसा'
  WHEN btrim(section) IN ('Other', 'Other Expenses', 'इतर खर्च') THEN 'इतर'
  ELSE 'इतर'
END;

UPDATE feed_expenses
SET accounting_period = CASE
  WHEN section IN ('मुरघास', 'भुसा') THEN 'annual'
  ELSE 'monthly'
END;

ALTER TABLE feed_expenses
ADD CONSTRAINT feed_expenses_section_check
CHECK (section IN ('मुरघास', 'कॅटल फीड', 'भुसा', 'इतर'));

ALTER TABLE feed_expenses
DROP CONSTRAINT IF EXISTS feed_expenses_murghas_bag_cost_check;

UPDATE feed_expenses
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

UPDATE finance_records finance
SET
  amount = feed.total_cost,
  accounting_period = feed.accounting_period,
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
FROM feed_expenses feed
WHERE finance.id = feed.finance_record_id
  AND feed.section = 'मुरघास';

ALTER TABLE feed_expenses
ADD CONSTRAINT feed_expenses_murghas_bag_cost_check
CHECK (
  section <> 'मुरघास'
  OR COALESCE(transport_cost, 0) = 0
);

ALTER TABLE feed_expenses
DROP CONSTRAINT IF EXISTS feed_expenses_cattle_feed_bags_check;

UPDATE feed_expenses
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

UPDATE finance_records finance
SET
  amount = feed.total_cost,
  accounting_period = feed.accounting_period,
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
FROM feed_expenses feed
WHERE finance.id = feed.finance_record_id
  AND feed.section = 'कॅटल फीड';

ALTER TABLE feed_expenses
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

ALTER TABLE feed_expenses
DROP CONSTRAINT IF EXISTS feed_expenses_accounting_period_check;

ALTER TABLE feed_expenses
DROP CONSTRAINT IF EXISTS feed_expenses_accounting_period_section_check;

ALTER TABLE finance_records
DROP CONSTRAINT IF EXISTS finance_records_accounting_period_check;

UPDATE finance_records finance
SET accounting_period = feed.accounting_period
FROM feed_expenses feed
WHERE finance.id = feed.finance_record_id
  AND feed.finance_record_id IS NOT NULL;

ALTER TABLE feed_expenses
ALTER COLUMN accounting_period SET DEFAULT 'monthly';

ALTER TABLE feed_expenses
ALTER COLUMN accounting_period SET NOT NULL;

ALTER TABLE finance_records
ALTER COLUMN accounting_period SET DEFAULT 'monthly';

ALTER TABLE finance_records
ALTER COLUMN accounting_period SET NOT NULL;

ALTER TABLE feed_expenses
ADD CONSTRAINT feed_expenses_accounting_period_check
CHECK (accounting_period IN ('monthly', 'annual'));

ALTER TABLE feed_expenses
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

ALTER TABLE finance_records
ADD CONSTRAINT finance_records_accounting_period_check
CHECK (accounting_period IN ('monthly', 'annual'));

CREATE INDEX IF NOT EXISTS idx_feed_expenses_farm_date ON feed_expenses(farm_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_feed_expenses_farm_section ON feed_expenses(farm_id, section);
CREATE INDEX IF NOT EXISTS idx_feed_expenses_farm_period_date ON feed_expenses(farm_id, accounting_period, date DESC);
CREATE INDEX IF NOT EXISTS idx_finance_records_farm_period_date ON finance_records(farm_id, accounting_period, date DESC);

ALTER TABLE feed_expenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access feed expenses in their farm" ON feed_expenses;
CREATE POLICY "Users can access feed expenses in their farm"
  ON feed_expenses FOR ALL
  USING (farm_id = public.current_user_farm_id())
  WITH CHECK (farm_id = public.current_user_farm_id());
