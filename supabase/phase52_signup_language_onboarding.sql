BEGIN;

ALTER TABLE public.user_profiles
  ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'mr';

UPDATE public.user_profiles profile
SET language = COALESCE(appearance.language, profile.language, 'mr'),
    updated_at = NOW()
FROM public.appearance_preferences appearance
WHERE appearance.user_id = profile.user_id
  AND (profile.language IS NULL OR profile.language NOT IN ('mr', 'en'));

UPDATE public.user_profiles
SET language = 'mr',
    updated_at = NOW()
WHERE language IS NULL OR language NOT IN ('mr', 'en');

ALTER TABLE public.user_profiles
  DROP CONSTRAINT IF EXISTS user_profiles_language_check;

ALTER TABLE public.user_profiles
  ADD CONSTRAINT user_profiles_language_check
  CHECK (language IN ('mr', 'en'));

COMMIT;
