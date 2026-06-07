# Backend Technical Design

**Document Version:** 1.0  
**Date:** 2026-06-07  
**Application:** Majhi Dairy

## 1. Backend Architecture

Majhi Dairy uses Supabase as the primary backend with Next.js server routes for trusted operations requiring secrets or service-role access. Browser code uses Supabase anon client for normal RLS-protected reads and writes.

## 2. Backend Service Boundaries

| Service | Tables | Server Required | Notes |
| --- | --- | --- | --- |
| Auth/Profile | users, farm_members, settings | Partial | Signup trigger plus onboarding APIs |
| Farm/Animals | farms, cows, calves | No for normal CRUD | RLS protected direct Supabase allowed |
| Records/Reminders | milk_records, health_records, reminders | Partial | Server for lifecycle jobs and bulk imports |
| Accounting | settlements, settlement_items, expenses | Yes | Financial save must be transactional and auditable |
| OCR | ocr_uploads, ocr_extractions | Yes | Provider API keys never exposed |
| AI Assistant | ai_chats, ai_messages | Yes | Function calling, data permissions, rate limiting |
| Reports | reports | Yes | Async generation and storage signed URLs |
| Notifications | notifications, notification_logs | Yes for push | Push keys and fanout server-only |
| Support | support_tickets, support_messages | Partial | RLS plus admin assignment server-side |
| Backup | backups | Yes | Service role and file generation |
| Admin | all | Yes | Role checks and audit required |

## 3. API / RPC Catalog

| Endpoint / Function | Method | Purpose | Security |
| --- | --- | --- | --- |
| /api/onboarding/language | POST | Save first-time language preference | Auth required; own profile/settings only |
| /api/auth/pin/setup | POST | Set PIN hash if enabled | Re-auth required |
| rpc.create_farm_for_user | RPC | Create farm and owner membership transaction | Auth required; SECURITY DEFINER with validation |
| rpc.register_cow | RPC | Create cow and optional calved calf form | Farm manager |
| rpc.record_calving_with_calf | RPC | Create calving, calf, cow status and reminders | Farm manager; transaction |
| rpc.save_milk_record | RPC | Insert/update manual or daily-slip milk record | Farm manager |
| rpc.save_settlement | RPC | Save reviewed 15-day settlement and derived feed expense | Farm manager; transaction |
| rpc.delete_settlement | RPC | Soft delete settlement and reverse derived rows | Owner/admin; transaction |
| /api/ocr/upload | POST | Create signed upload and job | Farm manager |
| /api/ocr/process | POST | Run OCR, AI extraction and validation | Server-only service role |
| /api/ocr/review-save | POST | Save user-confirmed extraction | Farm manager; never auto-save |
| /api/ai/chat | POST | Function-calling dairy assistant | Auth, farm access, AI enabled |
| /api/reports/generate | POST | Queue report generation | Report permission |
| /api/backups/create | POST | Queue full/incremental backup | Owner/admin |
| /api/notifications/send | POST | Admin broadcast or targeted notification | Admin/super admin |
| /api/admin/farms/:id | GET | Farm monitoring dashboard | Admin/super admin; audit read |

## 4. Transaction Requirements

### Settlement Save

```text
BEGIN
  validate farm access and status
  insert/update settlements
  replace settlement_items for corrected settlement
  create/update derived feed expense using settlement period month
  link accepted OCR extraction if OCR-originated
  refresh or enqueue monthly summary
  write audit_logs
COMMIT
```

### Calving With Calf

```text
BEGIN
  create calving_records
  create calf if provided
  update cow status
  cancel completed lifecycle reminders
  create calf care and next breeding reminders
  write audit_logs
COMMIT
```

## 5. Validation Engine

| Domain | Validation Rules |
| --- | --- |
| Milk | No negative liters; fat/SNF range; amount equals liters times rate within tolerance; duplicate policy enforced |
| Settlement | Summary totals have priority; feed deduction equals slip total deduction; net amount formula validated |
| OCR | Impossible values flagged; low confidence blocks direct save; torn rows stored as NULL |
| Reminders | Sold/dead/archived animals do not receive future reminders; source duplicates blocked |
| AI | Data permissions checked before tool execution; no raw SQL from model |
| Backup | Checksum and schema version verified before restore |

## 6. Background Jobs

| Job | Frequency | Purpose |
| --- | --- | --- |
| Reminder activation | Daily/hourly | Move scheduled reminders to active and send notifications |
| Slip due banner | Daily | Detect missing 1-15 and 16-end settlement uploads |
| Materialized summary refresh | Hourly/nightly | Refresh dashboard/report aggregates |
| Leaderboard refresh | Every 6 hours | Recalculate rankings |
| Backup schedule | Daily | Create auto backups |
| Notification retry | Every 15 minutes | Retry failed push notifications |
| Audit archive | Monthly | Move old audit partitions to archive storage |

## 7. Performance Targets

| Operation | Target |
| --- | --- |
| Home dashboard API | Under 500 ms from summary views |
| Milk record save | Under 700 ms |
| Settlement save after review | Under 2 seconds |
| OCR processing | Show progress; target 10-30 seconds provider-dependent |
| AI answer | Under 5 seconds for simple analytics |
| Monthly report generation | Under 30 seconds; async for annual exports |

## 8. Data Access Layer Standards

- Every server query must pass an explicit `farmId` resolved from authenticated user membership unless it is a platform-admin query.
- Direct table writes are allowed only for simple CRUD that RLS safely protects.
- Financial multi-table writes must use RPC or a single trusted API transaction.
- AI tools must use read-only functions with typed parameters and validated date ranges.
- Admin APIs must never trust farm_id or user_id from URL without role validation.

## 9. Core RPC Specifications

### 9.1 `save_settlement`

Input:

```json
{
  "farm_id": "uuid",
  "period_start": "YYYY-MM-DD",
  "period_end": "YYYY-MM-DD",
  "morning_total_liters": 2117.50,
  "evening_total_liters": 2128.06,
  "total_income": 136404.32,
  "feed_deduction": 7349.80,
  "net_amount": 129054.00,
  "items": []
}
```

Rules:

- Summary totals from settlement slip are authoritative for reporting.
- Daily slip entries override individual settlement item rows where exact date/session exists.
- `feed_deduction` creates or updates one settlement-sourced expense in the settlement period month.
- Deleting settlement reverses derived expense and refreshes reports.

### 9.2 `record_calving_with_calf`

Rules:

- Creates calving record and optional calf in one transaction.
- Marks related breeding record as calved.
- Cancels pregnancy/dry-off/calving reminders for completed lifecycle.
- Creates calf reminders such as dehorning 30-45 days and weaning/milk reduction.

### 9.3 `save_milk_record`

Rules:

- Prevent exact duplicate by farm/date/session/source unless correction mode is used.
- Calculates total liters and amount when formula inputs are present.
- Never silently overwrites OCR/manual records without explicit action.

## 10. Error Codes

| Code | Meaning | User Handling |
| --- | --- | --- |
| AUTH_REQUIRED | Missing/expired session | Redirect to login. |
| FARM_ACCESS_DENIED | User does not belong to farm | Show permission error and audit if suspicious. |
| VALIDATION_FAILED | Business validation failed | Highlight fields. |
| DUPLICATE_RECORD | Existing record found | Show replace/skip options. |
| OCR_LOW_CONFIDENCE | OCR result unsafe | Require correction/rescan. |
| FINANCIAL_MISMATCH | Formula/totals conflict | Block save until reviewed. |
| PROVIDER_UNAVAILABLE | AI/OCR/push provider failed | Retry or fallback. |
| RATE_LIMITED | Too many requests | Show wait message. |

## 11. Offline Sync Design

- Offline-captured slips and records are stored locally with temporary ids.
- Sync worker uploads pending items when online.
- Server returns conflict status when a record already exists.
- User must resolve conflicts for financial records; app must not auto-merge money values.
- Sync metadata should include device id, local created_at and retry count.

## 12. Admin Backend Design

Admin endpoints must provide:

- Farm details dashboard from aggregate views.
- Farm device/session list from login/session tables.
- Subscription extend/reduce/update with confirmation and audit.
- Notification center delivery and analytics.
- Support ticket assignment and SLA tracking.
- Export farm data and protected delete flow.

Every admin mutation must include:

```json
{
  "reason": "admin-entered reason",
  "confirmation": true,
  "actor_user_id": "uuid",
  "target_farm_id": "uuid"
}
```

## 13. Deployment and Migration Order

1. Add new target tables and helper functions.
2. Enable RLS with permissive read parity in staging only.
3. Backfill from current tables into target schema.
4. Add compatibility views for old table names.
5. Switch server APIs to target schema.
6. Switch client reads to target schema or views.
7. Run reconciliation reports for milk/accounting/reminders.
8. Lock old tables read-only.
9. Remove old tables only after backup and sign-off.

## 14. Backend QA Checklist

- Cross-farm access blocked for all endpoints.
- Settlement save/delete is fully reversible.
- Feed deduction appears in correct settlement month.
- Daily slip overrides settlement item rows only at item level, not summary totals.
- AI disabled setting blocks AI chat endpoint.
- AI data permissions affect tool execution.
- Push notification registration and delivery works on Android and iOS-supported browser constraints.
- Offline queue sync does not create duplicate financial records.
