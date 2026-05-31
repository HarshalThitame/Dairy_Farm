BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS cows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  breed TEXT DEFAULT 'जर्सी',
  date_of_birth DATE,
  tag_number TEXT,
  color TEXT,
  status TEXT DEFAULT 'रिकामी' CHECK (status IN ('गाभण', 'रिकामी', 'व्याललेली', 'उपचार सुरू', 'वाळलेली')),
  purchased_on DATE,
  notes TEXT,
  photo_url TEXT,
  photo_storage_path TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cow_id UUID REFERENCES cows(id) ON DELETE CASCADE,
  ai_date DATE NOT NULL,
  bull_code TEXT,
  bull_breed TEXT DEFAULT 'जर्सी',
  doctor_name TEXT,
  cost NUMERIC(8,2) CHECK (cost IS NULL OR cost >= 0),
  pregnancy_check_date DATE,
  pregnancy_result TEXT DEFAULT 'pending' CHECK (pregnancy_result IN ('positive', 'negative', 'pending')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calving_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cow_id UUID REFERENCES cows(id) ON DELETE CASCADE,
  ai_record_id UUID REFERENCES ai_records(id),
  expected_date DATE,
  actual_date DATE,
  calf_count INTEGER NOT NULL DEFAULT 1 CHECK (calf_count >= 1 AND calf_count <= 2),
  calf_gender TEXT CHECK (calf_gender IS NULL OR calf_gender IN ('नर', 'मादी')),
  calf_name TEXT,
  calving_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS milk_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cow_id UUID REFERENCES cows(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  morning_litres NUMERIC(10,2) DEFAULT 0 CHECK (morning_litres >= 0),
  evening_litres NUMERIC(10,2) DEFAULT 0 CHECK (evening_litres >= 0),
  total_litres NUMERIC(10,2) GENERATED ALWAYS AS (morning_litres + evening_litres) STORED,
  price_per_litre NUMERIC(6,2) DEFAULT 0 CHECK (price_per_litre IS NULL OR price_per_litre >= 0),
  morning_price_per_litre NUMERIC(6,2) CHECK (morning_price_per_litre IS NULL OR morning_price_per_litre >= 0),
  evening_price_per_litre NUMERIC(6,2) CHECK (evening_price_per_litre IS NULL OR evening_price_per_litre >= 0),
  total_amount NUMERIC(12,2) GENERATED ALWAYS AS (
    (COALESCE(morning_litres, 0) * COALESCE(morning_price_per_litre, price_per_litre, 0)) +
    (COALESCE(evening_litres, 0) * COALESCE(evening_price_per_litre, price_per_litre, 0))
  ) STORED,
  fat_percentage NUMERIC(4,2) CHECK (fat_percentage IS NULL OR fat_percentage >= 0),
  morning_fat_percentage NUMERIC(4,2) CHECK (morning_fat_percentage IS NULL OR morning_fat_percentage >= 0),
  evening_fat_percentage NUMERIC(4,2) CHECK (evening_fat_percentage IS NULL OR evening_fat_percentage >= 0),
  snf_value NUMERIC(4,2) CHECK (snf_value IS NULL OR snf_value >= 0),
  morning_snf_value NUMERIC(4,2) CHECK (morning_snf_value IS NULL OR morning_snf_value >= 0),
  evening_snf_value NUMERIC(4,2) CHECK (evening_snf_value IS NULL OR evening_snf_value >= 0),
  degree_reading NUMERIC(5,2) CHECK (degree_reading IS NULL OR degree_reading >= 0),
  morning_degree_reading NUMERIC(5,2) CHECK (morning_degree_reading IS NULL OR morning_degree_reading >= 0),
  evening_degree_reading NUMERIC(5,2) CHECK (evening_degree_reading IS NULL OR evening_degree_reading >= 0),
  slip_time TIME,
  milk_type TEXT DEFAULT 'cow' CHECK (milk_type IS NULL OR milk_type IN ('cow', 'buffalo')),
  dairy_member_code TEXT,
  clr_score NUMERIC(5,1) CHECK (clr_score IS NULL OR clr_score >= 0 AND clr_score <= 100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS health_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cow_id UUID REFERENCES cows(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('लसीकरण', 'आजारपण', 'जंतनाशक', 'तपासणी', 'उपचार')),
  description TEXT,
  doctor_name TEXT,
  cost NUMERIC(8,2) CHECK (cost IS NULL OR cost >= 0),
  next_due_date DATE,
  vaccine_name TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS finance_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('उत्पन्न', 'खर्च')),
  category TEXT CHECK (category IS NULL OR category IN ('दूध विक्री', 'वासरू विक्री', 'चारा', 'खाद्य', 'भूसा', 'औषध', 'AI खर्च', 'रेतन खर्च', 'पशुवैद्यक', 'मजुरी', 'वीज', 'वाहतूक', 'परिवहन', 'इतर')),
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  cow_id UUID REFERENCES cows(id),
  accounting_period TEXT NOT NULL DEFAULT 'monthly' CHECK (accounting_period IN ('monthly', 'annual')),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

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
  CONSTRAINT feed_expenses_accounting_period_section_check CHECK (
    (
      section IN ('मुरघास', 'भुसा')
      AND accounting_period = 'annual'
    )
    OR (
      section NOT IN ('मुरघास', 'भुसा')
      AND accounting_period = 'monthly'
    )
  ),
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

CREATE TABLE IF NOT EXISTS reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES farms(id) ON DELETE CASCADE,
  cow_id UUID REFERENCES cows(id) ON DELETE CASCADE,
  reminder_date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('माज तपासणी', 'गर्भधारणा तपासणी', 'व्यायण', 'लसीकरण', 'जंतनाशक', 'तपासणी', 'दूध बंद', 'वासरी दूध कमी', 'वासरी दूध बंद')),
  message TEXT NOT NULL,
  is_done BOOLEAN DEFAULT false,
  done_at TIMESTAMP,
  skipped BOOLEAN DEFAULT false,
  related_record_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
  mother_cow_id UUID REFERENCES cows(id) ON DELETE SET NULL,
  calving_record_id UUID REFERENCES calving_records(id) ON DELETE SET NULL,
  name TEXT,
  birth_date DATE NOT NULL,
  gender TEXT NOT NULL CHECK (gender IN ('नर', 'मादी')),
  breed TEXT,
  color TEXT,
  photo_url TEXT,
  photo_storage_path TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'historical', 'sold', 'dead', 'converted_to_cow')),
  is_raised BOOLEAN NOT NULL DEFAULT false,
  milk_feeding_status TEXT NOT NULL DEFAULT 'not_tracked' CHECK (milk_feeding_status IN ('not_tracked', 'दूध पाजायचे सुरू आहे', 'दूध कमी करायचे', 'दूध बंद')),
  milk_reduce_date DATE,
  milk_stop_date DATE,
  sold_date DATE,
  sale_amount NUMERIC(12,2) CHECK (sale_amount IS NULL OR sale_amount >= 0),
  sale_notes TEXT,
  finance_record_id UUID REFERENCES finance_records(id) ON DELETE SET NULL,
  converted_cow_id UUID REFERENCES cows(id) ON DELETE SET NULL,
  conversion_ai_record_id UUID REFERENCES ai_records(id) ON DELETE SET NULL,
  converted_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cows_active_name_idx ON cows (is_active, name);
CREATE INDEX IF NOT EXISTS ai_records_cow_date_idx ON ai_records (cow_id, ai_date DESC);
CREATE INDEX IF NOT EXISTS calving_records_cow_date_idx ON calving_records (cow_id, expected_date DESC);
CREATE INDEX IF NOT EXISTS milk_records_date_cow_idx ON milk_records (date DESC, cow_id);
CREATE UNIQUE INDEX IF NOT EXISTS milk_records_farm_date_overall_unique
  ON milk_records (farm_id, date)
  WHERE cow_id IS NULL;
CREATE INDEX IF NOT EXISTS health_records_cow_date_idx ON health_records (cow_id, date DESC);
CREATE INDEX IF NOT EXISTS finance_records_date_idx ON finance_records (date DESC);
CREATE INDEX IF NOT EXISTS feed_expenses_date_section_idx ON feed_expenses (date DESC, section);
CREATE INDEX IF NOT EXISTS reminders_due_idx ON reminders (is_done, reminder_date, cow_id);
CREATE INDEX IF NOT EXISTS idx_reminders_farm_id ON reminders(farm_id);
CREATE INDEX IF NOT EXISTS calves_farm_status_idx ON calves(farm_id, status, birth_date DESC);
CREATE INDEX IF NOT EXISTS calves_mother_idx ON calves(mother_cow_id, birth_date DESC);
CREATE INDEX IF NOT EXISTS calves_farm_sold_date_idx ON calves(farm_id, sold_date DESC) WHERE status = 'sold';
CREATE INDEX IF NOT EXISTS calves_finance_record_idx ON calves(finance_record_id);
CREATE INDEX IF NOT EXISTS calves_converted_cow_idx ON calves(converted_cow_id);
CREATE INDEX IF NOT EXISTS calves_conversion_ai_record_idx ON calves(conversion_ai_record_id);

CREATE OR REPLACE FUNCTION set_ai_calculated_dates()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.pregnancy_check_date IS NULL THEN
    NEW.pregnancy_check_date := NEW.ai_date + 60;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ai_records_set_calculated_dates ON ai_records;
CREATE TRIGGER ai_records_set_calculated_dates
BEFORE INSERT OR UPDATE OF ai_date, pregnancy_check_date
ON ai_records
FOR EACH ROW
EXECUTE FUNCTION set_ai_calculated_dates();

CREATE OR REPLACE FUNCTION set_calving_expected_date()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  ai_expected_date DATE;
BEGIN
  IF NEW.expected_date IS NULL AND NEW.ai_record_id IS NOT NULL THEN
    SELECT ai_date + 270
    INTO ai_expected_date
    FROM ai_records
    WHERE id = NEW.ai_record_id;

    IF ai_expected_date IS NOT NULL THEN
      NEW.expected_date := ai_expected_date;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS calving_records_set_expected_date ON calving_records;
CREATE TRIGGER calving_records_set_expected_date
BEFORE INSERT OR UPDATE OF ai_record_id, expected_date
ON calving_records
FOR EACH ROW
EXECUTE FUNCTION set_calving_expected_date();

CREATE OR REPLACE FUNCTION create_ai_reminders()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  cow_name TEXT;
BEGIN
  SELECT name
  INTO cow_name
  FROM cows
  WHERE id = NEW.cow_id;

  IF cow_name IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO reminders (farm_id, cow_id, reminder_date, type, message, related_record_id)
  VALUES
    (NEW.farm_id, NEW.cow_id, NEW.ai_date + 21, 'माज तपासणी', cow_name || ' माजावर आली का तपासा', NEW.id),
    (NEW.farm_id, NEW.cow_id, NEW.ai_date + 60, 'गर्भधारणा तपासणी', cow_name || ' ची गर्भधारणा तपासणी करा', NEW.id),
    (NEW.farm_id, NEW.cow_id, NEW.ai_date + 270, 'व्यायण', cow_name || ' व्यायण्याची वेळ जवळ आली आहे', NEW.id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ai_records_create_reminders ON ai_records;
CREATE TRIGGER ai_records_create_reminders
AFTER INSERT
ON ai_records
FOR EACH ROW
EXECUTE FUNCTION create_ai_reminders();

CREATE OR REPLACE FUNCTION create_health_reminder()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  cow_name TEXT;
  reminder_type TEXT;
  reminder_message TEXT;
BEGIN
  IF NEW.next_due_date IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT name
  INTO cow_name
  FROM cows
  WHERE id = NEW.cow_id;

  IF cow_name IS NULL THEN
    RETURN NEW;
  END IF;

  reminder_type := CASE
    WHEN NEW.type = 'जंतनाशक' THEN 'जंतनाशक'
    WHEN NEW.type = 'लसीकरण' THEN 'लसीकरण'
    ELSE 'तपासणी'
  END;

  reminder_message := CASE
    WHEN NEW.type = 'जंतनाशक' AND NEW.vaccine_name IS NOT NULL AND btrim(NEW.vaccine_name) <> '' THEN
      cow_name || ' ला ' || NEW.vaccine_name || ' देण्याची वेळ झाली'
    WHEN NEW.type = 'जंतनाशक' THEN
      cow_name || ' ला जंतनाशक देण्याची वेळ झाली'
    WHEN NEW.type = 'लसीकरण' AND NEW.vaccine_name IS NOT NULL AND btrim(NEW.vaccine_name) <> '' THEN
      cow_name || ' ला ' || NEW.vaccine_name || ' लस देण्याची वेळ झाली'
    WHEN NEW.type = 'लसीकरण' THEN
      cow_name || ' ला लस देण्याची वेळ झाली'
    ELSE
      cow_name || ' ची पुढील तपासणी करा'
  END;

  INSERT INTO reminders (farm_id, cow_id, reminder_date, type, message, related_record_id)
  VALUES (NEW.farm_id, NEW.cow_id, NEW.next_due_date, reminder_type, reminder_message, NEW.id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS health_records_create_reminder ON health_records;
CREATE TRIGGER health_records_create_reminder
AFTER INSERT
ON health_records
FOR EACH ROW
EXECUTE FUNCTION create_health_reminder();

COMMIT;
