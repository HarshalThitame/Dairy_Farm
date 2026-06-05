BEGIN;

-- Cow dry-off reminders must be based on the AI/retention date:
-- AI date + 210 days = expected calving date - 60 days.
-- They must not be created after the calf is born.

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

  IF COALESCE(NEW.pregnancy_result, 'pending') = 'negative' THEN
    INSERT INTO public.reminders (farm_id, cow_id, reminder_date, type, message, related_record_id)
    VALUES (
      NEW.farm_id,
      NEW.cow_id,
      COALESCE(NEW.pregnancy_check_date, NEW.ai_date + 61),
      'पुन्हा रेतन सूचना',
      cow_name || ' पुन्हा रेतनासाठी तयार असू शकते.',
      NEW.id
    );
  ELSE
    INSERT INTO public.reminders (farm_id, cow_id, reminder_date, type, message, related_record_id)
    VALUES
      (NEW.farm_id, NEW.cow_id, NEW.ai_date + 60, 'गर्भधारणा तपासणी', cow_name || ' ची गर्भधारणा तपासणी करा', NEW.id),
      (NEW.farm_id, NEW.cow_id, NEW.ai_date + 210, 'दूध बंद', cow_name || ' चे दूध काढणे बंद करण्याची वेळ जवळ आली आहे', NEW.id),
      (NEW.farm_id, NEW.cow_id, NEW.ai_date + 270, 'व्यायण', cow_name || ' व्यायण्याची वेळ जवळ आली आहे', NEW.id);

    IF COALESCE(NEW.pregnancy_result, 'pending') = 'pending' THEN
      INSERT INTO public.reminders (farm_id, cow_id, reminder_date, type, message, related_record_id)
      VALUES (
        NEW.farm_id,
        NEW.cow_id,
        NEW.ai_date + 61,
        'गर्भधारणा तपासणी बाकी',
        cow_name || ' साठी ६० दिवस झाले आहेत. गर्भधारणा तपासणी नोंद करा.',
        NEW.id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS ai_records_create_reminders ON public.ai_records;
CREATE TRIGGER ai_records_create_reminders
AFTER INSERT
ON public.ai_records
FOR EACH ROW
EXECUTE FUNCTION public.create_ai_reminders();

-- Remove only wrong pending cow dry-off reminders that were linked to calving
-- records. Done reminders are preserved as history.
DELETE FROM public.reminders AS reminder
USING public.calving_records AS calving
WHERE reminder.related_record_id = calving.id
  AND reminder.type = 'दूध बंद'
  AND reminder.is_done = false;

-- Backfill missing AI-based dry-off reminders for pregnant cows/records that
-- still need the 60-days-before-calving reminder.
INSERT INTO public.reminders (farm_id, cow_id, reminder_date, type, message, related_record_id, is_done)
SELECT
  ai.farm_id,
  ai.cow_id,
  ai.ai_date + 210,
  'दूध बंद',
  COALESCE(cow.name, 'गाय') || ' चे दूध काढणे बंद करण्याची वेळ जवळ आली आहे',
  ai.id,
  false
FROM public.ai_records AS ai
JOIN public.cows AS cow ON cow.id = ai.cow_id AND cow.farm_id = ai.farm_id
WHERE cow.status = 'गाभण'
  AND COALESCE(ai.pregnancy_result, 'pending') <> 'negative'
  AND NOT EXISTS (
    SELECT 1
    FROM public.calving_records AS calving
    WHERE calving.farm_id = ai.farm_id
      AND calving.ai_record_id = ai.id
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.reminders AS existing
    WHERE existing.farm_id = ai.farm_id
      AND existing.related_record_id = ai.id
      AND existing.type = 'दूध बंद'
  );

COMMIT;
