# Majhi Dairy Integration Specification

**Document Version:** 1.0  
**Date:** 2026-06-07

## 1. Integration Overview

Majhi Dairy integrates with Supabase, OpenAI, OCR provider, web push, Supabase Storage and analytics/monitoring services. All provider keys are server-side only.

## 2. Integration Matrix

| Integration | Purpose | Authentication | Data Flow | Retry Logic | Failure Handling | Rate Limits |
| --- | --- | --- | --- | --- | --- | --- |
| Supabase Auth | Identity and sessions | Supabase client/session JWT | Client signs in; server validates JWT; profile loaded from users | Provider-managed refresh; client retries safe reads | AUTH_REQUIRED or SESSION_EXPIRED; redirect to login | Auth provider limits plus app login throttling |
| Supabase PostgreSQL | Tenant data store | Anon key with RLS; service role server-only | Client/RPC/API reads and writes farm-scoped data | Retry idempotent reads; no blind retry for financial writes | Rollback transactions; audit failures | Connection pooling and query limits |
| Supabase Storage | Private file storage | Signed URLs and RLS storage policies | Upload slip/images/reports/backups through signed URLs | Retry resumable/offline uploads | Mark job failed/pending; no orphan business save | File size/type limits per bucket |
| OpenAI | AI assistant and optional OCR fallback | Server-side API key | Server builds tool-safe prompt, executes typed tools, stores chat messages | Retry transient 429/5xx with backoff and budget cap | AI_UNAVAILABLE; no fake data; preserve user question | Per-user/farm AI quotas |
| OCR Provider | Extract text from slip images | Server-side API key | Server sends compressed image, receives OCR text, validates, calls AI structuring | Retry provider timeout/5xx; fallback per policy | OCR_FAILED; user can retry/rescan/manual entry | Per-farm OCR quotas and provider limits |
| Push Notification Service | Mobile/browser push | VAPID/private server keys | Server sends to stored subscriptions; logs delivery | Retry transient failures 3 times | Invalid endpoint deactivated; in-app remains | Per-user notification throttling |
| Analytics/Monitoring | Usage, performance and error monitoring | Server-side token | Server emits non-sensitive events and metrics | Buffered retry | Drop non-critical analytics after buffer expires | Batch limits |


## 3. Supabase Data Flow

```text
Frontend -> Supabase Auth -> JWT
Frontend -> Supabase PostgREST/RPC with anon key
RLS -> farm_members/users policies
PostgreSQL -> response
Server APIs -> service role only for trusted jobs
```

## 4. OpenAI Integration Contract

- AI requests are accepted only when AI is enabled in settings.
- Tool execution is server-controlled; GPT never receives raw SQL access.
- Data permissions determine whether tools can use milk, slip, analytics or animal data.
- Store `tokens_input`, `tokens_output`, `latency_ms`, `tool_calls` and `data_sources`.
- AI responses must be in selected language unless user explicitly asks otherwise.

## 5. OCR Integration Contract

- Client compresses image where needed before upload.
- Server sends image/OCR text to provider; provider credentials remain secret.
- Extraction output must be strict JSON and validated before preview.
- Summary totals on settlement slips are authoritative for reports.
- If OCR/AI values conflict with validation rules, save is blocked until manual review.

## 6. Push Notification Contract

- Browser/device registers push subscription through `/v1/push/subscriptions`.
- Server stores endpoint hash and encrypted keys where applicable.
- Admin/reminder/goal events create in-app notification first.
- Push delivery is best effort; in-app notification is source of truth.

## 7. Failure and Recovery Standards

| Failure | Recovery |
| --- | --- |
| Provider timeout | Retry with exponential backoff if idempotent |
| Invalid API key | Disable provider path, alert admin, return service unavailable |
| Rate limit | Return RATE_LIMITED with retryAfter |
| Partial transaction failure | Rollback and write server error log |
| Offline client | Queue local action where safe; financial conflicts require review |

