from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from html import escape
import json
import re

BASE = Path("docs/qa/phase9")
BASE.mkdir(parents=True, exist_ok=True)
DATE = "2026-06-07"

BRD = Path("docs/brd/Majhi_Dairy_Master_BRD.md")
API_CATALOG = Path("docs/technical/phase8/api_catalog.json")

MODULES = {
    "AUTH": "Authentication",
    "DASH": "Home Dashboard",
    "COW": "Cow Management",
    "CALF": "Calf Management",
    "REC": "Records Management",
    "REM": "Reminders",
    "ACC": "Accounting",
    "OCR": "AI Slip Scanning",
    "REP": "Reports & Analytics",
    "GOAL": "Goals Management",
    "EXP": "Export & Backup",
    "AI": "AI Assistant",
    "NOTIF": "Notifications",
    "SET": "Settings",
    "PROF": "Profile",
    "SUP": "Support",
    "ACH": "Achievements & Leaderboard",
    "ADMIN": "Admin Panel",
    "ANALYTICS": "Analytics & BI",
    "ADMIN-NOTIF": "Admin Notification Center",
    "ADMIN-SUP": "Support Administration",
    "SUB": "Subscription & Trial Management",
    "SEC": "Security Architecture",
    "DATA": "Data Model",
    "INT": "System Integrations",
    "AUDIT": "Audit & Compliance",
    "DR": "Disaster Recovery",
}

UAT_BY_PREFIX = {
    "AUTH": "UAT-001",
    "DASH": "UAT-003",
    "COW": "UAT-002",
    "CALF": "UAT-002",
    "REC": "UAT-003",
    "REM": "UAT-004",
    "ACC": "UAT-006",
    "OCR": "UAT-005",
    "REP": "UAT-007",
    "GOAL": "UAT-008",
    "AI": "UAT-009",
    "NOTIF": "UAT-004",
    "SET": "UAT-001",
    "PROF": "UAT-001",
    "SUP": "UAT-010",
    "ACH": "UAT-012",
    "ADMIN": "UAT-012",
    "ANALYTICS": "UAT-012",
    "ADMIN-NOTIF": "UAT-012",
    "ADMIN-SUP": "UAT-012",
    "SUB": "UAT-012",
    "SEC": "UAT-012",
    "DATA": "UAT-012",
    "INT": "UAT-012",
    "AUDIT": "UAT-012",
    "DR": "UAT-011",
}


def md_table(headers, rows):
    def cell(value):
        return str(value).replace("\n", "<br>").replace("|", ";")

    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join(["---"] * len(headers)) + " |",
    ]
    for row in rows:
        lines.append("| " + " | ".join(cell(v) for v in row) + " |")
    return "\n".join(lines) + "\n"


def parse_requirements():
    text = BRD.read_text(encoding="utf-8")
    pattern = re.compile(
        r"^### ((?:ADMIN-NOTIF|ADMIN-SUP|AUTH|DASH|COW|CALF|REC|REM|ACC|OCR|REP|GOAL|EXP|AI|NOTIF|SET|PROF|SUP|ACH|ADMIN|ANALYTICS|SUB|SEC|DATA|INT|AUDIT|DR)-FR-\d{3}) - (.*)$",
        re.MULTILINE,
    )
    reqs = []
    for match in pattern.finditer(text):
        rid = match.group(1)
        title = match.group(2).strip()
        prefix = rid.split("-FR-")[0]
        reqs.append(
            {
                "requirementId": rid,
                "prefix": prefix,
                "module": MODULES.get(prefix, prefix),
                "title": title,
                "phase": source_phase(prefix),
            }
        )
    nfrs = []
    for match in re.finditer(r"^\|\s*(NFR-\d{3})\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|", text, re.MULTILINE):
        nfrs.append(
            {
                "requirementId": match.group(1).strip(),
                "prefix": "NFR",
                "module": "Non-Functional Requirements",
                "title": f"{match.group(2).strip()} - {match.group(3).strip()}",
                "acceptanceTarget": match.group(4).strip(),
                "phase": "Phase 5",
            }
        )
    return reqs, nfrs


def source_phase(prefix):
    if prefix in {"AUTH", "DASH", "COW", "CALF", "REC", "REM"}:
        return "Phase 2"
    if prefix in {"ACC", "OCR", "REP", "GOAL", "EXP"}:
        return "Phase 3"
    if prefix in {"AI", "NOTIF", "SET", "PROF", "SUP", "ACH"}:
        return "Phase 4"
    return "Phase 5"


def make_functional_cases(requirements):
    counters = {}
    cases = []
    for req in requirements:
        prefix = req["prefix"]
        counters[prefix] = counters.get(prefix, 0)
        for variant, suffix in [
            ("positive business flow", "Verify end-to-end successful behavior."),
            ("negative and validation flow", "Verify validation, permissions, duplicate/error handling and audit behavior."),
        ]:
            counters[prefix] += 1
            tc_id = f"{prefix}-TC-{counters[prefix]:03d}"
            priority = "High" if prefix in {"AUTH", "ACC", "OCR", "REM", "SEC", "ADMIN", "DATA"} else "Medium"
            severity = "Critical" if prefix in {"ACC", "OCR", "SEC", "DATA"} else "High"
            cases.append(
                {
                    "testCaseId": tc_id,
                    "requirementId": req["requirementId"],
                    "module": req["module"],
                    "title": f"{req['title']} - {variant}",
                    "description": f"{suffix} Requirement under test: {req['requirementId']} {req['title']}.",
                    "preconditions": "User account, farm membership and required seed data exist; selected language is Marathi or English as applicable.",
                    "testData": "Valid farmId, authenticated user, module-specific valid and invalid values, boundary dates and duplicate records where applicable.",
                    "steps": "1. Login with permitted role. 2. Navigate to the module. 3. Perform the target action. 4. Verify UI/API response. 5. Verify database/audit/report impact where applicable.",
                    "expectedResults": "The system follows the requirement, enforces validation and authorization, stores correct data, updates derived views, shows localized messages and creates audit logs where required.",
                    "priority": priority,
                    "severity": severity,
                    "automationCandidate": "Yes" if variant.startswith("positive") or prefix in {"AUTH", "ACC", "OCR", "API"} else "Partial",
                    "status": "Not Run",
                }
            )
    return cases


def make_nfr_cases(nfrs):
    cases = []
    for i, nfr in enumerate(nfrs, 1):
        for kind in ["target validation", "failure/resilience validation"]:
            cases.append(
                {
                    "testCaseId": f"NFR-TC-{len(cases)+1:03d}",
                    "requirementId": nfr["requirementId"],
                    "module": "Non-Functional Requirements",
                    "title": f"{nfr['title']} - {kind}",
                    "description": f"Validate NFR acceptance target: {nfr.get('acceptanceTarget','Defined in BRD')}.",
                    "preconditions": "Production-like test environment, monitoring enabled and representative dataset available.",
                    "testData": "Load profile, farm data, user roles and network/device profiles appropriate for the NFR.",
                    "steps": "1. Configure test environment. 2. Execute scenario. 3. Capture metrics/logs. 4. Compare results with target. 5. Record defects for deviations.",
                    "expectedResults": "Measured result meets or exceeds NFR target and no critical user-facing failure occurs.",
                    "priority": "High",
                    "severity": "High",
                    "automationCandidate": "Yes",
                    "status": "Not Run",
                }
            )
    return cases


def make_language_cases():
    areas = [
        "Navigation menu",
        "Authentication forms",
        "Home dashboard",
        "Cow list and details",
        "Calf list and details",
        "Records forms",
        "Reminder cards/actions",
        "Accounting forms",
        "OCR preview",
        "Reports and exports",
        "AI assistant",
        "Notification inbox",
        "Settings pages",
        "Profile pages",
        "Support pages",
        "Achievements and leaderboard",
        "Admin panel",
        "Validation errors",
        "Success toasts",
        "Print/PDF reports",
    ]
    cases = []
    for area in areas:
        for lang in ["Marathi", "English"]:
            cases.append(
                {
                    "testCaseId": f"LANG-TC-{len(cases)+1:03d}",
                    "requirementId": "SET-FR-004",
                    "module": "Localization",
                    "title": f"{area} renders correctly in {lang}",
                    "description": "Validate selected language is applied without mixed-language or layout breakage.",
                    "preconditions": f"User has selected {lang}; app cache/session available.",
                    "testData": "Representative farm data including long names, financial values, reminders and reports.",
                    "steps": "1. Select language. 2. Open target area. 3. Trigger forms, errors, dialogs and print/export if applicable. 4. Refresh/re-login and recheck.",
                    "expectedResults": "All user-facing labels, messages, actions and generated content use selected language; no truncation or overlap occurs.",
                    "priority": "High",
                    "severity": "Medium",
                    "automationCandidate": "Partial",
                    "status": "Not Run",
                }
            )
    return cases


def make_performance_cases():
    targets = [
        ("Dashboard load", "Dashboard < 2 seconds", "DASH-FR-001"),
        ("Cow list load", "Cow list < 2 seconds for 500 cows", "COW-FR-001"),
        ("Milk report", "Report data < 5 seconds", "REP-FR-001"),
        ("Annual report export", "Async export accepted < 2 seconds and completes within SLA", "REP-FR-010"),
        ("OCR processing", "OCR < 15 seconds for clear daily slip where provider permits", "OCR-FR-003"),
        ("AI response", "AI < 5 seconds for simple analytics question", "AI-FR-001"),
        ("Admin farm details", "Admin dashboard < 5 seconds with aggregate views", "ADMIN-FR-001"),
        ("Notification inbox", "Inbox < 2 seconds with 500 notifications", "NOTIF-FR-001"),
    ]
    profiles = ["baseline", "load", "stress", "spike", "endurance"]
    cases = []
    for name, target, req in targets:
        for profile in profiles:
            cases.append(
                {
                    "testCaseId": f"PERF-TC-{len(cases)+1:03d}",
                    "requirementId": req,
                    "module": "Performance",
                    "title": f"{name} performance - {profile}",
                    "description": f"Validate performance target: {target}.",
                    "preconditions": "Production-like environment, monitoring enabled, seeded farms/users/records.",
                    "testData": "Concurrent users, realistic farms, large milk/notification/AI/OCR datasets.",
                    "steps": "1. Start monitoring. 2. Run load profile. 3. Capture p50/p95/p99 latency, errors and resource usage. 4. Compare with target.",
                    "expectedResults": "Performance target is met without data loss, timeout bursts or critical errors.",
                    "priority": "High",
                    "severity": "High",
                    "automationCandidate": "Yes",
                    "status": "Not Run",
                }
            )
    return cases


def make_db_cases():
    db_areas = [
        ("Relationships and foreign keys", "DATA-FR-001"),
        ("Unique constraints and duplicate prevention", "DATA-FR-002"),
        ("Check constraints for financial and milk values", "DATA-FR-002"),
        ("RLS policies for farm-owned tables", "SEC-FR-002"),
        ("Audit log creation and immutability", "AUDIT-FR-001"),
        ("Indexes used by dashboard/report queries", "NFR-001"),
        ("Settlement save/delete transaction integrity", "ACC-FR-003"),
        ("OCR audit linkage", "OCR-FR-007"),
        ("Reminder trigger lifecycle", "REM-FR-001"),
        ("Backup checksum and restore validation", "EXP-FR-003"),
    ]
    cases = []
    for area, req in db_areas:
        for variant in ["positive integrity", "negative constraint violation", "cross-farm isolation"]:
            cases.append(
                {
                    "testCaseId": f"DB-TC-{len(cases)+1:03d}",
                    "requirementId": req,
                    "module": "Database",
                    "title": f"{area} - {variant}",
                    "description": "Validate database integrity, RLS and transactional behavior.",
                    "preconditions": "Database seeded with two farms, multiple roles and realistic records.",
                    "testData": "Valid rows, invalid rows, cross-farm ids and rollback scenarios.",
                    "steps": "1. Execute database/API operation. 2. Verify constraints/RLS. 3. Verify no partial writes. 4. Verify audit and summaries.",
                    "expectedResults": "Database enforces integrity; unauthorized or invalid changes are rejected; transactions are atomic.",
                    "priority": "High",
                    "severity": "Critical",
                    "automationCandidate": "Yes",
                    "status": "Not Run",
                }
            )
    return cases


def make_api_cases(endpoints):
    cases = []
    for e in endpoints:
        for test_type, title, expected in [
            ("Request/Response", "valid request returns documented response schema", "Response status, envelope, schema and success code match OpenAPI."),
            ("Authorization", "unauthorized or wrong role is rejected", "401/403 is returned and no data leaks across farms."),
            ("Error Handling", "invalid request returns standard error envelope", "400/409/422/429/500 errors use standard ErrorResponse with stable code."),
        ]:
            cases.append(
                {
                    "testCaseId": f"API-TC-{len(cases)+1:04d}",
                    "apiId": e["id"],
                    "module": e["tag"],
                    "method": e["method"],
                    "endpoint": e["path"],
                    "title": f"{e['id']} {title}",
                    "testType": test_type,
                    "requestValidation": e["validation"],
                    "expectedResponse": expected,
                    "authValidation": e["auth"],
                    "priority": "High" if e["tag"] in {"Authentication", "Accounting", "OCR", "Admin"} else "Medium",
                    "automationCandidate": "Yes",
                    "status": "Not Run",
                }
            )
    return cases


def make_security_cases():
    areas = [
        ("Authentication Security", "OWASP-A07 Identification and Authentication Failures"),
        ("Authorization Security", "OWASP-A01 Broken Access Control"),
        ("Session Security", "OWASP-A07 Identification and Authentication Failures"),
        ("Password Security", "OWASP-A02 Cryptographic Failures"),
        ("PIN Security", "OWASP-A07 Identification and Authentication Failures"),
        ("Input Validation", "OWASP-A03 Injection"),
        ("RLS Security", "OWASP-A01 Broken Access Control"),
        ("API Security", "OWASP-A05 Security Misconfiguration"),
        ("Storage Security", "OWASP-A01 Broken Access Control"),
        ("AI Privacy", "LLM prompt/tool access control"),
        ("OCR Privacy", "Sensitive document handling"),
        ("Admin Security", "Privileged action control"),
        ("Backup Security", "Data exposure prevention"),
        ("Notification Security", "Sensitive payload prevention"),
        ("Rate Limiting", "Abuse prevention"),
        ("Audit Logging", "Non-repudiation"),
    ]
    cases = []
    for area, owasp in areas:
        for scenario in [
            "positive authorized access",
            "unauthorized access denial",
            "tampered identifier/cross-farm attempt",
            "invalid/malicious input",
            "audit and monitoring verification",
        ]:
            cases.append(
                {
                    "testCaseId": f"SEC-TC-{len(cases)+1:03d}",
                    "requirementId": "SEC-FR-001",
                    "area": area,
                    "owaspCategory": owasp,
                    "title": f"{area} - {scenario}",
                    "preconditions": "Security test users for farmer, owner, support, admin, super admin and attacker exist.",
                    "steps": "1. Execute scenario using API/UI. 2. Inspect response, data access and logs. 3. Verify no sensitive data exposure.",
                    "expectedResults": "Access controls, validation, audit logs and monitoring behave as specified.",
                    "severity": "Critical" if "Authorization" in area or "RLS" in area else "High",
                    "priority": "High",
                    "automationCandidate": "Yes",
                    "status": "Not Run",
                }
            )
    return cases


def make_uat_scenarios():
    scenarios = [
        ("UAT-001", "New Farmer Registration", "Farmer", "Register, select language, create farm, reach dashboard."),
        ("UAT-002", "Add First Cow", "Farmer/Farm Owner", "Create cow profile, verify list/detail and reminders if applicable."),
        ("UAT-003", "Record Daily Milk", "Farmer", "Add morning/evening milk and confirm dashboard/report totals."),
        ("UAT-004", "Complete Vaccination Reminder", "Farmer/Veterinarian", "Open reminder, record vaccination, complete reminder and verify next due date."),
        ("UAT-005", "Upload Dairy Slip", "Farmer", "Upload clear daily slip, review AI/OCR data, edit if required and save."),
        ("UAT-006", "View Settlement", "Farmer/Farm Owner", "Upload or enter 15-day settlement and verify feed deduction/profit."),
        ("UAT-007", "Generate Report", "Farm Owner", "Generate monthly and annual report in Marathi/English and export PDF/Excel."),
        ("UAT-008", "Set Goal", "Farmer", "Set daily/monthly milk goal, track progress and receive achievement notification."),
        ("UAT-009", "Use AI Assistant", "Farmer", "Ask farm data question and verify answer uses real database data only."),
        ("UAT-010", "Create Support Ticket", "Farmer/Support", "Submit ticket, add reply, attach file, close ticket and rate support."),
        ("UAT-011", "Backup Data", "Farm Owner", "Create backup, download, verify metadata and restore to test environment."),
        ("UAT-012", "Admin Reviews Analytics", "Admin", "Open admin dashboard/farm details, review health score, users, devices, notifications and audit logs."),
    ]
    rows = []
    for sid, title, actor, desc in scenarios:
        rows.append(
            {
                "uatId": sid,
                "scenario": title,
                "actors": actor,
                "description": desc,
                "preconditions": "User exists with required role; test farm has representative seed data unless scenario covers first-time setup.",
                "testData": "Marathi and English users, farm, cows/calves, milk records, reminders, accounting records, support/admin data where applicable.",
                "steps": "1. Start from login. 2. Complete the business workflow. 3. Verify UI, database/report output, notifications and audit where applicable. 4. Repeat in Marathi/English if user-facing.",
                "expectedOutcome": "Business user can complete the workflow without support intervention and all resulting data is accurate, traceable and localized.",
                "businessAcceptanceCriteria": "Scenario accepted only when primary actor signs off and no Critical/High defects remain open.",
                "relatedModules": title,
                "priority": "High",
                "signOffRole": actor,
                "status": "Not Run",
            }
        )
    return rows


def make_regression_cases(requirements):
    cases = []
    smoke_modules = list(dict.fromkeys([r["module"] for r in requirements]))
    for module in smoke_modules:
        cases.append(
            {
                "regressionId": f"REG-TC-{len(cases)+1:03d}",
                "suite": "Smoke",
                "module": module,
                "title": f"{module} page/API opens without critical error",
                "steps": "Login, open module landing page/API health path, verify basic data load.",
                "expectedResults": "No crash, no unauthorized data leak, core summary/list visible.",
                "frequency": "Every build",
                "automationCandidate": "Yes",
                "status": "Not Run",
            }
        )
    for u in make_uat_scenarios():
        cases.append(
            {
                "regressionId": f"REG-TC-{len(cases)+1:03d}",
                "suite": "Critical Path",
                "module": u["scenario"],
                "title": f"Critical path: {u['scenario']}",
                "steps": u["steps"],
                "expectedResults": u["expectedOutcome"],
                "frequency": "Every release",
                "automationCandidate": "Partial",
                "status": "Not Run",
            }
        )
    for req in requirements[::3]:
        cases.append(
            {
                "regressionId": f"REG-TC-{len(cases)+1:03d}",
                "suite": "Requirement Regression",
                "module": req["module"],
                "title": f"Regression for {req['requirementId']} {req['title']}",
                "steps": "Execute existing positive and negative test cases mapped to this requirement.",
                "expectedResults": "Requirement behavior remains unchanged and no dependent module regression occurs.",
                "frequency": "Release candidate",
                "automationCandidate": "Partial",
                "status": "Not Run",
            }
        )
    return cases


def make_release_checklists():
    sections = {
        "QA Exit Checklist": [
            "All Critical and High functional test cases executed.",
            "All Critical and High defects closed or formally deferred.",
            "Requirement traceability coverage is 100%.",
            "Regression pack pass rate meets release criteria.",
            "API contract tests pass against current environment.",
            "Security test suite has no unresolved Critical/High finding.",
            "Performance targets are met or exceptions are approved.",
            "Marathi and English language smoke tests pass.",
            "Offline and sync critical paths are validated.",
            "Financial calculations are reconciled with database source of truth.",
        ],
        "Release Approval Checklist": [
            "Product owner approves release scope.",
            "QA lead approves test completion report.",
            "Security owner approves risk status.",
            "Support team receives release notes.",
            "Database migrations are reviewed and rollback-tested.",
            "Environment variables and secrets are verified.",
            "Monitoring and alerting are active.",
            "Backup is taken before production deployment.",
            "Rollback plan is documented.",
            "Known issues list is approved.",
        ],
        "UAT Approval Checklist": [
            "All UAT scenarios executed by business users.",
            "UAT sign-off captured for farmer flows.",
            "UAT sign-off captured for admin flows.",
            "Marathi user acceptance validated.",
            "English user acceptance validated.",
            "Reports/export outputs approved.",
            "OCR review flow approved.",
            "AI answers verified against database samples.",
            "Support workflow approved.",
            "Final go/no-go meeting completed.",
        ],
        "Production Readiness Checklist": [
            "Production Supabase RLS enabled.",
            "Storage buckets are private and policies active.",
            "Service role key is server-only.",
            "OpenAPI version matches deployed APIs.",
            "Database indexes exist for high-volume queries.",
            "Materialized views/jobs scheduled.",
            "Push notification keys configured.",
            "AI/OCR provider keys configured and billing checked.",
            "Audit logs are enabled.",
            "Disaster recovery contact and steps documented.",
        ],
    }
    return sections


def qa_strategy_md(counts):
    return f"""# Majhi Dairy QA Strategy

**Document Version:** 1.0  
**Date:** {DATE}  
**Application:** Majhi Dairy  
**Supported Languages:** Marathi and English  
**Platforms:** Web application and mobile responsive PWA  
**Target Audience:** Farmers, farm owners, veterinarians, support teams and administrators

## 1. QA Strategy

### 1.1 Testing Objectives

- Validate all business requirements from BRD Phases 1-6.
- Validate database, RLS and backend architecture from Phase 7.
- Validate API contracts and integration boundaries from Phase 8.
- Protect financial accuracy for milk, settlement, expense, report and profit calculations.
- Ensure AI/OCR data is never saved without user review.
- Ensure Marathi and English UX works across pages, popups, notifications, reports and errors.
- Ensure tenant isolation, security, performance, accessibility and release readiness.

### 1.2 Testing Scope

{md_table(['Area','In Scope'], [
('Functional','Authentication, dashboard, cows, calves, records, reminders, accounting, OCR, reports, AI, notifications, settings, profile, support, achievements, admin'),
('API','All /v1 endpoints and standard schemas from Phase 8 OpenAPI contract'),
('Database','Relationships, constraints, indexes, RLS policies, audit logs and transaction integrity'),
('Security','Auth, authorization, session, PIN/password, RLS, API, storage, AI/OCR privacy and admin protection'),
('Performance','Dashboard, lists, reports, OCR, AI and admin analytics targets'),
('Localization','Marathi and English translation, persistence, layout and generated reports'),
('UAT','Farmer, owner, veterinarian, support and admin end-to-end business workflows'),
])}

### 1.3 Test Pyramid

```text
                 UAT / Exploratory / Production Readiness
              System, E2E, Regression, Security, Performance
           API Contract, Integration, Database/RLS, Provider Tests
        Unit Tests: validation, formulas, mappers, hooks, components
```

### 1.4 Risk-Based Testing

{md_table(['Risk Area','Risk','QA Focus'], [
('Accounting','Wrong profit/loss or feed deduction month','High-priority calculation and reconciliation tests'),
('OCR','Wrong slip value saved','Confidence, validation, manual review and duplicate tests'),
('RLS','Cross-farm data leakage','Security and database isolation tests'),
('Reminders','Wrong animal lifecycle reminder','Trigger, cancellation and status-based regression tests'),
('AI','Hallucinated farm data','Tool-call, permission and source-verification tests'),
('Notifications','Push/in-app mismatch','Delivery, fallback and preference tests'),
('iOS PWA','Session/storage differences','Device/browser compatibility tests'),
])}

### 1.5 Quality Gates

- Unit test pass rate >= 95%.
- API contract suite pass rate = 100% for release candidate.
- Critical path regression pass rate = 100%.
- No open Critical defects.
- No open High security or financial defects.
- UAT sign-off completed for farmer and admin flows.
- Performance targets met or exception approved.
- Localization smoke tests pass in Marathi and English.

### 1.6 Entry Criteria

- Requirements and acceptance criteria baselined.
- Test environment deployed with required migrations.
- Test users and farm seed data available.
- OpenAPI contract published.
- Provider test keys configured for AI/OCR/push where needed.
- Logging and monitoring enabled.

### 1.7 Exit Criteria

- Planned tests executed or formally deferred.
- Defects triaged and release decision documented.
- RTM shows 100% requirement-to-test mapping.
- Release readiness checklist approved.
- UAT sign-off recorded.
- Production rollback and backup plans verified.

## 2. Requirement Traceability Test Matrix Summary

{md_table(['Artifact','Count'], [
('Functional BRD requirements parsed', counts['requirements']),
('NFR requirements parsed', counts['nfrs']),
('Functional test cases generated', counts['functional']),
('NFR test cases generated', counts['nfr_cases']),
('Language test cases generated', counts['language']),
('Performance test cases generated', counts['performance']),
('Database test cases generated', counts['database']),
('API test cases generated', counts['api']),
('Security test cases generated', counts['security']),
('Regression test cases generated', counts['regression']),
('UAT scenarios generated', counts['uat']),
])}

## 3. Functional Test Strategy

Functional testing is organized by module. Every functional requirement receives at least one positive and one negative/validation test. Financial and security modules receive Critical/High severity prioritization. Each test case includes preconditions, test data, steps, expected result, automation candidacy and execution status.

## 4. Authentication Test Suite

Authentication tests cover signup, login, logout, PIN login, forgot/reset password, first-time language selection, persistence, session expiry, multi-device login and lockout/rate limiting. Negative tests include invalid credentials, expired sessions, weak password/PIN, missing language, account suspension and brute-force attempts.

## 5. Cow and Calf Test Suites

Animal tests validate create/edit/archive flows, status transitions, pregnancy tracking, calving, calf creation, calf sold/converted status, vaccination/health history and reminder generation/cancellation.

## 6. Accounting Test Suite

Accounting tests validate manual milk entries, settlement entries, feed deduction handling, monthly profit/loss, payment tracking, source-of-truth precedence, deletion/reversal and financial report reconciliation.

## 7. OCR Test Suite

OCR tests cover clear images, poor images, blurred images, duplicate uploads, invalid files, fallback behavior, AI extraction, validation, manual correction, save transaction and audit trail. OCR tests must prove the system never auto-saves AI data.

## 8. AI Assistant Test Suite

AI tests validate Marathi/English responses, database-backed answers, context memory, data permissions, AI disabled mode, hallucination prevention, token tracking, feedback and history deletion.

## 9. Reporting Test Suite

Reporting tests validate data accuracy, filters, export formats, PDF/Excel/CSV/JSON generation, language-specific headers, performance and reconciliation with source tables.

## 10. Multilingual Testing

Language tests verify Marathi and English across navigation, forms, validation, dialogs, reports, notifications and AI responses. Layout checks ensure no truncation, overlap or mixed-language screens.

## 11. API Testing

Every Phase 8 endpoint receives request/response, authorization and error-handling tests. API contract tests must compare responses with OpenAPI schemas and standard error envelopes.

## 12. Security Testing

Security testing follows OWASP and product-specific controls: RLS, farm isolation, API authorization, password/PIN/session security, input validation, storage access, backup security, AI/OCR privacy and admin protected actions.

## 13. Performance Testing

Targets:

- Dashboard < 2 seconds.
- Reports < 5 seconds for interactive report data.
- OCR < 15 seconds for clear slips where provider latency permits.
- AI < 5 seconds for simple analytics.
- Admin farm dashboard < 5 seconds from aggregate views.

## 14. Database Testing

Database tests validate foreign keys, check constraints, indexes, RLS policies, audit logs, transaction rollback, materialized summary refresh and cross-farm isolation.

## 15. UAT Strategy

UAT is scenario-based and business-owned. The UAT package contains 12 end-to-end scenarios covering first-time farmer onboarding, animal setup, daily operations, OCR, settlement, reports, goals, AI, support, backup and admin analytics.

## 16. Regression Testing

Regression pack contains smoke, critical path, requirement regression and high-risk domain tests. Critical paths run every release candidate. Smoke tests run every build.

## 17. Test Automation Strategy

{md_table(['Phase','Automation Scope','Target'], [
('Phase 1','Unit, validation, API contract, smoke tests','Core safety net'),
('Phase 2','Critical path E2E, accounting reconciliation, OCR save flow','Release confidence'),
('Phase 3','Performance, security automation, visual/i18n checks','Scale and production hardening'),
])}

Recommended tools: Jest/Vitest, React Testing Library, Playwright, Postman/Newman or Schemathesis, k6, OWASP ZAP, Supabase test project, Lighthouse and custom SQL/RLS tests.

## 18. Defect Management

{md_table(['Severity','Definition','Examples'], [
('Critical','Blocks release or risks money/security/data loss','Cross-farm data leak, wrong profit calculation, auto-saving OCR financial data'),
('High','Major workflow broken or high-risk incorrect output','Settlement save fails, login broken on iOS, reminder lifecycle wrong'),
('Medium','Important issue with workaround','Layout issue, non-critical report filter bug'),
('Low','Cosmetic/minor content issue','Typo, minor spacing issue'),
])}

Defect lifecycle: New -> Triaged -> Assigned -> Fixed -> Ready for Retest -> Verified -> Closed / Deferred.

## 19. Release Readiness

Release readiness requires QA exit checklist, UAT approval checklist, release approval checklist and production readiness checklist to be completed in the generated workbook.

## 20. Test Execution Dashboard

Executive QA dashboard metrics:

- Requirement coverage percentage.
- Planned vs executed tests.
- Pass/fail/blocked rate.
- Open defects by severity.
- Defect density by module.
- Defect leakage by release.
- Automation coverage.
- API contract coverage.
- Security and performance gate status.
"""


def make_rtm(requirements, nfrs, functional, nfr_cases):
    by_req = {}
    for tc in functional + nfr_cases:
        by_req.setdefault(tc["requirementId"], []).append(tc["testCaseId"])
    rows = []
    for req in requirements:
        rows.append(
            {
                "requirementId": req["requirementId"],
                "module": req["module"],
                "requirementTitle": req["title"],
                "testCaseIds": ", ".join(by_req.get(req["requirementId"], [])),
                "uatScenarioId": UAT_BY_PREFIX.get(req["prefix"], "UAT-012"),
                "coverageStatus": "Covered" if by_req.get(req["requirementId"]) else "Missing",
                "coverageType": "Functional positive + negative",
                "sourcePhase": req["phase"],
            }
        )
    for nfr in nfrs:
        rows.append(
            {
                "requirementId": nfr["requirementId"],
                "module": nfr["module"],
                "requirementTitle": nfr["title"],
                "testCaseIds": ", ".join(by_req.get(nfr["requirementId"], [])),
                "uatScenarioId": "UAT-012",
                "coverageStatus": "Covered" if by_req.get(nfr["requirementId"]) else "Missing",
                "coverageType": "NFR validation",
                "sourcePhase": nfr["phase"],
            }
        )
    return rows


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
    requirements, nfrs = parse_requirements()
    api_catalog = json.loads(API_CATALOG.read_text(encoding="utf-8"))
    functional = make_functional_cases(requirements)
    nfr_cases = make_nfr_cases(nfrs)
    language = make_language_cases()
    performance = make_performance_cases()
    database = make_db_cases()
    api = make_api_cases(api_catalog["endpoints"])
    security = make_security_cases()
    uat = make_uat_scenarios()
    regression = make_regression_cases(requirements)
    rtm = make_rtm(requirements, nfrs, functional, nfr_cases)
    checklist = make_release_checklists()
    counts = {
        "requirements": len(requirements),
        "nfrs": len(nfrs),
        "functional": len(functional),
        "nfr_cases": len(nfr_cases),
        "language": len(language),
        "performance": len(performance),
        "database": len(database),
        "api": len(api),
        "security": len(security),
        "regression": len(regression),
        "uat": len(uat),
    }
    strategy = qa_strategy_md(counts)
    (BASE / "Majhi_Dairy_QA_Strategy.md").write_text(strategy, encoding="utf-8")
    md_to_docx(strategy, BASE / "Majhi_Dairy_QA_Strategy.docx")
    catalog = {
        "counts": counts,
        "functionalTestCases": functional,
        "nfrTestCases": nfr_cases,
        "languageTestCases": language,
        "performanceTestCases": performance,
        "databaseTestCases": database,
        "apiTestCases": api,
        "securityTestCases": security,
        "uatScenarios": uat,
        "regressionTestCases": regression,
        "rtm": rtm,
        "releaseChecklists": checklist,
    }
    (BASE / "qa_catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps(counts, indent=2))


if __name__ == "__main__":
    main()
