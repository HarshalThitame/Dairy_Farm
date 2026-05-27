BEGIN;

-- Keep the old daily milk entry table and new accounting dairy slips in sync.
-- Existing daily milk rows are copied to dairy_slips only when a matching
-- date/session slip is missing, so farmer-entered settlement slips are not
-- overwritten.

INSERT INTO public.dairy_slips (
  farm_id,
  slip_date,
  session,
  dairy_name,
  dairy_member_number,
  liters,
  fat_percentage,
  snf_percentage,
  clr_degree,
  rate_per_liter,
  notes,
  created_at,
  updated_at
)
SELECT
  milk.farm_id,
  milk.date,
  'सकाळ',
  farm.dairy_name,
  farm.dairy_member_number,
  milk.morning_litres,
  COALESCE(milk.morning_fat_percentage, milk.fat_percentage),
  COALESCE(milk.morning_snf_value, milk.snf_value),
  COALESCE(milk.morning_degree_reading, milk.degree_reading),
  COALESCE(NULLIF(milk.morning_price_per_litre, 0), NULLIF(milk.price_per_litre, 0), NULLIF(farm.milk_rate_default, 0), 32),
  milk.notes,
  milk.created_at,
  NOW()
FROM public.milk_records milk
LEFT JOIN public.farms farm ON farm.id = milk.farm_id
WHERE milk.farm_id IS NOT NULL
  AND milk.cow_id IS NULL
  AND COALESCE(milk.morning_litres, 0) > 0
ON CONFLICT (farm_id, slip_date, session) DO NOTHING;

INSERT INTO public.dairy_slips (
  farm_id,
  slip_date,
  session,
  dairy_name,
  dairy_member_number,
  liters,
  fat_percentage,
  snf_percentage,
  clr_degree,
  rate_per_liter,
  notes,
  created_at,
  updated_at
)
SELECT
  milk.farm_id,
  milk.date,
  'संध्याकाळ',
  farm.dairy_name,
  farm.dairy_member_number,
  milk.evening_litres,
  COALESCE(milk.evening_fat_percentage, milk.fat_percentage),
  COALESCE(milk.evening_snf_value, milk.snf_value),
  COALESCE(milk.evening_degree_reading, milk.degree_reading),
  COALESCE(NULLIF(milk.evening_price_per_litre, 0), NULLIF(milk.price_per_litre, 0), NULLIF(farm.milk_rate_default, 0), 32),
  milk.notes,
  milk.created_at,
  NOW()
FROM public.milk_records milk
LEFT JOIN public.farms farm ON farm.id = milk.farm_id
WHERE milk.farm_id IS NOT NULL
  AND milk.cow_id IS NULL
  AND COALESCE(milk.evening_litres, 0) > 0
ON CONFLICT (farm_id, slip_date, session) DO NOTHING;

WITH daily_slips AS (
  SELECT
    farm_id,
    slip_date AS date,
    COALESCE(SUM(liters) FILTER (WHERE session = 'सकाळ'), 0) AS morning_litres,
    COALESCE(SUM(liters) FILTER (WHERE session = 'संध्याकाळ'), 0) AS evening_litres,
    MAX(rate_per_liter) FILTER (WHERE session = 'सकाळ') AS morning_price_per_litre,
    MAX(rate_per_liter) FILTER (WHERE session = 'संध्याकाळ') AS evening_price_per_litre,
    MAX(fat_percentage) FILTER (WHERE session = 'सकाळ') AS morning_fat_percentage,
    MAX(fat_percentage) FILTER (WHERE session = 'संध्याकाळ') AS evening_fat_percentage,
    MAX(snf_percentage) FILTER (WHERE session = 'सकाळ') AS morning_snf_value,
    MAX(snf_percentage) FILTER (WHERE session = 'संध्याकाळ') AS evening_snf_value,
    MAX(clr_degree) FILTER (WHERE session = 'सकाळ') AS morning_degree_reading,
    MAX(clr_degree) FILTER (WHERE session = 'संध्याकाळ') AS evening_degree_reading,
    NULLIF(
      CONCAT_WS(
        E'\n',
        NULLIF('सकाळ: ' || COALESCE(MAX(notes) FILTER (WHERE session = 'सकाळ'), ''), 'सकाळ: '),
        NULLIF('संध्याकाळ: ' || COALESCE(MAX(notes) FILTER (WHERE session = 'संध्याकाळ'), ''), 'संध्याकाळ: ')
      ),
      ''
    ) AS notes
  FROM public.dairy_slips
  GROUP BY farm_id, slip_date
),
updated_milk AS (
  UPDATE public.milk_records milk
  SET
    morning_litres = daily.morning_litres,
    evening_litres = daily.evening_litres,
    price_per_litre = NULL,
    morning_price_per_litre = daily.morning_price_per_litre,
    evening_price_per_litre = daily.evening_price_per_litre,
    fat_percentage = NULL,
    morning_fat_percentage = daily.morning_fat_percentage,
    evening_fat_percentage = daily.evening_fat_percentage,
    snf_value = NULL,
    morning_snf_value = daily.morning_snf_value,
    evening_snf_value = daily.evening_snf_value,
    degree_reading = NULL,
    morning_degree_reading = daily.morning_degree_reading,
    evening_degree_reading = daily.evening_degree_reading,
    notes = daily.notes
  FROM daily_slips daily
  WHERE milk.farm_id = daily.farm_id
    AND milk.date = daily.date
    AND milk.cow_id IS NULL
  RETURNING milk.id
)
INSERT INTO public.milk_records (
  farm_id,
  cow_id,
  date,
  morning_litres,
  evening_litres,
  price_per_litre,
  morning_price_per_litre,
  evening_price_per_litre,
  fat_percentage,
  morning_fat_percentage,
  evening_fat_percentage,
  snf_value,
  morning_snf_value,
  evening_snf_value,
  degree_reading,
  morning_degree_reading,
  evening_degree_reading,
  notes
)
SELECT
  daily.farm_id,
  NULL,
  daily.date,
  daily.morning_litres,
  daily.evening_litres,
  NULL,
  daily.morning_price_per_litre,
  daily.evening_price_per_litre,
  NULL,
  daily.morning_fat_percentage,
  daily.evening_fat_percentage,
  NULL,
  daily.morning_snf_value,
  daily.evening_snf_value,
  NULL,
  daily.morning_degree_reading,
  daily.evening_degree_reading,
  daily.notes
FROM daily_slips daily
WHERE NOT EXISTS (
  SELECT 1
  FROM public.milk_records milk
  WHERE milk.farm_id = daily.farm_id
    AND milk.date = daily.date
    AND milk.cow_id IS NULL
);

WITH touched_months AS (
  SELECT farm_id, to_char(slip_date, 'YYYY-MM') AS month_year FROM public.dairy_slips
  UNION
  SELECT farm_id, to_char(settlement_date, 'YYYY-MM') AS month_year FROM public.dairy_settlements
  UNION
  SELECT farm_id, to_char(expense_date, 'YYYY-MM') AS month_year FROM public.monthly_expenses
),
slip_totals AS (
  SELECT
    farm_id,
    to_char(slip_date, 'YYYY-MM') AS month_year,
    SUM(liters) AS total_liters,
    SUM(total_amount) AS total_milk_income
  FROM public.dairy_slips
  GROUP BY farm_id, to_char(slip_date, 'YYYY-MM')
),
deduction_totals AS (
  SELECT
    farm_id,
    to_char(settlement_date, 'YYYY-MM') AS month_year,
    SUM(COALESCE(cattle_feed_deduction, 0) + COALESCE(other_deductions, 0)) AS total_dairy_deductions
  FROM public.dairy_settlements
  GROUP BY farm_id, to_char(settlement_date, 'YYYY-MM')
),
expense_totals AS (
  SELECT
    farm_id,
    to_char(expense_date, 'YYYY-MM') AS month_year,
    SUM(amount) FILTER (WHERE category = 'चारा') AS total_feed_expenses,
    SUM(amount) FILTER (WHERE category = 'भूसा') AS total_straw_expenses,
    SUM(amount) FILTER (WHERE category = 'औषध') AS total_medicine_expenses,
    SUM(amount) FILTER (WHERE category = 'मजुरी') AS total_labor_expenses,
    SUM(amount) FILTER (WHERE category = 'परिवहन') AS total_transport_expenses,
    SUM(amount) FILTER (WHERE category = 'इतर') AS total_other_expenses
  FROM public.monthly_expenses
  GROUP BY farm_id, to_char(expense_date, 'YYYY-MM')
)
INSERT INTO public.monthly_summary (
  farm_id,
  month_year,
  total_milk_income,
  total_liters,
  total_feed_expenses,
  total_straw_expenses,
  total_medicine_expenses,
  total_labor_expenses,
  total_transport_expenses,
  total_other_expenses,
  total_dairy_deductions,
  last_updated
)
SELECT
  touched.farm_id,
  touched.month_year,
  COALESCE(slips.total_milk_income, 0),
  COALESCE(slips.total_liters, 0),
  COALESCE(expenses.total_feed_expenses, 0),
  COALESCE(expenses.total_straw_expenses, 0),
  COALESCE(expenses.total_medicine_expenses, 0),
  COALESCE(expenses.total_labor_expenses, 0),
  COALESCE(expenses.total_transport_expenses, 0),
  COALESCE(expenses.total_other_expenses, 0),
  COALESCE(deductions.total_dairy_deductions, 0),
  NOW()
FROM touched_months touched
LEFT JOIN slip_totals slips
  ON slips.farm_id = touched.farm_id AND slips.month_year = touched.month_year
LEFT JOIN deduction_totals deductions
  ON deductions.farm_id = touched.farm_id AND deductions.month_year = touched.month_year
LEFT JOIN expense_totals expenses
  ON expenses.farm_id = touched.farm_id AND expenses.month_year = touched.month_year
ON CONFLICT (farm_id, month_year) DO UPDATE
SET
  total_milk_income = EXCLUDED.total_milk_income,
  total_liters = EXCLUDED.total_liters,
  total_feed_expenses = EXCLUDED.total_feed_expenses,
  total_straw_expenses = EXCLUDED.total_straw_expenses,
  total_medicine_expenses = EXCLUDED.total_medicine_expenses,
  total_labor_expenses = EXCLUDED.total_labor_expenses,
  total_transport_expenses = EXCLUDED.total_transport_expenses,
  total_other_expenses = EXCLUDED.total_other_expenses,
  total_dairy_deductions = EXCLUDED.total_dairy_deductions,
  last_updated = NOW();

COMMIT;
