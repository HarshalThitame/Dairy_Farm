BEGIN;

-- Update calf milk lifecycle from 40/60 days to 40/50 days.
-- 40 days: start reducing milk.
-- 50 days: stop milk.
-- This also updates existing calf records and their linked reminders.

UPDATE public.calves
SET
  milk_reduce_date = CASE
    WHEN is_raised = true AND gender = 'मादी' AND birth_date IS NOT NULL THEN birth_date + 40
    ELSE NULL
  END,
  milk_stop_date = CASE
    WHEN is_raised = true AND gender = 'मादी' AND birth_date IS NOT NULL THEN birth_date + 50
    ELSE NULL
  END,
  milk_feeding_status = CASE
    WHEN is_raised = true
      AND gender = 'मादी'
      AND status = 'active'
      AND birth_date IS NOT NULL
      AND CURRENT_DATE < birth_date + 40
      THEN 'दूध पाजायचे सुरू आहे'
    WHEN is_raised = true
      AND gender = 'मादी'
      AND status = 'active'
      AND birth_date IS NOT NULL
      AND CURRENT_DATE < birth_date + 50
      THEN 'दूध कमी करायचे'
    WHEN is_raised = true
      AND gender = 'मादी'
      AND status = 'active'
      AND birth_date IS NOT NULL
      THEN 'दूध बंद'
    ELSE 'not_tracked'
  END,
  updated_at = NOW()
WHERE birth_date IS NOT NULL;

UPDATE public.reminders AS reminder
SET
  reminder_date = calf.birth_date + 40,
  message = COALESCE(NULLIF(calf.name, ''), 'वासरी')
    || ' आता ४० दिवसांची झाली आहे. दूध कमी करण्यास सुरुवात करा.'
FROM public.calves AS calf
WHERE reminder.farm_id = calf.farm_id
  AND reminder.related_record_id = calf.id
  AND reminder.type = 'वासरी दूध कमी'
  AND calf.is_raised = true
  AND calf.gender = 'मादी'
  AND calf.birth_date IS NOT NULL;

UPDATE public.reminders AS reminder
SET
  reminder_date = calf.birth_date + 50,
  message = COALESCE(NULLIF(calf.name, ''), 'वासरी')
    || ' आता ५० दिवसांची झाली आहे. दूध बंद करण्याची वेळ झाली आहे.'
FROM public.calves AS calf
WHERE reminder.farm_id = calf.farm_id
  AND reminder.related_record_id = calf.id
  AND reminder.type = 'वासरी दूध बंद'
  AND calf.is_raised = true
  AND calf.gender = 'मादी'
  AND calf.birth_date IS NOT NULL;

-- Remove pending milk reminders for calves that are no longer tracked.
UPDATE public.reminders AS reminder
SET
  is_done = true,
  skipped = true,
  done_at = COALESCE(reminder.done_at, NOW())
FROM public.calves AS calf
WHERE reminder.farm_id = calf.farm_id
  AND reminder.related_record_id = calf.id
  AND reminder.type IN ('वासरी दूध कमी', 'वासरी दूध बंद')
  AND reminder.is_done = false
  AND (
    calf.status <> 'active'
    OR calf.is_raised IS DISTINCT FROM true
    OR calf.gender <> 'मादी'
  );

-- Normalize legacy/orphan reminder text too. Some old skipped reminders may no
-- longer have a linked calf row, but the user-facing message should not mention
-- the old 60-day rule.
UPDATE public.reminders
SET message = REPLACE(message, '६० दिवसांची', '५० दिवसांची')
WHERE type = 'वासरी दूध बंद'
  AND COALESCE(message, '') LIKE '%६० दिवसांची%';

COMMIT;

SELECT
  COUNT(*) AS wrong_stop_dates
FROM public.calves
WHERE is_raised = true
  AND gender = 'मादी'
  AND birth_date IS NOT NULL
  AND milk_stop_date <> birth_date + 50;
