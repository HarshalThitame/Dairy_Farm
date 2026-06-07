# Majhi Dairy Security Architecture

**Document Version:** 1.0  
**Date:** 2026-06-07  
**Application:** Majhi Dairy  
**Stack:** Next.js, React, TypeScript, Supabase, PostgreSQL, OpenAI APIs, OCR Services  
**Languages:** Marathi and English

## 1. Security Architecture Overview

Majhi Dairy uses a defense-in-depth model: Supabase Auth for identity, PostgreSQL Row Level Security for tenant isolation, private Supabase Storage for files, trusted server APIs for AI/OCR/push/admin operations, and immutable audit logs for accountability.

### 1.1 Security Principles

- Least privilege by default.
- Farm-level tenant isolation.
- No secrets in client code.
- Financial data is never silently changed by AI/OCR.
- Private files with short-lived signed access.
- High-risk actions require confirmation and audit.
- Marathi/English user messages must not expose sensitive internals.

### 1.2 High-Level Security Diagram

```text
Browser/PWA
  -> Supabase Auth JWT
  -> RLS-protected PostgreSQL / Storage signed URLs
  -> Trusted Next.js Server APIs
       -> Service role for controlled transactions/jobs
       -> OpenAI/OCR/Push providers with server-only keys
       -> Audit logs and monitoring
```

### 1.3 Trust Boundaries

| Boundary | Trusted? | Controls |
| --- | --- | --- |
| Browser/PWA | Untrusted | JWT, input validation, no service keys |
| Next.js server APIs | Trusted application boundary | Role checks, service role, audit, rate limits |
| Supabase PostgreSQL | Trusted data boundary | RLS, constraints, transactions, backups |
| Supabase Storage | Trusted file boundary | Private buckets, signed URLs, metadata RLS |
| AI/OCR providers | External processor | Minimized data, provider keys server-only, retention controls |
| Admin panel | Privileged boundary | RBAC, confirmation, audit, monitoring |


## 2. Threat Modeling - STRIDE

| Threat ID | STRIDE | Threat Description | Affected Components | Likelihood | Impact | Risk Rating | Mitigation | Residual Risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| TH-001 | Spoofing | Spoofing threat against authentication could compromise tenant data, trust or availability. | Authentication | Low | Critical | High | Strong authentication, token validation, session expiry and device/session audit. | Low |
| TH-002 | Tampering | Tampering threat against authentication could compromise tenant data, trust or availability. | Authentication | Medium | Critical | Critical | Input validation, RLS, transaction integrity, audit logs and protected actions. | Medium |
| TH-003 | Repudiation | Repudiation threat against authentication could compromise tenant data, trust or availability. | Authentication | Low | Critical | High | Immutable audit logs with actor, timestamp, IP/device and before/after metadata. | Low |
| TH-004 | Information Disclosure | Information Disclosure threat against authentication could compromise tenant data, trust or availability. | Authentication | Medium | Critical | Critical | Farm-scoped RLS, private storage, least privilege, redaction and signed URLs. | Medium |
| TH-005 | Denial of Service | Denial of Service threat against authentication could compromise tenant data, trust or availability. | Authentication | Medium | Critical | Critical | Rate limits, pagination, async jobs, quotas, provider timeout and monitoring. | Medium |
| TH-006 | Elevation of Privilege | Elevation of Privilege threat against authentication could compromise tenant data, trust or availability. | Authentication | Low | Critical | High | RBAC, role hierarchy, server-side checks, admin confirmation and audit. | Low |
| TH-007 | Spoofing | Spoofing threat against dashboard could compromise tenant data, trust or availability. | Dashboard | Low | Medium | Medium | Strong authentication, token validation, session expiry and device/session audit. | Low |
| TH-008 | Tampering | Tampering threat against dashboard could compromise tenant data, trust or availability. | Dashboard | Medium | Medium | Medium | Input validation, RLS, transaction integrity, audit logs and protected actions. | Low |
| TH-009 | Repudiation | Repudiation threat against dashboard could compromise tenant data, trust or availability. | Dashboard | Low | Medium | Medium | Immutable audit logs with actor, timestamp, IP/device and before/after metadata. | Low |
| TH-010 | Information Disclosure | Information Disclosure threat against dashboard could compromise tenant data, trust or availability. | Dashboard | Medium | Medium | Medium | Farm-scoped RLS, private storage, least privilege, redaction and signed URLs. | Low |
| TH-011 | Denial of Service | Denial of Service threat against dashboard could compromise tenant data, trust or availability. | Dashboard | Medium | Medium | Medium | Rate limits, pagination, async jobs, quotas, provider timeout and monitoring. | Low |
| TH-012 | Elevation of Privilege | Elevation of Privilege threat against dashboard could compromise tenant data, trust or availability. | Dashboard | Low | Medium | Medium | RBAC, role hierarchy, server-side checks, admin confirmation and audit. | Low |
| TH-013 | Spoofing | Spoofing threat against cow management could compromise tenant data, trust or availability. | Cow Management | Low | Medium | Medium | Strong authentication, token validation, session expiry and device/session audit. | Low |
| TH-014 | Tampering | Tampering threat against cow management could compromise tenant data, trust or availability. | Cow Management | Medium | Medium | Medium | Input validation, RLS, transaction integrity, audit logs and protected actions. | Low |
| TH-015 | Repudiation | Repudiation threat against cow management could compromise tenant data, trust or availability. | Cow Management | Low | Medium | Medium | Immutable audit logs with actor, timestamp, IP/device and before/after metadata. | Low |
| TH-016 | Information Disclosure | Information Disclosure threat against cow management could compromise tenant data, trust or availability. | Cow Management | Medium | Medium | Medium | Farm-scoped RLS, private storage, least privilege, redaction and signed URLs. | Low |
| TH-017 | Denial of Service | Denial of Service threat against cow management could compromise tenant data, trust or availability. | Cow Management | Medium | Medium | Medium | Rate limits, pagination, async jobs, quotas, provider timeout and monitoring. | Low |
| TH-018 | Elevation of Privilege | Elevation of Privilege threat against cow management could compromise tenant data, trust or availability. | Cow Management | Low | Medium | Medium | RBAC, role hierarchy, server-side checks, admin confirmation and audit. | Low |
| TH-019 | Spoofing | Spoofing threat against accounting could compromise tenant data, trust or availability. | Accounting | Low | Critical | High | Strong authentication, token validation, session expiry and device/session audit. Financial saves are transactional and reconciled. | Low |
| TH-020 | Tampering | Tampering threat against accounting could compromise tenant data, trust or availability. | Accounting | Medium | Critical | Critical | Input validation, RLS, transaction integrity, audit logs and protected actions. Financial saves are transactional and reconciled. | Medium |
| TH-021 | Repudiation | Repudiation threat against accounting could compromise tenant data, trust or availability. | Accounting | Low | Critical | High | Immutable audit logs with actor, timestamp, IP/device and before/after metadata. Financial saves are transactional and reconciled. | Low |
| TH-022 | Information Disclosure | Information Disclosure threat against accounting could compromise tenant data, trust or availability. | Accounting | Medium | Critical | Critical | Farm-scoped RLS, private storage, least privilege, redaction and signed URLs. Financial saves are transactional and reconciled. | Medium |
| TH-023 | Denial of Service | Denial of Service threat against accounting could compromise tenant data, trust or availability. | Accounting | Medium | Critical | Critical | Rate limits, pagination, async jobs, quotas, provider timeout and monitoring. Financial saves are transactional and reconciled. | Medium |
| TH-024 | Elevation of Privilege | Elevation of Privilege threat against accounting could compromise tenant data, trust or availability. | Accounting | Low | Critical | High | RBAC, role hierarchy, server-side checks, admin confirmation and audit. Financial saves are transactional and reconciled. | Low |
| TH-025 | Spoofing | Spoofing threat against ocr uploads could compromise tenant data, trust or availability. | OCR Uploads | Low | High | High | Strong authentication, token validation, session expiry and device/session audit. Provider keys are server-only; user review is mandatory for financial outputs. | Low |
| TH-026 | Tampering | Tampering threat against ocr uploads could compromise tenant data, trust or availability. | OCR Uploads | Medium | High | High | Input validation, RLS, transaction integrity, audit logs and protected actions. Provider keys are server-only; user review is mandatory for financial outputs. | Low |
| TH-027 | Repudiation | Repudiation threat against ocr uploads could compromise tenant data, trust or availability. | OCR Uploads | Low | High | High | Immutable audit logs with actor, timestamp, IP/device and before/after metadata. Provider keys are server-only; user review is mandatory for financial outputs. | Low |
| TH-028 | Information Disclosure | Information Disclosure threat against ocr uploads could compromise tenant data, trust or availability. | OCR Uploads | Medium | High | High | Farm-scoped RLS, private storage, least privilege, redaction and signed URLs. Provider keys are server-only; user review is mandatory for financial outputs. | Low |
| TH-029 | Denial of Service | Denial of Service threat against ocr uploads could compromise tenant data, trust or availability. | OCR Uploads | Medium | High | High | Rate limits, pagination, async jobs, quotas, provider timeout and monitoring. Provider keys are server-only; user review is mandatory for financial outputs. | Low |
| TH-030 | Elevation of Privilege | Elevation of Privilege threat against ocr uploads could compromise tenant data, trust or availability. | OCR Uploads | Low | High | High | RBAC, role hierarchy, server-side checks, admin confirmation and audit. Provider keys are server-only; user review is mandatory for financial outputs. | Low |
| TH-031 | Spoofing | Spoofing threat against ai assistant could compromise tenant data, trust or availability. | AI Assistant | Low | High | High | Strong authentication, token validation, session expiry and device/session audit. Provider keys are server-only; user review is mandatory for financial outputs. | Low |
| TH-032 | Tampering | Tampering threat against ai assistant could compromise tenant data, trust or availability. | AI Assistant | Medium | High | High | Input validation, RLS, transaction integrity, audit logs and protected actions. Provider keys are server-only; user review is mandatory for financial outputs. | Low |
| TH-033 | Repudiation | Repudiation threat against ai assistant could compromise tenant data, trust or availability. | AI Assistant | Low | High | High | Immutable audit logs with actor, timestamp, IP/device and before/after metadata. Provider keys are server-only; user review is mandatory for financial outputs. | Low |
| TH-034 | Information Disclosure | Information Disclosure threat against ai assistant could compromise tenant data, trust or availability. | AI Assistant | Medium | High | High | Farm-scoped RLS, private storage, least privilege, redaction and signed URLs. Provider keys are server-only; user review is mandatory for financial outputs. | Low |
| TH-035 | Denial of Service | Denial of Service threat against ai assistant could compromise tenant data, trust or availability. | AI Assistant | Medium | High | High | Rate limits, pagination, async jobs, quotas, provider timeout and monitoring. Provider keys are server-only; user review is mandatory for financial outputs. | Low |
| TH-036 | Elevation of Privilege | Elevation of Privilege threat against ai assistant could compromise tenant data, trust or availability. | AI Assistant | Low | High | High | RBAC, role hierarchy, server-side checks, admin confirmation and audit. Provider keys are server-only; user review is mandatory for financial outputs. | Low |
| TH-037 | Spoofing | Spoofing threat against reports could compromise tenant data, trust or availability. | Reports | Low | Medium | Medium | Strong authentication, token validation, session expiry and device/session audit. | Low |
| TH-038 | Tampering | Tampering threat against reports could compromise tenant data, trust or availability. | Reports | Medium | Medium | Medium | Input validation, RLS, transaction integrity, audit logs and protected actions. | Low |
| TH-039 | Repudiation | Repudiation threat against reports could compromise tenant data, trust or availability. | Reports | Low | Medium | Medium | Immutable audit logs with actor, timestamp, IP/device and before/after metadata. | Low |
| TH-040 | Information Disclosure | Information Disclosure threat against reports could compromise tenant data, trust or availability. | Reports | Medium | Medium | Medium | Farm-scoped RLS, private storage, least privilege, redaction and signed URLs. | Low |
| TH-041 | Denial of Service | Denial of Service threat against reports could compromise tenant data, trust or availability. | Reports | Medium | Medium | Medium | Rate limits, pagination, async jobs, quotas, provider timeout and monitoring. | Low |
| TH-042 | Elevation of Privilege | Elevation of Privilege threat against reports could compromise tenant data, trust or availability. | Reports | Low | Medium | Medium | RBAC, role hierarchy, server-side checks, admin confirmation and audit. | Low |
| TH-043 | Spoofing | Spoofing threat against admin panel could compromise tenant data, trust or availability. | Admin Panel | Low | Critical | High | Strong authentication, token validation, session expiry and device/session audit. | Low |
| TH-044 | Tampering | Tampering threat against admin panel could compromise tenant data, trust or availability. | Admin Panel | Medium | Critical | Critical | Input validation, RLS, transaction integrity, audit logs and protected actions. | Medium |
| TH-045 | Repudiation | Repudiation threat against admin panel could compromise tenant data, trust or availability. | Admin Panel | Low | Critical | High | Immutable audit logs with actor, timestamp, IP/device and before/after metadata. | Low |
| TH-046 | Information Disclosure | Information Disclosure threat against admin panel could compromise tenant data, trust or availability. | Admin Panel | Medium | Critical | Critical | Farm-scoped RLS, private storage, least privilege, redaction and signed URLs. | Medium |
| TH-047 | Denial of Service | Denial of Service threat against admin panel could compromise tenant data, trust or availability. | Admin Panel | Medium | Critical | Critical | Rate limits, pagination, async jobs, quotas, provider timeout and monitoring. | Medium |
| TH-048 | Elevation of Privilege | Elevation of Privilege threat against admin panel could compromise tenant data, trust or availability. | Admin Panel | Low | Critical | High | RBAC, role hierarchy, server-side checks, admin confirmation and audit. | Low |
| TH-049 | Spoofing | Spoofing threat against apis could compromise tenant data, trust or availability. | APIs | Low | High | High | Strong authentication, token validation, session expiry and device/session audit. | Low |
| TH-050 | Tampering | Tampering threat against apis could compromise tenant data, trust or availability. | APIs | Medium | High | High | Input validation, RLS, transaction integrity, audit logs and protected actions. | Low |
| TH-051 | Repudiation | Repudiation threat against apis could compromise tenant data, trust or availability. | APIs | Low | High | High | Immutable audit logs with actor, timestamp, IP/device and before/after metadata. | Low |
| TH-052 | Information Disclosure | Information Disclosure threat against apis could compromise tenant data, trust or availability. | APIs | Medium | High | High | Farm-scoped RLS, private storage, least privilege, redaction and signed URLs. | Low |
| TH-053 | Denial of Service | Denial of Service threat against apis could compromise tenant data, trust or availability. | APIs | Medium | High | High | Rate limits, pagination, async jobs, quotas, provider timeout and monitoring. | Low |
| TH-054 | Elevation of Privilege | Elevation of Privilege threat against apis could compromise tenant data, trust or availability. | APIs | Low | High | High | RBAC, role hierarchy, server-side checks, admin confirmation and audit. | Low |
| TH-055 | Spoofing | Spoofing threat against storage could compromise tenant data, trust or availability. | Storage | Low | High | High | Strong authentication, token validation, session expiry and device/session audit. | Low |
| TH-056 | Tampering | Tampering threat against storage could compromise tenant data, trust or availability. | Storage | Medium | High | High | Input validation, RLS, transaction integrity, audit logs and protected actions. | Low |
| TH-057 | Repudiation | Repudiation threat against storage could compromise tenant data, trust or availability. | Storage | Low | High | High | Immutable audit logs with actor, timestamp, IP/device and before/after metadata. | Low |
| TH-058 | Information Disclosure | Information Disclosure threat against storage could compromise tenant data, trust or availability. | Storage | Medium | High | High | Farm-scoped RLS, private storage, least privilege, redaction and signed URLs. | Low |
| TH-059 | Denial of Service | Denial of Service threat against storage could compromise tenant data, trust or availability. | Storage | Medium | High | High | Rate limits, pagination, async jobs, quotas, provider timeout and monitoring. | Low |
| TH-060 | Elevation of Privilege | Elevation of Privilege threat against storage could compromise tenant data, trust or availability. | Storage | Low | High | High | RBAC, role hierarchy, server-side checks, admin confirmation and audit. | Low |


## 3. Identity and Access Management

### 3.1 Role Hierarchy

```text
Super Admin
  -> Admin
    -> Support
      -> Farm Owner
        -> Farmer / Worker
          -> Veterinarian (assigned farm scope)
```

### 3.2 Permission Matrix

| Area | Farmer | Farm Owner | Veterinarian | Support | Admin | Super Admin |
| --- | --- | --- | --- | --- | --- | --- |
| Own profile | CRUD own | CRUD own | Read own | Read own | Read support/admin | Full |
| Farm profile | Read | CRUD | Read assigned | Read support-scoped | Read/update admin-scoped | Full |
| Farm members | Read | CRUD except last-owner removal | None | Read support-scoped | Admin manage | Full |
| Cows and calves | CRUD | CRUD | Read/update health if assigned | Read support-scoped | Read/admin support | Full |
| Milk records | CRUD farm | CRUD farm | Read assigned if permitted | Read support-scoped | Read/admin support | Full |
| Health/vaccination | CRUD farm | CRUD farm | CRUD assigned | Read support-scoped | Read/admin support | Full |
| Accounting/settlements | CRUD farm | CRUD farm | None | Read support-scoped | Read/admin support | Full |
| OCR slips | Upload/review farm | Upload/review/delete farm | None | Read support-scoped | Read/admin support | Full |
| AI assistant | Use own/farm permissions | Use/manage farm settings | Use assigned if enabled | None | Analytics only | Full analytics |
| Notifications | Own inbox | Own/farm settings | Own inbox | Support notifications | Send admin-scoped | Full broadcast |
| Support tickets | Create/read own | Create/read farm tickets | Respond assigned | Manage assigned | Manage all support | Full |
| Admin panel | None | None | None | Limited support console | Admin console | Full console |
| Backups/export | Request own farm export if allowed | Full farm backup/export/restore | None | None | Admin export if permitted | Full |


## 4. Supabase Security Design

### 4.1 Auth and JWT Strategy

- Supabase Auth issues JWTs for authenticated sessions.
- Application profile and role are stored in `public.users`.
- Farm membership and tenant access are resolved via `farm_members`.
- Refresh token lifecycle follows Supabase defaults with secure storage.
- MFA readiness: schema and UI should allow future MFA without redesign.

### 4.2 RLS Policy Strategy

| Table | SELECT | INSERT | UPDATE | DELETE | Security Considerations |
| --- | --- | --- | --- | --- | --- |
| users | Own profile or platform admin | Own profile during signup or admin | Own editable fields or admin | Super admin only | Do not expose password/PIN/auth secrets; profile deletion follows privacy policy. |
| farms | Farm member or platform admin | Authenticated owner onboarding | Farm owner/admin | Super admin protected action | Farm is tenant boundary; delete requires backup and audit. |
| farm_members | Same farm member or admin | Owner/admin | Owner/admin; cannot remove last owner | Owner/admin | Prevents privilege escalation and orphan farms. |
| cows | Farm member via can_access_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Owner/admin protected where destructive | All policies include farm_id isolation; service role only in trusted jobs. |
| calves | Farm member via can_access_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Owner/admin protected where destructive | All policies include farm_id isolation; service role only in trusted jobs. |
| milk_records | Farm member via can_access_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Owner/admin protected where destructive | All policies include farm_id isolation; service role only in trusted jobs. |
| feed_records | Farm member via can_access_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Owner/admin protected where destructive | All policies include farm_id isolation; service role only in trusted jobs. |
| health_records | Farm member via can_access_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Owner/admin protected where destructive | All policies include farm_id isolation; service role only in trusted jobs. |
| vaccinations | Farm member via can_access_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Owner/admin protected where destructive | All policies include farm_id isolation; service role only in trusted jobs. |
| breeding_records | Farm member via can_access_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Owner/admin protected where destructive | All policies include farm_id isolation; service role only in trusted jobs. |
| calving_records | Farm member via can_access_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Owner/admin protected where destructive | All policies include farm_id isolation; service role only in trusted jobs. |
| reminders | Farm member via can_access_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Owner/admin protected where destructive | All policies include farm_id isolation; service role only in trusted jobs. |
| expenses | Farm member via can_access_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Owner/admin protected where destructive | All policies include farm_id isolation; service role only in trusted jobs. |
| settlements | Farm member via can_access_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Owner/admin protected where destructive | All policies include farm_id isolation; service role only in trusted jobs. |
| settlement_items | Farm member via can_access_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Owner/admin protected where destructive | All policies include farm_id isolation; service role only in trusted jobs. |
| reports | Farm member via can_access_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Owner/admin protected where destructive | All policies include farm_id isolation; service role only in trusted jobs. |
| goals | Farm member via can_access_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Owner/admin protected where destructive | All policies include farm_id isolation; service role only in trusted jobs. |
| notifications | Farm member via can_access_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Owner/admin protected where destructive | All policies include farm_id isolation; service role only in trusted jobs. |
| notification_logs | Farm member via can_access_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Owner/admin protected where destructive | All policies include farm_id isolation; service role only in trusted jobs. |
| ai_chats | Farm member via can_access_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Owner/admin protected where destructive | All policies include farm_id isolation; service role only in trusted jobs. |
| ai_messages | Farm member via can_access_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Owner/admin protected where destructive | All policies include farm_id isolation; service role only in trusted jobs. |
| ocr_uploads | Farm member via can_access_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Owner/admin protected where destructive | All policies include farm_id isolation; service role only in trusted jobs. |
| ocr_extractions | Farm member via can_access_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Owner/admin protected where destructive | All policies include farm_id isolation; service role only in trusted jobs. |
| achievements | Active catalog visible to users | Admin | Admin | Super admin | Catalog writes are platform-only. |
| leaderboard_entries | Farm member via can_access_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Owner/admin protected where destructive | All policies include farm_id isolation; service role only in trusted jobs. |
| support_tickets | Farm member via can_access_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Owner/admin protected where destructive | All policies include farm_id isolation; service role only in trusted jobs. |
| support_messages | Farm member via can_access_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Owner/admin protected where destructive | All policies include farm_id isolation; service role only in trusted jobs. |
| backups | Farm member via can_access_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Owner/admin protected where destructive | All policies include farm_id isolation; service role only in trusted jobs. |
| audit_logs | Owner/admin scoped; support limited; super admin full | Server/service role only | Never | Never except retention archive job | Append-only, redacted, retention-controlled. |
| settings | Farm member via can_access_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Farm manager via can_manage_farm(farm_id) | Owner/admin protected where destructive | All policies include farm_id isolation; service role only in trusted jobs. |


## 5. API Security

| API Category | Controls |
| --- | --- |
| Auth APIs | Rate limits, password/PIN policy, lockout, safe error messages, audit login failures |
| Farm APIs | Farm membership validation, RLS, owner-only destructive actions |
| Cow/Calf APIs | Farm-scoped access, lifecycle validation, reminder side-effects audited |
| Records APIs | Input validation, duplicate prevention, transaction safety |
| Accounting APIs | NUMERIC validation, no silent overwrite, source-of-truth checks, audit |
| OCR APIs | File validation, private storage, confidence gates, mandatory review |
| AI APIs | AI enabled check, data permissions, tool allowlist, token quotas |
| Admin APIs | Admin/super admin role, confirmation, reason, protected audit |


## 6. Data Protection

### 6.1 Data Classification

| Data Category | Examples | Classification | Purpose | Access | Retention |
| --- | --- | --- | --- | --- | --- |
| User identity | Name, phone, email, role | Confidential | Authentication, support, account management | User/support/admin | Account lifetime |
| Farm profile | Farm name, village, taluka, district | Confidential | Farm operations and reports | Farm members/admin | Farm lifetime |
| Animal records | Cows, calves, health, breeding | Confidential | Farm management | Farm members/vet/admin | Farm lifetime |
| Financial records | Milk, settlement, expenses, profit | Restricted | Accounting and reporting | Owner/farm manager/admin | Financial retention policy |
| Slip images/OCR text | Uploaded dairy slips and extracted data | Restricted | OCR/audit/debug | Farm manager/admin | Audit retention period |
| AI chats | Questions, answers, tool metadata | Confidential | AI assistance and audit | User/farm owner/admin limited | User-configured retention |
| Support tickets | Messages, attachments, device details | Confidential | Support service | Ticket owner/support/admin | Support retention policy |
| Audit logs | Actor, action, IP/device, before/after metadata | Restricted | Security and investigation | Admin/security only | Minimum 3 years |
| Backups | Exported farm data | Restricted | Recovery and portability | Owner/admin | Backup retention policy |


### 6.2 Deletion Rules

- Account deletion anonymizes profile after legal/support retention is satisfied.
- Farm deletion requires owner/super-admin confirmation, backup option and audit.
- Financial and audit records follow retention policy and are not immediately hard-deleted by normal users.
- AI chat deletion removes user-visible history but may retain minimal audit/cost metadata.

## 7. Encryption Strategy

- Encryption in transit: HTTPS/TLS for all app, API, storage and provider traffic.
- Encryption at rest: Supabase managed database/storage encryption.
- Backup encryption: backups stored in private bucket; optional application-layer encryption for full farm backups.
- Secret management: server-only environment variables; no provider keys in frontend.
- Key rotation: rotate service/provider keys after suspected exposure and on planned cadence.

## 8. OCR Security

### 8.1 Controls

- Allowed MIME types and size limits.
- Client compression but server validates file type/size again.
- Private `ocr-slips` bucket; no public URLs.
- Signed URL expiry.
- OCR raw text and images retained only for approved audit/debug period.
- Financial values require user review before save.

### 8.2 OCR Threat Scenarios

| Scenario | Mitigation |
| --- | --- |
| Malicious file upload | MIME validation, extension validation, size limits, scan readiness |
| Slip image exposed | Private bucket, signed URLs, RLS metadata check |
| Wrong OCR value saved | Validation engine, confidence gate, mandatory preview |
| Duplicate upload | Duplicate detection and explicit replace/skip decision |
| Provider outage | Retry/fallback/manual entry; no partial financial save |


## 9. AI Security and Privacy

### 9.1 AI Data Flow

```text
User question -> AI API -> Load settings/permissions -> typed tool call -> farm-scoped database query -> AI answer -> ai_messages audit
```

### 9.2 AI Risk Register

| Risk ID | Risk | Rating | Description | Mitigation |
| --- | --- | --- | --- | --- |
| AI-001 | Hallucinated farm data | High | AI answers fake values. | Use tool-only database retrieval; cite period/source in answer. |
| AI-002 | Unauthorized data use | Critical | AI uses milk/slip/animal data without permission. | Server-side AI permission checks before tool execution. |
| AI-003 | Prompt injection | High | User asks model to bypass policy/tool limits. | Instruction hierarchy, tool allowlist, schema validation. |
| AI-004 | Sensitive data in logs | Medium | AI logs retain private data too long. | Retention policy, deletion, redaction and access limits. |
| AI-005 | Token/cost abuse | Medium | Excessive AI usage increases cost. | Rate limits, quotas, short context and monitoring. |


### 9.3 Consent Model

- AI assistant can be disabled.
- User controls whether AI may use milk records, slip history, analytics and animal data.
- AI tool execution must enforce permission on server, not only UI.

## 10. Audit Logging

Audit log categories:

- User activity: login, logout, profile changes.
- Admin activity: subscription changes, suspension, impersonation, notifications.
- Security logs: failed login, rate limits, denied access, token anomalies.
- Data change logs: financial records, animal lifecycle, reminder actions.
- AI/OCR logs: tool calls, extraction status, confidence, review/save.

Retention: audit logs retained minimum 3 years or per approved compliance policy.

## 11. Privacy Compliance

Privacy policy must describe data collected, purpose, retention, sharing with AI/OCR providers, user rights, deletion process, backup/export and support access.

User rights:

- Access/export farm data.
- Correct profile/farm records.
- Delete account subject to retention.
- Control AI data permissions.
- Control notifications.

## 12. Security Monitoring

| Alert | Trigger | Severity |
| --- | --- | --- |
| Repeated login failures | Multiple failures per user/IP | Medium/High |
| Cross-farm access denial spike | RLS/API denied attempts | High |
| Admin protected action | Suspend/delete/impersonate/subscription change | High |
| Provider key error | OpenAI/OCR auth failure | High |
| Backup download | Full farm backup download | Medium/High |
| High OCR/AI usage | Quota threshold exceeded | Medium |
| Storage access denial spike | Many private file denials | Medium |


## 13. Incident Response

Detailed incident response plan is provided in `Incident_Response_Plan.md`.

## 14. Backup and Disaster Recovery Security

- Backups are private, signed, access-logged and checksum-verified.
- Restore requires owner/admin authorization and audit.
- Ransomware recovery depends on immutable managed backups and tested restore runbooks.
- Backup retention and deletion must be policy-driven.

## 15. Vulnerability Management

| Activity | Frequency | Owner |
| --- | --- | --- |
| Dependency scan | Every PR/build | Engineering |
| SAST | Every PR/build | Engineering |
| DAST | Before release and major changes | QA/Security |
| RLS/security tests | Every release | QA/Security |
| Penetration testing | Before production and annually | External/Security |
| Secret scanning | Every PR/build | Engineering |


## 16. Security Test Cases

Security test cases are generated in `Security_Test_Cases.xlsx`.

## 17. Production Hardening

Production hardening checklist is generated in `Production_Hardening_Checklist.xlsx`.

## 18. Security Readiness Assessment

| Area | Score | Notes |
| --- | --- | --- |
| Identity and access | 84/100 | Strong foundation; MFA future-ready recommended |
| Tenant isolation/RLS | 88/100 | RLS matrix complete; must verify with automated tests |
| API security | 82/100 | Standard controls defined; implementation needs rate limits |
| Data protection | 80/100 | Classification complete; retention policy needs final approval |
| AI/OCR privacy | 78/100 | Good controls; provider policy and redaction should be finalized |
| Admin controls | 82/100 | Protected actions and audit defined |
| Monitoring/IR | 76/100 | Plan ready; tooling and alert routes need implementation |
| Production hardening | 80/100 | Checklist ready; must be executed before go-live |


Overall recommendation: **Conditional go-live security approval** after RLS tests, secret scanning, storage policy validation, provider key review, retention approval and production hardening checklist completion.
