-- Phase 39: Taluka-wise leaderboard support.
-- Run this after phase34_achievements_gamification.sql.

ALTER TABLE public.user_scores
  ADD COLUMN IF NOT EXISTS taluka_name TEXT;

ALTER TABLE public.leaderboards
  ADD COLUMN IF NOT EXISTS taluka_name TEXT;

UPDATE public.user_scores AS score
SET taluka_name = farm.taluka_name
FROM public.farms AS farm
WHERE score.farm_id = farm.id
  AND (score.taluka_name IS NULL OR score.taluka_name = '')
  AND farm.taluka_name IS NOT NULL
  AND farm.taluka_name <> '';

UPDATE public.leaderboards AS board
SET taluka_name = farm.taluka_name
FROM public.farms AS farm
WHERE board.farm_id = farm.id
  AND (board.taluka_name IS NULL OR board.taluka_name = '')
  AND farm.taluka_name IS NOT NULL
  AND farm.taluka_name <> '';

CREATE INDEX IF NOT EXISTS idx_user_scores_taluka_dairy_score
ON public.user_scores(taluka_name, dairy_score DESC, achievement_points DESC);

CREATE INDEX IF NOT EXISTS idx_user_scores_taluka_milk
ON public.user_scores(taluka_name, total_milk_liters DESC);

CREATE INDEX IF NOT EXISTS idx_user_scores_taluka_activity
ON public.user_scores(taluka_name, recent_activity_days DESC);

CREATE INDEX IF NOT EXISTS idx_leaderboards_taluka_type_score
ON public.leaderboards(taluka_name, leaderboard_type, period_key, score DESC);
