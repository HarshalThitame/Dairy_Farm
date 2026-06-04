BEGIN;

ALTER TABLE public.calving_records
ADD COLUMN IF NOT EXISTS calf_count INTEGER NOT NULL DEFAULT 1;

ALTER TABLE public.calving_records
DROP CONSTRAINT IF EXISTS calving_records_calf_count_check;

ALTER TABLE public.calving_records
ADD CONSTRAINT calving_records_calf_count_check
CHECK (calf_count >= 1 AND calf_count <= 2);

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

CREATE TABLE IF NOT EXISTS public.calves (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  mother_cow_id UUID REFERENCES public.cows(id) ON DELETE SET NULL,
  calving_record_id UUID REFERENCES public.calving_records(id) ON DELETE SET NULL,
  name TEXT,
  birth_date DATE NOT NULL,
  gender TEXT NOT NULL,
  breed TEXT,
  color TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  is_raised BOOLEAN NOT NULL DEFAULT false,
  milk_feeding_status TEXT NOT NULL DEFAULT 'not_tracked',
  milk_reduce_date DATE,
  milk_stop_date DATE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.calves
ADD COLUMN IF NOT EXISTS farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS mother_cow_id UUID REFERENCES public.cows(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS calving_record_id UUID REFERENCES public.calving_records(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS name TEXT,
ADD COLUMN IF NOT EXISTS birth_date DATE,
ADD COLUMN IF NOT EXISTS gender TEXT,
ADD COLUMN IF NOT EXISTS breed TEXT,
ADD COLUMN IF NOT EXISTS color TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS is_raised BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS milk_feeding_status TEXT DEFAULT 'not_tracked',
ADD COLUMN IF NOT EXISTS milk_reduce_date DATE,
ADD COLUMN IF NOT EXISTS milk_stop_date DATE,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

UPDATE public.calves SET status = 'historical' WHERE status IS NULL;
UPDATE public.calves SET is_raised = false WHERE is_raised IS NULL;
UPDATE public.calves SET milk_feeding_status = 'not_tracked' WHERE milk_feeding_status IS NULL;

ALTER TABLE public.calves
DROP CONSTRAINT IF EXISTS calves_gender_check;

ALTER TABLE public.calves
ADD CONSTRAINT calves_gender_check
CHECK (gender IN ('नर', 'मादी'));

ALTER TABLE public.calves
DROP CONSTRAINT IF EXISTS calves_status_check;

ALTER TABLE public.calves
ADD CONSTRAINT calves_status_check
CHECK (status IN ('active', 'historical', 'sold', 'dead', 'converted_to_cow'));

ALTER TABLE public.calves
DROP CONSTRAINT IF EXISTS calves_milk_feeding_status_check;

ALTER TABLE public.calves
ADD CONSTRAINT calves_milk_feeding_status_check
CHECK (milk_feeding_status IN ('not_tracked', 'दूध पाजायचे सुरू आहे', 'दूध कमी करायचे', 'दूध बंद'));

CREATE INDEX IF NOT EXISTS calves_farm_status_idx ON public.calves(farm_id, status, birth_date DESC);
CREATE INDEX IF NOT EXISTS calves_mother_idx ON public.calves(mother_cow_id, birth_date DESC);
CREATE INDEX IF NOT EXISTS calves_calving_record_idx ON public.calves(calving_record_id);

ALTER TABLE public.calves ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access calves in their farm" ON public.calves;
CREATE POLICY "Users can access calves in their farm"
  ON public.calves FOR ALL
  USING (farm_id = public.current_user_farm_id())
  WITH CHECK (farm_id = public.current_user_farm_id());

COMMIT;
