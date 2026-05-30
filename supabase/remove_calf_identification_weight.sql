BEGIN;

ALTER TABLE public.calves
DROP COLUMN IF EXISTS identification_mark;

ALTER TABLE public.calving_records
DROP COLUMN IF EXISTS calf_weight;

COMMIT;
