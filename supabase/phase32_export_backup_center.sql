BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'farm-backups',
  'farm-backups',
  false,
  52428800,
  ARRAY[
    'application/json',
    'text/csv',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE TABLE IF NOT EXISTS public.farm_export_backups (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  type TEXT NOT NULL DEFAULT 'backup' CHECK (type IN ('backup', 'export')),
  format TEXT NOT NULL DEFAULT 'json' CHECK (format IN ('json', 'csv', 'xlsx', 'pdf')),
  file_name TEXT NOT NULL,
  storage_bucket TEXT NOT NULL DEFAULT 'farm-backups',
  storage_path TEXT NOT NULL,
  size_bytes BIGINT NOT NULL DEFAULT 0,
  records_count INTEGER NOT NULL DEFAULT 0,
  sections JSONB NOT NULL DEFAULT '[]'::jsonb,
  date_range JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('creating', 'ready', 'failed', 'restored', 'deleted')),
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  restored_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_farm_export_backups_farm_created
ON public.farm_export_backups(farm_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_farm_export_backups_type
ON public.farm_export_backups(farm_id, type, created_at DESC);

CREATE TABLE IF NOT EXISTS public.farm_auto_backup_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE UNIQUE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  frequency TEXT NOT NULL DEFAULT 'off' CHECK (frequency IN ('off', 'daily', 'weekly', 'monthly')),
  enabled BOOLEAN NOT NULL DEFAULT false,
  cloud_backup_enabled BOOLEAN NOT NULL DEFAULT false,
  cloud_provider TEXT,
  last_backup_at TIMESTAMP,
  next_backup_at TIMESTAMP,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_farm_auto_backup_settings_next
ON public.farm_auto_backup_settings(enabled, next_backup_at)
WHERE enabled = true;

ALTER TABLE public.farm_export_backups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_auto_backup_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access export backups in their farm" ON public.farm_export_backups;
CREATE POLICY "Users can access export backups in their farm"
  ON public.farm_export_backups FOR ALL
  USING (farm_id = public.current_user_farm_id())
  WITH CHECK (farm_id = public.current_user_farm_id());

DROP POLICY IF EXISTS "Users can access auto backup settings in their farm" ON public.farm_auto_backup_settings;
CREATE POLICY "Users can access auto backup settings in their farm"
  ON public.farm_auto_backup_settings FOR ALL
  USING (farm_id = public.current_user_farm_id())
  WITH CHECK (farm_id = public.current_user_farm_id());

COMMIT;
