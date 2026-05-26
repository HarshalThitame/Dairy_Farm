-- Fix feed_expenses section constraint.
-- Run this once if saving Chara/Bhusa shows:
-- new row for relation "feed_expenses" violates check constraint "feed_expenses_section_check"

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

UPDATE public.feed_expenses
SET section = CASE
  WHEN btrim(section) IN ('Murghas', 'Murghas Cost', 'मुरघास खर्च') THEN 'मुरघास'
  WHEN btrim(section) IN ('Cattle Feed', 'Cattle Feed Cost', 'खाद्य', 'कॅटल फीड खर्च') THEN 'कॅटल फीड'
  WHEN btrim(section) IN ('Bhusa', 'Bhusa Cost', 'भुसा खर्च') THEN 'भुसा'
  WHEN btrim(section) IN ('Other', 'Other Expenses', 'इतर खर्च') THEN 'इतर'
  ELSE 'इतर'
END;

ALTER TABLE public.feed_expenses
ADD CONSTRAINT feed_expenses_section_check
CHECK (section IN ('मुरघास', 'कॅटल फीड', 'भुसा', 'इतर'));

SELECT
  conname,
  pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'public.feed_expenses'::regclass
  AND conname = 'feed_expenses_section_check';
