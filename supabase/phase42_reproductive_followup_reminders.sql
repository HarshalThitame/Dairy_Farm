BEGIN;

ALTER TABLE public.reminders
DROP CONSTRAINT IF EXISTS reminders_type_check;

ALTER TABLE public.reminders
ADD CONSTRAINT reminders_type_check
CHECK (
  type IN (
    'माज तपासणी',
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

WITH duplicate_reminders AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY farm_id, related_record_id, type
      ORDER BY
        is_done ASC,
        COALESCE(done_at, created_at, reminder_date::timestamp) DESC,
        created_at DESC,
        id DESC
    ) AS duplicate_rank
  FROM public.reminders
  WHERE related_record_id IS NOT NULL
)
DELETE FROM public.reminders AS reminder
USING duplicate_reminders AS duplicate
WHERE reminder.id = duplicate.id
  AND duplicate.duplicate_rank > 1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_reminders_unique_related_type
ON public.reminders (farm_id, related_record_id, type)
WHERE related_record_id IS NOT NULL;

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

INSERT INTO public.reminders (farm_id, cow_id, reminder_date, type, message, related_record_id, is_done)
SELECT
  ai.farm_id,
  ai.cow_id,
  ai.ai_date + 61,
  'गर्भधारणा तपासणी बाकी',
  COALESCE(cow.name, 'गाय') || ' साठी ६० दिवस झाले आहेत. गर्भधारणा तपासणी नोंद करा.',
  ai.id,
  false
FROM public.ai_records AS ai
LEFT JOIN public.cows AS cow ON cow.id = ai.cow_id
WHERE COALESCE(ai.pregnancy_result, 'pending') = 'pending'
  AND NOT EXISTS (
    SELECT 1
    FROM public.reminders AS existing
    WHERE existing.farm_id = ai.farm_id
      AND existing.related_record_id = ai.id
      AND existing.type = 'गर्भधारणा तपासणी बाकी'
  );

INSERT INTO public.reminders (farm_id, cow_id, reminder_date, type, message, related_record_id, is_done)
SELECT
  ai.farm_id,
  ai.cow_id,
  COALESCE(ai.pregnancy_check_date, ai.ai_date + 61),
  'पुन्हा रेतन सूचना',
  COALESCE(cow.name, 'गाय') || ' पुन्हा रेतनासाठी तयार असू शकते.',
  ai.id,
  false
FROM public.ai_records AS ai
LEFT JOIN public.cows AS cow ON cow.id = ai.cow_id
WHERE ai.pregnancy_result = 'negative'
  AND NOT EXISTS (
    SELECT 1
    FROM public.ai_records AS newer_ai
    WHERE newer_ai.farm_id = ai.farm_id
      AND newer_ai.cow_id = ai.cow_id
      AND newer_ai.ai_date > ai.ai_date
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.calving_records AS calving
    WHERE calving.farm_id = ai.farm_id
      AND calving.cow_id = ai.cow_id
      AND calving.actual_date > ai.ai_date
  )
  AND NOT EXISTS (
    SELECT 1
    FROM public.reminders AS existing
    WHERE existing.farm_id = ai.farm_id
      AND existing.related_record_id = ai.id
      AND existing.type = 'पुन्हा रेतन सूचना'
  );

UPDATE public.reminders AS reminder
SET
  is_done = true,
  skipped = true,
  done_at = COALESCE(reminder.done_at, NOW())
FROM public.ai_records AS ai
WHERE reminder.farm_id = ai.farm_id
  AND reminder.related_record_id = ai.id
  AND ai.pregnancy_result = 'negative'
  AND reminder.type IN ('माज तपासणी', 'गर्भधारणा तपासणी', 'गर्भधारणा तपासणी बाकी', 'दूध बंद', 'व्यायण')
  AND reminder.is_done = false;

UPDATE public.reminders AS reminder
SET
  is_done = true,
  skipped = false,
  done_at = COALESCE(reminder.done_at, NOW())
FROM public.ai_records AS ai
WHERE reminder.farm_id = ai.farm_id
  AND reminder.related_record_id = ai.id
  AND ai.pregnancy_result = 'positive'
  AND reminder.type IN ('माज तपासणी', 'गर्भधारणा तपासणी', 'गर्भधारणा तपासणी बाकी')
  AND reminder.is_done = false;

UPDATE public.ai_records AS ai
SET pregnancy_result = 'positive'
FROM public.calving_records AS calving
WHERE calving.farm_id = ai.farm_id
  AND calving.ai_record_id = ai.id
  AND calving.actual_date IS NOT NULL
  AND COALESCE(ai.pregnancy_result, 'pending') = 'pending';

UPDATE public.reminders AS reminder
SET
  is_done = true,
  skipped = true,
  done_at = COALESCE(reminder.done_at, NOW())
FROM public.calving_records AS calving
WHERE calving.farm_id = reminder.farm_id
  AND calving.ai_record_id = reminder.related_record_id
  AND calving.actual_date IS NOT NULL
  AND reminder.type IN ('माज तपासणी', 'गर्भधारणा तपासणी', 'गर्भधारणा तपासणी बाकी', 'दूध बंद', 'व्यायण')
  AND reminder.is_done = false;

UPDATE public.reminders AS reminder
SET
  is_done = true,
  skipped = true,
  done_at = COALESCE(reminder.done_at, NOW())
WHERE reminder.type = 'दूध बंद'
  AND reminder.is_done = false
  AND EXISTS (
    SELECT 1
    FROM public.calving_records AS calving
    WHERE calving.farm_id = reminder.farm_id
      AND calving.cow_id = reminder.cow_id
      AND calving.actual_date IS NOT NULL
      AND reminder.reminder_date <= calving.actual_date
  );

UPDATE public.reminders AS reminder
SET
  is_done = true,
  skipped = true,
  done_at = COALESCE(reminder.done_at, NOW())
FROM public.ai_records AS ai
WHERE reminder.farm_id = ai.farm_id
  AND reminder.related_record_id = ai.id
  AND reminder.type IN (
    'माज तपासणी',
    'गर्भधारणा तपासणी',
    'गर्भधारणा तपासणी बाकी',
    'पुन्हा रेतन सूचना',
    'दूध बंद',
    'व्यायण'
  )
  AND reminder.is_done = false
  AND (
    EXISTS (
      SELECT 1
      FROM public.ai_records AS newer_ai
      WHERE newer_ai.farm_id = ai.farm_id
        AND newer_ai.cow_id = ai.cow_id
        AND newer_ai.ai_date > ai.ai_date
    )
    OR EXISTS (
      SELECT 1
      FROM public.calving_records AS later_calving
      WHERE later_calving.farm_id = ai.farm_id
        AND later_calving.cow_id = ai.cow_id
        AND later_calving.actual_date > ai.ai_date
    )
  );

INSERT INTO public.reminders (farm_id, cow_id, reminder_date, type, message, related_record_id, is_done)
SELECT
  calving.farm_id,
  calving.cow_id,
  calving.actual_date + 60,
  'पुढील रेतन तयारी',
  COALESCE(cow.name, 'गाय') || ' पुढील रेतनासाठी तयार आहे का तपासा.',
  calving.id,
  false
FROM public.calving_records AS calving
LEFT JOIN public.cows AS cow ON cow.id = calving.cow_id
WHERE calving.actual_date IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.reminders AS existing
    WHERE existing.farm_id = calving.farm_id
      AND existing.related_record_id = calving.id
      AND existing.type = 'पुढील रेतन तयारी'
  );

COMMIT;
