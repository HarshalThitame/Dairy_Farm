CREATE TABLE IF NOT EXISTS public.farm_veterinarians (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  mobile TEXT,
  village TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_farm_veterinarians_farm_active
  ON public.farm_veterinarians(farm_id, is_active, name);

CREATE UNIQUE INDEX IF NOT EXISTS idx_farm_veterinarians_unique_name
  ON public.farm_veterinarians(farm_id, lower(btrim(name)));

ALTER TABLE public.farm_veterinarians ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Farm users can read veterinarians" ON public.farm_veterinarians;
CREATE POLICY "Farm users can read veterinarians"
  ON public.farm_veterinarians
  FOR SELECT
  USING (
    farm_id IN (
      SELECT users.farm_id
      FROM public.users
      WHERE users.id = auth.uid()
        AND users.is_active = true
    )
  );

DROP POLICY IF EXISTS "Farm owners can manage veterinarians" ON public.farm_veterinarians;
CREATE POLICY "Farm owners can manage veterinarians"
  ON public.farm_veterinarians
  FOR ALL
  USING (
    farm_id IN (
      SELECT users.farm_id
      FROM public.users
      WHERE users.id = auth.uid()
        AND users.is_active = true
        AND (users.is_farm_owner = true OR users.role = 'admin')
    )
  )
  WITH CHECK (
    farm_id IN (
      SELECT users.farm_id
      FROM public.users
      WHERE users.id = auth.uid()
        AND users.is_active = true
        AND (users.is_farm_owner = true OR users.role = 'admin')
    )
  );

INSERT INTO public.farm_veterinarians (farm_id, name, mobile, is_active)
SELECT farms.id, btrim(farms.vet_name), NULLIF(btrim(COALESCE(farms.vet_mobile, '')), ''), true
FROM public.farms
WHERE NULLIF(btrim(COALESCE(farms.vet_name, '')), '') IS NOT NULL
  AND NOT EXISTS (
    SELECT 1
    FROM public.farm_veterinarians existing
    WHERE existing.farm_id = farms.id
      AND lower(btrim(existing.name)) = lower(btrim(farms.vet_name))
  );
