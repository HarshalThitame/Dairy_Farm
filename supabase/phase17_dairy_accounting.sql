BEGIN;

CREATE TABLE IF NOT EXISTS public.dairy_slips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  slip_date DATE NOT NULL,
  slip_time TIME,
  session TEXT NOT NULL CHECK (session IN ('सकाळ', 'संध्याकाळ')),
  milk_type TEXT DEFAULT 'cow' CHECK (milk_type IS NULL OR milk_type IN ('cow', 'buffalo')),
  dairy_name TEXT,
  dairy_member_number TEXT,
  dairy_member_code TEXT,
  liters NUMERIC(8,2) NOT NULL CHECK (liters > 0),
  fat_percentage NUMERIC(4,2) CHECK (fat_percentage IS NULL OR fat_percentage >= 0),
  snf_percentage NUMERIC(4,2) CHECK (snf_percentage IS NULL OR snf_percentage >= 0),
  clr_degree NUMERIC(6,2) CHECK (clr_degree IS NULL OR clr_degree >= 0),
  clr_score NUMERIC(5,1) CHECK (clr_score IS NULL OR (clr_score >= 0 AND clr_score <= 100)),
  rate_per_liter NUMERIC(8,2) NOT NULL CHECK (rate_per_liter > 0),
  total_amount NUMERIC(12,2) GENERATED ALWAYS AS (liters * rate_per_liter) STORED,
  notes TEXT,
  slip_image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(farm_id, slip_date, session)
);

CREATE INDEX IF NOT EXISTS idx_dairy_slips_farm ON public.dairy_slips(farm_id);
CREATE INDEX IF NOT EXISTS idx_dairy_slips_date ON public.dairy_slips(slip_date);
CREATE INDEX IF NOT EXISTS idx_dairy_slips_farm_date ON public.dairy_slips(farm_id, slip_date);

CREATE TABLE IF NOT EXISTS public.dairy_settlements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  settlement_date DATE NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  dairy_name TEXT,
  dairy_member_number TEXT,
  total_liters NUMERIC(10,2) CHECK (total_liters IS NULL OR total_liters >= 0),
  total_milk_income NUMERIC(12,2) NOT NULL CHECK (total_milk_income >= 0),
  cattle_feed_deduction NUMERIC(12,2) DEFAULT 0 CHECK (cattle_feed_deduction >= 0),
  other_deductions NUMERIC(12,2) DEFAULT 0 CHECK (other_deductions >= 0),
  total_deductions NUMERIC(12,2) GENERATED ALWAYS AS (cattle_feed_deduction + other_deductions) STORED,
  net_payable NUMERIC(12,2) GENERATED ALWAYS AS (total_milk_income - cattle_feed_deduction - other_deductions) STORED,
  payment_received BOOLEAN DEFAULT false,
  payment_received_date DATE,
  payment_received_amount NUMERIC(12,2) CHECK (payment_received_amount IS NULL OR payment_received_amount >= 0),
  expected_liters NUMERIC(10,2),
  expected_amount NUMERIC(12,2),
  liters_discrepancy NUMERIC(10,2),
  discrepancy NUMERIC(12,2),
  discrepancy_notes TEXT,
  matched_slips UUID[] DEFAULT '{}'::uuid[],
  settlement_notes TEXT,
  settlement_image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(farm_id, period_start, period_end),
  CHECK (period_end >= period_start)
);

CREATE INDEX IF NOT EXISTS idx_settlements_farm ON public.dairy_settlements(farm_id);
CREATE INDEX IF NOT EXISTS idx_settlements_date ON public.dairy_settlements(settlement_date);
CREATE INDEX IF NOT EXISTS idx_settlements_period ON public.dairy_settlements(period_start, period_end);

CREATE TABLE IF NOT EXISTS public.monthly_expenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  expense_date DATE NOT NULL,
  month_year TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('चारा', 'भूसा', 'औषध', 'मजुरी', 'परिवहन', 'इतर')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  description TEXT,
  vendor_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_expenses_farm ON public.monthly_expenses(farm_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON public.monthly_expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_month ON public.monthly_expenses(month_year);

CREATE TABLE IF NOT EXISTS public.monthly_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  month_year TEXT NOT NULL,
  total_milk_income NUMERIC(12,2) DEFAULT 0,
  total_liters NUMERIC(10,2) DEFAULT 0,
  total_feed_expenses NUMERIC(12,2) DEFAULT 0,
  total_straw_expenses NUMERIC(12,2) DEFAULT 0,
  total_medicine_expenses NUMERIC(12,2) DEFAULT 0,
  total_labor_expenses NUMERIC(12,2) DEFAULT 0,
  total_transport_expenses NUMERIC(12,2) DEFAULT 0,
  total_other_expenses NUMERIC(12,2) DEFAULT 0,
  total_all_expenses NUMERIC(12,2) GENERATED ALWAYS AS (
    total_feed_expenses + total_straw_expenses + total_medicine_expenses +
    total_labor_expenses + total_transport_expenses + total_other_expenses
  ) STORED,
  total_dairy_deductions NUMERIC(12,2) DEFAULT 0,
  net_profit NUMERIC(12,2) GENERATED ALWAYS AS (
    total_milk_income -
    (total_feed_expenses + total_straw_expenses + total_medicine_expenses +
     total_labor_expenses + total_transport_expenses + total_other_expenses) -
    total_dairy_deductions
  ) STORED,
  last_updated TIMESTAMP DEFAULT NOW(),
  UNIQUE(farm_id, month_year)
);

CREATE INDEX IF NOT EXISTS idx_monthly_summary_farm ON public.monthly_summary(farm_id);

ALTER TABLE public.dairy_slips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dairy_settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_summary ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access dairy slips in their farm" ON public.dairy_slips;
CREATE POLICY "Users can access dairy slips in their farm"
  ON public.dairy_slips FOR ALL
  USING (farm_id = public.current_user_farm_id())
  WITH CHECK (farm_id = public.current_user_farm_id());

DROP POLICY IF EXISTS "Users can access dairy settlements in their farm" ON public.dairy_settlements;
CREATE POLICY "Users can access dairy settlements in their farm"
  ON public.dairy_settlements FOR ALL
  USING (farm_id = public.current_user_farm_id())
  WITH CHECK (farm_id = public.current_user_farm_id());

DROP POLICY IF EXISTS "Users can access monthly expenses in their farm" ON public.monthly_expenses;
CREATE POLICY "Users can access monthly expenses in their farm"
  ON public.monthly_expenses FOR ALL
  USING (farm_id = public.current_user_farm_id())
  WITH CHECK (farm_id = public.current_user_farm_id());

DROP POLICY IF EXISTS "Users can access monthly summary in their farm" ON public.monthly_summary;
CREATE POLICY "Users can access monthly summary in their farm"
  ON public.monthly_summary FOR ALL
  USING (farm_id = public.current_user_farm_id())
  WITH CHECK (farm_id = public.current_user_farm_id());

COMMIT;
