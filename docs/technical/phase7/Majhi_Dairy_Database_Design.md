# Majhi Dairy Database Design Document

**Document Version:** 1.0  
**Date:** 2026-06-07  
**Application:** Majhi Dairy  
**Database Platform:** PostgreSQL on Supabase  
**Authentication:** Supabase Auth  
**Storage:** Supabase Storage  
**Languages:** Marathi and English  
**Target Scale:** 100,000+ users, 50,000+ farms, millions of milk records

## 1. Database Architecture Overview

Majhi Dairy uses a multi-tenant PostgreSQL database where `farms` is the primary tenant boundary. Supabase Auth owns credential identity in `auth.users`; application tables in `public` store farm operations, AI/OCR history, notifications, support, backups and audit logs.

### 1.1 Data Flow Diagram

```text
User -> Supabase Auth -> users profile -> farm_members role resolution
     -> farms tenant boundary -> cows/calves/records/accounting/reminders
     -> reports/goals/leaderboards/AI/OCR/notifications/audit logs
```

### 1.2 Data Ownership Model

- `auth.users.id` is the identity root.
- `public.users.id` mirrors the authenticated user.
- `farms.id` is the tenant root for operational data.
- `farm_members` controls access, roles and future multi-farm membership.
- Every farm-owned table contains `farm_id` for RLS, indexing and partitioning.
- Admin/support access must be explicit, audited and never dependent on client-side filtering.

### 1.3 Multi-Tenant Strategy

| Topic | Decision |
| --- | --- |
| Tenant key | farm_id on every farm-owned table |
| Membership | farm_members many-to-many user-farm table |
| RLS | Enabled on all public tables with helper functions |
| Admin access | Role-based policies plus audit logs |
| Support access | Ticket-scoped and optionally farm-scoped read access |
| Service role | Trusted server APIs, Edge Functions and scheduled jobs only |
| Data isolation | All queries and policies filter by farm_id or ownership |

### 1.4 Scalability Considerations

- Partition high-volume tables by month or quarter: `milk_records`, `audit_logs`, `notification_logs`, `ai_messages`, `ocr_extractions`.
- Use composite indexes beginning with `farm_id` and date/status columns.
- Use materialized views for dashboard/report summaries.
- Use background jobs for OCR, reports, backups, leaderboards and reminders.

## 2. Entity Inventory

| # | Entity | Purpose | Key Relationships | Retention |
| --- | --- | --- | --- | --- |
| 1 | users | Application user profile synchronized with Supabase Auth identity. | One user can own farms, belong to farms, create records, receive notifications and use AI/support. | Retain while active; anonymize after deletion; audit references retained. |
| 2 | farms | Tenant root entity for multi-tenant data ownership. | Farm has members, animals, records, reminders, expenses, settlements, notifications, support tickets and audit logs. | Retain while subscription/account exists; protected cascade after backup/export. |
| 3 | farm_members | Membership and role mapping between users and farms. | Many users can belong to many farms; role controls permissions. | Retain membership history; removed memberships archived. |
| 4 | cows | Cow lifecycle master record. | Cow has milk, feed, health, vaccination, breeding, calving, reminder and calf records. | Retain lifetime history after sold/dead/archive unless farm deletion occurs. |
| 5 | calves | Calf lifecycle master record. | Calf may link to mother cow and convert into cow record. | Retain after sold/converted for lineage and financial history. |
| 6 | milk_records | Daily farm-level or cow-level milk production record. | Belongs to farm and optionally cow, OCR upload and settlement item. | Retain for statutory/reporting period; soft-delete preferred with audit. |
| 7 | feed_records | Feed and fodder usage/cost records. | Can link to cow/calf and optionally create expense entry. | Retain as financial source record; soft-delete with audit. |
| 8 | health_records | Animal health treatment and observation records. | Belongs to farm and one cow or calf; can create reminders and expenses. | Retain for animal lifetime plus operational/legal period. |
| 9 | vaccinations | Vaccination and deworming schedule/administration records. | Links to cow/calf, reminders and veterinarian. | Retain for animal lifetime and reporting history. |
| 10 | breeding_records | AI/natural breeding lifecycle records. | Belongs to cow and creates pregnancy/dry-off/calving reminders. | Retain permanently for reproductive history. |
| 11 | calving_records | Cow delivery record and calf creation source. | Belongs to cow, may create calf and post-calving reminders. | Retain permanently for lineage and production analysis. |
| 12 | reminders | Unified task/reminder engine. | May link to cow, calf and source records; notifications are generated from reminders. | Keep completed/cancelled history for at least two years. |
| 13 | expenses | Unified farm expense ledger. | May link to feed records, settlements and users. | Financial records retained for audit/reporting; soft delete with audit. |
| 14 | settlements | 15-day dairy settlement/payment slip header and financial summary. | Has settlement_items, links OCR upload/extraction and generated feed expense. | Financial settlement records retained; deletion reverses derived data transactionally. |
| 15 | settlement_items | Daily/session line items extracted from settlement slip. | Belongs to settlement and can match milk_records. | Retain with settlement; cascade on permanent settlement deletion. |
| 16 | reports | Generated report jobs and files. | Belongs to farm/user; generated files stored in reports bucket. | Files expire by policy; metadata retained for audit/usage. |
| 17 | goals | Farm/user production and quality goals. | Belongs to farm and optionally user; can generate notifications/achievements. | Retain historical goals for analytics. |
| 18 | notifications | Notification master record for in-app/push/admin messages. | Has notification_logs and may link to farm/admin creator. | Retain metadata for analytics; content per communication policy. |
| 19 | notification_logs | Per-user notification delivery/read/click audit. | Belongs to notification, user and farm. | Retain delivery logs for analytics; prune old success logs by policy. |
| 20 | ai_chats | AI assistant conversation session. | Has many ai_messages and belongs to farm/user. | Default retention 12 months or user-configured deletion. |
| 21 | ai_messages | Individual AI chat messages and tool-call audit. | Belongs to ai_chats and farm/user. | Follows AI chat retention; cost/audit metadata retained as allowed. |
| 22 | ocr_uploads | Uploaded dairy slip image/file processing job. | Has OCR extractions and may link saved records. | Keep images for audit period; allow purge after export if policy permits. |
| 23 | ocr_extractions | OCR and AI extraction result/audit. | Belongs to OCR upload and farm; can link saved record. | Retain for debugging/audit period; redact sensitive fields by policy. |
| 24 | achievements | Achievement catalog and rules. | Referenced by progress and notifications. | Retain inactive definitions for historical earned achievements. |
| 25 | leaderboard_entries | Materialized ranking rows. | Computed from milk, activity, OCR, AI and score data. | Retain monthly/annual snapshots; recalculate current period. |
| 26 | support_tickets | User support ticket master. | Has support_messages and attachments; can notify users/admins. | Retain support history for service quality and legal policy. |
| 27 | support_messages | Support ticket conversation messages. | Belongs to support_tickets and sender user. | Retain with ticket according to support retention policy. |
| 28 | backups | Farm export/backup jobs and files. | Belongs to farm/user; file stored in backups bucket. | Retain according to user schedule and storage policy. |
| 29 | audit_logs | Immutable audit and security event ledger. | Belongs to farm/user where applicable and references changed entity. | Retain minimum 3 years or per compliance policy; append-only. |
| 30 | settings | Generic user/farm settings registry. | Belongs to farm and/or user. User settings override farm defaults. | Retain latest settings; audit changes in audit_logs. |


## 3. Table Design

The following is the target production schema. Existing project tables such as `dairy_settlements`, `dairy_slips`, `slip_uploads`, `ai_records`, `finance_records`, `monthly_expenses`, and `ai_assistant_logs` should be mapped through migrations or compatibility views.

### users

**Description:** Application user profile synchronized with Supabase Auth identity.

**Relationships:** One user can own farms, belong to farms, create records, receive notifications and use AI/support.

**Retention:** Retain while active; anonymize after deletion; audit references retained.

**Columns**

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | N | auth.users.id | PK/FK |
| email | TEXT | Y | NULL | unique when present |
| phone | TEXT | Y | NULL | unique when present |
| full_name | TEXT | N | '' | display name |
| default_language | TEXT | N | mr | check mr/en |
| role | TEXT | N | farmer | platform role |
| status | TEXT | N | active | active/invited/suspended/deleted |
| profile_photo_path | TEXT | Y | NULL | storage path |
| last_login_at | TIMESTAMPTZ | Y | NULL | last login |
| created_at | TIMESTAMPTZ | N | now() | created |
| updated_at | TIMESTAMPTZ | N | now() | updated |

**Indexes**

- `idx_users_created`

**Unique Constraints**

- email unique where not null; phone unique where not null

**Foreign Keys**

- None

**Check Constraints**

- non-negative numeric values
- status/type enum checks where applicable
- farm_id required for tenant-owned tables

### farms

**Description:** Tenant root entity for multi-tenant data ownership.

**Relationships:** Farm has members, animals, records, reminders, expenses, settlements, notifications, support tickets and audit logs.

**Retention:** Retain while subscription/account exists; protected cascade after backup/export.

**Columns**

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | N | gen_random_uuid() | PK |
| farm_code | TEXT | N | generated | unique public code |
| name | TEXT | N | '' | farm name |
| owner_user_id | UUID | N | current | user FK users |
| village | TEXT | Y | NULL | village |
| taluka | TEXT | Y | NULL | taluka |
| district | TEXT | Y | NULL | district |
| state | TEXT | N | Maharashtra | state |
| country | TEXT | N | India | country |
| timezone | TEXT | N | Asia/Kolkata | timezone |
| status | TEXT | N | trial | trial/active/inactive/suspended/deleted |
| subscription_status | TEXT | N | trial | trial/active/expired/cancelled |
| plan_code | TEXT | Y | NULL | plan |
| trial_started_at | TIMESTAMPTZ | Y | NULL | trial start |
| trial_ends_at | TIMESTAMPTZ | Y | NULL | trial end |
| subscription_ends_at | TIMESTAMPTZ | Y | NULL | paid expiry |
| created_at | TIMESTAMPTZ | N | now() | created |
| updated_at | TIMESTAMPTZ | N | now() | updated |

**Indexes**

- `idx_farms_created`

**Unique Constraints**

- farm_code unique

**Foreign Keys**

- `owner_user_id references related table`

**Check Constraints**

- non-negative numeric values
- status/type enum checks where applicable
- farm_id required for tenant-owned tables

### farm_members

**Description:** Membership and role mapping between users and farms.

**Relationships:** Many users can belong to many farms; role controls permissions.

**Retention:** Retain membership history; removed memberships archived.

**Columns**

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | N | gen_random_uuid() | PK |
| farm_id | UUID | N | none | FK farms |
| user_id | UUID | N | none | FK users |
| role | TEXT | N | worker | owner/farmer/worker/veterinarian/accountant/support_viewer |
| status | TEXT | N | active | active/invited/inactive/removed |
| permissions | JSONB | N | {} | fine-grained overrides |
| invited_by | UUID | Y | NULL | FK users |
| joined_at | TIMESTAMPTZ | Y | NULL | joined |
| last_active_at | TIMESTAMPTZ | Y | NULL | activity |
| created_at | TIMESTAMPTZ | N | now() | created |

**Indexes**

- `idx_farm_members_farm_date`
- `idx_farm_members_farm_status`

**Unique Constraints**

- unique farm_id plus user_id

**Foreign Keys**

- `farm_id references related table`
- `user_id references related table`

**Check Constraints**

- non-negative numeric values
- status/type enum checks where applicable
- farm_id required for tenant-owned tables

### cows

**Description:** Cow lifecycle master record.

**Relationships:** Cow has milk, feed, health, vaccination, breeding, calving, reminder and calf records.

**Retention:** Retain lifetime history after sold/dead/archive unless farm deletion occurs.

**Columns**

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | N | gen_random_uuid() | PK |
| farm_id | UUID | N | none | FK farms |
| tag_number | TEXT | Y | NULL | farm tag |
| name | TEXT | N | '' | cow name |
| breed | TEXT | Y | NULL | breed |
| dob | DATE | Y | NULL | birth |
| purchase_date | DATE | Y | NULL | purchase |
| status | TEXT | N | active | active/pregnant/dry/calved/sold/dead/archived |
| reproductive_status | TEXT | N | open | open/inseminated/pregnant/calved/dry |
| lactation_number | INTEGER | N | 0 | lactation |
| profile_photo_path | TEXT | Y | NULL | image |
| notes | TEXT | Y | NULL | notes |
| created_by | UUID | Y | NULL | FK users |
| created_at | TIMESTAMPTZ | N | now() | created |
| updated_at | TIMESTAMPTZ | N | now() | updated |

**Indexes**

- `idx_cows_farm_date`
- `idx_cows_farm_status`

**Unique Constraints**

- unique farm_id plus tag_number where tag_number is not null

**Foreign Keys**

- `farm_id references related table`

**Check Constraints**

- non-negative numeric values
- status/type enum checks where applicable
- farm_id required for tenant-owned tables

### calves

**Description:** Calf lifecycle master record.

**Relationships:** Calf may link to mother cow and convert into cow record.

**Retention:** Retain after sold/converted for lineage and financial history.

**Columns**

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | N | gen_random_uuid() | PK |
| farm_id | UUID | N | none | FK farms |
| mother_cow_id | UUID | Y | NULL | FK cows |
| converted_cow_id | UUID | Y | NULL | FK cows |
| name | TEXT | N | '' | calf name |
| gender | TEXT | N | unknown | female/male/unknown |
| birth_date | DATE | N | none | birth |
| status | TEXT | N | active | active/sold/dead/converted/archived |
| dehorning_due_start | DATE | Y | NULL | 30-day window start |
| dehorning_due_end | DATE | Y | NULL | 45-day window end |
| weaning_due_date | DATE | Y | NULL | milk reduction due |
| photo_path | TEXT | Y | NULL | storage |
| sale_date | DATE | Y | NULL | sale |
| sale_amount | NUMERIC(12,2) | Y | NULL | sale income |
| notes | TEXT | Y | NULL | notes |
| created_at | TIMESTAMPTZ | N | now() | created |
| updated_at | TIMESTAMPTZ | N | now() | updated |

**Indexes**

- `idx_calves_farm_date`
- `idx_calves_farm_status`

**Unique Constraints**

- none

**Foreign Keys**

- `farm_id references related table`
- `mother_cow_id references related table`
- `converted_cow_id references related table`

**Check Constraints**

- non-negative numeric values
- status/type enum checks where applicable
- farm_id required for tenant-owned tables

### milk_records

**Description:** Daily farm-level or cow-level milk production record.

**Relationships:** Belongs to farm and optionally cow, OCR upload and settlement item.

**Retention:** Retain for statutory/reporting period; soft-delete preferred with audit.

**Columns**

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | N | gen_random_uuid() | PK |
| farm_id | UUID | N | none | FK farms |
| cow_id | UUID | Y | NULL | FK cows |
| record_date | DATE | N | none | milk date |
| morning_liters | NUMERIC(10,2) | N | 0 | morning |
| evening_liters | NUMERIC(10,2) | N | 0 | evening |
| total_liters | NUMERIC(10,2) | N | 0 | total |
| fat_percent | NUMERIC(5,2) | Y | NULL | fat |
| snf_percent | NUMERIC(5,2) | Y | NULL | snf |
| clr_score | NUMERIC(5,2) | Y | NULL | clr |
| rate_per_liter | NUMERIC(10,2) | Y | NULL | rate |
| amount | NUMERIC(12,2) | Y | NULL | amount |
| milk_type | TEXT | N | cow | cow/buffalo |
| source | TEXT | N | manual | manual/daily_slip/settlement_item/import |
| source_record_id | UUID | Y | NULL | source |
| ocr_upload_id | UUID | Y | NULL | FK ocr_uploads |
| accounting_month | TEXT | N | YYYY-MM | month |
| created_by | UUID | Y | NULL | user |
| created_at | TIMESTAMPTZ | N | now() | created |
| updated_at | TIMESTAMPTZ | N | now() | updated |
| deleted_at | TIMESTAMPTZ | Y | NULL | soft delete |

**Indexes**

- `idx_milk_records_farm_date`
- `idx_milk_records_farm_status`
- `idx_milk_records_farm_created_or_period`

**Unique Constraints**

- none

**Foreign Keys**

- `farm_id references related table`
- `cow_id references related table`
- `source_record_id references related table`
- `ocr_upload_id references related table`

**Check Constraints**

- non-negative numeric values
- status/type enum checks where applicable
- farm_id required for tenant-owned tables

### feed_records

**Description:** Feed and fodder usage/cost records.

**Relationships:** Can link to cow/calf and optionally create expense entry.

**Retention:** Retain as financial source record; soft-delete with audit.

**Columns**

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | N | gen_random_uuid() | PK |
| farm_id | UUID | N | none | FK farms |
| cow_id | UUID | Y | NULL | FK cows |
| calf_id | UUID | Y | NULL | FK calves |
| record_date | DATE | N | none | date |
| feed_type | TEXT | N | none | type |
| quantity | NUMERIC(12,3) | Y | NULL | quantity |
| unit | TEXT | N | kg | unit |
| rate | NUMERIC(12,2) | Y | NULL | rate |
| amount | NUMERIC(12,2) | N | 0 | amount |
| supplier | TEXT | Y | NULL | supplier |
| source | TEXT | N | manual | manual/settlement/import |
| is_expense_accounted | BOOLEAN | N | true | expense flag |
| notes | TEXT | Y | NULL | notes |
| created_by | UUID | Y | NULL | FK users |
| created_at | TIMESTAMPTZ | N | now() | created |

**Indexes**

- `idx_feed_records_farm_date`
- `idx_feed_records_farm_status`

**Unique Constraints**

- none

**Foreign Keys**

- `farm_id references related table`
- `cow_id references related table`
- `calf_id references related table`

**Check Constraints**

- non-negative numeric values
- status/type enum checks where applicable
- farm_id required for tenant-owned tables

### health_records

**Description:** Animal health treatment and observation records.

**Relationships:** Belongs to farm and one cow or calf; can create reminders and expenses.

**Retention:** Retain for animal lifetime plus operational/legal period.

**Columns**

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | N | gen_random_uuid() | PK |
| farm_id | UUID | N | none | FK farms |
| cow_id | UUID | Y | NULL | FK cows |
| calf_id | UUID | Y | NULL | FK calves |
| record_date | DATE | N | none | date |
| health_type | TEXT | N | general | type |
| diagnosis | TEXT | Y | NULL | diagnosis |
| symptoms | TEXT | Y | NULL | symptoms |
| treatment | TEXT | Y | NULL | treatment |
| medicine | TEXT | Y | NULL | medicine |
| veterinarian_name | TEXT | Y | NULL | vet |
| cost | NUMERIC(12,2) | N | 0 | cost |
| next_due_date | DATE | Y | NULL | follow-up |
| follow_up_required | BOOLEAN | N | false | flag |
| attachments | JSONB | N | [] | storage paths |
| created_by | UUID | Y | NULL | user |
| created_at | TIMESTAMPTZ | N | now() | created |

**Indexes**

- `idx_health_records_farm_date`
- `idx_health_records_farm_status`

**Unique Constraints**

- none

**Foreign Keys**

- `farm_id references related table`
- `cow_id references related table`
- `calf_id references related table`

**Check Constraints**

- non-negative numeric values
- status/type enum checks where applicable
- farm_id required for tenant-owned tables

### vaccinations

**Description:** Vaccination and deworming schedule/administration records.

**Relationships:** Links to cow/calf, reminders and veterinarian.

**Retention:** Retain for animal lifetime and reporting history.

**Columns**

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | N | gen_random_uuid() | PK |
| farm_id | UUID | N | none | FK farms |
| cow_id | UUID | Y | NULL | FK cows |
| calf_id | UUID | Y | NULL | FK calves |
| vaccine_name | TEXT | N | none | name |
| vaccine_type | TEXT | N | vaccination | vaccination/deworming |
| administered_date | DATE | Y | NULL | completed |
| due_date | DATE | N | none | due |
| dose | TEXT | Y | NULL | dose |
| batch_no | TEXT | Y | NULL | batch |
| veterinarian_name | TEXT | Y | NULL | vet |
| status | TEXT | N | scheduled | scheduled/completed/missed/cancelled |
| cost | NUMERIC(12,2) | N | 0 | cost |
| reminder_id | UUID | Y | NULL | FK reminders |
| created_at | TIMESTAMPTZ | N | now() | created |

**Indexes**

- `idx_vaccinations_farm_date`
- `idx_vaccinations_farm_status`

**Unique Constraints**

- none

**Foreign Keys**

- `farm_id references related table`
- `cow_id references related table`
- `calf_id references related table`
- `reminder_id references related table`

**Check Constraints**

- non-negative numeric values
- status/type enum checks where applicable
- farm_id required for tenant-owned tables

### breeding_records

**Description:** AI/natural breeding lifecycle records.

**Relationships:** Belongs to cow and creates pregnancy/dry-off/calving reminders.

**Retention:** Retain permanently for reproductive history.

**Columns**

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | N | gen_random_uuid() | PK |
| farm_id | UUID | N | none | FK farms |
| cow_id | UUID | N | none | FK cows |
| breeding_date | DATE | N | none | AI date |
| method | TEXT | N | ai | ai/natural |
| semen_or_bull | TEXT | Y | NULL | semen/bull |
| technician_name | TEXT | Y | NULL | technician |
| status | TEXT | N | pending | pending/pregnant/not_pregnant/superseded/calved |
| pregnancy_check_due_date | DATE | N | breeding_date+60 | due |
| pregnancy_check_date | DATE | Y | NULL | actual |
| pregnancy_result | TEXT | Y | NULL | positive/negative/unknown |
| superseded_by | UUID | Y | NULL | FK breeding_records |
| expected_calving_date | DATE | Y | NULL | expected |
| notes | TEXT | Y | NULL | notes |
| created_at | TIMESTAMPTZ | N | now() | created |

**Indexes**

- `idx_breeding_records_farm_date`
- `idx_breeding_records_farm_status`

**Unique Constraints**

- none

**Foreign Keys**

- `farm_id references related table`
- `cow_id references related table`

**Check Constraints**

- non-negative numeric values
- status/type enum checks where applicable
- farm_id required for tenant-owned tables

### calving_records

**Description:** Cow delivery record and calf creation source.

**Relationships:** Belongs to cow, may create calf and post-calving reminders.

**Retention:** Retain permanently for lineage and production analysis.

**Columns**

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | N | gen_random_uuid() | PK |
| farm_id | UUID | N | none | FK farms |
| cow_id | UUID | N | none | FK cows |
| calf_id | UUID | Y | NULL | FK calves |
| breeding_record_id | UUID | Y | NULL | FK breeding_records |
| calving_date | DATE | N | none | date |
| calving_type | TEXT | N | normal | normal/assisted/difficult/c_section |
| outcome | TEXT | N | live | live/stillborn/abortion |
| complications | TEXT | Y | NULL | complications |
| next_breeding_window_start | DATE | Y | NULL | calving+60 |
| next_breeding_window_end | DATE | Y | NULL | calving+90 |
| notes | TEXT | Y | NULL | notes |
| created_at | TIMESTAMPTZ | N | now() | created |

**Indexes**

- `idx_calving_records_farm_date`
- `idx_calving_records_farm_status`

**Unique Constraints**

- none

**Foreign Keys**

- `farm_id references related table`
- `cow_id references related table`
- `calf_id references related table`
- `breeding_record_id references related table`

**Check Constraints**

- non-negative numeric values
- status/type enum checks where applicable
- farm_id required for tenant-owned tables

### reminders

**Description:** Unified task/reminder engine.

**Relationships:** May link to cow, calf and source records; notifications are generated from reminders.

**Retention:** Keep completed/cancelled history for at least two years.

**Columns**

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | N | gen_random_uuid() | PK |
| farm_id | UUID | N | none | FK farms |
| cow_id | UUID | Y | NULL | FK cows |
| calf_id | UUID | Y | NULL | FK calves |
| related_table | TEXT | Y | NULL | source table |
| related_record_id | UUID | Y | NULL | source id |
| type | TEXT | N | custom | type |
| title | TEXT | N | none | title |
| message | TEXT | N | none | message |
| reminder_date | DATE | N | none | due date |
| priority | TEXT | N | normal | low/normal/high/urgent |
| status | TEXT | N | scheduled | scheduled/active/snoozed/completed/cancelled/expired |
| snoozed_until | DATE | Y | NULL | snooze |
| completed_at | TIMESTAMPTZ | Y | NULL | done |
| completed_by | UUID | Y | NULL | FK users |
| action_url | TEXT | Y | NULL | link |
| metadata | JSONB | N | {} | metadata |
| created_at | TIMESTAMPTZ | N | now() | created |

**Indexes**

- `idx_reminders_farm_date`
- `idx_reminders_farm_status`

**Unique Constraints**

- none

**Foreign Keys**

- `farm_id references related table`
- `cow_id references related table`
- `calf_id references related table`
- `related_record_id references related table`

**Check Constraints**

- non-negative numeric values
- status/type enum checks where applicable
- farm_id required for tenant-owned tables

### expenses

**Description:** Unified farm expense ledger.

**Relationships:** May link to feed records, settlements and users.

**Retention:** Financial records retained for audit/reporting; soft delete with audit.

**Columns**

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | N | gen_random_uuid() | PK |
| farm_id | UUID | N | none | FK farms |
| expense_date | DATE | N | none | date |
| accounting_month | TEXT | N | YYYY-MM | month |
| category | TEXT | N | other | feed/fodder/veterinary/medicine/labour/transport/utilities/equipment/other |
| subcategory | TEXT | Y | NULL | subcategory |
| amount | NUMERIC(12,2) | N | 0 | amount |
| payment_method | TEXT | Y | NULL | method |
| source | TEXT | N | manual | manual/feed_record/settlement/import |
| settlement_id | UUID | Y | NULL | FK settlements |
| feed_record_id | UUID | Y | NULL | FK feed_records |
| description | TEXT | Y | NULL | description |
| created_by | UUID | Y | NULL | user |
| created_at | TIMESTAMPTZ | N | now() | created |
| deleted_at | TIMESTAMPTZ | Y | NULL | soft delete |

**Indexes**

- `idx_expenses_farm_date`
- `idx_expenses_farm_status`
- `idx_expenses_farm_created_or_period`

**Unique Constraints**

- none

**Foreign Keys**

- `farm_id references related table`
- `settlement_id references related table`
- `feed_record_id references related table`

**Check Constraints**

- non-negative numeric values
- status/type enum checks where applicable
- farm_id required for tenant-owned tables

### settlements

**Description:** 15-day dairy settlement/payment slip header and financial summary.

**Relationships:** Has settlement_items, links OCR upload/extraction and generated feed expense.

**Retention:** Financial settlement records retained; deletion reverses derived data transactionally.

**Columns**

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | N | gen_random_uuid() | PK |
| farm_id | UUID | N | none | FK farms |
| dairy_name | TEXT | Y | NULL | center |
| member_code | TEXT | Y | NULL | code |
| period_start | DATE | N | none | start |
| period_end | DATE | N | none | end |
| settlement_date | DATE | N | period_end | date |
| morning_total_liters | NUMERIC(12,2) | Y | NULL | printed morning total |
| evening_total_liters | NUMERIC(12,2) | Y | NULL | printed evening total |
| total_liters | NUMERIC(12,2) | N | 0 | printed total |
| average_rate | NUMERIC(10,2) | Y | NULL | avg rate |
| total_income | NUMERIC(14,2) | N | 0 | milk income |
| feed_deduction | NUMERIC(14,2) | N | 0 | total deduction as feed |
| other_deduction | NUMERIC(14,2) | N | 0 | other deduction |
| round_adjustment | NUMERIC(10,2) | N | 0 | round |
| net_amount | NUMERIC(14,2) | N | 0 | final paid |
| source_upload_id | UUID | Y | NULL | FK ocr_uploads |
| validation_status | TEXT | N | pending_review | status |
| status | TEXT | N | active | active/deleted/corrected |
| raw_data | JSONB | N | {} | OCR data |
| created_by | UUID | Y | NULL | user |
| created_at | TIMESTAMPTZ | N | now() | created |
| updated_at | TIMESTAMPTZ | N | now() | updated |
| deleted_at | TIMESTAMPTZ | Y | NULL | soft delete |

**Indexes**

- `idx_settlements_farm_date`
- `idx_settlements_farm_status`
- `idx_settlements_farm_created_or_period`

**Unique Constraints**

- unique farm_id plus period_start plus period_end where deleted_at is null

**Foreign Keys**

- `farm_id references related table`
- `source_upload_id references related table`

**Check Constraints**

- non-negative numeric values
- status/type enum checks where applicable
- farm_id required for tenant-owned tables

### settlement_items

**Description:** Daily/session line items extracted from settlement slip.

**Relationships:** Belongs to settlement and can match milk_records.

**Retention:** Retain with settlement; cascade on permanent settlement deletion.

**Columns**

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | N | gen_random_uuid() | PK |
| settlement_id | UUID | N | none | FK settlements |
| farm_id | UUID | N | none | FK farms |
| record_date | DATE | N | none | date |
| session | TEXT | N | morning | morning/evening |
| liters | NUMERIC(10,2) | Y | NULL | liters |
| fat_percent | NUMERIC(5,2) | Y | NULL | fat |
| snf_percent | NUMERIC(5,2) | Y | NULL | snf |
| rate_per_liter | NUMERIC(10,2) | Y | NULL | rate |
| amount | NUMERIC(12,2) | Y | NULL | amount |
| source | TEXT | N | ocr | ocr/manual/daily_slip_override |
| matched_milk_record_id | UUID | Y | NULL | FK milk_records |
| confidence | NUMERIC(5,2) | Y | NULL | confidence |
| status | TEXT | N | reviewed | reviewed/missing/overridden/rejected |
| created_at | TIMESTAMPTZ | N | now() | created |

**Indexes**

- `idx_settlement_items_farm_date`
- `idx_settlement_items_farm_status`

**Unique Constraints**

- unique settlement_id plus record_date plus session

**Foreign Keys**

- `settlement_id references related table`
- `farm_id references related table`
- `matched_milk_record_id references related table`

**Check Constraints**

- non-negative numeric values
- status/type enum checks where applicable
- farm_id required for tenant-owned tables

### reports

**Description:** Generated report jobs and files.

**Relationships:** Belongs to farm/user; generated files stored in reports bucket.

**Retention:** Files expire by policy; metadata retained for audit/usage.

**Columns**

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | N | gen_random_uuid() | PK |
| farm_id | UUID | N | none | FK farms |
| user_id | UUID | N | none | FK users |
| report_type | TEXT | N | none | type |
| format | TEXT | N | pdf | pdf/xlsx/csv/json |
| date_start | DATE | Y | NULL | start |
| date_end | DATE | Y | NULL | end |
| filters | JSONB | N | {} | filters |
| status | TEXT | N | queued | queued/processing/completed/failed/expired |
| file_path | TEXT | Y | NULL | storage |
| error_message | TEXT | Y | NULL | error |
| generated_at | TIMESTAMPTZ | Y | NULL | generated |
| expires_at | TIMESTAMPTZ | Y | NULL | expiry |
| created_at | TIMESTAMPTZ | N | now() | created |

**Indexes**

- `idx_reports_farm_date`
- `idx_reports_farm_status`

**Unique Constraints**

- none

**Foreign Keys**

- `farm_id references related table`
- `user_id references related table`

**Check Constraints**

- non-negative numeric values
- status/type enum checks where applicable
- farm_id required for tenant-owned tables

### goals

**Description:** Farm/user production and quality goals.

**Relationships:** Belongs to farm and optionally user; can generate notifications/achievements.

**Retention:** Retain historical goals for analytics.

**Columns**

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | N | gen_random_uuid() | PK |
| farm_id | UUID | N | none | FK farms |
| user_id | UUID | Y | NULL | FK users |
| goal_type | TEXT | N | daily_milk | type |
| target_value | NUMERIC(14,2) | N | 0 | target |
| unit | TEXT | N | liter | unit |
| period_start | DATE | N | none | start |
| period_end | DATE | N | none | end |
| progress_value | NUMERIC(14,2) | N | 0 | progress |
| status | TEXT | N | in_progress | in_progress/completed/missed/cancelled |
| reminder_enabled | BOOLEAN | N | true | flag |
| completed_at | TIMESTAMPTZ | Y | NULL | completed |
| created_at | TIMESTAMPTZ | N | now() | created |

**Indexes**

- `idx_goals_farm_date`
- `idx_goals_farm_status`

**Unique Constraints**

- none

**Foreign Keys**

- `farm_id references related table`
- `user_id references related table`

**Check Constraints**

- non-negative numeric values
- status/type enum checks where applicable
- farm_id required for tenant-owned tables

### notifications

**Description:** Notification master record for in-app/push/admin messages.

**Relationships:** Has notification_logs and may link to farm/admin creator.

**Retention:** Retain metadata for analytics; content per communication policy.

**Columns**

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | N | gen_random_uuid() | PK |
| farm_id | UUID | Y | NULL | FK farms |
| title | TEXT | N | none | title |
| message | TEXT | N | none | body |
| type | TEXT | N | information | type |
| priority | TEXT | N | normal | priority |
| action_text | TEXT | Y | NULL | button |
| action_url | TEXT | Y | NULL | link |
| image_url | TEXT | Y | NULL | image |
| audience | JSONB | N | {} | audience |
| channels | TEXT[] | N | {in_app} | channels |
| created_by | UUID | Y | NULL | FK users |
| scheduled_at | TIMESTAMPTZ | Y | NULL | schedule |
| expires_at | TIMESTAMPTZ | Y | NULL | expiry |
| status | TEXT | N | draft | draft/scheduled/sent/cancelled/expired |
| created_at | TIMESTAMPTZ | N | now() | created |

**Indexes**

- `idx_notifications_farm_date`
- `idx_notifications_farm_status`

**Unique Constraints**

- none

**Foreign Keys**

- `farm_id references related table`

**Check Constraints**

- non-negative numeric values
- status/type enum checks where applicable
- farm_id required for tenant-owned tables

### notification_logs

**Description:** Per-user notification delivery/read/click audit.

**Relationships:** Belongs to notification, user and farm.

**Retention:** Retain delivery logs for analytics; prune old success logs by policy.

**Columns**

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | N | gen_random_uuid() | PK |
| notification_id | UUID | N | none | FK notifications |
| farm_id | UUID | Y | NULL | FK farms |
| user_id | UUID | N | none | FK users |
| channel | TEXT | N | in_app | channel |
| delivery_status | TEXT | N | pending | pending/delivered/failed/opened/clicked/skipped |
| delivered_at | TIMESTAMPTZ | Y | NULL | delivered |
| read_at | TIMESTAMPTZ | Y | NULL | read |
| opened_at | TIMESTAMPTZ | Y | NULL | opened |
| clicked_at | TIMESTAMPTZ | Y | NULL | clicked |
| error_message | TEXT | Y | NULL | error |
| push_endpoint_hash | TEXT | Y | NULL | endpoint hash |
| created_at | TIMESTAMPTZ | N | now() | created |

**Indexes**

- `idx_notification_logs_farm_date`
- `idx_notification_logs_farm_status`
- `idx_notification_logs_farm_created_or_period`

**Unique Constraints**

- unique notification_id plus user_id plus channel

**Foreign Keys**

- `notification_id references related table`
- `farm_id references related table`
- `user_id references related table`

**Check Constraints**

- non-negative numeric values
- status/type enum checks where applicable
- farm_id required for tenant-owned tables

### ai_chats

**Description:** AI assistant conversation session.

**Relationships:** Has many ai_messages and belongs to farm/user.

**Retention:** Default retention 12 months or user-configured deletion.

**Columns**

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | N | gen_random_uuid() | PK |
| farm_id | UUID | N | none | FK farms |
| user_id | UUID | N | none | FK users |
| title | TEXT | Y | NULL | title |
| language | TEXT | N | mr | mr/en |
| status | TEXT | N | active | active/archived/deleted |
| metadata | JSONB | N | {} | metadata |
| created_at | TIMESTAMPTZ | N | now() | created |
| updated_at | TIMESTAMPTZ | N | now() | updated |

**Indexes**

- `idx_ai_chats_farm_date`
- `idx_ai_chats_farm_status`

**Unique Constraints**

- none

**Foreign Keys**

- `farm_id references related table`
- `user_id references related table`

**Check Constraints**

- non-negative numeric values
- status/type enum checks where applicable
- farm_id required for tenant-owned tables

### ai_messages

**Description:** Individual AI chat messages and tool-call audit.

**Relationships:** Belongs to ai_chats and farm/user.

**Retention:** Follows AI chat retention; cost/audit metadata retained as allowed.

**Columns**

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | N | gen_random_uuid() | PK |
| chat_id | UUID | N | none | FK ai_chats |
| farm_id | UUID | N | none | FK farms |
| user_id | UUID | Y | NULL | FK users |
| role | TEXT | N | user | user/assistant/tool/system |
| content | TEXT | N | none | content |
| tool_calls | JSONB | N | [] | calls |
| data_sources | JSONB | N | [] | sources |
| tokens_input | INTEGER | N | 0 | input tokens |
| tokens_output | INTEGER | N | 0 | output tokens |
| latency_ms | INTEGER | Y | NULL | latency |
| feedback | TEXT | Y | NULL | useful/not_useful |
| created_at | TIMESTAMPTZ | N | now() | created |

**Indexes**

- `idx_ai_messages_farm_date`
- `idx_ai_messages_farm_status`
- `idx_ai_messages_farm_created_or_period`

**Unique Constraints**

- none

**Foreign Keys**

- `chat_id references related table`
- `farm_id references related table`
- `user_id references related table`

**Check Constraints**

- non-negative numeric values
- status/type enum checks where applicable
- farm_id required for tenant-owned tables

### ocr_uploads

**Description:** Uploaded dairy slip image/file processing job.

**Relationships:** Has OCR extractions and may link saved records.

**Retention:** Keep images for audit period; allow purge after export if policy permits.

**Columns**

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | N | gen_random_uuid() | PK |
| farm_id | UUID | N | none | FK farms |
| user_id | UUID | N | none | FK users |
| slip_type | TEXT | N | unknown | daily/settlement/unknown |
| image_path | TEXT | N | none | storage |
| original_filename | TEXT | Y | NULL | filename |
| mime_type | TEXT | N | none | mime |
| file_size_bytes | BIGINT | N | 0 | size |
| original_size_bytes | BIGINT | Y | NULL | original size |
| compression_ratio | NUMERIC(5,2) | Y | NULL | compression |
| status | TEXT | N | uploaded | uploaded/processing/extracted/reviewed/saved/failed/cancelled |
| error_message | TEXT | Y | NULL | error |
| created_at | TIMESTAMPTZ | N | now() | created |
| updated_at | TIMESTAMPTZ | N | now() | updated |

**Indexes**

- `idx_ocr_uploads_farm_date`
- `idx_ocr_uploads_farm_status`

**Unique Constraints**

- none

**Foreign Keys**

- `farm_id references related table`
- `user_id references related table`

**Check Constraints**

- non-negative numeric values
- status/type enum checks where applicable
- farm_id required for tenant-owned tables

### ocr_extractions

**Description:** OCR and AI extraction result/audit.

**Relationships:** Belongs to OCR upload and farm; can link saved record.

**Retention:** Retain for debugging/audit period; redact sensitive fields by policy.

**Columns**

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | N | gen_random_uuid() | PK |
| upload_id | UUID | N | none | FK ocr_uploads |
| farm_id | UUID | N | none | FK farms |
| provider | TEXT | N | google_vision | provider |
| raw_text | TEXT | Y | NULL | OCR text |
| extracted_json | JSONB | N | {} | structured |
| confidence | NUMERIC(5,2) | N | 0 | confidence |
| warnings | JSONB | N | [] | warnings |
| validation_errors | JSONB | N | [] | errors |
| model_used | TEXT | Y | NULL | model |
| tokens_used | INTEGER | N | 0 | tokens |
| status | TEXT | N | pending_review | pending_review/accepted/rejected/corrected |
| reviewed_by | UUID | Y | NULL | FK users |
| reviewed_at | TIMESTAMPTZ | Y | NULL | reviewed |
| linked_record_table | TEXT | Y | NULL | table |
| linked_record_id | UUID | Y | NULL | row |
| created_at | TIMESTAMPTZ | N | now() | created |

**Indexes**

- `idx_ocr_extractions_farm_date`
- `idx_ocr_extractions_farm_status`
- `idx_ocr_extractions_farm_created_or_period`

**Unique Constraints**

- none

**Foreign Keys**

- `upload_id references related table`
- `farm_id references related table`
- `linked_record_id references related table`

**Check Constraints**

- non-negative numeric values
- status/type enum checks where applicable
- farm_id required for tenant-owned tables

### achievements

**Description:** Achievement catalog and rules.

**Relationships:** Referenced by progress and notifications.

**Retention:** Retain inactive definitions for historical earned achievements.

**Columns**

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | N | gen_random_uuid() | PK |
| code | TEXT | N | none | unique |
| title_mr | TEXT | N | none | Marathi title |
| title_en | TEXT | N | none | English title |
| description_mr | TEXT | N | none | Marathi desc |
| description_en | TEXT | N | none | English desc |
| category | TEXT | N | milk | category |
| target_type | TEXT | N | count | type |
| target_value | NUMERIC(14,2) | N | 1 | target |
| points | INTEGER | N | 0 | points |
| is_hidden | BOOLEAN | N | false | hidden |
| is_active | BOOLEAN | N | true | active |
| created_at | TIMESTAMPTZ | N | now() | created |

**Indexes**

- `idx_achievements_created`

**Unique Constraints**

- code unique

**Foreign Keys**

- None

**Check Constraints**

- non-negative numeric values
- status/type enum checks where applicable
- farm_id required for tenant-owned tables

### leaderboard_entries

**Description:** Materialized ranking rows.

**Relationships:** Computed from milk, activity, OCR, AI and score data.

**Retention:** Retain monthly/annual snapshots; recalculate current period.

**Columns**

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | N | gen_random_uuid() | PK |
| farm_id | UUID | N | none | FK farms |
| leaderboard_type | TEXT | N | dairy_score | type |
| scope_type | TEXT | N | platform | platform/district/taluka |
| scope_value | TEXT | Y | NULL | value |
| period_start | DATE | N | none | start |
| period_end | DATE | N | none | end |
| score | NUMERIC(14,2) | N | 0 | score |
| rank | INTEGER | N | 0 | rank |
| metrics | JSONB | N | {} | metrics |
| calculated_at | TIMESTAMPTZ | N | now() | calculated |

**Indexes**

- `idx_leaderboard_entries_farm_date`
- `idx_leaderboard_entries_farm_status`

**Unique Constraints**

- unique leaderboard_type plus scope plus period plus farm_id

**Foreign Keys**

- `farm_id references related table`

**Check Constraints**

- non-negative numeric values
- status/type enum checks where applicable
- farm_id required for tenant-owned tables

### support_tickets

**Description:** User support ticket master.

**Relationships:** Has support_messages and attachments; can notify users/admins.

**Retention:** Retain support history for service quality and legal policy.

**Columns**

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | N | gen_random_uuid() | PK |
| farm_id | UUID | Y | NULL | FK farms |
| user_id | UUID | N | none | FK users |
| ticket_no | TEXT | N | generated | unique |
| subject | TEXT | N | none | subject |
| category | TEXT | N | technical | category |
| priority | TEXT | N | medium | low/medium/high/critical |
| status | TEXT | N | open | open/in_progress/waiting_for_user/resolved/closed/rejected |
| assigned_to | UUID | Y | NULL | FK users |
| description | TEXT | N | none | description |
| sla_due_at | TIMESTAMPTZ | Y | NULL | due |
| resolved_at | TIMESTAMPTZ | Y | NULL | resolved |
| closed_at | TIMESTAMPTZ | Y | NULL | closed |
| created_at | TIMESTAMPTZ | N | now() | created |
| updated_at | TIMESTAMPTZ | N | now() | updated |

**Indexes**

- `idx_support_tickets_farm_date`
- `idx_support_tickets_farm_status`

**Unique Constraints**

- ticket_no unique

**Foreign Keys**

- `farm_id references related table`
- `user_id references related table`

**Check Constraints**

- non-negative numeric values
- status/type enum checks where applicable
- farm_id required for tenant-owned tables

### support_messages

**Description:** Support ticket conversation messages.

**Relationships:** Belongs to support_tickets and sender user.

**Retention:** Retain with ticket according to support retention policy.

**Columns**

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | N | gen_random_uuid() | PK |
| ticket_id | UUID | N | none | FK support_tickets |
| farm_id | UUID | Y | NULL | FK farms |
| sender_user_id | UUID | N | none | FK users |
| sender_role | TEXT | N | user | user/support/admin/system |
| message | TEXT | N | none | message |
| attachments | JSONB | N | [] | attachments |
| internal_only | BOOLEAN | N | false | internal |
| created_at | TIMESTAMPTZ | N | now() | created |

**Indexes**

- `idx_support_messages_farm_date`
- `idx_support_messages_farm_status`

**Unique Constraints**

- none

**Foreign Keys**

- `ticket_id references related table`
- `farm_id references related table`
- `sender_user_id references related table`

**Check Constraints**

- non-negative numeric values
- status/type enum checks where applicable
- farm_id required for tenant-owned tables

### backups

**Description:** Farm export/backup jobs and files.

**Relationships:** Belongs to farm/user; file stored in backups bucket.

**Retention:** Retain according to user schedule and storage policy.

**Columns**

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | N | gen_random_uuid() | PK |
| farm_id | UUID | N | none | FK farms |
| user_id | UUID | N | none | FK users |
| backup_type | TEXT | N | full | full/incremental |
| scope | JSONB | N | {} | scope |
| format | TEXT | N | json | json/zip/xlsx |
| file_path | TEXT | Y | NULL | storage |
| status | TEXT | N | queued | queued/processing/completed/failed/restoring/restored/expired |
| size_bytes | BIGINT | N | 0 | size |
| record_count | INTEGER | N | 0 | count |
| checksum | TEXT | Y | NULL | sha256 |
| error_message | TEXT | Y | NULL | error |
| expires_at | TIMESTAMPTZ | Y | NULL | expiry |
| restored_at | TIMESTAMPTZ | Y | NULL | restored |
| created_at | TIMESTAMPTZ | N | now() | created |

**Indexes**

- `idx_backups_farm_date`
- `idx_backups_farm_status`

**Unique Constraints**

- none

**Foreign Keys**

- `farm_id references related table`
- `user_id references related table`

**Check Constraints**

- non-negative numeric values
- status/type enum checks where applicable
- farm_id required for tenant-owned tables

### audit_logs

**Description:** Immutable audit and security event ledger.

**Relationships:** Belongs to farm/user where applicable and references changed entity.

**Retention:** Retain minimum 3 years or per compliance policy; append-only.

**Columns**

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | N | gen_random_uuid() | PK |
| farm_id | UUID | Y | NULL | FK farms |
| user_id | UUID | Y | NULL | FK users |
| actor_role | TEXT | Y | NULL | role |
| event_type | TEXT | N | data_change | type |
| entity_table | TEXT | Y | NULL | table |
| entity_id | UUID | Y | NULL | row |
| action | TEXT | N | none | action |
| old_values | JSONB | Y | NULL | before |
| new_values | JSONB | Y | NULL | after |
| ip_address | INET | Y | NULL | ip |
| device_id | TEXT | Y | NULL | device |
| severity | TEXT | N | info | info/warning/high/critical |
| created_at | TIMESTAMPTZ | N | now() | event |

**Indexes**

- `idx_audit_logs_farm_date`
- `idx_audit_logs_farm_status`
- `idx_audit_logs_farm_created_or_period`

**Unique Constraints**

- none

**Foreign Keys**

- `farm_id references related table`
- `user_id references related table`
- `entity_id references related table`
- `device_id references related table`

**Check Constraints**

- non-negative numeric values
- status/type enum checks where applicable
- farm_id required for tenant-owned tables

### settings

**Description:** Generic user/farm settings registry.

**Relationships:** Belongs to farm and/or user. User settings override farm defaults.

**Retention:** Retain latest settings; audit changes in audit_logs.

**Columns**

| Column | Type | Nullable | Default | Notes |
| --- | --- | --- | --- | --- |
| id | UUID | N | gen_random_uuid() | PK |
| farm_id | UUID | Y | NULL | FK farms |
| user_id | UUID | Y | NULL | FK users |
| category | TEXT | N | general | category |
| setting_key | TEXT | N | none | key |
| setting_value | JSONB | N | {} | value |
| updated_by | UUID | Y | NULL | FK users |
| created_at | TIMESTAMPTZ | N | now() | created |
| updated_at | TIMESTAMPTZ | N | now() | updated |

**Indexes**

- `idx_settings_farm_date`
- `idx_settings_farm_status`

**Unique Constraints**

- unique farm/user category setting_key

**Foreign Keys**

- `farm_id references related table`
- `user_id references related table`

**Check Constraints**

- non-negative numeric values
- status/type enum checks where applicable
- farm_id required for tenant-owned tables

## 4. Entity Relationships

| Parent | Child | Cardinality | Foreign Key | Delete / Update Rule |
| --- | --- | --- | --- | --- |
| users | farms | 1:N | farms.owner_user_id | RESTRICT until farm transfer |
| users | farm_members | 1:N | farm_members.user_id | CASCADE membership |
| farms | farm_members | 1:N | farm_members.farm_id | CASCADE tenant membership |
| farms | cows | 1:N | cows.farm_id | CASCADE on farm deletion |
| farms | calves | 1:N | calves.farm_id | CASCADE on farm deletion |
| cows | calves | 1:N | calves.mother_cow_id | SET NULL for lineage history |
| farms | milk_records | 1:N | milk_records.farm_id | CASCADE on farm deletion; soft delete normally |
| cows | milk_records | 1:N | milk_records.cow_id | SET NULL to retain farm record |
| farms | settlements | 1:N | settlements.farm_id | CASCADE on farm deletion |
| settlements | settlement_items | 1:N | settlement_items.settlement_id | CASCADE with settlement |
| milk_records | settlement_items | 1:N | settlement_items.matched_milk_record_id | SET NULL |
| farms | expenses | 1:N | expenses.farm_id | CASCADE on farm deletion |
| settlements | expenses | 1:N | expenses.settlement_id | SET NULL; soft-delete source preferred |
| cows | breeding_records | 1:N | breeding_records.cow_id | CASCADE animal lifecycle |
| cows | calving_records | 1:N | calving_records.cow_id | CASCADE animal lifecycle |
| calving_records | calves | 1:1 optional | calving_records.calf_id | SET NULL |
| farms | reminders | 1:N | reminders.farm_id | CASCADE tenant reminders |
| cows | reminders | 1:N | reminders.cow_id | SET NULL historical reminder |
| calves | reminders | 1:N | reminders.calf_id | SET NULL historical reminder |
| users | goals | 1:N | goals.user_id | CASCADE user goals |
| farms | goals | 1:N | goals.farm_id | CASCADE farm goals |
| notifications | notification_logs | 1:N | notification_logs.notification_id | CASCADE delivery logs |
| users | notification_logs | 1:N | notification_logs.user_id | CASCADE user logs |
| ai_chats | ai_messages | 1:N | ai_messages.chat_id | CASCADE chat messages |
| ocr_uploads | ocr_extractions | 1:N | ocr_extractions.upload_id | CASCADE extraction attempts |
| support_tickets | support_messages | 1:N | support_messages.ticket_id | CASCADE messages |
| farms | backups | 1:N | backups.farm_id | CASCADE backup metadata |
| farms | audit_logs | 1:N | audit_logs.farm_id | SET NULL after deletion/anonymization review |
| farms | settings | 1:N | settings.farm_id | CASCADE farm settings |
| users | settings | 1:N | settings.user_id | CASCADE user settings |


## 5. Reporting and Aggregation Design

| View | Purpose | Refresh |
| --- | --- | --- |
| mv_daily_farm_milk_summary | Daily morning/evening/total liters, amount, fat, SNF | On save or hourly |
| mv_monthly_farm_milk_summary | Monthly production and income | On settlement save and nightly |
| mv_monthly_financial_summary | Income, feed deduction, manual expenses, profit | On expense/settlement save |
| mv_farm_health_snapshot | Farm health score components | Nightly and on admin request |
| mv_leaderboard_current | Current ranking by scope and metric | Every 6 hours |

## 6. Performance Design

- All list queries must include `farm_id`, date range and pagination.
- Financial and milk reports should read from summary/materialized views where possible.
- OCR and AI logs should be partitioned or archived after the active analysis window.
- Export jobs should stream data in chunks instead of loading complete farm backups into memory.

## 7. Backup and Disaster Recovery Data Design

- `backups` stores metadata, checksum and restore status.
- Backup files are stored in the `backups` bucket with owner-only signed URLs.
- RPO target: 24 hours or better through Supabase managed backups.
- RTO target: 4 hours for database metadata, 24 hours for full file restore.

## 8. Migration Strategy

| Current / Legacy Table | Target Table / Strategy |
| --- | --- |
| dairy_settlements | settlements; keep compatibility view during migration |
| dairy_slips and slip_uploads | ocr_uploads, ocr_extractions, milk_records |
| ai_records | breeding_records; keep view for old UI until migrated |
| finance_records and monthly_expenses | expenses and monthly summary views |
| ai_assistant_logs | ai_chats and ai_messages |
| notification_delivery_logs | notification_logs |

## 9. Implementation Roadmap and Effort Estimate

| Phase | Scope | Backend Deliverables | Estimate |
| --- | --- | --- | --- |
| 1 | Authentication | Supabase Auth, users, farm_members, RLS helpers | 5-8 days |
| 2 | Farm Management | farms, settings, membership workflows | 4-6 days |
| 3 | Cow/Calf Management | cows, calves, lifecycle triggers | 7-10 days |
| 4 | Milk Records | milk_records, summaries, duplicate rules | 8-12 days |
| 5 | Accounting | settlements, expenses, financial summaries | 10-14 days |
| 6 | AI and OCR | ocr_uploads, ocr_extractions, ai_chats/messages | 10-15 days |
| 7 | Reports | reports, export jobs, materialized views | 7-10 days |
| 8 | Admin | admin analytics, support, notifications, audit | 10-15 days |

## 10. Acceptance Checklist

- All farm-owned tables have `farm_id` and RLS enabled.
- All high-volume tables have composite farm/date indexes.
- Every financial table has non-negative amount checks.
- Every AI/OCR-generated financial record stores raw extraction/audit metadata.
- Settlement deletion reverses derived expense/report data in a transaction.
- Support/admin actions create audit logs.
