UPDATE public.user_scores
SET rank_label = CASE rank_code
  WHEN 'beginner_farmer' THEN 'नवीन दूध उत्पादक शेतकरी'
  WHEN 'active_farmer' THEN 'सक्रिय दूध उत्पादक शेतकरी'
  WHEN 'smart_farmer' THEN 'स्मार्ट दूध उत्पादक शेतकरी'
  WHEN 'advanced_farmer' THEN 'प्रगत दूध उत्पादक शेतकरी'
  WHEN 'expert_farmer' THEN 'तज्ञ दूध उत्पादक शेतकरी'
  WHEN 'dairy_champion' THEN 'दूध उत्पादक चॅम्पियन'
  WHEN 'dairy_master' THEN 'दूध उत्पादक मास्टर'
  ELSE rank_label
END
WHERE rank_code IN (
  'beginner_farmer',
  'active_farmer',
  'smart_farmer',
  'advanced_farmer',
  'expert_farmer',
  'dairy_champion',
  'dairy_master'
);
