BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'information'
    CHECK (type IN (
      'information',
      'success',
      'warning',
      'critical',
      'promotion',
      'system_update',
      'subscription_reminder',
      'trial_expiry_reminder',
      'maintenance_notice',
      'ai_feature_announcement'
    )),
  priority TEXT NOT NULL DEFAULT 'normal'
    CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  image_url TEXT,
  action_text TEXT,
  action_url TEXT,
  target_audience TEXT NOT NULL DEFAULT 'all_farms',
  target_filter JSONB DEFAULT '{}'::jsonb,
  channels JSONB DEFAULT '["in_app"]'::jsonb,
  created_by UUID REFERENCES public.super_admins(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  scheduled_at TIMESTAMP,
  sent_at TIMESTAMP,
  expires_at TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'scheduled', 'sending', 'sent', 'cancelled', 'failed', 'expired')),
  failure_reason TEXT,
  total_recipients INTEGER DEFAULT 0,
  delivered_count INTEGER DEFAULT 0,
  opened_count INTEGER DEFAULT 0,
  clicked_count INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_notifications_status_created ON public.notifications(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON public.notifications(scheduled_at) WHERE status = 'scheduled';
CREATE INDEX IF NOT EXISTS idx_notifications_expires ON public.notifications(expires_at);
CREATE INDEX IF NOT EXISTS idx_notifications_created_by ON public.notifications(created_by);

CREATE TABLE IF NOT EXISTS public.notification_targets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  district TEXT,
  target_type TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_targets_notification ON public.notification_targets(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_targets_farm ON public.notification_targets(farm_id);
CREATE INDEX IF NOT EXISTS idx_notification_targets_user ON public.notification_targets(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_targets_district ON public.notification_targets(district);
CREATE INDEX IF NOT EXISTS idx_notification_targets_type ON public.notification_targets(target_type);

CREATE TABLE IF NOT EXISTS public.notification_reads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  read_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(notification_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_notification_reads_user ON public.notification_reads(user_id, read_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_reads_notification ON public.notification_reads(notification_id);

CREATE TABLE IF NOT EXISTS public.notification_delivery_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'in_app'
    CHECK (channel IN ('in_app', 'push', 'whatsapp', 'sms', 'email')),
  delivery_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (delivery_status IN ('pending', 'delivered', 'failed', 'opened', 'clicked', 'deleted')),
  delivered_at TIMESTAMP,
  opened_at TIMESTAMP,
  clicked_at TIMESTAMP,
  deleted_at TIMESTAMP,
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(notification_id, user_id, channel)
);

CREATE INDEX IF NOT EXISTS idx_notification_logs_notification ON public.notification_delivery_logs(notification_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_user_channel ON public.notification_delivery_logs(user_id, channel, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_logs_farm ON public.notification_delivery_logs(farm_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON public.notification_delivery_logs(delivery_status);
CREATE INDEX IF NOT EXISTS idx_notification_logs_deleted ON public.notification_delivery_logs(user_id, deleted_at);

CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'information',
  priority TEXT NOT NULL DEFAULT 'normal',
  action_text TEXT,
  action_url TEXT,
  image_url TEXT,
  created_by UUID REFERENCES public.super_admins(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notification_templates_active ON public.notification_templates(is_active, created_at DESC);

CREATE TABLE IF NOT EXISTS public.scheduled_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  notification_id UUID NOT NULL REFERENCES public.notifications(id) ON DELETE CASCADE,
  schedule_type TEXT NOT NULL DEFAULT 'once'
    CHECK (schedule_type IN ('once', 'daily', 'weekly', 'monthly', 'custom_cron')),
  cron_expression TEXT,
  next_run_at TIMESTAMP,
  last_run_at TIMESTAMP,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'paused', 'cancelled', 'completed', 'failed')),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_next_run ON public.scheduled_notifications(status, next_run_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_notification ON public.scheduled_notifications(notification_id);

CREATE TABLE IF NOT EXISTS public.user_push_subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  last_seen_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON public.user_push_subscriptions(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_farm ON public.user_push_subscriptions(farm_id);

CREATE OR REPLACE FUNCTION public.touch_notification_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notifications_touch_updated_at ON public.notifications;
CREATE TRIGGER trg_notifications_touch_updated_at
BEFORE UPDATE ON public.notifications
FOR EACH ROW EXECUTE FUNCTION public.touch_notification_updated_at();

DROP TRIGGER IF EXISTS trg_notification_logs_touch_updated_at ON public.notification_delivery_logs;
CREATE TRIGGER trg_notification_logs_touch_updated_at
BEFORE UPDATE ON public.notification_delivery_logs
FOR EACH ROW EXECUTE FUNCTION public.touch_notification_updated_at();

DROP TRIGGER IF EXISTS trg_notification_templates_touch_updated_at ON public.notification_templates;
CREATE TRIGGER trg_notification_templates_touch_updated_at
BEFORE UPDATE ON public.notification_templates
FOR EACH ROW EXECUTE FUNCTION public.touch_notification_updated_at();

DROP TRIGGER IF EXISTS trg_scheduled_notifications_touch_updated_at ON public.scheduled_notifications;
CREATE TRIGGER trg_scheduled_notifications_touch_updated_at
BEFORE UPDATE ON public.scheduled_notifications
FOR EACH ROW EXECUTE FUNCTION public.touch_notification_updated_at();

DROP TRIGGER IF EXISTS trg_push_subscriptions_touch_updated_at ON public.user_push_subscriptions;
CREATE TRIGGER trg_push_subscriptions_touch_updated_at
BEFORE UPDATE ON public.user_push_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.touch_notification_updated_at();

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_reads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_delivery_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_push_subscriptions ENABLE ROW LEVEL SECURITY;

INSERT INTO public.notification_templates (name, title, message, type, priority, action_text, action_url)
VALUES
  ('Trial Ending', 'ट्रायल लवकर संपणार आहे', 'तुमचा ट्रायल कालावधी लवकर संपणार आहे. सेवा सुरू ठेवण्यासाठी subscription सक्रिय करा.', 'trial_expiry_reminder', 'high', 'तपशील बघा', '/profile'),
  ('Subscription Renewal', 'Subscription Renewal', 'तुमचे subscription renew करण्याची वेळ आली आहे.', 'subscription_reminder', 'high', 'Renew करा', '/profile'),
  ('System Maintenance', 'सिस्टम देखभाल सूचना', 'निर्धारित वेळेत app मध्ये थोडा व्यत्यय येऊ शकतो.', 'maintenance_notice', 'normal', 'माहिती बघा', '/'),
  ('New Feature Launch', 'नवीन सुविधा उपलब्ध', 'माझी डेअरीमध्ये नवीन सुविधा उपलब्ध झाली आहे. आजच वापरून बघा.', 'system_update', 'normal', 'उघडा', '/'),
  ('AI Announcement', 'नवीन AI सहाय्यक उपलब्ध', 'आता AI सहाय्यक वापरून तुमच्या डेअरीची माहिती सहज मिळवा.', 'ai_feature_announcement', 'normal', 'आता वापरा', '/'),
  ('Payment Reminder', 'पेमेंट आठवण', 'तुमचे डेअरी app subscription payment बाकी आहे.', 'subscription_reminder', 'urgent', 'पेमेंट करा', '/profile')
ON CONFLICT DO NOTHING;

COMMIT;
