BEGIN;

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
  WHERE id = NEW.cow_id
    AND farm_id = NEW.farm_id;

  IF cow_name IS NULL THEN
    RETURN NEW;
  END IF;

  -- A new AI cycle supersedes older pending reproductive reminders for the same cow.
  UPDATE public.reminders r
  SET
    is_done = true,
    skipped = true,
    done_at = COALESCE(r.done_at, NOW())
  FROM public.ai_records old_ai
  WHERE r.farm_id = NEW.farm_id
    AND r.related_record_id = old_ai.id
    AND old_ai.farm_id = NEW.farm_id
    AND old_ai.cow_id = NEW.cow_id
    AND old_ai.id <> NEW.id
    AND old_ai.ai_date <= NEW.ai_date
    AND r.is_done = false
    AND r.type IN (
      'माज तपासणी',
      'गर्भधारणा तपासणी',
      'गर्भधारणा तपासणी बाकी',
      'पुन्हा रेतन सूचना',
      'दूध बंद',
      'व्यायण'
    );

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
      (NEW.farm_id, NEW.cow_id, NEW.ai_date + 21, 'माज तपासणी', cow_name || ' माजावर आली का तपासा', NEW.id),
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

COMMIT;
