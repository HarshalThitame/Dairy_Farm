BEGIN;

-- After multitenancy, reminders.farm_id is NOT NULL. These triggers must copy
-- the farm from the source record, otherwise health/AI saves fail while creating reminders.

CREATE OR REPLACE FUNCTION public.create_ai_reminders()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  cow_name TEXT;
BEGIN
  SELECT name
  INTO cow_name
  FROM public.cows
  WHERE id = NEW.cow_id;

  IF cow_name IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.reminders (farm_id, cow_id, reminder_date, type, message, related_record_id)
  VALUES
    (NEW.farm_id, NEW.cow_id, NEW.ai_date + 21, 'माज तपासणी', cow_name || ' माजावर आली का तपासा', NEW.id),
    (NEW.farm_id, NEW.cow_id, NEW.ai_date + 60, 'गर्भधारणा तपासणी', cow_name || ' ची गर्भधारणा तपासणी करा', NEW.id),
    (NEW.farm_id, NEW.cow_id, NEW.ai_date + 270, 'व्यायण', cow_name || ' व्यायण्याची वेळ जवळ आली आहे', NEW.id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ai_records_create_reminders ON public.ai_records;
CREATE TRIGGER ai_records_create_reminders
AFTER INSERT
ON public.ai_records
FOR EACH ROW
EXECUTE FUNCTION public.create_ai_reminders();

CREATE OR REPLACE FUNCTION public.create_health_reminder()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
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
  FROM public.cows
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

  INSERT INTO public.reminders (farm_id, cow_id, reminder_date, type, message, related_record_id)
  VALUES (NEW.farm_id, NEW.cow_id, NEW.next_due_date, reminder_type, reminder_message, NEW.id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS health_records_create_reminder ON public.health_records;
CREATE TRIGGER health_records_create_reminder
AFTER INSERT
ON public.health_records
FOR EACH ROW
EXECUTE FUNCTION public.create_health_reminder();

UPDATE public.reminders AS reminders
SET farm_id = cows.farm_id
FROM public.cows AS cows
WHERE reminders.farm_id IS NULL
  AND reminders.cow_id = cows.id;

CREATE INDEX IF NOT EXISTS idx_reminders_farm_id ON public.reminders(farm_id);

COMMIT;
