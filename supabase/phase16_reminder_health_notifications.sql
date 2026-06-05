BEGIN;

ALTER TABLE public.reminders
DROP CONSTRAINT IF EXISTS reminders_type_check;

ALTER TABLE public.reminders
ADD CONSTRAINT reminders_type_check
CHECK (
  type IN (
    'गर्भधारणा तपासणी',
    'गर्भधारणा तपासणी बाकी',
    'पुन्हा रेतन सूचना',
    'पुढील रेतन तयारी',
    'व्यायण',
    'लसीकरण',
    'जंतनाशक',
    'तपासणी',
    'दूध बंद',
    'शिंग काढणे',
    'वासरी दूध कमी',
    'वासरी दूध बंद'
  )
);

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
SET
  type = 'तपासणी',
  message = cows.name || ' ची पुढील तपासणी करा'
FROM public.health_records AS health_records
JOIN public.cows AS cows ON cows.id = health_records.cow_id
WHERE reminders.related_record_id = health_records.id
  AND health_records.next_due_date IS NOT NULL
  AND health_records.type IN ('आजारपण', 'तपासणी', 'उपचार')
  AND reminders.type = 'लसीकरण';

INSERT INTO public.reminders (farm_id, cow_id, reminder_date, type, message, related_record_id)
SELECT
  health_records.farm_id,
  health_records.cow_id,
  health_records.next_due_date,
  CASE
    WHEN health_records.type = 'जंतनाशक' THEN 'जंतनाशक'
    WHEN health_records.type = 'लसीकरण' THEN 'लसीकरण'
    ELSE 'तपासणी'
  END,
  CASE
    WHEN health_records.type = 'जंतनाशक' AND health_records.vaccine_name IS NOT NULL AND btrim(health_records.vaccine_name) <> '' THEN
      cows.name || ' ला ' || health_records.vaccine_name || ' देण्याची वेळ झाली'
    WHEN health_records.type = 'जंतनाशक' THEN
      cows.name || ' ला जंतनाशक देण्याची वेळ झाली'
    WHEN health_records.type = 'लसीकरण' AND health_records.vaccine_name IS NOT NULL AND btrim(health_records.vaccine_name) <> '' THEN
      cows.name || ' ला ' || health_records.vaccine_name || ' लस देण्याची वेळ झाली'
    WHEN health_records.type = 'लसीकरण' THEN
      cows.name || ' ला लस देण्याची वेळ झाली'
    ELSE
      cows.name || ' ची पुढील तपासणी करा'
  END,
  health_records.id
FROM public.health_records AS health_records
JOIN public.cows AS cows ON cows.id = health_records.cow_id
WHERE health_records.next_due_date IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.reminders AS reminders
    WHERE reminders.related_record_id = health_records.id
  );

COMMIT;
