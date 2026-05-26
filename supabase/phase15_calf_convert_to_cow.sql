BEGIN;

ALTER TABLE public.calves
ADD COLUMN IF NOT EXISTS converted_cow_id UUID,
ADD COLUMN IF NOT EXISTS conversion_ai_record_id UUID,
ADD COLUMN IF NOT EXISTS converted_at TIMESTAMP;

ALTER TABLE public.calves
DROP CONSTRAINT IF EXISTS calves_converted_cow_id_fkey;

ALTER TABLE public.calves
ADD CONSTRAINT calves_converted_cow_id_fkey
FOREIGN KEY (converted_cow_id)
REFERENCES public.cows(id)
ON DELETE SET NULL;

ALTER TABLE public.calves
DROP CONSTRAINT IF EXISTS calves_conversion_ai_record_id_fkey;

ALTER TABLE public.calves
ADD CONSTRAINT calves_conversion_ai_record_id_fkey
FOREIGN KEY (conversion_ai_record_id)
REFERENCES public.ai_records(id)
ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS calves_converted_cow_idx
ON public.calves(converted_cow_id);

CREATE INDEX IF NOT EXISTS calves_conversion_ai_record_idx
ON public.calves(conversion_ai_record_id);

COMMIT;
