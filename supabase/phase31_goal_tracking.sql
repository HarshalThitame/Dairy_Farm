BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.farm_goal_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE UNIQUE,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  daily_milk_goal NUMERIC(10,2) DEFAULT 300,
  weekly_milk_goal NUMERIC(10,2) DEFAULT 2100,
  monthly_milk_goal NUMERIC(10,2) DEFAULT 9000,
  fat_goal NUMERIC(5,2) DEFAULT 4.5,
  snf_goal NUMERIC(5,2) DEFAULT 8.8,
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_farm_goal_settings_farm
ON public.farm_goal_settings(farm_id);

CREATE TABLE IF NOT EXISTS public.goal_progress_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('daily_milk', 'weekly_milk', 'monthly_milk', 'fat', 'snf')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  target_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  actual_value NUMERIC(12,2) NOT NULL DEFAULT 0,
  percentage NUMERIC(6,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'in_progress' CHECK (status IN ('completed', 'missed', 'in_progress', 'no_goal')),
  unit TEXT,
  generated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(farm_id, goal_type, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_goal_progress_history_farm_period
ON public.goal_progress_history(farm_id, period_start DESC, goal_type);

CREATE INDEX IF NOT EXISTS idx_goal_progress_history_status
ON public.goal_progress_history(farm_id, status, generated_at DESC);

CREATE TABLE IF NOT EXISTS public.goal_achievement_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  goal_type TEXT NOT NULL CHECK (goal_type IN ('daily_milk', 'weekly_milk', 'monthly_milk', 'fat', 'snf')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(farm_id, user_id, goal_type, period_start, period_end)
);

CREATE INDEX IF NOT EXISTS idx_goal_achievement_notifications_user
ON public.goal_achievement_notifications(user_id, created_at DESC);

ALTER TABLE public.farm_goal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_progress_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.goal_achievement_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access goal settings in their farm" ON public.farm_goal_settings;
CREATE POLICY "Users can access goal settings in their farm"
  ON public.farm_goal_settings FOR ALL
  USING (farm_id = public.current_user_farm_id())
  WITH CHECK (farm_id = public.current_user_farm_id());

DROP POLICY IF EXISTS "Users can access goal progress in their farm" ON public.goal_progress_history;
CREATE POLICY "Users can access goal progress in their farm"
  ON public.goal_progress_history FOR ALL
  USING (farm_id = public.current_user_farm_id())
  WITH CHECK (farm_id = public.current_user_farm_id());

DROP POLICY IF EXISTS "Users can access goal notifications in their farm" ON public.goal_achievement_notifications;
CREATE POLICY "Users can access goal notifications in their farm"
  ON public.goal_achievement_notifications FOR ALL
  USING (farm_id = public.current_user_farm_id())
  WITH CHECK (farm_id = public.current_user_farm_id());

COMMIT;
