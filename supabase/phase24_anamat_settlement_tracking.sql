-- Phase 24: 15-day settlement slip + anamat tracking
-- Run this complete file in Supabase SQL Editor.

CREATE TABLE IF NOT EXISTS public.anamat_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
  settlement_id UUID REFERENCES public.dairy_settlements(id) ON DELETE SET NULL,
  amount_cut NUMERIC(10,2) NOT NULL,
  cut_date DATE NOT NULL,
  status TEXT DEFAULT 'accumulated'
    CHECK (status IN ('accumulated', 'claimed', 'partial_claimed')),
  claimed_amount NUMERIC(10,2) DEFAULT 0,
  claim_date DATE,
  claim_notes TEXT,
  settlement_period_start DATE,
  settlement_period_end DATE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anamat_farm ON public.anamat_tracking(farm_id);
CREATE INDEX IF NOT EXISTS idx_anamat_status ON public.anamat_tracking(status);
CREATE INDEX IF NOT EXISTS idx_anamat_settlement ON public.anamat_tracking(settlement_id);

ALTER TABLE public.dairy_settlements
ADD COLUMN IF NOT EXISTS anamat_cut NUMERIC(10,2) DEFAULT 0;

ALTER TABLE public.dairy_settlements
ADD COLUMN IF NOT EXISTS total_deductions_before_anamat NUMERIC(10,2);

CREATE TABLE IF NOT EXISTS public.monthly_anamat_summary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
  month_year TEXT NOT NULL,
  total_anamat_accumulated NUMERIC(10,2) DEFAULT 0,
  settlement_count INTEGER DEFAULT 0,
  total_anamat_claimed NUMERIC(10,2) DEFAULT 0,
  claim_count INTEGER DEFAULT 0,
  running_balance NUMERIC(10,2) DEFAULT 0,
  UNIQUE(farm_id, month_year)
);

CREATE INDEX IF NOT EXISTS idx_monthly_anamat_farm ON public.monthly_anamat_summary(farm_id);

CREATE TABLE IF NOT EXISTS public.anamat_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
  settlement_id UUID REFERENCES public.dairy_settlements(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  type TEXT NOT NULL CHECK (type IN ('deposit', 'withdrawal')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_anamat_transactions_farm_date
ON public.anamat_transactions(farm_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_anamat_transactions_settlement
ON public.anamat_transactions(settlement_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_anamat_transactions_deposit_settlement_unique
ON public.anamat_transactions(settlement_id)
WHERE type = 'deposit' AND settlement_id IS NOT NULL;

ALTER TABLE public.monthly_summary
ADD COLUMN IF NOT EXISTS total_anamat_accumulated NUMERIC(10,2) DEFAULT 0;

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

-- Normalize legacy/free-text finance categories before adding the stricter check.
-- The live DB can contain older English labels or old feed section names, and
-- PostgreSQL validates every existing row when a CHECK constraint is added.
UPDATE public.finance_records
SET category = CASE
  WHEN category IS NULL THEN NULL
  WHEN btrim(category) IN ('Milk Sale', 'Milk sales', 'दूध', 'दुध विक्री') THEN 'दूध विक्री'
  WHEN btrim(category) IN ('Calf Sale', 'Calf sales', 'वासरू', 'वासरू विकले') THEN 'वासरू विक्री'
  WHEN btrim(category) IN ('Cattle Feed', 'Cattle Feed Cost', 'कॅटल फीड', 'कॅटल फीड खर्च', 'खाद्य खर्च') THEN 'खाद्य'
  WHEN btrim(category) IN ('Murghas', 'Murghas Cost', 'मुरघास', 'मुरघास खर्च') THEN 'चारा'
  WHEN btrim(category) IN ('Bhusa', 'Bhusa Cost', 'भुसा', 'भुसा खर्च') THEN 'भूसा'
  WHEN btrim(category) IN ('Medicine', 'Medicines', 'वैद्यकीय', 'दवाई', 'औषध खर्च') THEN 'औषध'
  WHEN btrim(category) IN ('AI', 'AI Cost', 'कृत्रिम रेतन', 'कृत्रिम रेतन खर्च') THEN 'रेतन खर्च'
  WHEN btrim(category) IN ('Vet', 'Veterinary', 'Doctor', 'डॉक्टर', 'पशुवैद्यकीय') THEN 'पशुवैद्यक'
  WHEN btrim(category) IN ('Labor', 'Labour', 'मजूर', 'कामगार', 'मजुरी खर्च') THEN 'मजुरी'
  WHEN btrim(category) IN ('Electricity', 'Light bill', 'वीज बिल') THEN 'वीज'
  WHEN btrim(category) IN ('Transport', 'Transportation', 'परिवहन') THEN 'वाहतूक'
  WHEN btrim(category) IN ('Other', 'Other Expenses', 'इतर खर्च', 'Misc') THEN 'इतर'
  WHEN btrim(category) IN ('Anamat Return', 'Anamat Refund', 'अनामत दावा', 'अनामत परिणाम') THEN 'अनामत परतावा'
  ELSE btrim(category)
END
WHERE category IS NOT NULL;

-- Preserve any still-unknown live category in description, then make it valid.
UPDATE public.finance_records
SET
  description = concat_ws(' | ', NULLIF(description, ''), 'मूळ वर्ग: ' || category),
  category = 'इतर'
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
    'इतर',
    'अनामत परतावा'
  );

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
    'इतर',
    'अनामत परतावा'
  )
);

-- Optional but useful for older rows.
UPDATE public.dairy_settlements
SET anamat_cut = 0
WHERE anamat_cut IS NULL;

INSERT INTO public.anamat_transactions (
  farm_id,
  settlement_id,
  date,
  amount,
  type,
  notes,
  created_at
)
SELECT
  farm_id,
  settlement_id,
  cut_date,
  amount_cut,
  'deposit',
  'सेटलमेंटमधून अनामत जमा',
  created_at
FROM public.anamat_tracking
WHERE amount_cut > 0
ON CONFLICT DO NOTHING;
