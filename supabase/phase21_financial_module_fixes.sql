-- Phase 21: Financial module data alignment
-- Keeps old feed expense finance rows consistent with the Marathi UI.

UPDATE public.finance_records AS fr
SET
  category = 'खाद्य',
  accounting_period = 'monthly'
FROM public.feed_expenses AS fe
WHERE fe.finance_record_id = fr.id
  AND fe.section = 'कॅटल फीड';

UPDATE public.finance_records AS fr
SET accounting_period = 'annual'
FROM public.feed_expenses AS fe
WHERE fe.finance_record_id = fr.id
  AND fe.section IN ('मुरघास', 'भुसा');

UPDATE public.finance_records AS fr
SET accounting_period = 'monthly'
FROM public.feed_expenses AS fe
WHERE fe.finance_record_id = fr.id
  AND fe.section = 'इतर';
