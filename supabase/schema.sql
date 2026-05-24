BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS cows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  breed TEXT,
  date_of_birth DATE,
  tag_number TEXT,
  color TEXT,
  status TEXT DEFAULT 'रिकामी' CHECK (status IN ('गाभण', 'रिकामी', 'व्याललेली', 'उपचार सुरू', 'वाळलेली')),
  purchased_on DATE,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cow_id UUID REFERENCES cows(id) ON DELETE CASCADE,
  ai_date DATE NOT NULL,
  bull_code TEXT,
  bull_breed TEXT,
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
  calf_gender TEXT CHECK (calf_gender IS NULL OR calf_gender IN ('नर', 'मादी')),
  calf_name TEXT,
  calf_weight NUMERIC(5,2) CHECK (calf_weight IS NULL OR calf_weight >= 0),
  calving_notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS milk_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cow_id UUID REFERENCES cows(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  morning_litres NUMERIC(5,2) DEFAULT 0 CHECK (morning_litres >= 0),
  evening_litres NUMERIC(5,2) DEFAULT 0 CHECK (evening_litres >= 0),
  total_litres NUMERIC(5,2) GENERATED ALWAYS AS (morning_litres + evening_litres) STORED,
  fat_percentage NUMERIC(4,2) CHECK (fat_percentage IS NULL OR fat_percentage >= 0),
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
  date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('उत्पन्न', 'खर्च')),
  category TEXT CHECK (category IS NULL OR category IN ('दूध विक्री', 'चारा', 'औषध', 'AI खर्च', 'मजुरी', 'इतर')),
  amount NUMERIC(10,2) NOT NULL CHECK (amount >= 0),
  cow_id UUID REFERENCES cows(id),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reminders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  cow_id UUID REFERENCES cows(id) ON DELETE CASCADE,
  reminder_date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('माज तपासणी', 'गर्भधारणा तपासणी', 'व्यायण', 'लसीकरण', 'जंतनाशक', 'दूध बंद')),
  message TEXT NOT NULL,
  is_done BOOLEAN DEFAULT false,
  done_at TIMESTAMP,
  skipped BOOLEAN DEFAULT false,
  related_record_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS cows_active_name_idx ON cows (is_active, name);
CREATE INDEX IF NOT EXISTS ai_records_cow_date_idx ON ai_records (cow_id, ai_date DESC);
CREATE INDEX IF NOT EXISTS calving_records_cow_date_idx ON calving_records (cow_id, expected_date DESC);
CREATE INDEX IF NOT EXISTS milk_records_date_cow_idx ON milk_records (date DESC, cow_id);
CREATE INDEX IF NOT EXISTS health_records_cow_date_idx ON health_records (cow_id, date DESC);
CREATE INDEX IF NOT EXISTS finance_records_date_idx ON finance_records (date DESC);
CREATE INDEX IF NOT EXISTS reminders_due_idx ON reminders (is_done, reminder_date, cow_id);

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

  INSERT INTO reminders (cow_id, reminder_date, type, message, related_record_id)
  VALUES
    (NEW.cow_id, NEW.ai_date + 21, 'माज तपासणी', cow_name || ' माजावर आली का तपासा', NEW.id),
    (NEW.cow_id, NEW.ai_date + 60, 'गर्भधारणा तपासणी', cow_name || ' ची गर्भधारणा तपासणी करा', NEW.id),
    (NEW.cow_id, NEW.ai_date + 270, 'व्यायण', cow_name || ' व्यायण्याची वेळ जवळ आली आहे', NEW.id);

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
    ELSE 'लसीकरण'
  END;

  reminder_message := CASE
    WHEN NEW.vaccine_name IS NULL OR btrim(NEW.vaccine_name) = '' THEN
      cow_name || ' ला लस देण्याची वेळ झाली'
    ELSE
      cow_name || ' ला ' || NEW.vaccine_name || ' लस देण्याची वेळ झाली'
  END;

  INSERT INTO reminders (cow_id, reminder_date, type, message, related_record_id)
  VALUES (NEW.cow_id, NEW.next_due_date, reminder_type, reminder_message, NEW.id);

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
