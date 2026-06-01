-- Final khadya expense rule:
-- 1. Manual/nondi khadya entries are kept only as information.
-- 2. Final khadya expense for profit/monthly expense comes from 15-day settlement slip.
-- 3. On settlement slips, "एकूण कपात" is stored as cattle_feed_deduction.

ALTER TABLE public.monthly_summary
ADD COLUMN IF NOT EXISTS last_khadya_recalculated_at TIMESTAMP DEFAULT NULL;

UPDATE public.monthly_summary AS ms
SET
  total_feed_expenses = 0,
  total_dairy_deductions = COALESCE(
    (
      SELECT ROUND(
        SUM(
          COALESCE(ds.cattle_feed_deduction, 0) +
          COALESCE(ds.other_deductions, 0)
        ),
        2
      )
      FROM public.dairy_settlements AS ds
      WHERE ds.farm_id = ms.farm_id
        AND ds.period_end >= TO_DATE(ms.month_year || '-01', 'YYYY-MM-DD')
        AND ds.period_end < (TO_DATE(ms.month_year || '-01', 'YYYY-MM-DD') + INTERVAL '1 month')::date
    ),
    0
  ),
  last_updated = NOW(),
  last_khadya_recalculated_at = NOW();

-- Check final values after running:
-- SELECT farm_id, month_year, total_feed_expenses, total_dairy_deductions, total_all_expenses, net_profit
-- FROM public.monthly_summary
-- ORDER BY month_year DESC;
