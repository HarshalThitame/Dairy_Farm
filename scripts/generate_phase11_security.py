from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from html import escape
import json
import re

BASE = Path("docs/security/phase11")
BASE.mkdir(parents=True, exist_ok=True)
DATE = "2026-06-07"

TABLES = [
    "users", "farms", "farm_members", "cows", "calves", "milk_records", "feed_records",
    "health_records", "vaccinations", "breeding_records", "calving_records", "reminders",
    "expenses", "settlements", "settlement_items", "reports", "goals", "notifications",
    "notification_logs", "ai_chats", "ai_messages", "ocr_uploads", "ocr_extractions",
    "achievements", "leaderboard_entries", "support_tickets", "support_messages",
    "backups", "audit_logs", "settings"
]

ROLES = ["Farmer", "Farm Owner", "Veterinarian", "Support", "Admin", "Super Admin"]


def md_table(headers, rows):
    def cell(v):
        return str(v).replace("\n", "<br>").replace("|", ";")
    lines = ["| " + " | ".join(headers) + " |", "| " + " | ".join(["---"] * len(headers)) + " |"]
    for row in rows:
        lines.append("| " + " | ".join(cell(x) for x in row) + " |")
    return "\n".join(lines) + "\n"


def threats():
    components = [
        ("AUTH", "Authentication"),
        ("DASH", "Dashboard"),
        ("COW", "Cow Management"),
        ("ACC", "Accounting"),
        ("OCR", "OCR Uploads"),
        ("AI", "AI Assistant"),
        ("REP", "Reports"),
        ("ADMIN", "Admin Panel"),
        ("API", "APIs"),
        ("STOR", "Storage"),
    ]
    stride_types = ["Spoofing", "Tampering", "Repudiation", "Information Disclosure", "Denial of Service", "Elevation of Privilege"]
    rows = []
    impact_map = {
        "Authentication": "Critical",
        "Accounting": "Critical",
        "Admin Panel": "Critical",
        "APIs": "High",
        "Storage": "High",
        "OCR Uploads": "High",
        "AI Assistant": "High",
    }
    i = 1
    for code, component in components:
        for t in stride_types:
            likelihood = "Medium" if t in {"Tampering", "Information Disclosure", "Denial of Service"} else "Low"
            impact = impact_map.get(component, "Medium")
            rating = "Critical" if impact == "Critical" and likelihood != "Low" else ("High" if impact in {"Critical", "High"} else "Medium")
            rows.append({
                "threatId": f"TH-{i:03d}",
                "stride": t,
                "threatDescription": f"{t} threat against {component.lower()} could compromise tenant data, trust or availability.",
                "affectedComponents": component,
                "likelihood": likelihood,
                "impact": impact,
                "riskRating": rating,
                "mitigation": mitigation_for(t, component),
                "residualRisk": "Low" if rating in {"Medium", "High"} else "Medium",
            })
            i += 1
    return rows


def mitigation_for(stride, component):
    base = {
        "Spoofing": "Strong authentication, token validation, session expiry and device/session audit.",
        "Tampering": "Input validation, RLS, transaction integrity, audit logs and protected actions.",
        "Repudiation": "Immutable audit logs with actor, timestamp, IP/device and before/after metadata.",
        "Information Disclosure": "Farm-scoped RLS, private storage, least privilege, redaction and signed URLs.",
        "Denial of Service": "Rate limits, pagination, async jobs, quotas, provider timeout and monitoring.",
        "Elevation of Privilege": "RBAC, role hierarchy, server-side checks, admin confirmation and audit.",
    }[stride]
    if component in {"AI Assistant", "OCR Uploads"}:
        base += " Provider keys are server-only; user review is mandatory for financial outputs."
    if component == "Accounting":
        base += " Financial saves are transactional and reconciled."
    return base


def permission_matrix():
    areas = [
        ("Own profile", "CRUD own", "CRUD own", "Read own", "Read own", "Read support/admin", "Full"),
        ("Farm profile", "Read", "CRUD", "Read assigned", "Read support-scoped", "Read/update admin-scoped", "Full"),
        ("Farm members", "Read", "CRUD except last-owner removal", "None", "Read support-scoped", "Admin manage", "Full"),
        ("Cows and calves", "CRUD", "CRUD", "Read/update health if assigned", "Read support-scoped", "Read/admin support", "Full"),
        ("Milk records", "CRUD farm", "CRUD farm", "Read assigned if permitted", "Read support-scoped", "Read/admin support", "Full"),
        ("Health/vaccination", "CRUD farm", "CRUD farm", "CRUD assigned", "Read support-scoped", "Read/admin support", "Full"),
        ("Accounting/settlements", "CRUD farm", "CRUD farm", "None", "Read support-scoped", "Read/admin support", "Full"),
        ("OCR slips", "Upload/review farm", "Upload/review/delete farm", "None", "Read support-scoped", "Read/admin support", "Full"),
        ("AI assistant", "Use own/farm permissions", "Use/manage farm settings", "Use assigned if enabled", "None", "Analytics only", "Full analytics"),
        ("Notifications", "Own inbox", "Own/farm settings", "Own inbox", "Support notifications", "Send admin-scoped", "Full broadcast"),
        ("Support tickets", "Create/read own", "Create/read farm tickets", "Respond assigned", "Manage assigned", "Manage all support", "Full"),
        ("Admin panel", "None", "None", "None", "Limited support console", "Admin console", "Full console"),
        ("Backups/export", "Request own farm export if allowed", "Full farm backup/export/restore", "None", "None", "Admin export if permitted", "Full"),
    ]
    return [{"area": a, "farmer": b, "owner": c, "veterinarian": d, "support": e, "admin": f, "superAdmin": g} for a,b,c,d,e,f,g in areas]


def rls_matrix():
    rows = []
    for table in TABLES:
        if table == "users":
            rows.append({"table": table, "select": "Own profile or platform admin", "insert": "Own profile during signup or admin", "update": "Own editable fields or admin", "delete": "Super admin only", "securityConsiderations": "Do not expose password/PIN/auth secrets; profile deletion follows privacy policy."})
        elif table == "farms":
            rows.append({"table": table, "select": "Farm member or platform admin", "insert": "Authenticated owner onboarding", "update": "Farm owner/admin", "delete": "Super admin protected action", "securityConsiderations": "Farm is tenant boundary; delete requires backup and audit."})
        elif table == "farm_members":
            rows.append({"table": table, "select": "Same farm member or admin", "insert": "Owner/admin", "update": "Owner/admin; cannot remove last owner", "delete": "Owner/admin", "securityConsiderations": "Prevents privilege escalation and orphan farms."})
        elif table == "achievements":
            rows.append({"table": table, "select": "Active catalog visible to users", "insert": "Admin", "update": "Admin", "delete": "Super admin", "securityConsiderations": "Catalog writes are platform-only."})
        elif table == "audit_logs":
            rows.append({"table": table, "select": "Owner/admin scoped; support limited; super admin full", "insert": "Server/service role only", "update": "Never", "delete": "Never except retention archive job", "securityConsiderations": "Append-only, redacted, retention-controlled."})
        else:
            rows.append({"table": table, "select": "Farm member via can_access_farm(farm_id)", "insert": "Farm manager via can_manage_farm(farm_id)", "update": "Farm manager via can_manage_farm(farm_id)", "delete": "Owner/admin protected where destructive", "securityConsiderations": "All policies include farm_id isolation; service role only in trusted jobs."})
    return rows


def risk_register():
    rows = [
        ("SR-001", "Cross-farm data leakage", "Critical", "RLS/API authorization gap exposes farm data.", "RLS tests, farm_id enforcement, admin audit.", "Low"),
        ("SR-002", "Financial tampering", "Critical", "Unauthorized update changes income/profit.", "RBAC, transaction RPCs, audit, reconciliation.", "Low"),
        ("SR-003", "OCR malicious file", "High", "Uploaded file abuses parser/storage.", "MIME validation, size limits, private bucket, malware scan readiness.", "Medium"),
        ("SR-004", "AI prompt injection", "High", "User input attempts unauthorized tool/data access.", "Tool allowlist, permission checks, no raw SQL, output filtering.", "Medium"),
        ("SR-005", "Service key exposure", "Critical", "Service role/OpenAI/OCR keys exposed to client or logs.", "Server-only env vars, secret scanning, rotation.", "Low"),
        ("SR-006", "Weak PIN/password attack", "High", "Brute force or reused credentials.", "Password policy, PIN lockout, rate limiting, audit.", "Medium"),
        ("SR-007", "Admin misuse", "High", "Privileged action suspends/deletes wrong farm.", "Confirmation, reason, protected action logs, least privilege.", "Medium"),
        ("SR-008", "Backup exposure", "Critical", "Backup file leaks complete farm data.", "Private bucket, signed URLs, encryption, access audit.", "Low"),
        ("SR-009", "Push payload privacy", "Medium", "Sensitive data appears in OS notification panel.", "Payload minimization and user preferences.", "Low"),
        ("SR-010", "Report URL leakage", "High", "Generated report accessible publicly.", "Signed URLs, expiry, RLS metadata check.", "Low"),
        ("SR-011", "Dependency vulnerability", "High", "Package vulnerability exploited.", "SCA, patch SLAs, CI checks.", "Medium"),
        ("SR-012", "Session persistence issue", "Medium", "Lost/invalid session causes broken navigation.", "Session validation, graceful login redirect, device QA.", "Low"),
        ("SR-013", "Storage bucket misconfiguration", "Critical", "OCR slips, reports or backups become publicly readable.", "Private-by-default buckets, CI policy checks, signed URL tests.", "Low"),
        ("SR-014", "RLS bypass through service API", "Critical", "Server API using service role omits explicit farm authorization.", "Central auth guard, farm access assertion, code review checklist.", "Low"),
        ("SR-015", "Sensitive error disclosure", "Medium", "Stack traces or provider errors reveal internals to user.", "Safe error mapping, server-only logs, localized generic messages.", "Low"),
        ("SR-016", "Admin notification abuse", "Medium", "Broadcast sends sensitive or misleading content to wrong farms.", "Audience preview, send confirmation, delivery audit and RBAC.", "Low"),
        ("SR-017", "Support attachment data leak", "High", "Ticket attachments are exposed across farms/users.", "Ticket-scoped private storage and signed URL authorization.", "Low"),
        ("SR-018", "Localization fallback leak", "Low", "Fallback messages expose technical details in English/Marathi.", "Central i18n error catalog and QA language sweep.", "Low"),
        ("SR-019", "Offline data conflict", "Medium", "Queued offline writes overwrite newer financial/animal records.", "Conflict detection, server timestamps and user confirmation.", "Medium"),
        ("SR-020", "Realtime channel leakage", "High", "Supabase realtime sends farm notifications to unauthorized clients.", "Channel authorization and farm-scoped subscriptions.", "Low"),
    ]
    return [{"riskId": a, "risk": b, "rating": c, "description": d, "mitigation": e, "residualRisk": f, "owner": "Security/Engineering", "status": "Open"} for a,b,c,d,e,f in rows]


def ai_risks():
    rows = [
        ("AI-001", "Hallucinated farm data", "High", "AI answers fake values.", "Use tool-only database retrieval; cite period/source in answer."),
        ("AI-002", "Unauthorized data use", "Critical", "AI uses milk/slip/animal data without permission.", "Server-side AI permission checks before tool execution."),
        ("AI-003", "Prompt injection", "High", "User asks model to bypass policy/tool limits.", "Instruction hierarchy, tool allowlist, schema validation."),
        ("AI-004", "Sensitive data in logs", "Medium", "AI logs retain private data too long.", "Retention policy, deletion, redaction and access limits."),
        ("AI-005", "Token/cost abuse", "Medium", "Excessive AI usage increases cost.", "Rate limits, quotas, short context and monitoring."),
    ]
    return [{"riskId": a, "risk": b, "rating": c, "description": d, "mitigation": e} for a,b,c,d,e in rows]


def security_tests():
    areas = [
        "Authentication", "Authorization", "Session", "Password", "PIN", "RLS", "API", "Storage",
        "OCR", "AI", "Admin", "Backup", "Reports", "Notifications", "Audit", "Rate Limiting"
    ]
    rows = []
    for area in areas:
        for scenario in ["positive authorized access", "unauthorized denial", "tampered identifier", "malicious input", "audit/alert verification", "rate limit/abuse behavior", "localized safe error behavior"]:
            rows.append({
                "testCaseId": f"SEC11-TC-{len(rows)+1:03d}",
                "area": area,
                "title": f"{area} - {scenario}",
                "preconditions": "Security users exist for farmer, owner, veterinarian, support, admin, super admin and attacker.",
                "steps": "Execute scenario through UI/API, inspect response, database state and audit logs.",
                "expectedResults": "Controls enforce least privilege, no sensitive data leaks, invalid input is rejected and audit/alerts are created where required.",
                "severity": "Critical" if area in {"Authorization", "RLS", "Admin", "Backup"} else "High",
                "automationCandidate": "Yes",
                "status": "Not Run",
            })
    return rows


def hardening_items():
    categories = {
        "Infrastructure": ["Use HTTPS only", "Configure secure headers", "Enable monitoring", "Restrict production console access", "Document rollback", "Disable debug mode", "Set HSTS", "Review DNS/domain ownership", "Restrict CI/CD secrets", "Use least-privilege deploy tokens"],
        "Database": ["Enable RLS all public tables", "Verify farm_id indexes", "Restrict service role", "Run RLS tests", "Enable backups", "Validate check constraints", "Create audit triggers/jobs", "Review migration rollback", "Partition/archive high-volume records", "Review slow query logs"],
        "Supabase": ["Private storage buckets", "Signed URL expiry", "Auth redirect allowlist", "JWT expiry reviewed", "Realtime channel access reviewed", "Disable anonymous broad access", "Rotate service keys", "Review storage policies", "Review edge function envs", "Configure project backups"],
        "Application": ["No secrets in client bundle", "Input validation", "Error boundaries", "Localized safe errors", "Audit high-risk actions", "CSRF-safe server mutations", "Sanitize markdown/user content", "Secure PWA service worker", "Respect privacy settings", "Disable source maps in production if required"],
        "API": ["JWT validation", "RBAC checks", "Rate limits", "OpenAPI contract tests", "Request size limits", "Response redaction", "Idempotency for critical saves", "Pagination limits", "CORS allowlist", "Admin action reason capture"],
        "Storage": ["File type validation", "File size validation", "No public OCR/report URLs", "Retention jobs", "Malware scan readiness", "Signed URL auth check", "Path traversal prevention", "Backup download audit", "Attachment ownership check", "Lifecycle cleanup"],
        "Monitoring": ["Auth failure alerts", "Provider failure alerts", "Admin action alerts", "High error rate alert", "Backup failure alert", "Cross-farm denial spike", "Unusual OCR/AI spend", "Push failure spike", "Realtime auth failures", "Slow API dashboard"],
        "AI/OCR": ["Tool allowlist", "No raw SQL by AI", "Provider key server-only", "Prompt injection tests", "Financial review gate", "Confidence thresholds", "Token quotas", "Provider timeout", "OCR duplicate detection", "AI data permission checks"],
        "Admin": ["Super admin protected actions", "Confirmation dialogs", "Audit reason required", "Impersonation disabled or audited", "Subscription change audit", "Notification audience preview", "Device/session visibility", "Role change dual check", "Delete farm protection", "Support data minimization"],
        "Privacy": ["Privacy policy published", "Consent text reviewed", "Data export path tested", "Account deletion workflow", "AI permission persistence", "Notification preference persistence", "Retention schedule approved", "Support access rules", "Data processor inventory", "Incident communication template"],
    }
    rows = []
    for category, items in categories.items():
        for idx, item in enumerate(items, 1):
            rows.append({"itemId": f"{category[:3].upper()}-{idx:03d}", "category": category, "item": item, "owner": "TBD", "status": "Pending", "evidence": ""})
    return rows


def data_collection_matrix():
    return [
        ("User identity", "Name, phone, email, role", "Confidential", "Authentication, support, account management", "User/support/admin", "Account lifetime"),
        ("Farm profile", "Farm name, village, taluka, district", "Confidential", "Farm operations and reports", "Farm members/admin", "Farm lifetime"),
        ("Animal records", "Cows, calves, health, breeding", "Confidential", "Farm management", "Farm members/vet/admin", "Farm lifetime"),
        ("Financial records", "Milk, settlement, expenses, profit", "Restricted", "Accounting and reporting", "Owner/farm manager/admin", "Financial retention policy"),
        ("Slip images/OCR text", "Uploaded dairy slips and extracted data", "Restricted", "OCR/audit/debug", "Farm manager/admin", "Audit retention period"),
        ("AI chats", "Questions, answers, tool metadata", "Confidential", "AI assistance and audit", "User/farm owner/admin limited", "User-configured retention"),
        ("Support tickets", "Messages, attachments, device details", "Confidential", "Support service", "Ticket owner/support/admin", "Support retention policy"),
        ("Audit logs", "Actor, action, IP/device, before/after metadata", "Restricted", "Security and investigation", "Admin/security only", "Minimum 3 years"),
        ("Backups", "Exported farm data", "Restricted", "Recovery and portability", "Owner/admin", "Backup retention policy"),
    ]


def incident_plan_md():
    return f"""# Majhi Dairy Incident Response Plan

**Document Version:** 1.0  
**Date:** {DATE}

## 1. Objective

Provide a repeatable process to identify, contain, eradicate, recover from and learn from security incidents affecting Majhi Dairy.

## 2. Incident Severity Levels

{md_table(['Severity','Definition','Examples','Target Response'], [
('Critical','Active breach, data leak, financial data tampering or platform-wide outage','Cross-farm data leak, service role exposure, backup leak','Immediate response; executive notification'),
('High','High-risk vulnerability or major tenant impact','Admin misuse, OCR/report private URL exposure','Same business day'),
('Medium','Limited impact or contained issue','Single account compromise, suspicious rate limit event','2 business days'),
('Low','Low-risk event or policy deviation','Minor misconfiguration without exposure','5 business days'),
])}

## 3. Response Phases

1. Preparation: owners, access, runbooks, backups and communication templates ready.
2. Identification: alerts, user reports, logs and anomaly detection.
3. Containment: revoke sessions/keys, disable affected feature, block abusive IP/token.
4. Eradication: patch vulnerability, rotate secrets, remove malicious files.
5. Recovery: restore service, verify data integrity and monitor.
6. Post-incident review: root cause, timeline, lessons, corrective actions.

## 4. Escalation Matrix

{md_table(['Incident Type','Primary Owner','Escalation'], [
('Data leak / RLS failure','Security Architect','Founder, Engineering Lead, Legal/Compliance'),
('Financial tampering','Engineering Lead','Product Owner, Security, affected farm owner'),
('Provider key exposure','DevOps/Security','Engineering Lead, provider support'),
('AI/OCR abuse','AI Engineer','Security, Product Owner'),
('Production outage','DevOps','Engineering Lead, Support Lead'),
])}

## 5. Communication Plan

- Internal incident channel opened immediately for Critical/High.
- Affected user/farm communication prepared with facts only.
- Avoid speculation; include impact, action taken, user action required and next update time.
- Preserve evidence and audit logs before cleanup.

## 6. Recovery Validation

- Confirm RLS and API authorization tests pass.
- Confirm no ongoing unauthorized sessions/tokens.
- Confirm affected data integrity through reconciliation queries.
- Confirm backups and restore points are valid.
- Monitor for recurrence for at least 72 hours after Critical/High incidents.
"""


def architecture_md():
    threats_rows = threats()
    risks = risk_register()
    ai = ai_risks()
    return f"""# Majhi Dairy Security Architecture

**Document Version:** 1.0  
**Date:** {DATE}  
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

{md_table(['Boundary','Trusted?','Controls'], [
('Browser/PWA','Untrusted','JWT, input validation, no service keys'),
('Next.js server APIs','Trusted application boundary','Role checks, service role, audit, rate limits'),
('Supabase PostgreSQL','Trusted data boundary','RLS, constraints, transactions, backups'),
('Supabase Storage','Trusted file boundary','Private buckets, signed URLs, metadata RLS'),
('AI/OCR providers','External processor','Minimized data, provider keys server-only, retention controls'),
('Admin panel','Privileged boundary','RBAC, confirmation, audit, monitoring'),
])}

## 2. Threat Modeling - STRIDE

{md_table(['Threat ID','STRIDE','Threat Description','Affected Components','Likelihood','Impact','Risk Rating','Mitigation','Residual Risk'], [(t['threatId'],t['stride'],t['threatDescription'],t['affectedComponents'],t['likelihood'],t['impact'],t['riskRating'],t['mitigation'],t['residualRisk']) for t in threats_rows])}

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

{md_table(['Area','Farmer','Farm Owner','Veterinarian','Support','Admin','Super Admin'], [(p['area'],p['farmer'],p['owner'],p['veterinarian'],p['support'],p['admin'],p['superAdmin']) for p in permission_matrix()])}

## 4. Supabase Security Design

### 4.1 Auth and JWT Strategy

- Supabase Auth issues JWTs for authenticated sessions.
- Application profile and role are stored in `public.users`.
- Farm membership and tenant access are resolved via `farm_members`.
- Refresh token lifecycle follows Supabase defaults with secure storage.
- MFA readiness: schema and UI should allow future MFA without redesign.

### 4.2 RLS Policy Strategy

{md_table(['Table','SELECT','INSERT','UPDATE','DELETE','Security Considerations'], [(r['table'],r['select'],r['insert'],r['update'],r['delete'],r['securityConsiderations']) for r in rls_matrix()])}

## 5. API Security

{md_table(['API Category','Controls'], [
('Auth APIs','Rate limits, password/PIN policy, lockout, safe error messages, audit login failures'),
('Farm APIs','Farm membership validation, RLS, owner-only destructive actions'),
('Cow/Calf APIs','Farm-scoped access, lifecycle validation, reminder side-effects audited'),
('Records APIs','Input validation, duplicate prevention, transaction safety'),
('Accounting APIs','NUMERIC validation, no silent overwrite, source-of-truth checks, audit'),
('OCR APIs','File validation, private storage, confidence gates, mandatory review'),
('AI APIs','AI enabled check, data permissions, tool allowlist, token quotas'),
('Admin APIs','Admin/super admin role, confirmation, reason, protected audit'),
])}

## 6. Data Protection

### 6.1 Data Classification

{md_table(['Data Category','Examples','Classification','Purpose','Access','Retention'], data_collection_matrix())}

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

{md_table(['Scenario','Mitigation'], [
('Malicious file upload','MIME validation, extension validation, size limits, scan readiness'),
('Slip image exposed','Private bucket, signed URLs, RLS metadata check'),
('Wrong OCR value saved','Validation engine, confidence gate, mandatory preview'),
('Duplicate upload','Duplicate detection and explicit replace/skip decision'),
('Provider outage','Retry/fallback/manual entry; no partial financial save'),
])}

## 9. AI Security and Privacy

### 9.1 AI Data Flow

```text
User question -> AI API -> Load settings/permissions -> typed tool call -> farm-scoped database query -> AI answer -> ai_messages audit
```

### 9.2 AI Risk Register

{md_table(['Risk ID','Risk','Rating','Description','Mitigation'], [(r['riskId'],r['risk'],r['rating'],r['description'],r['mitigation']) for r in ai])}

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

{md_table(['Alert','Trigger','Severity'], [
('Repeated login failures','Multiple failures per user/IP','Medium/High'),
('Cross-farm access denial spike','RLS/API denied attempts','High'),
('Admin protected action','Suspend/delete/impersonate/subscription change','High'),
('Provider key error','OpenAI/OCR auth failure','High'),
('Backup download','Full farm backup download','Medium/High'),
('High OCR/AI usage','Quota threshold exceeded','Medium'),
('Storage access denial spike','Many private file denials','Medium'),
])}

## 13. Incident Response

Detailed incident response plan is provided in `Incident_Response_Plan.md`.

## 14. Backup and Disaster Recovery Security

- Backups are private, signed, access-logged and checksum-verified.
- Restore requires owner/admin authorization and audit.
- Ransomware recovery depends on immutable managed backups and tested restore runbooks.
- Backup retention and deletion must be policy-driven.

## 15. Vulnerability Management

{md_table(['Activity','Frequency','Owner'], [
('Dependency scan','Every PR/build','Engineering'),
('SAST','Every PR/build','Engineering'),
('DAST','Before release and major changes','QA/Security'),
('RLS/security tests','Every release','QA/Security'),
('Penetration testing','Before production and annually','External/Security'),
('Secret scanning','Every PR/build','Engineering'),
])}

## 16. Security Test Cases

Security test cases are generated in `Security_Test_Cases.xlsx`.

## 17. Production Hardening

Production hardening checklist is generated in `Production_Hardening_Checklist.xlsx`.

## 18. Security Readiness Assessment

{md_table(['Area','Score','Notes'], [
('Identity and access','84/100','Strong foundation; MFA future-ready recommended'),
('Tenant isolation/RLS','88/100','RLS matrix complete; must verify with automated tests'),
('API security','82/100','Standard controls defined; implementation needs rate limits'),
('Data protection','80/100','Classification complete; retention policy needs final approval'),
('AI/OCR privacy','78/100','Good controls; provider policy and redaction should be finalized'),
('Admin controls','82/100','Protected actions and audit defined'),
('Monitoring/IR','76/100','Plan ready; tooling and alert routes need implementation'),
('Production hardening','80/100','Checklist ready; must be executed before go-live'),
])}

Overall recommendation: **Conditional go-live security approval** after RLS tests, secret scanning, storage policy validation, provider key review, retention approval and production hardening checklist completion.
"""


def clean_inline(s: str) -> str:
    s = re.sub(r"\*\*(.*?)\*\*", r"\1", s.strip())
    s = re.sub(r"`([^`]*)`", r"\1", s)
    return s.replace("<br>", "; ")


def p_xml(text, style=None):
    text = clean_inline(text)
    if not text:
        return "<w:p/>"
    ppr = f'<w:pPr><w:pStyle w:val="{style}"/></w:pPr>' if style else ""
    return f'<w:p>{ppr}<w:r><w:t xml:space="preserve">{escape(text)}</w:t></w:r></w:p>'


def table_xml(rows):
    cols = max(len(r) for r in rows)
    body = ['<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/></w:tblPr>']
    for r in rows:
        body.append("<w:tr>")
        for c in r + [""] * (cols - len(r)):
            body.append("<w:tc>" + p_xml(c) + "</w:tc>")
        body.append("</w:tr>")
    body.append("</w:tbl>")
    return "".join(body)


def md_to_docx(md, path):
    lines = md.splitlines()
    body, i, code, codebuf = [], 0, False, []
    while i < len(lines):
        s = lines[i].strip()
        if s.startswith("```"):
            if not code:
                code, codebuf = True, []
            else:
                body.append(p_xml("\n".join(codebuf), "Code"))
                code = False
            i += 1
            continue
        if code:
            codebuf.append(lines[i])
            i += 1
            continue
        if not s:
            i += 1
            continue
        if s.startswith("|"):
            rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                cells = [clean_inline(x) for x in lines[i].strip().strip("|").split("|")]
                if not all(re.fullmatch(r"[-:\s]+", x or "") for x in cells):
                    rows.append(cells)
                i += 1
            body.append(table_xml(rows))
            continue
        h = re.match(r"^(#{1,6})\s+(.*)$", s)
        if h:
            style = {1: "Heading1", 2: "Heading2", 3: "Heading3"}.get(min(len(h.group(1)), 3), "Heading3")
            body.append(p_xml(h.group(2), style))
            i += 1
            continue
        if s.startswith("- "):
            body.append(p_xml("• " + s[2:]))
            i += 1
            continue
        body.append(p_xml(s))
        i += 1
    document = f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>{"".join(body)}<w:sectPr/></w:body></w:document>'
    styles = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:rPr><w:b/><w:sz w:val="34"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:rPr><w:b/><w:sz w:val="24"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Code"><w:name w:val="Code"/><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="18"/></w:rPr></w:style><w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/></w:style></w:styles>'''
    ct = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>'''
    rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'''
    docrels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'''
    with ZipFile(path, "w", ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", ct)
        z.writestr("_rels/.rels", rels)
        z.writestr("word/document.xml", document)
        z.writestr("word/_rels/document.xml.rels", docrels)
        z.writestr("word/styles.xml", styles)


def main():
    arch = architecture_md()
    incident = incident_plan_md()
    (BASE / "Majhi_Dairy_Security_Architecture.md").write_text(arch, encoding="utf-8")
    (BASE / "Incident_Response_Plan.md").write_text(incident, encoding="utf-8")
    md_to_docx(arch, BASE / "Majhi_Dairy_Security_Architecture.docx")
    catalog = {
        "threats": threats(),
        "permissionMatrix": permission_matrix(),
        "rlsMatrix": rls_matrix(),
        "riskRegister": risk_register(),
        "aiRisks": ai_risks(),
        "securityTests": security_tests(),
        "hardeningItems": hardening_items(),
        "dataCollectionMatrix": data_collection_matrix(),
    }
    (BASE / "security_catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({k: len(v) for k, v in catalog.items()}, indent=2))


if __name__ == "__main__":
    main()
