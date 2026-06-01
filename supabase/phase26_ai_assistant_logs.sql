BEGIN;

CREATE TABLE IF NOT EXISTS public.ai_assistant_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  tools_used JSONB DEFAULT '[]'::jsonb,
  execution_ms INTEGER DEFAULT 0,
  response TEXT,
  error TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_assistant_logs_farm_created
ON public.ai_assistant_logs(farm_id, created_at DESC);

ALTER TABLE public.ai_assistant_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access AI assistant logs in their farm" ON public.ai_assistant_logs;
CREATE POLICY "Users can access AI assistant logs in their farm"
  ON public.ai_assistant_logs FOR ALL
  USING (farm_id = public.current_user_farm_id())
  WITH CHECK (farm_id = public.current_user_farm_id());

COMMIT;
