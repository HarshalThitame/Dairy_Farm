BEGIN;

-- Remove older support seed rows that were inserted with broken Marathi encoding.
-- User-created tickets, ticket messages, attachments, ratings and feature requests are intentionally untouched.
DELETE FROM public.faq_articles
WHERE title ~ '\?{2,}' OR body ~ '\?{2,}';

DELETE FROM public.tutorials
WHERE title ~ '\?{2,}'
   OR description ~ '\?{2,}'
   OR content ~ '\?{2,}'
   OR steps::text ~ '\?{2,}';

DELETE FROM public.system_status_logs
WHERE message ~ '\?{2,}';

INSERT INTO public.faq_articles (category, title, body, keywords, is_published)
VALUES
('getting_started', 'App सुरू कसे करायचे?', 'मुख्यपृष्ठावरून गायी, नोंदी, आठवणी, अहवाल आणि हिशोब वापरता येतात. रोज दूध नोंद किंवा स्लिप स्कॅन केल्यास अहवाल आपोआप तयार होतात.', ARRAY['start','dashboard','home'], true),
('milk_records', 'दूध नोंद कुठे करायची?', 'नोंदी > दूध नोंद किंवा हिशोबातील manually दूध नोंद वापरा. जर डेअरी slip असेल तर स्लिप स्कॅन वापरणे अधिक अचूक आहे.', ARRAY['milk','dudh','entry'], true),
('slip_upload', '15 दिवसांची slip कशी upload करायची?', 'हिशोब > स्लिप स्कॅन मध्ये gallery किंवा camera मधून slip निवडा. AI ने वाचलेली माहिती तपासा आणि नंतरच जतन करा.', ARRAY['slip','ocr','settlement'], true),
('ai_assistant', 'दुग्धमित्र AI काय करतो?', 'दुग्धमित्र AI तुमच्या database मधील दूध, उत्पन्न, खर्च आणि अहवालांची माहिती मराठीत समजावतो.', ARRAY['ai','assistant'], true),
('reports', 'अहवालात आकडे कुठून येतात?', 'अहवाल दूध नोंदी, settlement slip, खर्च आणि उत्पन्न database मधून तयार होतात. 15 दिवसांच्या slip मधील final total ला priority दिली जाते.', ARRAY['reports','ahval'], true),
('notifications', 'Mobile notification येत नसेल तर?', 'Settings > सूचना सेटिंग्ज मध्ये mobile notification चालू करा. HTTPS production app आणि browser permission दोन्ही आवश्यक आहेत.', ARRAY['notification','push'], true),
('security', 'PIN बदलायचा असेल तर?', 'Settings > सुरक्षा केंद्र मध्ये PIN किंवा password बदलता येतो. मजबूत password वापरा.', ARRAY['pin','password'], true)
ON CONFLICT (title) DO UPDATE
SET category = EXCLUDED.category,
    body = EXCLUDED.body,
    keywords = EXCLUDED.keywords,
    is_published = true,
    updated_at = NOW();

INSERT INTO public.tutorials (category, title, description, type, content, steps, is_published)
VALUES
('getting_started', 'माझी डेअरी पहिल्यांदा वापरणे', 'Dashboard, गायी आणि नोंदी समजून घ्या.', 'step_by_step', 'नवीन user साठी मूलभूत मार्गदर्शक.', '[{"title":"मुख्यपृष्ठ उघडा","text":"आजचे दूध, आठवणी आणि सारांश बघा."},{"title":"गायी जोडा","text":"गायी विभागातून जनावरांची माहिती भरा."},{"title":"दूध नोंदवा","text":"दूध नोंद किंवा स्लिप स्कॅन वापरा."}]'::jsonb, true),
('milk_entry', 'दूध नोंद योग्य पद्धत', 'सकाळ/संध्याकाळ दूध आणि दर भरा.', 'article', 'दूध नोंद overall farm level वर करा. 100 गायी असतील तरी प्रत्येक गायीनुसार दूध नोंद करण्याची गरज नाही.', '[]'::jsonb, true),
('ocr_slip_upload', 'स्लिप स्कॅन टिप्स', 'स्पष्ट फोटो घेण्यासाठी सूचना.', 'step_by_step', 'Slip पूर्ण frame मध्ये, प्रकाशात आणि सरळ ठेवा.', '[{"title":"फोटो स्पष्ट घ्या","text":"Slip जवळून पण पूर्ण दिसेल अशी घ्या."},{"title":"AI माहिती तपासा","text":"AI ने वाचलेले आकडे slip सोबत जुळतात का ते तपासा."},{"title":"जतन करा","text":"सर्व ठीक असल्यावरच जतन करा."}]'::jsonb, true),
('reports', 'मासिक अहवाल समजून घेणे', 'दूध, खर्च आणि नफा reports वाचा.', 'article', 'मासिक अहवालात दूध उत्पन्न, खाद्य कपात, खर्च आणि नफा एकत्र दिसतो.', '[]'::jsonb, true),
('ai_assistant', 'दुग्धमित्र AI प्रश्न', 'AI ला सोपे प्रश्न विचारा.', 'article', 'उदा. आजचे दूध? या महिन्याचे उत्पन्न? सरासरी फॅट?', '[]'::jsonb, true)
ON CONFLICT (title) DO UPDATE
SET category = EXCLUDED.category,
    description = EXCLUDED.description,
    type = EXCLUDED.type,
    content = EXCLUDED.content,
    steps = EXCLUDED.steps,
    is_published = true,
    updated_at = NOW();

INSERT INTO public.system_status_logs (service_name, status, message)
VALUES
('API', 'operational', 'API सेवा सुरळीत आहे.'),
('Database', 'operational', 'Database सेवा सुरळीत आहे.'),
('OCR', 'operational', 'OCR सेवा उपलब्ध आहे.'),
('AI', 'operational', 'AI सहाय्यक उपलब्ध आहे.'),
('Notifications', 'operational', 'Notification सेवा सुरळीत आहे.')
ON CONFLICT DO NOTHING;

COMMIT;
