BEGIN;

-- Old reproductive reminders must not stay active after a newer AI cycle or actual calving exists.
UPDATE public.reminders r
SET
  is_done = true,
  skipped = true,
  done_at = COALESCE(r.done_at, NOW())
FROM public.ai_records ai
WHERE r.farm_id = ai.farm_id
  AND r.related_record_id = ai.id
  AND r.is_done = false
  AND r.type IN ('गर्भधारणा तपासणी', 'गर्भधारणा तपासणी बाकी', 'पुन्हा रेतन सूचना', 'दूध बंद', 'व्यायण')
  AND (
    EXISTS (
      SELECT 1
      FROM public.ai_records newer
      WHERE newer.farm_id = ai.farm_id
        AND newer.cow_id = ai.cow_id
        AND newer.ai_date > ai.ai_date
    )
    OR EXISTS (
      SELECT 1
      FROM public.calving_records calv
      WHERE calv.farm_id = ai.farm_id
        AND calv.cow_id = ai.cow_id
        AND calv.actual_date > ai.ai_date
    )
  );

-- Orphan calf reminders should not remain actionable.
UPDATE public.reminders r
SET
  is_done = true,
  skipped = true,
  done_at = COALESCE(r.done_at, NOW())
WHERE r.is_done = false
  AND r.type IN ('शिंग काढणे', 'वासरी दूध कमी', 'वासरी दूध बंद')
  AND NOT EXISTS (
    SELECT 1
    FROM public.calves calf
    WHERE calf.id = r.related_record_id
      AND calf.farm_id = r.farm_id
  );

-- Milk reminders apply only to active raised female calves.
UPDATE public.reminders r
SET
  is_done = true,
  skipped = true,
  done_at = COALESCE(r.done_at, NOW())
FROM public.calves calf
WHERE r.farm_id = calf.farm_id
  AND r.related_record_id = calf.id
  AND r.is_done = false
  AND r.type IN ('वासरी दूध कमी', 'वासरी दूध बंद')
  AND (
    calf.gender <> 'मादी'
    OR calf.is_raised = false
    OR calf.status <> 'active'
  );

-- Dehorning reminders apply only to active raised calves.
UPDATE public.reminders r
SET
  is_done = true,
  skipped = true,
  done_at = COALESCE(r.done_at, NOW())
FROM public.calves calf
WHERE r.farm_id = calf.farm_id
  AND r.related_record_id = calf.id
  AND r.is_done = false
  AND r.type = 'शिंग काढणे'
  AND (
    calf.is_raised = false
    OR calf.status <> 'active'
  );

COMMIT;
