BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS profile_photo_url TEXT,
  ADD COLUMN IF NOT EXISTS profile_photo_storage_path TEXT,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  village_name TEXT,
  taluka_name TEXT,
  district_name TEXT,
  state_name TEXT DEFAULT 'महाराष्ट्र',
  profile_photo_url TEXT,
  profile_photo_storage_path TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_farm ON public.user_profiles(farm_id);

CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  categories JSONB NOT NULL DEFAULT '{}'::jsonb,
  channels JSONB NOT NULL DEFAULT '{}'::jsonb,
  quiet_hours_enabled BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '22:00',
  quiet_hours_end TIME DEFAULT '06:00',
  frequency TEXT DEFAULT 'instant' CHECK (frequency IN ('instant', 'daily', 'weekly')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_preferences_farm ON public.notification_preferences(farm_id);

CREATE TABLE IF NOT EXISTS public.appearance_preferences (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  theme_mode TEXT DEFAULT 'light' CHECK (theme_mode IN ('light', 'dark', 'system')),
  font_size TEXT DEFAULT 'medium' CHECK (font_size IN ('small', 'medium', 'large')),
  language TEXT DEFAULT 'mr' CHECK (language IN ('mr', 'en', 'hi')),
  default_page TEXT DEFAULT 'dashboard' CHECK (default_page IN ('dashboard', 'ai_assistant', 'milk_reports', 'slip_scanner', 'analytics')),
  compact_mode BOOLEAN DEFAULT false,
  high_contrast BOOLEAN DEFAULT false,
  large_touch_targets BOOLEAN DEFAULT true,
  reduce_animations BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_appearance_preferences_farm ON public.appearance_preferences(farm_id);

CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  device_name TEXT,
  browser TEXT,
  os TEXT,
  device_brand TEXT,
  device_model TEXT,
  device_type TEXT DEFAULT 'unknown',
  platform_version TEXT,
  browser_version TEXT,
  client_hints JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  login_at TIMESTAMP DEFAULT NOW(),
  last_active_at TIMESTAMP DEFAULT NOW(),
  logout_at TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user_active ON public.user_sessions(user_id, is_active, last_active_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_sessions_farm ON public.user_sessions(farm_id);

CREATE TABLE IF NOT EXISTS public.user_login_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  farm_id UUID REFERENCES public.farms(id) ON DELETE SET NULL,
  mobile TEXT,
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  failure_reason TEXT,
  device_name TEXT,
  browser TEXT,
  os TEXT,
  device_brand TEXT,
  device_model TEXT,
  device_type TEXT DEFAULT 'unknown',
  platform_version TEXT,
  browser_version TEXT,
  client_hints JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_history_user_created ON public.user_login_history(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_history_farm_created ON public.user_login_history(farm_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.user_settings_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  farm_id UUID REFERENCES public.farms(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_settings_audit_user_created ON public.user_settings_audit_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_settings_audit_farm_created ON public.user_settings_audit_logs(farm_id, created_at DESC);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'profile-photos',
  'profile-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp'];

COMMIT;
