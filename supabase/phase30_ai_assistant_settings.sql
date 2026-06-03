BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.ai_assistant_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  enabled BOOLEAN DEFAULT true,
  response_style TEXT DEFAULT 'short' CHECK (response_style IN ('short', 'detailed', 'expert')),
  suggested_questions_enabled BOOLEAN DEFAULT true,
  data_permissions JSONB NOT NULL DEFAULT '{
    "milk_records": true,
    "slip_history": true,
    "analytics": true,
    "animal_data": true
  }'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_assistant_preferences_farm
ON public.ai_assistant_preferences(farm_id);

ALTER TABLE public.ai_assistant_logs
  ADD COLUMN IF NOT EXISTS feedback TEXT,
  ADD COLUMN IF NOT EXISTS feedback_note TEXT,
  ADD COLUMN IF NOT EXISTS feedback_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'ai_assistant_logs_feedback_check'
      AND conrelid = 'public.ai_assistant_logs'::regclass
  ) THEN
    ALTER TABLE public.ai_assistant_logs
      ADD CONSTRAINT ai_assistant_logs_feedback_check
      CHECK (feedback IS NULL OR feedback IN ('useful', 'not_useful'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_ai_assistant_logs_user_created
ON public.ai_assistant_logs(user_id, created_at DESC)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_ai_assistant_logs_feedback
ON public.ai_assistant_logs(farm_id, feedback, feedback_at DESC)
WHERE feedback IS NOT NULL;

ALTER TABLE public.ai_assistant_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access AI assistant preferences in their farm" ON public.ai_assistant_preferences;
CREATE POLICY "Users can access AI assistant preferences in their farm"
  ON public.ai_assistant_preferences FOR ALL
  USING (farm_id = public.current_user_farm_id())
  WITH CHECK (farm_id = public.current_user_farm_id());

COMMIT;
