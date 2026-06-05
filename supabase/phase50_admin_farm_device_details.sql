BEGIN;

-- Store richer device identity for farm sessions so super-admins can see
-- exactly which phones/devices a farm is logged in from.

ALTER TABLE public.user_sessions
  ADD COLUMN IF NOT EXISTS device_brand TEXT,
  ADD COLUMN IF NOT EXISTS device_model TEXT,
  ADD COLUMN IF NOT EXISTS device_type TEXT DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS platform_version TEXT,
  ADD COLUMN IF NOT EXISTS browser_version TEXT,
  ADD COLUMN IF NOT EXISTS client_hints JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.user_login_history
  ADD COLUMN IF NOT EXISTS device_brand TEXT,
  ADD COLUMN IF NOT EXISTS device_model TEXT,
  ADD COLUMN IF NOT EXISTS device_type TEXT DEFAULT 'unknown',
  ADD COLUMN IF NOT EXISTS platform_version TEXT,
  ADD COLUMN IF NOT EXISTS browser_version TEXT,
  ADD COLUMN IF NOT EXISTS client_hints JSONB DEFAULT '{}'::jsonb;

UPDATE public.user_sessions
SET
  device_type = COALESCE(NULLIF(device_type, ''), CASE
    WHEN os = 'Android' OR COALESCE(user_agent, '') ILIKE '%Android%' THEN 'mobile'
    WHEN os = 'iOS' OR COALESCE(user_agent, '') ILIKE '%iPhone%' OR COALESCE(user_agent, '') ILIKE '%iPad%' THEN 'mobile'
    ELSE 'desktop'
  END),
  device_model = regexp_replace(COALESCE(NULLIF(device_model, ''), NULLIF(device_name, ''), ''), '\s+Build/.*$', '', 'i'),
  client_hints = COALESCE(client_hints, '{}'::jsonb);

UPDATE public.user_login_history
SET
  device_type = COALESCE(NULLIF(device_type, ''), CASE
    WHEN os = 'Android' OR COALESCE(user_agent, '') ILIKE '%Android%' THEN 'mobile'
    WHEN os = 'iOS' OR COALESCE(user_agent, '') ILIKE '%iPhone%' OR COALESCE(user_agent, '') ILIKE '%iPad%' THEN 'mobile'
    ELSE 'desktop'
  END),
  device_model = regexp_replace(COALESCE(NULLIF(device_model, ''), NULLIF(device_name, ''), ''), '\s+Build/.*$', '', 'i'),
  client_hints = COALESCE(client_hints, '{}'::jsonb);

CREATE INDEX IF NOT EXISTS idx_user_sessions_farm_active_device
ON public.user_sessions(farm_id, is_active, last_active_at DESC);

CREATE INDEX IF NOT EXISTS idx_login_history_farm_device_created
ON public.user_login_history(farm_id, created_at DESC);

COMMIT;
