BEGIN;

UPDATE public.notification_templates
SET
  name = 'ट्रायल संपत आहे',
  title = 'ट्रायल लवकर संपणार आहे',
  message = 'तुमचा ट्रायल कालावधी लवकर संपणार आहे. सेवा सुरू ठेवण्यासाठी subscription सक्रिय करा.',
  type = 'trial_expiry_reminder',
  priority = 'high',
  action_text = 'तपशील बघा',
  action_url = '/profile',
  is_active = true,
  updated_at = NOW()
WHERE name = 'Trial Ending' OR type = 'trial_expiry_reminder';

UPDATE public.notification_templates
SET
  name = 'Subscription नूतनीकरण',
  title = 'Subscription नूतनीकरण',
  message = 'तुमचे subscription renew करण्याची वेळ आली आहे.',
  type = 'subscription_reminder',
  priority = 'high',
  action_text = 'Renew करा',
  action_url = '/profile',
  is_active = true,
  updated_at = NOW()
WHERE name = 'Subscription Renewal';

UPDATE public.notification_templates
SET
  name = 'सिस्टम देखभाल',
  title = 'सिस्टम देखभाल सूचना',
  message = 'निर्धारित वेळेत app मध्ये थोडा व्यत्यय येऊ शकतो.',
  type = 'maintenance_notice',
  priority = 'normal',
  action_text = 'माहिती बघा',
  action_url = '/',
  is_active = true,
  updated_at = NOW()
WHERE name = 'System Maintenance' OR type = 'maintenance_notice';

UPDATE public.notification_templates
SET
  name = 'नवीन सुविधा',
  title = 'नवीन सुविधा उपलब्ध',
  message = 'माझी डेअरीमध्ये नवीन सुविधा उपलब्ध झाली आहे. आजच वापरून बघा.',
  type = 'system_update',
  priority = 'normal',
  action_text = 'उघडा',
  action_url = '/',
  is_active = true,
  updated_at = NOW()
WHERE name = 'New Feature Launch' OR type = 'system_update';

UPDATE public.notification_templates
SET
  name = 'AI सहाय्यक',
  title = 'नवीन AI सहाय्यक उपलब्ध',
  message = 'आता AI सहाय्यक वापरून तुमच्या डेअरीची माहिती सहज मिळवा.',
  type = 'ai_feature_announcement',
  priority = 'normal',
  action_text = 'आता वापरा',
  action_url = '/',
  is_active = true,
  updated_at = NOW()
WHERE name = 'AI Announcement' OR type = 'ai_feature_announcement';

UPDATE public.notification_templates
SET
  name = 'पेमेंट आठवण',
  title = 'पेमेंट आठवण',
  message = 'तुमचे डेअरी app subscription payment बाकी आहे.',
  type = 'subscription_reminder',
  priority = 'urgent',
  action_text = 'पेमेंट करा',
  action_url = '/profile',
  is_active = true,
  updated_at = NOW()
WHERE name = 'Payment Reminder';

COMMIT;
