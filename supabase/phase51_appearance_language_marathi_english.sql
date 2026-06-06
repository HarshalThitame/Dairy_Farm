BEGIN;

UPDATE public.appearance_preferences
SET language = 'mr',
    updated_at = NOW()
WHERE language IS NULL
   OR language NOT IN ('mr', 'en');

ALTER TABLE public.appearance_preferences
  DROP CONSTRAINT IF EXISTS appearance_preferences_language_check;

ALTER TABLE public.appearance_preferences
  ADD CONSTRAINT appearance_preferences_language_check
  CHECK (language IN ('mr', 'en'));

COMMIT;
