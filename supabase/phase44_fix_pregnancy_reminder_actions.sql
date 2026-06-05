BEGIN;

-- Clean up stale pregnancy lifecycle reminders after a pregnancy result was already recorded.
UPDATE public.reminders r
SET
  is_done = true,
  skipped = CASE WHEN ai.pregnancy_result = 'negative' THEN true ELSE false END,
  done_at = COALESCE(r.done_at, NOW())
FROM public.ai_records ai
WHERE r.farm_id = ai.farm_id
  AND r.related_record_id = ai.id
  AND r.is_done = false
  AND ai.pregnancy_result IN ('positive', 'negative')
  AND r.type IN ('माज तपासणी', 'गर्भधारणा तपासणी', 'गर्भधारणा तपासणी बाकी');

-- If the cow is not pregnant, dry-off and calving reminders from that AI cycle must not remain active.
UPDATE public.reminders r
SET
  is_done = true,
  skipped = true,
  done_at = COALESCE(r.done_at, NOW())
FROM public.ai_records ai
WHERE r.farm_id = ai.farm_id
  AND r.related_record_id = ai.id
  AND r.is_done = false
  AND ai.pregnancy_result = 'negative'
  AND r.type IN ('दूध बंद', 'व्यायण');

-- Ensure one active repeat-breeding reminder exists for negative pregnancy cycles.
INSERT INTO public.reminders (farm_id, cow_id, reminder_date, type, message, related_record_id, is_done, skipped)
SELECT
  ai.farm_id,
  ai.cow_id,
  COALESCE(ai.pregnancy_check_date, ai.ai_date + 61),
  'पुन्हा रेतन सूचना',
  COALESCE(cows.name, 'गाय') || ' पुन्हा रेतनासाठी तयार असू शकते.',
  ai.id,
  false,
  false
FROM public.ai_records ai
LEFT JOIN public.cows cows
  ON cows.id = ai.cow_id
 AND cows.farm_id = ai.farm_id
WHERE ai.pregnancy_result = 'negative'
  AND NOT EXISTS (
    SELECT 1
    FROM public.reminders existing
    WHERE existing.farm_id = ai.farm_id
      AND existing.related_record_id = ai.id
      AND existing.type = 'पुन्हा रेतन सूचना'
      AND existing.is_done = false
  );

COMMIT;
