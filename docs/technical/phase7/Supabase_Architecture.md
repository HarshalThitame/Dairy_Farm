# Supabase Architecture Document

**Document Version:** 1.0  
**Date:** 2026-06-07  
**Application:** Majhi Dairy

## 1. Supabase Components

| Component | Use in Majhi Dairy |
| --- | --- |
| Supabase Auth | Signup, login, password recovery, session management and JWT identity |
| PostgreSQL | Primary relational database and tenant data store |
| Row Level Security | Tenant isolation and role-based access |
| Supabase Storage | Profile photos, animal photos, OCR slips, reports, backups and support attachments |
| Realtime | Notification inbox updates, selected dashboard events and admin monitoring |
| Edge Functions / Server APIs | OCR, AI, report export, backup/restore, push notifications |
| Cron / Scheduled Jobs | Reminder generation, leaderboard refresh, backups and summary refresh |

## 2. Auth Architecture

- Supabase Auth stores credentials and identity.
- `public.users` is created/updated by signup trigger or onboarding API.
- New users select Marathi or English before entering the app; default is Marathi.
- Farm authorization is resolved through `farm_members`, not client state.

## 3. Storage Buckets

| Bucket | Purpose | Max Size | Allowed Types | Access Rules | Retention |
| --- | --- | --- | --- | --- | --- |
| profile-images | User avatars | 5 MB | JPG, PNG, WEBP | Owner write; members read allowed avatars | Account lifetime |
| cow-images | Cow photos | 8 MB | JPG, PNG, WEBP | Farm animal editors write; farm members read | Animal lifetime |
| calf-images | Calf photos | 8 MB | JPG, PNG, WEBP | Farm animal editors write; farm members read | Animal lifetime |
| health-documents | Health attachments | 10 MB | JPG, PNG, WEBP, PDF | Health editors write; farm/vet read | Health record lifetime |
| ocr-slips | Daily and settlement slips | 12 MB | JPG, PNG, WEBP, PDF | Farm manager write/read through signed URLs | Audit retention period |
| reports | Generated reports | 50 MB | PDF, XLSX, CSV, JSON | Signed URL to authorized farm members | Configurable expiry |
| backups | Farm backups | 1 GB | ZIP, JSON, XLSX | Owner/admin only, signed URLs, no public access | Backup retention policy |
| support-attachments | Ticket attachments | 10 MB | JPG, PNG, PDF, DOCX | Ticket owner and support/admin read | Ticket retention period |


## 4. OCR Architecture

1. Client captures or selects native-camera image and compresses only if needed.
2. Client uploads to `ocr-slips` using signed URL.
3. Server creates `ocr_uploads` and processes OCR with provider key server-side.
4. AI structures OCR text into strict JSON.
5. Validation engine checks totals, formulae and impossible values.
6. User reviews and explicitly saves.
7. Save creates `milk_records` or `settlements`, `settlement_items`, `expenses` and audit rows.

## 5. AI Assistant Architecture

- AI never directly executes raw SQL.
- Server exposes typed read-only tools for farm analytics.
- AI permissions are checked against settings before tool execution.
- Tool results are stored in `ai_messages.data_sources`.

## 6. Notification Architecture

- `notifications` stores message content and schedule.
- `notification_logs` stores recipient delivery/read/click status.
- Push keys and fanout run only server-side.
- Sensitive financial details should not be included in push payload unless explicitly allowed.

## 7. Security and Secrets

- `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are client-safe.
- `SUPABASE_SERVICE_ROLE_KEY`, AI keys, OCR keys and push keys are server-only.
- Service role must never be bundled into browser code.

## 8. Authentication Sequence Diagrams

### 8.1 Signup and First-Time Language Selection

```text
User -> App: open signup
App -> Supabase Auth: create auth user
Supabase Auth -> App: user id + session
App -> API: create users profile and default farm/member
API -> PostgreSQL: insert users, farms, farm_members
App -> Language Screen: Marathi / English selection
User -> App: select language
App -> API: save users.default_language and settings.language
API -> PostgreSQL: audit language selection
App -> Dashboard: load selected language bundle
```

### 8.2 Login and Session Resolution

```text
User -> App: login
App -> Supabase Auth: sign in
Supabase Auth -> App: JWT session
App -> PostgreSQL: read users profile
App -> PostgreSQL: read farm_members and active farm
RLS -> PostgreSQL: allow only accessible farms
App -> Dashboard: render tenant-scoped data
```

### 8.3 PIN Login

```text
User -> App: enter PIN
App -> Local secure state: verify app-level lock/session validity
App -> Supabase: refresh or validate existing session
App -> PostgreSQL: read profile and active farm
App -> Audit: log successful/failed PIN attempt where server-side PIN is used
```

## 9. OCR Error Handling and Retry Logic

| Failure | System Behavior |
| --- | --- |
| Upload interrupted | Keep local pending queue; retry when online. |
| OCR provider unavailable | Mark `ocr_uploads.status = failed`; allow retry; do not create financial records. |
| AI JSON invalid | Retry with strict JSON repair once; if still invalid show manual entry. |
| Validation mismatch | Show warning and block direct save until corrected. |
| Low confidence | Require manual review and visible field highlights. |
| Duplicate slip | Show existing record and require explicit replace/skip decision. |

## 10. AI Request and Response Flow

```text
User Question
  -> AI API route
  -> Load user AI settings and data permissions
  -> Intent classification
  -> Approved function/tool call only
  -> Database query with farm_id and RLS/service validation
  -> Tool result summary
  -> AI Marathi/English response
  -> ai_messages audit with tools, data sources, tokens and latency
```

Caching rules:

- Simple dashboard metrics may be cached for 60-300 seconds per farm.
- AI tool results must include source date range and cannot be reused across farms.
- Financial answers should prefer materialized summaries but must expose period and source.
- AI responses must not cache personal/support-ticket data beyond chat history policy.

## 11. Reporting Architecture

| Report Type | Primary Source | Optimization |
| --- | --- | --- |
| Daily milk report | milk_records | farm_id + record_date index |
| Monthly milk report | mv_monthly_farm_milk_summary | materialized view refresh |
| Settlement report | settlements, settlement_items | period index |
| Expense report | expenses | accounting_month index |
| Profit/loss report | monthly financial summary | materialized view |
| Cow performance | cows, milk_records, health_records | cow/date index |
| Annual report | monthly summaries | async export job |

Export processing must be async for large ranges and store output in `reports` bucket with expiry and signed download URL.

## 12. Notification Delivery Architecture

```text
Event/Reminder/Admin Message
  -> notifications row
  -> target resolution
  -> notification_logs per recipient/channel
  -> in-app realtime insert
  -> push fanout from server
  -> retry failed push deliveries
  -> read/open/click tracking
```

Retry policy:

- Retry transient push failures 3 times with exponential backoff.
- Mark invalid subscriptions as inactive after permanent endpoint failure.
- Critical admin messages should remain in-app even if push fails.
- Quiet hours should delay non-critical notification delivery.

## 13. Audit Logging Architecture

Audit events are required for:

- Signup, login failure, password/PIN changes and session logout.
- Farm create/update/suspend/delete and subscription changes.
- Cow/calf lifecycle changes, breeding, calving and reminder actions.
- Financial creates/updates/deletes, settlement save/delete and summary recalculation.
- OCR extraction, review, correction and save.
- AI tool usage and data permission changes.
- Backup create/download/restore.
- Admin protected actions and support ticket status changes.

## 14. Backup and Disaster Recovery Architecture

- Supabase managed backups protect database recovery.
- Application-level farm backups support user-initiated export/restore.
- Backup files must include schema version, generated_at, farm_id, row counts and checksum.
- Restore requires owner/admin authorization, checksum validation and audit log.
- Restore must run in dependency order: farms, members, animals, records, accounting, reminders, settings, derived data.

## 15. Database Performance Architecture

- Use PgBouncer/Supabase pooling for server-side workloads.
- Avoid N+1 dashboard queries; use RPC or summary views.
- Paginate admin farm/user lists.
- Partition high-volume audit, notification and AI/OCR logs.
- Use generated/accounting month columns for monthly filters.
- Keep JSONB indexes only where query patterns require them.

## 16. Security Architecture

- RLS is mandatory for client-visible tables.
- Service role is server-only and never exposed in Next.js client bundles.
- Storage buckets use private access and signed URLs.
- Financial values use NUMERIC and transaction-safe writes.
- AI and OCR provider keys are stored only as server environment variables.
- Admin impersonation, deletion, suspension and subscription changes require audit logs.
