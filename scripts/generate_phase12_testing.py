from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from html import escape
import json
import re

BASE = Path("docs/qa/phase12")
BASE.mkdir(parents=True, exist_ok=True)
DATE = "2026-06-07"

MODULES = {
    "Authentication": ("AUTH", [
        "User signup", "User login", "PIN login", "Forgot password", "Password reset",
        "Session management", "Logout", "First-time language selection",
        "Language persistence", "Multi-device login", "Account recovery", "Account lockout"
    ]),
    "Dashboard": ("DASH", [
        "Today milk summary", "Today income summary", "Pending slip banner", "Quick actions",
        "Farm snapshot", "Active reminders", "Recent activity", "Goal progress",
        "Monthly performance", "AI assistant card", "Notification bell"
    ]),
    "Cow Management": ("COW", [
        "Add cow", "Edit cow", "Archive cow", "Sell cow", "Cow details navigation",
        "Breed and tag management", "Pregnancy tracking", "Calving tracking",
        "Health history", "Vaccination history", "Important dates", "Cow timeline",
        "Pregnant cow sort order"
    ]),
    "Calf Management": ("CALF", [
        "Register calf", "Edit calf", "Sell calf", "Link mother cow", "Gender tracking",
        "Growth tracking", "Calf health", "Calf vaccination", "Dehorning reminder",
        "Weaning reminder", "Convert female calf to cow", "Suppress sold calf reminders"
    ]),
    "Records": ("REC", [
        "Milk record", "Feed record", "Health record", "Vaccination record", "Breeding record",
        "Calving record", "Veterinarian selection", "Offline record queue", "Record edit",
        "Record delete", "Duplicate prevention"
    ]),
    "Reminders": ("REM", [
        "Pregnancy check reminder", "Dry off reminder", "Calving reminder",
        "Next breeding readiness", "Missed pregnancy alert", "Repeat breeding alert",
        "Vaccination reminder", "Deworming reminder", "Calf care reminder",
        "Custom reminder", "Snooze reminder", "Complete reminder", "Cancel lifecycle reminders"
    ]),
    "Accounting": ("ACC", [
        "Daily milk entry", "Manual settlement entry", "Settlement OCR save",
        "Feed deduction as expense", "Manual feed expense inclusion", "Other expense",
        "Income entry", "Profit calculation", "Monthly summary", "Annual summary",
        "Settlement deletion reversal", "Payment slip upload status", "Financial reconciliation"
    ]),
    "OCR": ("OCR", [
        "Daily slip upload", "15-day settlement upload", "Native camera capture",
        "Gallery upload", "Image compression", "OCR text extraction", "AI data extraction",
        "Validation engine", "Manual review", "Duplicate detection", "JSON repair",
        "Fallback provider path"
    ]),
    "Reports": ("REP", [
        "Milk report", "Income report", "Expense report", "Profit report", "Annual report",
        "Cow performance report", "Vaccination report", "Settlement report",
        "PDF export", "Excel export", "Print layout"
    ]),
    "AI Assistant": ("AI", [
        "Ask dairy question", "Milk analytics answer", "Financial answer", "Reminder answer",
        "Goal coaching", "Chat history", "AI disable toggle", "AI response style",
        "AI data permissions", "Feedback capture", "Prompt injection defense"
    ]),
    "Notifications": ("NOTIF", [
        "Notification inbox", "Push subscription", "Notification preferences", "Quiet hours",
        "Admin broadcast", "Reminder notification", "Goal notification", "Notification tone",
        "Mark read", "Delete notification"
    ]),
    "Settings": ("SET", [
        "Settings home", "Security settings", "Notification settings", "Language settings",
        "Theme settings", "Font size", "Accessibility toggles", "AI settings",
        "Goal settings", "Export settings", "Veterinarian settings"
    ]),
    "Profile": ("PROF", [
        "Profile overview", "Edit personal info", "Edit farm name", "Profile photo",
        "Village/taluka dropdown", "Statistics dashboard", "Score page",
        "Achievements page", "Outside click popup close"
    ]),
    "Goals": ("GOAL", [
        "Daily milk goal", "Weekly milk goal", "Monthly milk goal", "Fat goal", "SNF goal",
        "Goal progress", "Achievement notification", "Historical goals", "AI recommendation"
    ]),
    "Support": ("SUP", [
        "Help center", "FAQ search", "Tutorials", "Create ticket", "Reply ticket",
        "Upload attachment", "Close ticket", "Reopen ticket", "Support rating",
        "Feature request", "Bug report"
    ]),
    "Achievements": ("ACH", [
        "Achievement dashboard", "Dairy score", "Milk badge", "OCR badge", "AI badge",
        "Consistency streak", "Leaderboard all farms", "Leaderboard taluka",
        "Share achievement", "Rank calculation"
    ]),
    "Admin Panel": ("ADMIN", [
        "Admin dashboard", "Farm list", "Farm details", "User management",
        "Subscription control", "Trial control", "Notification center", "Template edit/delete",
        "Support admin", "Audit logs", "Analytics", "Protected farm delete"
    ]),
}

VARIANTS = [
    ("positive business flow", "High", "High", "Yes"),
    ("mandatory field validation", "High", "Medium", "Yes"),
    ("boundary value validation", "Medium", "Medium", "Yes"),
    ("duplicate or conflict prevention", "High", "High", "Partial"),
    ("unauthorized role denial", "High", "Critical", "Yes"),
    ("Marathi/English localization", "Medium", "Medium", "Partial"),
    ("audit and derived data impact", "High", "High", "Partial"),
]


def md_table(headers, rows):
    def cell(v):
        return str(v).replace("\n", "<br>").replace("|", ";")
    lines = ["| " + " | ".join(headers) + " |", "| " + " | ".join(["---"] * len(headers)) + " |"]
    for row in rows:
        lines.append("| " + " | ".join(cell(x) for x in row) + " |")
    return "\n".join(lines) + "\n"


def requirement_id(prefix, feature_idx):
    return f"{prefix}-FR-{feature_idx:03d}"


def functional_cases():
    rows = []
    for module, (prefix, features) in MODULES.items():
        for f_idx, feature in enumerate(features, 1):
            for v_idx, (variant, priority, severity, auto) in enumerate(VARIANTS, 1):
                rows.append({
                    "testCaseId": f"{prefix}-TC-{f_idx:03d}-{v_idx:02d}",
                    "requirementId": requirement_id(prefix, f_idx),
                    "module": module,
                    "title": f"{feature} - {variant}",
                    "priority": priority,
                    "severity": severity,
                    "preconditions": "User, farm, role permissions and representative Marathi/English data are available.",
                    "testData": "Valid, invalid, duplicate, boundary and cross-farm records as applicable.",
                    "steps": "1. Login with target role. 2. Navigate to feature. 3. Execute scenario. 4. Verify UI/API/database/report/audit impact. 5. Repeat language-sensitive checks where required.",
                    "expectedResults": "System enforces business rules, validates input, preserves farm isolation, updates correct derived data and shows selected-language messages.",
                    "postConditions": "No unintended records, orphan rows, financial mismatch, reminder mismatch or unauthorized data exposure remains.",
                    "automationCandidate": auto,
                    "status": "Not Run",
                })
    return rows


def negative_cases(functional):
    rows = []
    negative_types = [
        "invalid input", "missing required data", "duplicate record", "unauthorized access",
        "cross-farm id tampering", "invalid role access", "stale/offline conflict"
    ]
    for idx, base in enumerate(functional[:210], 1):
        ntype = negative_types[(idx - 1) % len(negative_types)]
        rows.append({
            "testCaseId": f"NEG-TC-{idx:03d}",
            "requirementId": base["requirementId"],
            "module": base["module"],
            "title": f"{base['title'].split(' - ')[0]} - negative {ntype}",
            "priority": "High",
            "severity": "High" if "unauthorized" in ntype or "cross-farm" in ntype else "Medium",
            "preconditions": base["preconditions"],
            "testData": f"Scenario with {ntype}.",
            "steps": "1. Prepare invalid/unauthorized request. 2. Submit through UI/API. 3. Verify error response and database remains unchanged.",
            "expectedResults": "Operation is rejected with safe localized error, audit/alert created where applicable, and no data corruption occurs.",
            "postConditions": "System remains stable and user can recover.",
            "automationCandidate": "Yes",
            "status": "Not Run",
        })
    return rows


def load_json(path, fallback):
    p = Path(path)
    if not p.exists():
        return fallback
    return json.loads(p.read_text(encoding="utf-8"))


def api_cases():
    api_catalog = load_json("docs/technical/phase8/api_catalog.json", {"endpoints": []})
    rows = []
    variants = [
        ("valid request returns documented response schema", "Request/Response", "High"),
        ("missing/invalid request fields return validation error", "Validation", "High"),
        ("unauthenticated request is rejected", "Authentication", "High"),
        ("unauthorized role or farm id is rejected", "Authorization", "Critical"),
        ("rate limit and safe error behavior", "Rate Limit/Error", "Medium"),
    ]
    for endpoint in api_catalog.get("endpoints", []):
        for idx, (variant, test_type, severity) in enumerate(variants, 1):
            rows.append({
                "testCaseId": f"API12-TC-{len(rows)+1:04d}",
                "apiId": endpoint.get("id", ""),
                "module": endpoint.get("tag", ""),
                "method": endpoint.get("method", ""),
                "endpoint": endpoint.get("path", ""),
                "title": f"{endpoint.get('id','API')} {variant}",
                "testType": test_type,
                "requestValidation": endpoint.get("validation", ""),
                "expectedResponse": f"Status {endpoint.get('success','2xx')} for valid flow or documented {endpoint.get('errors','4xx/5xx')} for negative flow; schema {endpoint.get('response','StandardResponse')} is respected.",
                "authValidation": endpoint.get("auth", ""),
                "priority": "High",
                "severity": severity,
                "automationCandidate": "Yes",
                "status": "Not Run",
            })
    return rows


def database_cases():
    security_catalog = load_json("docs/security/phase11/security_catalog.json", {"rlsMatrix": []})
    rows = []
    scenarios = [
        ("relationship and foreign key integrity", "Insert/update/delete respects FK cardinality.", "SELECT 1; -- replace with table-specific FK query"),
        ("check constraint validation", "Invalid enum/range is rejected.", "SELECT conname FROM pg_constraint WHERE conrelid = '{{table}}'::regclass;"),
        ("RLS select isolation", "User sees only permitted farm rows.", "SET ROLE authenticated; SELECT count(*) FROM {{table}};"),
        ("RLS mutation denial", "Unauthorized insert/update/delete is rejected.", "-- Execute mutation as unauthorized test user and expect denial"),
        ("index/query plan validation", "Common filters use expected indexes.", "EXPLAIN ANALYZE SELECT * FROM {{table}} LIMIT 10;"),
        ("audit/backup validation", "High-risk changes create audit and backup/export remains valid.", "SELECT * FROM audit_logs WHERE table_name='{{table}}' ORDER BY created_at DESC LIMIT 5;"),
    ]
    for rls in security_catalog.get("rlsMatrix", []):
        table = rls["table"]
        for idx, (scenario, expected, query) in enumerate(scenarios, 1):
            rows.append({
                "testCaseId": f"DB12-TC-{len(rows)+1:04d}",
                "table": table,
                "requirementId": "DATA-FR-001",
                "title": f"{table} - {scenario}",
                "preconditions": "Seeded multi-farm database, authenticated test users and RLS enabled.",
                "sqlVerificationQuery": query.replace("{{table}}", table),
                "steps": "1. Run SQL/API setup. 2. Execute target database operation. 3. Verify constraints/RLS/audit. 4. Roll back test data.",
                "expectedResults": expected,
                "priority": "High",
                "severity": "Critical" if "RLS" in scenario else "High",
                "automationCandidate": "Yes",
                "status": "Not Run",
            })
    return rows


def ocr_cases():
    scenarios = [
        "Clear daily thermal slip", "Blurred daily slip", "Cropped daily slip", "Low light daily slip",
        "Clear 15-day settlement slip", "Folded/torn settlement slip", "Mixed Marathi/English settlement",
        "Duplicate upload", "Invalid file format", "Large file upload", "Provider unavailable", "JSON repair fallback"
    ]
    checks = ["accuracy", "confidence", "manual correction", "financial validation", "duplicate/error recovery", "audit trail"]
    rows = []
    for scenario in scenarios:
        for check in checks:
            rows.append({
                "testCaseId": f"OCR12-TC-{len(rows)+1:03d}",
                "requirementId": "OCR-FR-001",
                "scenario": scenario,
                "title": f"{scenario} - {check}",
                "preconditions": "OCR service configured or fallback/manual review path available.",
                "testData": "Representative dairy slip image/PDF and expected golden extraction values.",
                "steps": "1. Upload file. 2. Process OCR/AI extraction. 3. Review preview. 4. Edit if needed. 5. Save and verify database/audit.",
                "expectedResults": "Extraction meets confidence/validation rules; financial values are not silently guessed; user review is required before save.",
                "priority": "High",
                "severity": "High",
                "automationCandidate": "Partial",
                "status": "Not Run",
            })
    return rows


def ai_cases():
    scenarios = [
        "Today milk question", "Monthly revenue question", "Highest milk day question",
        "Average fat/SNF question", "Reminder due question", "Goal recommendation",
        "Animal data question", "Chat history search", "Language switching", "Prompt injection attempt",
        "Permission disabled data source", "No data available"
    ]
    checks = ["accuracy", "permission", "hallucination prevention", "Marathi response", "English response", "audit/token tracking"]
    rows = []
    for scenario in scenarios:
        for check in checks:
            rows.append({
                "testCaseId": f"AI12-TC-{len(rows)+1:03d}",
                "requirementId": "AI-FR-001",
                "scenario": scenario,
                "title": f"{scenario} - {check}",
                "preconditions": "AI settings, permissions and representative farm data are configured.",
                "testData": "Known database values and expected answer facts.",
                "steps": "1. Ask question. 2. Capture tool calls/output. 3. Compare answer with database. 4. Verify permission and language behavior.",
                "expectedResults": "AI answer uses only permitted real database data, avoids hallucination, follows selected style/language and logs usage.",
                "priority": "High",
                "severity": "Critical" if check in {"permission", "hallucination prevention"} else "High",
                "automationCandidate": "Partial",
                "status": "Not Run",
            })
    return rows


def localization_cases():
    areas = ["Navigation", "Dashboard", "Forms", "Dialogs", "Reports", "Notifications", "AI responses", "Validation messages", "Admin", "Exports"]
    languages = ["Marathi", "English"]
    rows = []
    for lang in languages:
        for area in areas:
            for check in ["translation completeness", "no mixed language", "layout expansion", "persistence after refresh/login"]:
                rows.append({
                    "testCaseId": f"LANG12-TC-{len(rows)+1:03d}",
                    "language": lang,
                    "area": area,
                    "title": f"{lang} {area} - {check}",
                    "preconditions": f"User language set to {lang}.",
                    "steps": "1. Open target area. 2. Trigger normal/empty/error states. 3. Refresh and re-login. 4. Verify layout and text.",
                    "expectedResults": "All user-facing text appears in selected language with no truncation, overlap or incorrect fallback.",
                    "priority": "High",
                    "severity": "Medium",
                    "automationCandidate": "Partial",
                    "status": "Not Run",
                })
    return rows


def accessibility_cases():
    areas = ["Dashboard", "Forms", "Modals", "Tables", "Reports", "Settings", "AI chat", "Admin"]
    checks = ["keyboard navigation", "screen reader labels", "color contrast", "font scaling", "touch target size", "reduced motion", "responsive overflow"]
    rows = []
    for area in areas:
        for check in checks:
            rows.append({
                "testCaseId": f"A11Y12-TC-{len(rows)+1:03d}",
                "area": area,
                "title": f"{area} - {check}",
                "preconditions": "Browser accessibility tooling and mobile viewport profiles available.",
                "steps": "1. Open page/state. 2. Execute accessibility check. 3. Verify manual keyboard/touch/screen reader behavior.",
                "expectedResults": "Page meets WCAG-oriented expectations for target users and no content is inaccessible.",
                "priority": "Medium",
                "severity": "Medium",
                "automationCandidate": "Partial",
                "status": "Not Run",
            })
    return rows


def performance_cases():
    targets = [
        ("Dashboard", "< 2 seconds"), ("Reports", "< 5 seconds"), ("OCR", "< 15 seconds"), ("AI", "< 5 seconds"),
        ("Cow list", "< 2 seconds"), ("Admin farm details", "< 4 seconds"), ("Export", "< 20 seconds")
    ]
    workloads = ["1,000 users", "10,000 users", "100,000 users"]
    test_types = ["load", "stress", "spike", "soak"]
    rows = []
    for area, target in targets:
        for workload in workloads:
            for test_type in test_types:
                rows.append({
                    "testCaseId": f"PERF12-TC-{len(rows)+1:03d}",
                    "area": area,
                    "testType": test_type,
                    "workloadModel": workload,
                    "target": target,
                    "preconditions": "Production-like environment, seeded large dataset, monitoring enabled.",
                    "steps": "1. Configure workload. 2. Execute test. 3. Capture p50/p95/p99, error rate and resource usage. 4. Compare target.",
                    "expectedResults": "Target is met with acceptable error rate and no data corruption or provider abuse.",
                    "priority": "High",
                    "severity": "High",
                    "automationCandidate": "Yes",
                    "status": "Not Run",
                })
    return rows


def security_cases():
    security_catalog = load_json("docs/security/phase11/security_catalog.json", {"securityTests": []})
    rows = []
    for item in security_catalog.get("securityTests", []):
        rows.append({
            "testCaseId": item["testCaseId"].replace("SEC11", "SEC12"),
            "area": item["area"],
            "title": item["title"],
            "owaspCategory": "OWASP aligned",
            "preconditions": item["preconditions"],
            "steps": item["steps"],
            "expectedResults": item["expectedResults"],
            "severity": item["severity"],
            "priority": "High",
            "automationCandidate": item["automationCandidate"],
            "status": item["status"],
        })
    extra = ["JWT expiry", "refresh token theft", "CSRF-like mutation", "public bucket discovery", "backup URL replay", "admin impersonation", "SQL injection attempt", "XSS in support ticket"]
    for scenario in extra:
        rows.append({
            "testCaseId": f"SEC12-TC-X{len(rows)+1:03d}",
            "area": "OWASP Extension",
            "title": scenario,
            "owaspCategory": "OWASP Top 10 / MASVS relevant",
            "preconditions": "Security test accounts and monitoring available.",
            "steps": "1. Execute attack simulation safely. 2. Verify rejection, logs and no data exposure.",
            "expectedResults": "Attack is blocked, no sensitive data leaks and alert/audit is recorded where required.",
            "severity": "Critical",
            "priority": "High",
            "automationCandidate": "Partial",
            "status": "Not Run",
        })
    return rows


def uat_scenarios():
    scenarios = [
        ("UAT-001", "Register New Farmer", "Farmer", "New user selects language, signs up and reaches dashboard."),
        ("UAT-002", "Create Farm", "Farm Owner", "Owner creates/updates farm profile with village/taluka data."),
        ("UAT-003", "Add Cow", "Farmer", "Farmer adds cow and verifies profile/reminders."),
        ("UAT-004", "Record Milk", "Farmer", "Farmer records morning/evening milk and sees dashboard/report impact."),
        ("UAT-005", "Complete Vaccination", "Farmer/Veterinarian", "User records vaccination and completes due reminder."),
        ("UAT-006", "Upload Dairy Slip", "Farmer", "User scans daily/settlement slip, reviews and saves."),
        ("UAT-007", "View Settlement", "Farm Owner", "Owner views settlement, deductions and financial reconciliation."),
        ("UAT-008", "Generate Reports", "Farm Owner", "Owner filters, exports and prints reports."),
        ("UAT-009", "Set Goals", "Farm Owner", "Owner creates goals and tracks progress."),
        ("UAT-010", "Use AI Assistant", "Farmer", "User asks dairy question and validates real-data answer."),
        ("UAT-011", "Create Support Ticket", "Farmer", "User creates ticket with attachment and gets reply."),
        ("UAT-012", "Backup and Restore", "Farm Owner", "Owner creates backup and validates restore workflow."),
        ("UAT-013", "Admin Analytics Review", "Admin", "Admin reviews farm details, analytics and protected actions."),
    ]
    return [{
        "uatId": sid,
        "scenario": name,
        "actor": actor,
        "objective": desc,
        "preconditions": "User role, farm data and language preference are available.",
        "steps": "1. Start from login. 2. Complete business workflow. 3. Verify UI, database, report, notification and audit outcomes. 4. Repeat language-critical parts.",
        "expectedOutcome": "Workflow completes without support intervention and all data is accurate, localized and traceable.",
        "acceptanceCriteria": "Business user signs off; no Critical/High defect remains; screenshots/evidence attached.",
        "status": "Not Run",
    } for sid, name, actor, desc in scenarios]


def regression_cases(functional):
    suites = ["Smoke", "Sanity", "Critical Path", "Full Regression", "Release Validation"]
    rows = []
    for module in MODULES.keys():
        for suite in suites:
            rows.append({
                "regressionId": f"REG12-TC-{len(rows)+1:03d}",
                "suite": suite,
                "module": module,
                "title": f"{suite} coverage for {module}",
                "steps": "Login, open module, execute one create/read/update or representative flow, verify no crash/data leak.",
                "expectedResults": "Core flow works, selected language is applied and no regression in linked summaries/reports.",
                "frequency": "Every build" if suite in {"Smoke", "Sanity"} else "Every release",
                "automationCandidate": "Yes" if suite in {"Smoke", "Sanity", "Critical Path"} else "Partial",
                "status": "Not Run",
            })
    for base in functional[::25]:
        rows.append({
            "regressionId": f"REG12-TC-{len(rows)+1:03d}",
            "suite": "Feature Regression",
            "module": base["module"],
            "title": f"Regression for {base['requirementId']} {base['title'].split(' - ')[0]}",
            "steps": base["steps"],
            "expectedResults": base["expectedResults"],
            "frequency": "Every major release",
            "automationCandidate": base["automationCandidate"],
            "status": "Not Run",
        })
    return rows


def release_checklists():
    categories = {
        "QA Exit": ["All planned tests executed", "No open Critical defects", "No open High defects without waiver", "Regression suite passed", "Localization sweep completed"],
        "UAT Sign-Off": ["All UAT scenarios executed", "Business owners sign off", "Known issues accepted", "Training/support material ready"],
        "Security Sign-Off": ["RLS tests passed", "Secret scan clean", "Storage policies verified", "OWASP security tests passed", "Phase 11 hardening reviewed"],
        "Performance Sign-Off": ["Dashboard target met", "Reports target met", "OCR target met", "AI target met", "Load test evidence attached"],
        "Production Release": ["Production env configured", "Database backup taken", "Migrations reviewed", "Monitoring enabled", "Support team ready"],
        "Rollback": ["Rollback build available", "DB rollback/restore plan documented", "Provider config rollback ready", "Communication template ready"],
    }
    rows = []
    for category, items in categories.items():
        for idx, item in enumerate(items, 1):
            rows.append({"checklistId": f"{category[:3].upper()}-{idx:03d}", "category": category, "item": item, "owner": "TBD", "status": "Pending", "evidence": ""})
    return rows


def rtm(functional, uats):
    rows = []
    uat_ids = [u["uatId"] for u in uats]
    seen = {}
    for tc in functional:
        rid = tc["requirementId"]
        seen.setdefault(rid, {"module": tc["module"], "tests": []})["tests"].append(tc["testCaseId"])
    for idx, (rid, data) in enumerate(sorted(seen.items()), 1):
        rows.append({
            "businessRequirement": f"BO-{((idx - 1) % 12) + 1:03d}",
            "functionalRequirement": rid,
            "module": data["module"],
            "userStory": f"US-{rid.replace('-FR-', '-')}",
            "testCases": ", ".join(data["tests"][:5]),
            "uatScenario": uat_ids[(idx - 1) % len(uat_ids)],
            "coverageStatus": "Covered",
            "coverageType": "Functional + negative/API/security where applicable",
        })
    return rows


def master_strategy_md(catalog):
    counts = {k: len(v) for k, v in catalog.items() if isinstance(v, list)}
    total_tests = sum(counts[k] for k in [
        "functionalTestCases", "negativeTestCases", "apiTestCases", "databaseTestCases", "ocrTestCases",
        "aiTestCases", "localizationTestCases", "accessibilityTestCases", "performanceTestCases",
        "securityTestCases", "regressionTestCases"
    ])
    return f"""# Majhi Dairy Master Test Strategy

**Document Version:** 1.0  
**Date:** {DATE}  
**Application:** Majhi Dairy  
**Platforms:** Web and Mobile Responsive PWA  
**Technology:** Next.js, React, TypeScript, Supabase, PostgreSQL, OpenAI, OCR Services  
**Languages:** Marathi and English

## 1. Master Test Strategy

### 1.1 Test Vision

Validate Majhi Dairy as a trustworthy, farmer-friendly, multilingual and financially accurate dairy management platform. Testing prioritizes real data accuracy, farm isolation, mobile usability, OCR/AI correctness, security controls and release confidence.

### 1.2 Test Objectives

- Validate all business and functional requirements from Phases 1-11.
- Verify accounting, settlement, OCR and report calculations.
- Verify Marathi and English language consistency.
- Prove farm-level tenant isolation through RLS/API/security tests.
- Validate production readiness under realistic web/mobile workloads.
- Provide UAT scripts that business stakeholders can execute and sign off.

### 1.3 Scope

In scope: authentication, dashboard, cows, calves, records, reminders, accounting, OCR, reports, AI assistant, notifications, settings, profile, goals, support, achievements, admin, APIs, database, security, localization, accessibility, performance, DR and release validation.

Out of scope for this package: third-party provider internal testing, payment gateway certification not yet integrated, hardware/IoT sensor certification, WhatsApp/SMS channels not implemented.

### 1.4 Testing Levels

{md_table(['Level','Purpose','Primary Owners'], [
('Unit','Validate functions, calculations, validators and UI components','Developers'),
('Integration','Validate APIs, Supabase, storage, AI/OCR and notification contracts','Developers/QA'),
('System','Validate complete app workflows across roles and devices','QA'),
('Regression','Protect existing behavior after every release','QA/Automation'),
('UAT','Business sign-off by farmers/admin stakeholders','Product/UAT Lead'),
('Performance','Validate response time and scale targets','Performance Engineer'),
('Security','Validate auth, RLS, API, storage, AI/OCR and admin controls','Security/QA'),
('Accessibility','Validate mobile readability, keyboard, contrast and responsive behavior','QA/UX'),
('Localization','Validate Marathi/English text, layout and generated outputs','QA/Product'),
('Disaster Recovery','Validate backup, restore and rollback readiness','DevOps/QA'),
])}

### 1.5 Quality Gates

{md_table(['Gate','Criteria'], [
('Build Gate','Unit tests pass, lint/build pass, no secret scan failure'),
('Integration Gate','API contract, database and provider mocks pass'),
('System Gate','Critical path functional tests pass'),
('Security Gate','RLS, auth, storage and OWASP security tests pass'),
('Performance Gate','Dashboard <2s, Reports <5s, OCR <15s, AI <5s at target profile'),
('UAT Gate','All UAT scenarios signed off or waived'),
('Release Gate','No open Critical/High defect without approved waiver'),
])}

## 2. Requirement Coverage Matrix

The full traceability matrix is included as a sheet in `Functional_Test_Cases.xlsx`.

Coverage summary:

{md_table(['Artifact','Count'], sorted(counts.items()))}

Total generated executable/planned test cases across detailed suites: **{total_tests}**.

## 3. Test Design Specification

{md_table(['Technique','Application in Majhi Dairy'], [
('Boundary Value Analysis','Milk liters, fat, SNF, rates, dates, password/PIN length, file size, pagination limits'),
('Equivalence Partitioning','Valid/invalid roles, valid/invalid slip types, supported/unsupported files, language options'),
('Decision Tables','Reminder triggers, subscription/trial states, AI permissions, OCR confidence save rules'),
('State Transition Testing','Cow pregnancy/calving lifecycle, calf active/sold/conversion lifecycle, ticket/reminder states'),
('Use Case Testing','End-to-end UAT scenarios such as signup, milk record, slip upload, settlement, report and support'),
('Risk-Based Testing','Financial accuracy, cross-farm leakage, admin protected actions, OCR/AI hallucination, backups'),
('Exploratory Testing','Mobile PWA camera/upload, iOS session behavior, Marathi layout, admin farm details'),
])}

## 4. Functional Test Suites

Detailed functional and negative test cases are delivered in `Functional_Test_Cases.xlsx`.

Module coverage:

{md_table(['Module','Feature Count'], [(m, len(v[1])) for m,v in MODULES.items()])}

## 5. Negative Testing

Negative tests cover invalid inputs, missing data, duplicates, unauthorized access, invalid OCR files, AI abuse, invalid API requests and invalid role access. They verify safe localized errors and unchanged database state.

## 6. Database Testing

Database tests validate relationships, constraints, RLS policies, indexes, audit logs, backups and SQL verification queries. Delivered in `Database_Test_Cases.xlsx`.

## 7. API Testing Package

API tests are generated from Phase 8 endpoint inventory. Delivered in `API_Test_Cases.xlsx`.

## 8. OCR Testing Package

OCR tests include clear, blurred, cropped, low-light, duplicate, invalid and large-file slips, with accuracy/confidence/manual-review validation. Delivered in `OCR_Test_Cases.xlsx`.

## 9. AI Testing Package

AI tests validate real-data answers, hallucination prevention, permission controls, prompt injection resistance, language switching, chat history and response quality. Delivered in `AI_Test_Cases.xlsx`.

## 10. Localization Testing

Localization tests cover Marathi and English labels, menus, forms, notifications, reports, AI responses, error messages, layout expansion and persistence.

## 11. Accessibility Testing

Accessibility tests cover keyboard navigation, screen reader labels, contrast, font scaling, large touch targets, reduced motion and responsive overflow.

## 12. Performance Testing

Performance targets:

{md_table(['Area','Target'], [
('Dashboard','< 2 seconds'),
('Reports','< 5 seconds'),
('OCR','< 15 seconds'),
('AI','< 5 seconds'),
])}

Workload models include 1,000, 10,000 and 100,000 users, with load, stress, spike and soak tests.

## 13. Security Testing

Security tests build on Phase 11 security package and include authentication, authorization, session, JWT, RLS, input validation, file upload, API, admin, backup and OWASP-aligned cases. Delivered in `Security_Test_Cases.xlsx`.

## 14. UAT Package

UAT scenarios are delivered in `UAT_Scenarios.xlsx` and cover farmer, farm owner, veterinarian, support and admin business journeys.

## 15. Regression Test Suite

Regression tests include smoke, sanity, critical path, full regression and release validation suites. Delivered in `Regression_Test_Suite.xlsx`.

## 16. Test Automation Strategy

Recommended tools:

- Unit/component: Vitest/Jest, React Testing Library.
- E2E: Playwright for web/mobile responsive flows.
- API/contract: Postman/Newman or Schemathesis against OpenAPI.
- DB/RLS: Supabase test project with SQL assertions.
- Performance: k6.
- Security: OWASP ZAP, secret scanning, dependency scanning.
- Accessibility: axe-core and manual mobile checks.

Automation targets:

{md_table(['Phase','Coverage Target'], [
('Phase A','Smoke, auth, dashboard, milk record, reminder, accounting basics: 35%'),
('Phase B','API contract, database/RLS, OCR/AI happy paths, localization smoke: 55%'),
('Phase C','Critical regression, security, performance baselines, admin flows: 75%'),
])}

## 17. Defect Management

Severity matrix:

{md_table(['Severity','Definition','Example'], [
('Critical','Blocks release or causes data leak/corruption','Cross-farm data exposure, incorrect profit save'),
('High','Major user workflow broken','Slip save fails, login fails on iPhone'),
('Medium','Workaround exists but user impact is visible','Layout issue, non-critical report filter bug'),
('Low','Cosmetic/minor issue','Text alignment or typo'),
])}

Defect lifecycle: New -> Triage -> Assigned -> In Progress -> Fixed -> QA Retest -> Closed/Reopened -> Release Notes.

## 18. Release Readiness

Detailed checklists are delivered in `Release_Readiness_Checklist.xlsx`.

## 19. Test Metrics and Dashboards

Metrics include coverage, pass rate, open defects by severity, automation coverage, escaped defects, UAT sign-off, performance targets, security findings and go/no-go risk.

## 20. Final QA Approval Package

Go/No-Go framework:

- Go: All release gates met; no open Critical/High; UAT signed off; rollback ready.
- Conditional Go: Low/Medium defects accepted with owners and dates.
- No-Go: Any unresolved Critical, data integrity defect, cross-farm security issue, or missing rollback plan.
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
    functional = functional_cases()
    uats = uat_scenarios()
    catalog = {
        "functionalTestCases": functional,
        "negativeTestCases": negative_cases(functional),
        "apiTestCases": api_cases(),
        "databaseTestCases": database_cases(),
        "ocrTestCases": ocr_cases(),
        "aiTestCases": ai_cases(),
        "localizationTestCases": localization_cases(),
        "accessibilityTestCases": accessibility_cases(),
        "performanceTestCases": performance_cases(),
        "securityTestCases": security_cases(),
        "uatScenarios": uats,
        "regressionTestCases": regression_cases(functional),
        "releaseChecklists": release_checklists(),
        "rtm": rtm(functional, uats),
    }
    md = master_strategy_md(catalog)
    (BASE / "Majhi_Dairy_Master_Test_Strategy.md").write_text(md, encoding="utf-8")
    md_to_docx(md, BASE / "Majhi_Dairy_Master_Test_Strategy.docx")
    (BASE / "phase12_qa_catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({k: len(v) for k, v in catalog.items()}, indent=2))


if __name__ == "__main__":
    main()
