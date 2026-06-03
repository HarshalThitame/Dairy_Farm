BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'support-attachments',
  'support-attachments',
  false,
  10485760,
  ARRAY[
    'image/jpeg',
    'image/png',
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]::text[]
)
ON CONFLICT (id) DO UPDATE
SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ticket_number TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN (
    'bug_report',
    'feature_request',
    'account_issue',
    'payment_issue',
    'subscription_issue',
    'data_issue',
    'ai_assistant_issue',
    'ocr_issue',
    'technical_support',
    'other'
  )),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  description TEXT NOT NULL,
  preferred_contact_method TEXT DEFAULT 'app' CHECK (preferred_contact_method IN ('app', 'whatsapp', 'phone', 'email')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting_for_user', 'resolved', 'closed', 'rejected')),
  assigned_admin_id UUID REFERENCES public.super_admins(id) ON DELETE SET NULL,
  device_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  closed_at TIMESTAMP,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_farm_status
ON public.support_tickets(farm_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_support_tickets_user_created
ON public.support_tickets(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  admin_id UUID REFERENCES public.super_admins(id) ON DELETE SET NULL,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('user', 'admin', 'system')),
  message TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_created
ON public.ticket_messages(ticket_id, created_at ASC);

CREATE TABLE IF NOT EXISTS public.ticket_attachments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.ticket_messages(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size BIGINT NOT NULL DEFAULT 0,
  storage_bucket TEXT NOT NULL DEFAULT 'support-attachments',
  storage_path TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ticket_attachments_ticket
ON public.ticket_attachments(ticket_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.faq_articles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  keywords TEXT[] DEFAULT ARRAY[]::text[],
  views_count INTEGER DEFAULT 0,
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_faq_articles_category
ON public.faq_articles(category, is_published);

CREATE INDEX IF NOT EXISTS idx_faq_articles_search
ON public.faq_articles USING gin(to_tsvector('simple', title || ' ' || body));

CREATE UNIQUE INDEX IF NOT EXISTS idx_faq_articles_title_unique
ON public.faq_articles(title);

CREATE TABLE IF NOT EXISTS public.feature_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  expected_benefit TEXT,
  status TEXT NOT NULL DEFAULT 'requested' CHECK (status IN ('requested', 'planned', 'under_development', 'released', 'rejected')),
  votes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feature_requests_status_votes
ON public.feature_requests(status, votes_count DESC, created_at DESC);

CREATE TABLE IF NOT EXISTS public.feature_votes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_request_id UUID NOT NULL REFERENCES public.feature_requests(id) ON DELETE CASCADE,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(feature_request_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_feature_votes_user
ON public.feature_votes(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.tutorials (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'article' CHECK (type IN ('article', 'video', 'image', 'step_by_step')),
  content TEXT,
  media_url TEXT,
  steps JSONB NOT NULL DEFAULT '[]'::jsonb,
  views_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  updated_at TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tutorials_category
ON public.tutorials(category, is_published);

CREATE UNIQUE INDEX IF NOT EXISTS idx_tutorials_title_unique
ON public.tutorials(title);

CREATE TABLE IF NOT EXISTS public.support_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE UNIQUE,
  farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_ratings_farm
ON public.support_ratings(farm_id, created_at DESC);

CREATE TABLE IF NOT EXISTS public.system_status_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  service_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'operational' CHECK (status IN ('operational', 'degraded', 'down', 'maintenance')),
  message TEXT,
  checked_at TIMESTAMP DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_system_status_logs_service
ON public.system_status_logs(service_name, checked_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_system_status_logs_service_message_unique
ON public.system_status_logs(service_name, message);

CREATE TABLE IF NOT EXISTS public.support_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ticket_id UUID REFERENCES public.support_tickets(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_support_audit_logs_farm_created
ON public.support_audit_logs(farm_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.generate_support_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.ticket_number IS NULL OR NEW.ticket_number = '' THEN
    NEW.ticket_number := 'MD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(REPLACE(NEW.id::text, '-', ''), 1, 6));
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_support_ticket_number ON public.support_tickets;
CREATE TRIGGER trg_support_ticket_number
BEFORE INSERT ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.generate_support_ticket_number();

CREATE OR REPLACE FUNCTION public.touch_support_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_support_tickets_touch ON public.support_tickets;
CREATE TRIGGER trg_support_tickets_touch
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW EXECUTE FUNCTION public.touch_support_updated_at();

DROP TRIGGER IF EXISTS trg_feature_requests_touch ON public.feature_requests;
CREATE TRIGGER trg_feature_requests_touch
BEFORE UPDATE ON public.feature_requests
FOR EACH ROW EXECUTE FUNCTION public.touch_support_updated_at();

CREATE OR REPLACE FUNCTION public.refresh_feature_vote_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  feature_id UUID;
BEGIN
  feature_id := COALESCE(NEW.feature_request_id, OLD.feature_request_id);
  UPDATE public.feature_requests
  SET votes_count = (
    SELECT COUNT(*) FROM public.feature_votes WHERE feature_request_id = feature_id
  )
  WHERE id = feature_id;
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_feature_votes_refresh_count_insert ON public.feature_votes;
CREATE TRIGGER trg_feature_votes_refresh_count_insert
AFTER INSERT ON public.feature_votes
FOR EACH ROW EXECUTE FUNCTION public.refresh_feature_vote_count();

DROP TRIGGER IF EXISTS trg_feature_votes_refresh_count_delete ON public.feature_votes;
CREATE TRIGGER trg_feature_votes_refresh_count_delete
AFTER DELETE ON public.feature_votes
FOR EACH ROW EXECUTE FUNCTION public.refresh_feature_vote_count();

ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faq_articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feature_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can access tickets in their farm" ON public.support_tickets;
CREATE POLICY "Users can access tickets in their farm"
  ON public.support_tickets FOR ALL
  USING (farm_id = public.current_user_farm_id())
  WITH CHECK (farm_id = public.current_user_farm_id());

DROP POLICY IF EXISTS "Users can access ticket messages in their farm" ON public.ticket_messages;
CREATE POLICY "Users can access ticket messages in their farm"
  ON public.ticket_messages FOR ALL
  USING (farm_id = public.current_user_farm_id())
  WITH CHECK (farm_id = public.current_user_farm_id());

DROP POLICY IF EXISTS "Users can access ticket attachments in their farm" ON public.ticket_attachments;
CREATE POLICY "Users can access ticket attachments in their farm"
  ON public.ticket_attachments FOR ALL
  USING (farm_id = public.current_user_farm_id())
  WITH CHECK (farm_id = public.current_user_farm_id());

DROP POLICY IF EXISTS "Users can read published FAQ articles" ON public.faq_articles;
CREATE POLICY "Users can read published FAQ articles"
  ON public.faq_articles FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Users can access feature requests in their farm" ON public.feature_requests;
CREATE POLICY "Users can access feature requests in their farm"
  ON public.feature_requests FOR ALL
  USING (farm_id = public.current_user_farm_id())
  WITH CHECK (farm_id = public.current_user_farm_id());

DROP POLICY IF EXISTS "Users can vote from their farm" ON public.feature_votes;
CREATE POLICY "Users can vote from their farm"
  ON public.feature_votes FOR ALL
  USING (farm_id = public.current_user_farm_id())
  WITH CHECK (farm_id = public.current_user_farm_id());

DROP POLICY IF EXISTS "Users can read published tutorials" ON public.tutorials;
CREATE POLICY "Users can read published tutorials"
  ON public.tutorials FOR SELECT
  USING (is_published = true);

DROP POLICY IF EXISTS "Users can access support ratings in their farm" ON public.support_ratings;
CREATE POLICY "Users can access support ratings in their farm"
  ON public.support_ratings FOR ALL
  USING (farm_id = public.current_user_farm_id())
  WITH CHECK (farm_id = public.current_user_farm_id());

DROP POLICY IF EXISTS "Users can read system status" ON public.system_status_logs;
CREATE POLICY "Users can read system status"
  ON public.system_status_logs FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can access support audit logs in their farm" ON public.support_audit_logs;
CREATE POLICY "Users can access support audit logs in their farm"
  ON public.support_audit_logs FOR ALL
  USING (farm_id = public.current_user_farm_id())
  WITH CHECK (farm_id = public.current_user_farm_id());

INSERT INTO public.faq_articles (category, title, body, keywords)
VALUES
('getting_started', 'App सुरू कसे करायचे?', 'मुख्यपृष्ठावरून गायी, नोंदी, आठवणी, अहवाल आणि हिशोब वापरता येतात. रोज दूध नोंद किंवा स्लिप स्कॅन केल्यास अहवाल आपोआप तयार होतात.', ARRAY['start','dashboard','home']),
('milk_records', 'दूध नोंद कुठे करायची?', 'नोंदी > दूध नोंद किंवा हिशोबातील manually दूध नोंद वापरा. जर डेअरी slip असेल तर स्लिप स्कॅन वापरणे अधिक अचूक आहे.', ARRAY['milk','dudh','entry']),
('slip_upload', '15 दिवसांची slip कशी upload करायची?', 'हिशोब > स्लिप स्कॅन मध्ये gallery किंवा camera मधून slip निवडा. AI ने वाचलेली माहिती तपासा आणि नंतरच जतन करा.', ARRAY['slip','ocr','settlement']),
('ai_assistant', 'दुग्धमित्र AI काय करतो?', 'दुग्धमित्र AI तुमच्या database मधील दूध, उत्पन्न, खर्च आणि अहवालांची माहिती मराठीत समजावतो.', ARRAY['ai','assistant']),
('reports', 'अहवालात आकडे कुठून येतात?', 'अहवाल दूध नोंदी, settlement slip, खर्च आणि उत्पन्न database मधून तयार होतात. 15 दिवसांच्या slip मधील final total ला priority दिली जाते.', ARRAY['reports','ahval']),
('notifications', 'Mobile notification येत नसेल तर?', 'Settings > सूचना सेटिंग्ज मध्ये mobile notification चालू करा. HTTPS production app आणि browser permission दोन्ही आवश्यक आहेत.', ARRAY['notification','push']),
('security', 'PIN बदलायचा असेल तर?', 'Settings > सुरक्षा केंद्र मध्ये PIN किंवा password बदलता येतो. मजबूत password वापरा.', ARRAY['pin','password'])
ON CONFLICT DO NOTHING;

INSERT INTO public.tutorials (category, title, description, type, content, steps)
VALUES
('getting_started', 'माझी डेअरी पहिल्यांदा वापरणे', 'Dashboard, गायी आणि नोंदी समजून घ्या.', 'step_by_step', 'नवीन user साठी मूलभूत मार्गदर्शक.', '[{"title":"मुख्यपृष्ठ उघडा","text":"आजचे दूध, आठवणी आणि सारांश बघा."},{"title":"गायी जोडा","text":"गायी विभागातून जनावरांची माहिती भरा."},{"title":"दूध नोंदवा","text":"दूध नोंद किंवा स्लिप स्कॅन वापरा."}]'::jsonb),
('milk_entry', 'दूध नोंद योग्य पद्धत', 'सकाळ/संध्याकाळ दूध आणि दर भरा.', 'article', 'दूध नोंद overall farm level वर करा. 100 गायी असतील तरी प्रत्येक गायीनुसार दूध नोंद करण्याची गरज नाही.', '[]'::jsonb),
('ocr_slip_upload', 'स्लिप स्कॅन टिप्स', 'स्पष्ट फोटो घेण्यासाठी सूचना.', 'step_by_step', 'Slip पूर्ण frame मध्ये, प्रकाशात आणि सरळ ठेवा.', '[{"title":"फोटो स्पष्ट घ्या","text":"Slip जवळून पण पूर्ण दिसेल अशी घ्या."},{"title":"AI माहिती तपासा","text":"AI ने वाचलेले आकडे slip सोबत जुळतात का ते तपासा."},{"title":"जतन करा","text":"सर्व ठीक असल्यावरच जतन करा."}]'::jsonb),
('reports', 'मासिक अहवाल समजून घेणे', 'दूध, खर्च आणि नफा reports वाचा.', 'article', 'मासिक अहवालात दूध उत्पन्न, खाद्य कपात, खर्च आणि नफा एकत्र दिसतो.', '[]'::jsonb),
('ai_assistant', 'दुग्धमित्र AI प्रश्न', 'AI ला सोपे प्रश्न विचारा.', 'article', 'उदा. आजचे दूध? या महिन्याचे उत्पन्न? सरासरी फॅट?', '[]'::jsonb)
ON CONFLICT DO NOTHING;

INSERT INTO public.system_status_logs (service_name, status, message)
VALUES
('API', 'operational', 'API सेवा सुरळीत आहे.'),
('Database', 'operational', 'Database सेवा सुरळीत आहे.'),
('OCR', 'operational', 'OCR सेवा उपलब्ध आहे.'),
('AI', 'operational', 'AI सहाय्यक उपलब्ध आहे.'),
('Notifications', 'operational', 'Notification सेवा सुरळीत आहे.')
ON CONFLICT DO NOTHING;

COMMIT;
