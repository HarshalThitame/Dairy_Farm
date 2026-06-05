BEGIN;

-- This repair is intentionally conservative:
-- 1. Drop the old check constraint.
-- 2. Normalize any legacy/unknown reminder types to an app-supported type.
-- 3. Recreate the constraint with every reminder type currently used by the app.

ALTER TABLE public.reminders
DROP CONSTRAINT IF EXISTS reminders_type_check;

UPDATE public.reminders
SET type = CASE
  WHEN btrim(COALESCE(type, '')) IN ('माज', 'माज चेक', 'heat_check', 'heat check') THEN 'तपासणी'
  WHEN btrim(COALESCE(type, '')) IN ('गर्भ तपासणी', 'pregnancy_check', 'pregnancy check') THEN 'गर्भधारणा तपासणी'
  WHEN btrim(COALESCE(type, '')) IN ('गर्भधारणा बाकी', 'missed_pregnancy', 'missed pregnancy') THEN 'गर्भधारणा तपासणी बाकी'
  WHEN btrim(COALESCE(type, '')) IN ('repeat_breeding', 'repeat breeding') THEN 'पुन्हा रेतन सूचना'
  WHEN btrim(COALESCE(type, '')) IN ('next_breeding_ready', 'next breeding ready') THEN 'पुढील रेतन तयारी'
  WHEN btrim(COALESCE(type, '')) IN ('calving', 'delivery') THEN 'व्यायण'
  WHEN btrim(COALESCE(type, '')) IN ('vaccination', 'vaccine') THEN 'लसीकरण'
  WHEN btrim(COALESCE(type, '')) IN ('deworming') THEN 'जंतनाशक'
  WHEN btrim(COALESCE(type, '')) IN ('checkup', 'health_check', 'health check') THEN 'तपासणी'
  WHEN btrim(COALESCE(type, '')) IN ('dry_off', 'dry off') THEN 'दूध बंद'
  WHEN btrim(COALESCE(type, '')) IN ('dehorning') THEN 'शिंग काढणे'
  WHEN btrim(COALESCE(type, '')) IN ('calf_milk_reduce', 'calf milk reduce') THEN 'वासरी दूध कमी'
  WHEN btrim(COALESCE(type, '')) IN ('calf_milk_stop', 'calf milk stop') THEN 'वासरी दूध बंद'
  ELSE 'तपासणी'
END
WHERE type IS NULL
  OR btrim(type) = ''
  OR type NOT IN (
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
  );

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

COMMIT;
