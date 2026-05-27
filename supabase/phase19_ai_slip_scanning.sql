BEGIN;

ALTER TABLE public.milk_records
  ADD COLUMN IF NOT EXISTS ai_extracted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS ai_model_used TEXT,
  ADD COLUMN IF NOT EXISTS ai_raw_data JSONB,
  ADD COLUMN IF NOT EXISTS slip_image_url TEXT,
  ADD COLUMN IF NOT EXISTS ocr_timestamp TIMESTAMP;

ALTER TABLE public.dairy_slips
  ADD COLUMN IF NOT EXISTS ai_extracted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS ai_model_used TEXT,
  ADD COLUMN IF NOT EXISTS ai_raw_data JSONB,
  ADD COLUMN IF NOT EXISTS ocr_timestamp TIMESTAMP;

ALTER TABLE public.dairy_settlements
  ADD COLUMN IF NOT EXISTS ai_extracted BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS ai_confidence NUMERIC(3,2),
  ADD COLUMN IF NOT EXISTS ai_model_used TEXT,
  ADD COLUMN IF NOT EXISTS ai_raw_data JSONB,
  ADD COLUMN IF NOT EXISTS ocr_timestamp TIMESTAMP;

CREATE TABLE IF NOT EXISTS public.slip_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  original_filename TEXT,
  original_size BIGINT,
  compressed_size BIGINT,
  compression_ratio INTEGER,
  original_image_url TEXT,
  compressed_image_url TEXT,
  compressed_storage_path TEXT,
  slip_type TEXT CHECK (slip_type IS NULL OR slip_type IN ('daily', 'settlement')),
  ai_model_used TEXT,
  ai_model_primary TEXT DEFAULT 'gpt-4o-mini',
  ai_model_fallback TEXT,
  ai_confidence NUMERIC(3,2),
  ai_raw_response JSONB,
  ai_tokens_used INTEGER,
  ai_cost_estimate NUMERIC(8,4),
  extraction_status TEXT DEFAULT 'pending' CHECK (
    extraction_status IN ('pending', 'processing', 'success', 'failed', 'saved')
  ),
  extraction_error TEXT,
  retried BOOLEAN DEFAULT false,
  linked_milk_record_id UUID REFERENCES public.milk_records(id) ON DELETE SET NULL,
  linked_dairy_slip_id UUID REFERENCES public.dairy_slips(id) ON DELETE SET NULL,
  linked_settlement_id UUID REFERENCES public.dairy_settlements(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE public.slip_uploads
  ADD COLUMN IF NOT EXISTS compression_ratio INTEGER,
  ADD COLUMN IF NOT EXISTS ai_model_primary TEXT DEFAULT 'gpt-4o-mini',
  ADD COLUMN IF NOT EXISTS ai_model_fallback TEXT,
  ADD COLUMN IF NOT EXISTS ai_tokens_used INTEGER,
  ADD COLUMN IF NOT EXISTS ai_cost_estimate NUMERIC(8,4),
  ADD COLUMN IF NOT EXISTS retried BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_slip_uploads_farm ON public.slip_uploads(farm_id);
CREATE INDEX IF NOT EXISTS idx_slip_uploads_status ON public.slip_uploads(extraction_status);
CREATE INDEX IF NOT EXISTS idx_slip_uploads_type ON public.slip_uploads(slip_type);
CREATE INDEX IF NOT EXISTS idx_slip_uploads_created ON public.slip_uploads(created_at DESC);

ALTER TABLE public.slip_uploads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access slip uploads in their farm" ON public.slip_uploads;
CREATE POLICY "Users can access slip uploads in their farm"
  ON public.slip_uploads FOR ALL
  USING (farm_id = public.current_user_farm_id())
  WITH CHECK (farm_id = public.current_user_farm_id());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'dairy-slips',
  'dairy-slips',
  true,
  5242880,
  ARRAY['image/webp', 'image/jpeg', 'image/png', 'image/heic', 'image/heif']
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

COMMIT;
