BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT NOT NULL UNIQUE,
  category TEXT NOT NULL CHECK (category IN (
    'milk_production',
    'income',
    'data_entry',
    'ocr_usage',
    'ai_usage',
    'consistency',
    'farm_growth',
    'subscription_loyalty',
    'community',
    'hidden'
  )),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '🏅',
  metric_key TEXT NOT NULL,
  target_value NUMERIC(14,2) NOT NULL DEFAULT 1,
  points INTEGER NOT NULL DEFAULT 10,
  rarity TEXT NOT NULL DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary', 'secret')),
  reward_type TEXT DEFAULT 'badge' CHECK (reward_type IS NULL OR reward_type IN ('badge', 'title', 'theme', 'profile_frame', 'icon')),
  reward_value TEXT,
  is_secret BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_achievements_category
ON public.achievements(category, sort_order);

CREATE TABLE IF NOT EXISTS public.user_achievements (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  unlocked_at TIMESTAMP DEFAULT NOW(),
  points_awarded INTEGER DEFAULT 0,
  reward_claimed BOOLEAN DEFAULT false,
  reward_claimed_at TIMESTAMP,
  UNIQUE(farm_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_user_achievements_farm
ON public.user_achievements(farm_id, unlocked_at DESC);

CREATE TABLE IF NOT EXISTS public.achievement_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
  current_value NUMERIC(14,2) DEFAULT 0,
  target_value NUMERIC(14,2) DEFAULT 0,
  progress_percent NUMERIC(5,2) DEFAULT 0,
  remaining_value NUMERIC(14,2) DEFAULT 0,
  is_unlocked BOOLEAN DEFAULT false,
  last_evaluated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(farm_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_achievement_progress_farm
ON public.achievement_progress(farm_id, progress_percent DESC);

CREATE TABLE IF NOT EXISTS public.achievement_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  notification_type TEXT DEFAULT 'achievement_unlocked' CHECK (notification_type IN (
    'achievement_unlocked',
    'rank_increased',
    'milestone_reached',
    'leaderboard_updated'
  )),
  read_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_achievement_notifications_farm
ON public.achievement_notifications(farm_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.user_scores (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE UNIQUE,
  farm_name TEXT,
  district_name TEXT,
  dairy_score NUMERIC(5,2) DEFAULT 0,
  achievement_points INTEGER DEFAULT 0,
  achievements_unlocked INTEGER DEFAULT 0,
  total_achievements INTEGER DEFAULT 0,
  rank_code TEXT NOT NULL DEFAULT 'beginner_farmer',
  rank_label TEXT NOT NULL DEFAULT 'Beginner Farmer',
  milk_score NUMERIC(5,2) DEFAULT 0,
  ai_score NUMERIC(5,2) DEFAULT 0,
  ocr_score NUMERIC(5,2) DEFAULT 0,
  activity_score NUMERIC(5,2) DEFAULT 0,
  consistency_score NUMERIC(5,2) DEFAULT 0,
  profile_score NUMERIC(5,2) DEFAULT 0,
  data_quality_score NUMERIC(5,2) DEFAULT 0,
  total_milk_liters NUMERIC(14,2) DEFAULT 0,
  total_income NUMERIC(14,2) DEFAULT 0,
  ai_questions INTEGER DEFAULT 0,
  slips_uploaded INTEGER DEFAULT 0,
  recent_activity_days INTEGER DEFAULT 0,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_scores_dairy_score
ON public.user_scores(dairy_score DESC, achievement_points DESC);

CREATE INDEX IF NOT EXISTS idx_user_scores_district
ON public.user_scores(district_name, dairy_score DESC);

CREATE INDEX IF NOT EXISTS idx_user_scores_milk
ON public.user_scores(total_milk_liters DESC);

CREATE INDEX IF NOT EXISTS idx_user_scores_ai
ON public.user_scores(ai_questions DESC);

CREATE INDEX IF NOT EXISTS idx_user_scores_ocr
ON public.user_scores(slips_uploaded DESC);

CREATE TABLE IF NOT EXISTS public.user_ranks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  old_rank_code TEXT,
  new_rank_code TEXT NOT NULL,
  old_score NUMERIC(5,2),
  new_score NUMERIC(5,2),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_ranks_farm_created
ON public.user_ranks(farm_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.leaderboards (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  leaderboard_type TEXT NOT NULL CHECK (leaderboard_type IN ('farm', 'milk', 'ai_usage', 'ocr_usage', 'activity', 'district')),
  period_key TEXT NOT NULL DEFAULT 'all_time',
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  farm_name TEXT,
  district_name TEXT,
  score NUMERIC(14,2) DEFAULT 0,
  rank_position INTEGER,
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  calculated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(leaderboard_type, period_key, farm_id)
);

CREATE INDEX IF NOT EXISTS idx_leaderboards_type_rank
ON public.leaderboards(leaderboard_type, period_key, rank_position);

CREATE TABLE IF NOT EXISTS public.achievement_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  achievement_id UUID REFERENCES public.achievements(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_achievement_audit_farm_created
ON public.achievement_audit_logs(farm_id, created_at DESC);

ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ranks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievement_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read active achievements" ON public.achievements;
CREATE POLICY "Users can read active achievements"
  ON public.achievements FOR SELECT
  USING (is_active = true);

DROP POLICY IF EXISTS "Users can access their farm achievements" ON public.user_achievements;
CREATE POLICY "Users can access their farm achievements"
  ON public.user_achievements FOR ALL
  USING (farm_id = public.current_user_farm_id())
  WITH CHECK (farm_id = public.current_user_farm_id());

DROP POLICY IF EXISTS "Users can access achievement progress in their farm" ON public.achievement_progress;
CREATE POLICY "Users can access achievement progress in their farm"
  ON public.achievement_progress FOR ALL
  USING (farm_id = public.current_user_farm_id())
  WITH CHECK (farm_id = public.current_user_farm_id());

DROP POLICY IF EXISTS "Users can access achievement notifications in their farm" ON public.achievement_notifications;
CREATE POLICY "Users can access achievement notifications in their farm"
  ON public.achievement_notifications FOR ALL
  USING (farm_id = public.current_user_farm_id())
  WITH CHECK (farm_id = public.current_user_farm_id());

DROP POLICY IF EXISTS "Users can read leaderboard scores" ON public.user_scores;
CREATE POLICY "Users can read leaderboard scores"
  ON public.user_scores FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can update their farm score" ON public.user_scores;
CREATE POLICY "Users can update their farm score"
  ON public.user_scores FOR ALL
  USING (farm_id = public.current_user_farm_id())
  WITH CHECK (farm_id = public.current_user_farm_id());

DROP POLICY IF EXISTS "Users can access rank history in their farm" ON public.user_ranks;
CREATE POLICY "Users can access rank history in their farm"
  ON public.user_ranks FOR ALL
  USING (farm_id = public.current_user_farm_id())
  WITH CHECK (farm_id = public.current_user_farm_id());

DROP POLICY IF EXISTS "Users can read leaderboards" ON public.leaderboards;
CREATE POLICY "Users can read leaderboards"
  ON public.leaderboards FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can maintain their farm leaderboard rows" ON public.leaderboards;
CREATE POLICY "Users can maintain their farm leaderboard rows"
  ON public.leaderboards FOR ALL
  USING (farm_id = public.current_user_farm_id())
  WITH CHECK (farm_id = public.current_user_farm_id());

DROP POLICY IF EXISTS "Users can access achievement audit in their farm" ON public.achievement_audit_logs;
CREATE POLICY "Users can access achievement audit in their farm"
  ON public.achievement_audit_logs FOR ALL
  USING (farm_id = public.current_user_farm_id())
  WITH CHECK (farm_id = public.current_user_farm_id());

INSERT INTO public.achievements
  (code, category, title, description, icon, metric_key, target_value, points, rarity, reward_type, reward_value, is_secret, sort_order)
VALUES
  ('milk_100', 'milk_production', '100 Liter Club', 'एकूण 100 लिटर दूध नोंद पूर्ण करा.', '🥉', 'total_milk_liters', 100, 10, 'common', 'badge', '100 Liter Club', false, 10),
  ('milk_1000', 'milk_production', '1000 Liter Club', 'एकूण 1000 लिटर दूध नोंद पूर्ण करा.', '🥈', 'total_milk_liters', 1000, 20, 'common', 'badge', '1000 Liter Club', false, 20),
  ('milk_5000', 'milk_production', '5000 Liter Club', 'एकूण 5000 लिटर दूध नोंद पूर्ण करा.', '🥇', 'total_milk_liters', 5000, 35, 'rare', 'title', 'Smart Milk Farmer', false, 30),
  ('milk_10000', 'milk_production', '10000 Liter Club', 'एकूण 10000 लिटर दूध नोंद पूर्ण करा.', '🏆', 'total_milk_liters', 10000, 50, 'rare', 'profile_frame', 'gold_milk_frame', false, 40),
  ('milk_50000', 'milk_production', '50000 Liter Club', 'एकूण 50000 लिटर दूध नोंद पूर्ण करा.', '👑', 'total_milk_liters', 50000, 90, 'epic', 'title', 'Dairy Champion', false, 50),
  ('milk_100000', 'milk_production', '100000 Liter Club', 'एकूण 100000 लिटर दूध नोंद पूर्ण करा.', '💎', 'total_milk_liters', 100000, 150, 'legendary', 'icon', 'diamond_milk_badge', false, 60),
  ('income_10000', 'income', 'First ₹10,000', 'दूध उत्पन्न ₹10,000 पूर्ण करा.', '💰', 'total_income', 10000, 10, 'common', 'badge', 'First Income', false, 70),
  ('income_50000', 'income', '₹50,000 Earner', 'दूध उत्पन्न ₹50,000 पूर्ण करा.', '💰', 'total_income', 50000, 25, 'common', 'badge', '50K Earner', false, 80),
  ('income_100000', 'income', '₹1 Lakh Earner', 'दूध उत्पन्न ₹1 लाख पूर्ण करा.', '💰', 'total_income', 100000, 40, 'rare', 'title', 'Income Builder', false, 90),
  ('income_500000', 'income', '₹5 Lakh Earner', 'दूध उत्पन्न ₹5 लाख पूर्ण करा.', '💰', 'total_income', 500000, 85, 'epic', 'profile_frame', 'income_gold_frame', false, 100),
  ('income_1000000', 'income', '₹10 Lakh Earner', 'दूध उत्पन्न ₹10 लाख पूर्ण करा.', '💰', 'total_income', 1000000, 140, 'legendary', 'title', 'Dairy Wealth Builder', false, 110),
  ('ocr_1', 'ocr_usage', 'First Slip Upload', 'पहिली dairy slip upload करा.', '📸', 'slips_uploaded', 1, 10, 'common', 'badge', 'Slip Starter', false, 120),
  ('ocr_50', 'ocr_usage', '50 Slips Uploaded', '50 slips upload करा.', '📸', 'slips_uploaded', 50, 30, 'rare', 'badge', 'Slip Pro', false, 130),
  ('ocr_100', 'ocr_usage', '100 Slips Uploaded', '100 slips upload करा.', '📸', 'slips_uploaded', 100, 50, 'rare', 'title', 'OCR Expert', false, 140),
  ('ocr_500', 'ocr_usage', 'OCR Master', '500 slips upload करा.', '📸', 'slips_uploaded', 500, 120, 'legendary', 'icon', 'camera_master', false, 150),
  ('ai_1', 'ai_usage', 'First AI Question', 'दुग्धमित्र AI ला पहिला प्रश्न विचारा.', '🤖', 'ai_questions', 1, 10, 'common', 'badge', 'AI Starter', false, 160),
  ('ai_10', 'ai_usage', 'AI Explorer', 'AI ला 10 प्रश्न विचारा.', '🤖', 'ai_questions', 10, 25, 'common', 'badge', 'AI Explorer', false, 170),
  ('ai_50', 'ai_usage', 'AI Enthusiast', 'AI ला 50 प्रश्न विचारा.', '🤖', 'ai_questions', 50, 45, 'rare', 'title', 'AI Enthusiast', false, 180),
  ('ai_100', 'ai_usage', 'AI Expert', 'AI ला 100 प्रश्न विचारा.', '🤖', 'ai_questions', 100, 70, 'epic', 'profile_frame', 'ai_glow_frame', false, 190),
  ('ai_500', 'ai_usage', 'AI Master', 'AI ला 500 प्रश्न विचारा.', '🤖', 'ai_questions', 500, 140, 'legendary', 'icon', 'ai_master', false, 200),
  ('streak_7', 'consistency', '7 Day Streak', 'सलग 7 दिवस दूध नोंद ठेवा.', '📅', 'current_streak_days', 7, 20, 'common', 'badge', '7 Day Streak', false, 210),
  ('streak_30', 'consistency', '30 Day Streak', 'सलग 30 दिवस दूध नोंद ठेवा.', '📅', 'current_streak_days', 30, 50, 'rare', 'title', 'Consistent Farmer', false, 220),
  ('streak_100', 'consistency', '100 Day Streak', 'सलग 100 दिवस दूध नोंद ठेवा.', '📅', 'current_streak_days', 100, 100, 'epic', 'profile_frame', 'streak_gold_frame', false, 230),
  ('streak_365', 'consistency', '365 Day Streak', 'सलग 365 दिवस dairy record discipline ठेवा.', '📅', 'current_streak_days', 365, 200, 'legendary', 'title', 'Year Round Dairy Master', false, 240),
  ('cow_1', 'farm_growth', 'First Cow Added', 'पहिली गाय app मध्ये जोडा.', '🐄', 'active_cows', 1, 10, 'common', 'badge', 'First Cow', false, 250),
  ('cow_10', 'farm_growth', '10 Cows', '10 active गायींची नोंद ठेवा.', '🐄', 'active_cows', 10, 30, 'common', 'badge', 'Growing Farm', false, 260),
  ('cow_25', 'farm_growth', '25 Cows', '25 active गायींची नोंद ठेवा.', '🐄', 'active_cows', 25, 55, 'rare', 'title', 'Large Farm Owner', false, 270),
  ('cow_50', 'farm_growth', '50 Cows', '50 active गायींची नोंद ठेवा.', '🐄', 'active_cows', 50, 90, 'epic', 'profile_frame', 'farm_gold_frame', false, 280),
  ('cow_100', 'farm_growth', '100 Cows', '100 active गायींची नोंद ठेवा.', '🐄', 'active_cows', 100, 160, 'legendary', 'title', 'Mega Dairy Farmer', false, 290),
  ('data_entry_30', 'data_entry', '30 Records Logged', '30 दूध नोंदी पूर्ण करा.', '📝', 'milk_record_count', 30, 20, 'common', 'badge', 'Record Keeper', false, 300),
  ('data_entry_100', 'data_entry', '100 Records Logged', '100 दूध नोंदी पूर्ण करा.', '📝', 'milk_record_count', 100, 45, 'rare', 'title', 'Data Smart Farmer', false, 310),
  ('loyalty_30', 'subscription_loyalty', '30 Days Active', 'App 30 दिवस active वापरा.', '⭐', 'days_active', 30, 25, 'common', 'badge', 'Loyal User', false, 320),
  ('community_1', 'community', 'First Feature Vote', 'पहिला feature vote किंवा support interaction करा.', '🤝', 'community_actions', 1, 15, 'common', 'badge', 'Community Helper', false, 330),
  ('secret_balanced', 'hidden', 'Surprise Badge', 'गुप्त achievement.', '🎁', 'balanced_usage_score', 4, 60, 'secret', 'icon', 'surprise_badge', true, 1000)
ON CONFLICT (code) DO UPDATE
SET
  category = EXCLUDED.category,
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  metric_key = EXCLUDED.metric_key,
  target_value = EXCLUDED.target_value,
  points = EXCLUDED.points,
  rarity = EXCLUDED.rarity,
  reward_type = EXCLUDED.reward_type,
  reward_value = EXCLUDED.reward_value,
  is_secret = EXCLUDED.is_secret,
  sort_order = EXCLUDED.sort_order,
  is_active = true,
  updated_at = NOW();

COMMIT;
