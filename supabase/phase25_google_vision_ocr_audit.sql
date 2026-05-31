BEGIN;

CREATE TABLE IF NOT EXISTS public.ocr_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  slip_upload_id UUID REFERENCES public.slip_uploads(id) ON DELETE SET NULL,
  image_url TEXT,
  image_storage_path TEXT,
  ocr_provider TEXT DEFAULT 'google_vision',
  ocr_text TEXT,
  ocr_confidence NUMERIC(5,4),
  ai_model TEXT,
  ai_json JSONB,
  confidence NUMERIC(5,4),
  warnings JSONB DEFAULT '[]'::jsonb,
  validation JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ocr_audit_logs_farm_created
ON public.ocr_audit_logs(farm_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ocr_audit_logs_upload
ON public.ocr_audit_logs(slip_upload_id);

ALTER TABLE public.dairy_slips
  ADD COLUMN IF NOT EXISTS ocr_text TEXT,
  ADD COLUMN IF NOT EXISTS ocr_provider TEXT,
  ADD COLUMN IF NOT EXISTS ocr_audit_log_id UUID REFERENCES public.ocr_audit_logs(id) ON DELETE SET NULL;

ALTER TABLE public.dairy_settlements
  ADD COLUMN IF NOT EXISTS ocr_text TEXT,
  ADD COLUMN IF NOT EXISTS ocr_provider TEXT,
  ADD COLUMN IF NOT EXISTS ocr_audit_log_id UUID REFERENCES public.ocr_audit_logs(id) ON DELETE SET NULL;

ALTER TABLE public.ocr_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access OCR audit logs in their farm" ON public.ocr_audit_logs;
CREATE POLICY "Users can access OCR audit logs in their farm"
  ON public.ocr_audit_logs FOR ALL
  USING (farm_id = public.current_user_farm_id())
  WITH CHECK (farm_id = public.current_user_farm_id());

COMMIT;
