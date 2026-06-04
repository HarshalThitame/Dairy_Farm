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

INSERT INTO public.reminders (farm_id, cow_id, reminder_date, type, message, related_record_id, is_done)
SELECT
  calf.farm_id,
  calf.mother_cow_id,
  calf.birth_date + 15,
  'शिंग काढणे',
  COALESCE(NULLIF(calf.name, ''), 'वासरी') || 'चे शिंग काढण्याची योग्य वेळ झाली आहे.',
  calf.id,
  false
FROM public.calves AS calf
WHERE calf.status = 'active'
  AND calf.is_raised = true
  AND calf.birth_date IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.reminders AS existing
    WHERE existing.farm_id = calf.farm_id
      AND existing.related_record_id = calf.id
      AND existing.type = 'शिंग काढणे'
  );

COMMIT;
