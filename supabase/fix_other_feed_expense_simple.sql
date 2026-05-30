-- Simplify existing "इतर" feed expenses so reports do not show them as चारा.
-- Run in Supabase SQL Editor.

UPDATE public.feed_expenses
SET
  quantity = NULL,
  unit = NULL,
  rate = NULL,
  bags_count = NULL,
  inner_material_cost = 0,
  labor_cost = 0,
  transport_cost = 0,
  other_cost = 0,
  accounting_period = 'monthly'
WHERE section = 'इतर';

UPDATE public.finance_records AS fr
SET
  category = 'इतर',
  accounting_period = 'monthly'
FROM public.feed_expenses AS fe
WHERE fe.finance_record_id = fr.id
  AND fe.section = 'इतर'
  AND fr.type = 'खर्च';
