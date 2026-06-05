BEGIN;

-- If a cow gets a newer AI/retan entry, any older pending AI entry for that
-- same cow did not result in pregnancy. Mark only pending older records as
-- negative. Existing positive/negative records and records with an actual
-- calving link are preserved.

CREATE OR REPLACE FUNCTION public.mark_superseded_ai_records_negative(
  p_farm_id UUID,
  p_cow_id UUID,
  p_new_ai_id UUID,
  p_new_ai_date DATE
)
RETURNS INTEGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  changed_count INTEGER := 0;
  auto_note TEXT := 'नंतरच्या रेतन नोंदीमुळे गर्भधारणा नाही म्हणून आपोआप चिन्हांकित.';
BEGIN
  UPDATE public.ai_records AS old_ai
  SET
    pregnancy_result = 'negative',
    notes = CASE
      WHEN old_ai.notes IS NOT NULL AND old_ai.notes LIKE '%' || auto_note || '%' THEN old_ai.notes
      ELSE btrim(CONCAT_WS(E'\n', NULLIF(old_ai.notes, ''), auto_note))
    END
  WHERE old_ai.farm_id = p_farm_id
    AND old_ai.cow_id = p_cow_id
    AND old_ai.id <> p_new_ai_id
    AND old_ai.ai_date < p_new_ai_date
    AND COALESCE(old_ai.pregnancy_result, 'pending') = 'pending'
    AND NOT EXISTS (
      SELECT 1
      FROM public.calving_records AS calving
      WHERE calving.farm_id = old_ai.farm_id
        AND calving.ai_record_id = old_ai.id
        AND calving.actual_date IS NOT NULL
    );

  GET DIAGNOSTICS changed_count = ROW_COUNT;
  RETURN changed_count;
END;
$$;

-- Backfill existing data.
WITH superseded AS (
  SELECT DISTINCT old_ai.id
  FROM public.ai_records AS old_ai
  WHERE COALESCE(old_ai.pregnancy_result, 'pending') = 'pending'
    AND EXISTS (
      SELECT 1
      FROM public.ai_records AS newer_ai
      WHERE newer_ai.farm_id = old_ai.farm_id
        AND newer_ai.cow_id = old_ai.cow_id
        AND newer_ai.id <> old_ai.id
        AND newer_ai.ai_date > old_ai.ai_date
    )
    AND NOT EXISTS (
      SELECT 1
      FROM public.calving_records AS calving
      WHERE calving.farm_id = old_ai.farm_id
        AND calving.ai_record_id = old_ai.id
        AND calving.actual_date IS NOT NULL
    )
)
UPDATE public.ai_records AS old_ai
SET
  pregnancy_result = 'negative',
  notes = CASE
    WHEN old_ai.notes IS NOT NULL
      AND old_ai.notes LIKE '%नंतरच्या रेतन नोंदीमुळे गर्भधारणा नाही म्हणून आपोआप चिन्हांकित.%'
      THEN old_ai.notes
    ELSE btrim(CONCAT_WS(
      E'\n',
      NULLIF(old_ai.notes, ''),
      'नंतरच्या रेतन नोंदीमुळे गर्भधारणा नाही म्हणून आपोआप चिन्हांकित.'
    ))
  END
FROM superseded
WHERE old_ai.id = superseded.id;

-- Close now-invalid reminders for older AI cycles that have a newer AI cycle.
UPDATE public.reminders AS reminder
SET
  is_done = true,
  skipped = true,
  done_at = COALESCE(reminder.done_at, NOW())
FROM public.ai_records AS old_ai
WHERE reminder.farm_id = old_ai.farm_id
  AND reminder.related_record_id = old_ai.id
  AND reminder.is_done = false
  AND reminder.type IN (
    'गर्भधारणा तपासणी',
    'गर्भधारणा तपासणी बाकी',
    'पुन्हा रेतन सूचना',
    'दूध बंद',
    'व्यायण'
  )
  AND old_ai.pregnancy_result = 'negative'
  AND EXISTS (
    SELECT 1
    FROM public.ai_records AS newer_ai
    WHERE newer_ai.farm_id = old_ai.farm_id
      AND newer_ai.cow_id = old_ai.cow_id
      AND newer_ai.id <> old_ai.id
      AND newer_ai.ai_date > old_ai.ai_date
  );

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

  PERFORM public.mark_superseded_ai_records_negative(
    NEW.farm_id,
    NEW.cow_id,
    NEW.id,
    NEW.ai_date
  );

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

SELECT
  COUNT(*) AS pending_ai_with_later_ai
FROM public.ai_records AS old_ai
WHERE COALESCE(old_ai.pregnancy_result, 'pending') = 'pending'
  AND EXISTS (
    SELECT 1
    FROM public.ai_records AS newer_ai
    WHERE newer_ai.farm_id = old_ai.farm_id
      AND newer_ai.cow_id = old_ai.cow_id
      AND newer_ai.id <> old_ai.id
      AND newer_ai.ai_date > old_ai.ai_date
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.calving_records AS calving
    WHERE calving.farm_id = old_ai.farm_id
      AND calving.ai_record_id = old_ai.id
      AND calving.actual_date IS NOT NULL
  );
