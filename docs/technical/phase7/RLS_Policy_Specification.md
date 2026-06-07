# RLS Policy Specification

**Document Version:** 1.0  
**Date:** 2026-06-07  
**Application:** Majhi Dairy

## 1. Principles

- RLS must be enabled on every public table.
- Service role is used only in trusted server APIs/jobs.
- Every farm-owned table uses `farm_id` with helper functions.
- Admin and support access must be explicit and auditable.

## 2. Helper Functions

```sql
CREATE OR REPLACE FUNCTION public.is_platform_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND role IN ('admin','super_admin')
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
      AND role = 'super_admin'
      AND status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_farm(target_farm_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_platform_admin()
  OR EXISTS (
    SELECT 1 FROM public.farm_members fm
    JOIN public.users u ON u.id = fm.user_id
    WHERE fm.farm_id = target_farm_id
      AND fm.user_id = auth.uid()
      AND fm.status = 'active'
      AND u.status = 'active'
  );
$$;

CREATE OR REPLACE FUNCTION public.can_manage_farm(target_farm_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_platform_admin()
  OR EXISTS (
    SELECT 1 FROM public.farm_members
    WHERE farm_id = target_farm_id
      AND user_id = auth.uid()
      AND status = 'active'
      AND role IN ('owner','farmer','accountant')
  );
$$;
```

## 3. Policy Pattern

### users

```sql
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_select_own_or_admin ON public.users FOR SELECT USING (id = auth.uid() OR public.is_platform_admin());
CREATE POLICY users_insert_own ON public.users FOR INSERT WITH CHECK (id = auth.uid() OR public.is_platform_admin());
CREATE POLICY users_update_own_or_admin ON public.users FOR UPDATE USING (id = auth.uid() OR public.is_platform_admin()) WITH CHECK (id = auth.uid() OR public.is_platform_admin());
CREATE POLICY users_delete_super_admin ON public.users FOR DELETE USING (public.is_super_admin());
```

### farms

```sql
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
CREATE POLICY farms_select_member ON public.farms FOR SELECT USING (public.can_access_farm(id));
CREATE POLICY farms_insert_owner ON public.farms FOR INSERT WITH CHECK (owner_user_id = auth.uid() OR public.is_platform_admin());
CREATE POLICY farms_update_owner ON public.farms FOR UPDATE USING (public.can_manage_farm(id)) WITH CHECK (public.can_manage_farm(id));
CREATE POLICY farms_delete_super_admin ON public.farms FOR DELETE USING (public.is_super_admin());
```

### farm_members

```sql
ALTER TABLE public.farm_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY farm_members_select_farm_member ON public.farm_members FOR SELECT USING (public.can_access_farm(farm_id));
CREATE POLICY farm_members_insert_farm_manager ON public.farm_members FOR INSERT WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY farm_members_update_farm_manager ON public.farm_members FOR UPDATE USING (public.can_manage_farm(farm_id)) WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY farm_members_delete_owner_or_admin ON public.farm_members FOR DELETE USING (public.can_manage_farm(farm_id) OR public.is_super_admin());
```

### cows

```sql
ALTER TABLE public.cows ENABLE ROW LEVEL SECURITY;
CREATE POLICY cows_select_farm_member ON public.cows FOR SELECT USING (public.can_access_farm(farm_id));
CREATE POLICY cows_insert_farm_manager ON public.cows FOR INSERT WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY cows_update_farm_manager ON public.cows FOR UPDATE USING (public.can_manage_farm(farm_id)) WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY cows_delete_owner_or_admin ON public.cows FOR DELETE USING (public.can_manage_farm(farm_id) OR public.is_super_admin());
```

### calves

```sql
ALTER TABLE public.calves ENABLE ROW LEVEL SECURITY;
CREATE POLICY calves_select_farm_member ON public.calves FOR SELECT USING (public.can_access_farm(farm_id));
CREATE POLICY calves_insert_farm_manager ON public.calves FOR INSERT WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY calves_update_farm_manager ON public.calves FOR UPDATE USING (public.can_manage_farm(farm_id)) WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY calves_delete_owner_or_admin ON public.calves FOR DELETE USING (public.can_manage_farm(farm_id) OR public.is_super_admin());
```

### milk_records

```sql
ALTER TABLE public.milk_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY milk_records_select_farm_member ON public.milk_records FOR SELECT USING (public.can_access_farm(farm_id));
CREATE POLICY milk_records_insert_farm_manager ON public.milk_records FOR INSERT WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY milk_records_update_farm_manager ON public.milk_records FOR UPDATE USING (public.can_manage_farm(farm_id)) WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY milk_records_delete_owner_or_admin ON public.milk_records FOR DELETE USING (public.can_manage_farm(farm_id) OR public.is_super_admin());
```

### feed_records

```sql
ALTER TABLE public.feed_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY feed_records_select_farm_member ON public.feed_records FOR SELECT USING (public.can_access_farm(farm_id));
CREATE POLICY feed_records_insert_farm_manager ON public.feed_records FOR INSERT WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY feed_records_update_farm_manager ON public.feed_records FOR UPDATE USING (public.can_manage_farm(farm_id)) WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY feed_records_delete_owner_or_admin ON public.feed_records FOR DELETE USING (public.can_manage_farm(farm_id) OR public.is_super_admin());
```

### health_records

```sql
ALTER TABLE public.health_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY health_records_select_farm_member ON public.health_records FOR SELECT USING (public.can_access_farm(farm_id));
CREATE POLICY health_records_insert_farm_manager ON public.health_records FOR INSERT WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY health_records_update_farm_manager ON public.health_records FOR UPDATE USING (public.can_manage_farm(farm_id)) WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY health_records_delete_owner_or_admin ON public.health_records FOR DELETE USING (public.can_manage_farm(farm_id) OR public.is_super_admin());
```

### vaccinations

```sql
ALTER TABLE public.vaccinations ENABLE ROW LEVEL SECURITY;
CREATE POLICY vaccinations_select_farm_member ON public.vaccinations FOR SELECT USING (public.can_access_farm(farm_id));
CREATE POLICY vaccinations_insert_farm_manager ON public.vaccinations FOR INSERT WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY vaccinations_update_farm_manager ON public.vaccinations FOR UPDATE USING (public.can_manage_farm(farm_id)) WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY vaccinations_delete_owner_or_admin ON public.vaccinations FOR DELETE USING (public.can_manage_farm(farm_id) OR public.is_super_admin());
```

### breeding_records

```sql
ALTER TABLE public.breeding_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY breeding_records_select_farm_member ON public.breeding_records FOR SELECT USING (public.can_access_farm(farm_id));
CREATE POLICY breeding_records_insert_farm_manager ON public.breeding_records FOR INSERT WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY breeding_records_update_farm_manager ON public.breeding_records FOR UPDATE USING (public.can_manage_farm(farm_id)) WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY breeding_records_delete_owner_or_admin ON public.breeding_records FOR DELETE USING (public.can_manage_farm(farm_id) OR public.is_super_admin());
```

### calving_records

```sql
ALTER TABLE public.calving_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY calving_records_select_farm_member ON public.calving_records FOR SELECT USING (public.can_access_farm(farm_id));
CREATE POLICY calving_records_insert_farm_manager ON public.calving_records FOR INSERT WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY calving_records_update_farm_manager ON public.calving_records FOR UPDATE USING (public.can_manage_farm(farm_id)) WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY calving_records_delete_owner_or_admin ON public.calving_records FOR DELETE USING (public.can_manage_farm(farm_id) OR public.is_super_admin());
```

### reminders

```sql
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY reminders_select_farm_member ON public.reminders FOR SELECT USING (public.can_access_farm(farm_id));
CREATE POLICY reminders_insert_farm_manager ON public.reminders FOR INSERT WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY reminders_update_farm_manager ON public.reminders FOR UPDATE USING (public.can_manage_farm(farm_id)) WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY reminders_delete_owner_or_admin ON public.reminders FOR DELETE USING (public.can_manage_farm(farm_id) OR public.is_super_admin());
```

### expenses

```sql
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
CREATE POLICY expenses_select_farm_member ON public.expenses FOR SELECT USING (public.can_access_farm(farm_id));
CREATE POLICY expenses_insert_farm_manager ON public.expenses FOR INSERT WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY expenses_update_farm_manager ON public.expenses FOR UPDATE USING (public.can_manage_farm(farm_id)) WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY expenses_delete_owner_or_admin ON public.expenses FOR DELETE USING (public.can_manage_farm(farm_id) OR public.is_super_admin());
```

### settlements

```sql
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
CREATE POLICY settlements_select_farm_member ON public.settlements FOR SELECT USING (public.can_access_farm(farm_id));
CREATE POLICY settlements_insert_farm_manager ON public.settlements FOR INSERT WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY settlements_update_farm_manager ON public.settlements FOR UPDATE USING (public.can_manage_farm(farm_id)) WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY settlements_delete_owner_or_admin ON public.settlements FOR DELETE USING (public.can_manage_farm(farm_id) OR public.is_super_admin());
```

### settlement_items

```sql
ALTER TABLE public.settlement_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY settlement_items_select_farm_member ON public.settlement_items FOR SELECT USING (public.can_access_farm(farm_id));
CREATE POLICY settlement_items_insert_farm_manager ON public.settlement_items FOR INSERT WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY settlement_items_update_farm_manager ON public.settlement_items FOR UPDATE USING (public.can_manage_farm(farm_id)) WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY settlement_items_delete_owner_or_admin ON public.settlement_items FOR DELETE USING (public.can_manage_farm(farm_id) OR public.is_super_admin());
```

### reports

```sql
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY reports_select_farm_member ON public.reports FOR SELECT USING (public.can_access_farm(farm_id));
CREATE POLICY reports_insert_farm_manager ON public.reports FOR INSERT WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY reports_update_farm_manager ON public.reports FOR UPDATE USING (public.can_manage_farm(farm_id)) WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY reports_delete_owner_or_admin ON public.reports FOR DELETE USING (public.can_manage_farm(farm_id) OR public.is_super_admin());
```

### goals

```sql
ALTER TABLE public.goals ENABLE ROW LEVEL SECURITY;
CREATE POLICY goals_select_farm_member ON public.goals FOR SELECT USING (public.can_access_farm(farm_id));
CREATE POLICY goals_insert_farm_manager ON public.goals FOR INSERT WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY goals_update_farm_manager ON public.goals FOR UPDATE USING (public.can_manage_farm(farm_id)) WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY goals_delete_owner_or_admin ON public.goals FOR DELETE USING (public.can_manage_farm(farm_id) OR public.is_super_admin());
```

### notifications

```sql
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_select_farm_member ON public.notifications FOR SELECT USING (public.can_access_farm(farm_id));
CREATE POLICY notifications_insert_farm_manager ON public.notifications FOR INSERT WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY notifications_update_farm_manager ON public.notifications FOR UPDATE USING (public.can_manage_farm(farm_id)) WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY notifications_delete_owner_or_admin ON public.notifications FOR DELETE USING (public.can_manage_farm(farm_id) OR public.is_super_admin());
```

### notification_logs

```sql
ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY notification_logs_select_farm_member ON public.notification_logs FOR SELECT USING (public.can_access_farm(farm_id));
CREATE POLICY notification_logs_insert_farm_manager ON public.notification_logs FOR INSERT WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY notification_logs_update_farm_manager ON public.notification_logs FOR UPDATE USING (public.can_manage_farm(farm_id)) WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY notification_logs_delete_owner_or_admin ON public.notification_logs FOR DELETE USING (public.can_manage_farm(farm_id) OR public.is_super_admin());
```

### ai_chats

```sql
ALTER TABLE public.ai_chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_chats_select_farm_member ON public.ai_chats FOR SELECT USING (public.can_access_farm(farm_id));
CREATE POLICY ai_chats_insert_farm_manager ON public.ai_chats FOR INSERT WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY ai_chats_update_farm_manager ON public.ai_chats FOR UPDATE USING (public.can_manage_farm(farm_id)) WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY ai_chats_delete_owner_or_admin ON public.ai_chats FOR DELETE USING (public.can_manage_farm(farm_id) OR public.is_super_admin());
```

### ai_messages

```sql
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_messages_select_farm_member ON public.ai_messages FOR SELECT USING (public.can_access_farm(farm_id));
CREATE POLICY ai_messages_insert_farm_manager ON public.ai_messages FOR INSERT WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY ai_messages_update_farm_manager ON public.ai_messages FOR UPDATE USING (public.can_manage_farm(farm_id)) WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY ai_messages_delete_owner_or_admin ON public.ai_messages FOR DELETE USING (public.can_manage_farm(farm_id) OR public.is_super_admin());
```

### ocr_uploads

```sql
ALTER TABLE public.ocr_uploads ENABLE ROW LEVEL SECURITY;
CREATE POLICY ocr_uploads_select_farm_member ON public.ocr_uploads FOR SELECT USING (public.can_access_farm(farm_id));
CREATE POLICY ocr_uploads_insert_farm_manager ON public.ocr_uploads FOR INSERT WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY ocr_uploads_update_farm_manager ON public.ocr_uploads FOR UPDATE USING (public.can_manage_farm(farm_id)) WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY ocr_uploads_delete_owner_or_admin ON public.ocr_uploads FOR DELETE USING (public.can_manage_farm(farm_id) OR public.is_super_admin());
```

### ocr_extractions

```sql
ALTER TABLE public.ocr_extractions ENABLE ROW LEVEL SECURITY;
CREATE POLICY ocr_extractions_select_farm_member ON public.ocr_extractions FOR SELECT USING (public.can_access_farm(farm_id));
CREATE POLICY ocr_extractions_insert_farm_manager ON public.ocr_extractions FOR INSERT WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY ocr_extractions_update_farm_manager ON public.ocr_extractions FOR UPDATE USING (public.can_manage_farm(farm_id)) WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY ocr_extractions_delete_owner_or_admin ON public.ocr_extractions FOR DELETE USING (public.can_manage_farm(farm_id) OR public.is_super_admin());
```

### achievements

```sql
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
CREATE POLICY achievements_select_active ON public.achievements FOR SELECT USING (is_active = true OR public.is_platform_admin());
CREATE POLICY achievements_insert_admin ON public.achievements FOR INSERT WITH CHECK (public.is_platform_admin());
CREATE POLICY achievements_update_admin ON public.achievements FOR UPDATE USING (public.is_platform_admin()) WITH CHECK (public.is_platform_admin());
CREATE POLICY achievements_delete_super_admin ON public.achievements FOR DELETE USING (public.is_super_admin());
```

### leaderboard_entries

```sql
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY leaderboard_entries_select_farm_member ON public.leaderboard_entries FOR SELECT USING (public.can_access_farm(farm_id));
CREATE POLICY leaderboard_entries_insert_farm_manager ON public.leaderboard_entries FOR INSERT WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY leaderboard_entries_update_farm_manager ON public.leaderboard_entries FOR UPDATE USING (public.can_manage_farm(farm_id)) WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY leaderboard_entries_delete_owner_or_admin ON public.leaderboard_entries FOR DELETE USING (public.can_manage_farm(farm_id) OR public.is_super_admin());
```

### support_tickets

```sql
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY support_tickets_select_farm_member ON public.support_tickets FOR SELECT USING (public.can_access_farm(farm_id));
CREATE POLICY support_tickets_insert_farm_manager ON public.support_tickets FOR INSERT WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY support_tickets_update_farm_manager ON public.support_tickets FOR UPDATE USING (public.can_manage_farm(farm_id)) WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY support_tickets_delete_owner_or_admin ON public.support_tickets FOR DELETE USING (public.can_manage_farm(farm_id) OR public.is_super_admin());
```

### support_messages

```sql
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY support_messages_select_farm_member ON public.support_messages FOR SELECT USING (public.can_access_farm(farm_id));
CREATE POLICY support_messages_insert_farm_manager ON public.support_messages FOR INSERT WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY support_messages_update_farm_manager ON public.support_messages FOR UPDATE USING (public.can_manage_farm(farm_id)) WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY support_messages_delete_owner_or_admin ON public.support_messages FOR DELETE USING (public.can_manage_farm(farm_id) OR public.is_super_admin());
```

### backups

```sql
ALTER TABLE public.backups ENABLE ROW LEVEL SECURITY;
CREATE POLICY backups_select_farm_member ON public.backups FOR SELECT USING (public.can_access_farm(farm_id));
CREATE POLICY backups_insert_farm_manager ON public.backups FOR INSERT WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY backups_update_farm_manager ON public.backups FOR UPDATE USING (public.can_manage_farm(farm_id)) WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY backups_delete_owner_or_admin ON public.backups FOR DELETE USING (public.can_manage_farm(farm_id) OR public.is_super_admin());
```

### audit_logs

```sql
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_logs_select_farm_member ON public.audit_logs FOR SELECT USING (public.can_access_farm(farm_id));
CREATE POLICY audit_logs_insert_farm_manager ON public.audit_logs FOR INSERT WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY audit_logs_update_farm_manager ON public.audit_logs FOR UPDATE USING (public.can_manage_farm(farm_id)) WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY audit_logs_delete_owner_or_admin ON public.audit_logs FOR DELETE USING (public.can_manage_farm(farm_id) OR public.is_super_admin());
```

### settings

```sql
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY settings_select_farm_member ON public.settings FOR SELECT USING (public.can_access_farm(farm_id));
CREATE POLICY settings_insert_farm_manager ON public.settings FOR INSERT WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY settings_update_farm_manager ON public.settings FOR UPDATE USING (public.can_manage_farm(farm_id)) WITH CHECK (public.can_manage_farm(farm_id));
CREATE POLICY settings_delete_owner_or_admin ON public.settings FOR DELETE USING (public.can_manage_farm(farm_id) OR public.is_super_admin());
```

## 4. Storage Policy Pattern

```sql
CREATE POLICY storage_ocr_slips_read
ON storage.objects FOR SELECT
USING (
  bucket_id = 'ocr-slips'
  AND public.can_access_farm((split_part(name, '/', 1))::uuid)
);

CREATE POLICY storage_ocr_slips_write
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ocr-slips'
  AND public.can_manage_farm((split_part(name, '/', 1))::uuid)
);
```

## 5. Verification Checklist

- Cross-farm URL manipulation is blocked.
- Non-member insert/update/delete fails.
- Support cannot read unrelated farm data.
- Admin action reads/writes create audit logs.
- Storage object path access follows farm ownership.
