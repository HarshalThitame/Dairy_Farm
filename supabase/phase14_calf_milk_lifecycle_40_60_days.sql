BEGIN;

UPDATE public.calves
SET
  milk_reduce_date = birth_date + 40,
  milk_stop_date = birth_date + 50,
  milk_feeding_status = CASE
    WHEN is_raised = true
      AND gender = 'मादी'
      AND status = 'active'
      AND CURRENT_DATE < birth_date + 40
      THEN 'दूध पाजायचे सुरू आहे'
    WHEN is_raised = true
      AND gender = 'मादी'
      AND status = 'active'
      AND CURRENT_DATE < birth_date + 50
      THEN 'दूध कमी करायचे'
    WHEN is_raised = true
      AND gender = 'मादी'
      AND status = 'active'
      THEN 'दूध बंद'
    ELSE 'not_tracked'
  END,
  updated_at = NOW()
WHERE birth_date IS NOT NULL;

UPDATE public.reminders reminder
SET
  reminder_date = calf.birth_date + 40,
  message = COALESCE(NULLIF(calf.name, ''), 'वासरी')
    || ' आता ४० दिवसांची झाली आहे. दूध कमी करण्यास सुरुवात करा.'
FROM public.calves calf
WHERE reminder.related_record_id = calf.id
  AND reminder.type = 'वासरी दूध कमी'
  AND calf.is_raised = true
  AND calf.gender = 'मादी';

UPDATE public.reminders reminder
SET
  reminder_date = calf.birth_date + 50,
  message = COALESCE(NULLIF(calf.name, ''), 'वासरी')
    || ' आता ५० दिवसांची झाली आहे. दूध बंद करण्याची वेळ झाली आहे.'
FROM public.calves calf
WHERE reminder.related_record_id = calf.id
  AND reminder.type = 'वासरी दूध बंद'
  AND calf.is_raised = true
  AND calf.gender = 'मादी';

COMMIT;
