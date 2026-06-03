ALTER TABLE public.appearance_preferences
  ALTER COLUMN theme_mode SET DEFAULT 'light';

UPDATE public.appearance_preferences
SET theme_mode = 'light',
    updated_at = NOW()
WHERE theme_mode IS NULL;
