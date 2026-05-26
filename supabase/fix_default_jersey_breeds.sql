-- Set Jersey as the default breed for new cow and AI records.
-- Run this once in Supabase SQL Editor.

BEGIN;

UPDATE public.cows
SET breed = 'जर्सी'
WHERE breed IS NULL
   OR BTRIM(breed) = ''
   OR BTRIM(breed) IN ('Jersey', 'jersey', 'Jersi', 'jersi', 'जर्सि');

ALTER TABLE public.cows
ALTER COLUMN breed SET DEFAULT 'जर्सी';

UPDATE public.ai_records
SET bull_breed = 'जर्सी'
WHERE bull_breed IS NULL
   OR BTRIM(bull_breed) = ''
   OR BTRIM(bull_breed) IN ('Jersey', 'jersey', 'Jersi', 'jersi', 'जर्सि');

ALTER TABLE public.ai_records
ALTER COLUMN bull_breed SET DEFAULT 'जर्सी';

COMMIT;

SELECT
  (SELECT COUNT(*) FROM public.cows WHERE breed IS NULL OR BTRIM(breed) = '') AS cows_without_breed,
  (SELECT COUNT(*) FROM public.ai_records WHERE bull_breed IS NULL OR BTRIM(bull_breed) = '') AS ai_without_bull_breed;
