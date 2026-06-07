from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from html import escape
import json
import re

BASE = Path("docs/project/phase10")
BASE.mkdir(parents=True, exist_ok=True)
DATE = "2026-06-07"

EPICS = [
    ("EPIC-AUTH", "Authentication & Onboarding", "Secure first-time access, language selection and session foundation.", "Must", ""),
    ("EPIC-DASH", "Home Dashboard", "Give farmers instant farm status, actions, reminders and goals.", "Must", "AUTH, FARM"),
    ("EPIC-FARM", "Farm & Member Management", "Manage tenant farm profile, members and permissions.", "Must", "AUTH"),
    ("EPIC-COW", "Cow Management", "Manage cow lifecycle, profile, reproduction and health visibility.", "Must", "FARM"),
    ("EPIC-CALF", "Calf Management", "Track calf lifecycle, reminders and conversion/sale status.", "Must", "COW"),
    ("EPIC-REC", "Records Management", "Capture milk, feed, health, vaccination, breeding and calving records.", "Must", "COW, CALF"),
    ("EPIC-REM", "Reminder Engine", "Generate and complete lifecycle, health and operational reminders.", "Must", "REC"),
    ("EPIC-ACC", "Accounting & Settlement", "Handle milk income, expenses, settlement slips, feed deduction and profit.", "Must", "REC"),
    ("EPIC-OCR", "AI Slip Scanning & OCR", "Digitize daily and settlement slips with review-first financial safety.", "Should", "ACC"),
    ("EPIC-REP", "Reports & Analytics", "Generate milk, financial, animal and annual reports.", "Should", "ACC, REC"),
    ("EPIC-AI", "Dugdhmitra AI Assistant", "Answer farm questions using real database data and permissions.", "Should", "REC, ACC"),
    ("EPIC-NOTIF", "Notifications", "Deliver in-app and push reminders, admin messages and system alerts.", "Should", "REM"),
    ("EPIC-SET", "Settings & Personalization", "Manage language, appearance, AI, notification, goals and backup settings.", "Must", "AUTH"),
    ("EPIC-PROF", "Profile & Statistics", "Manage user/farm profile, statistics and score visibility.", "Should", "FARM, REC"),
    ("EPIC-SUP", "Support Center", "Provide FAQ, tickets, attachments and support communication.", "Could", "AUTH"),
    ("EPIC-ACH", "Achievements & Leaderboard", "Increase engagement through score, badges and rankings.", "Could", "REC, GOAL"),
    ("EPIC-ADMIN", "Admin Panel", "Manage farms, users, subscriptions, notifications, analytics and support.", "Must", "AUTH, FARM"),
    ("EPIC-QA", "Quality, Security & Performance", "Harden app for scale, security, localization and launch readiness.", "Must", "All"),
]

STORY_SEEDS = {
    "EPIC-AUTH": [
        "signup with phone or email", "login with password", "PIN login", "forgot password", "reset password",
        "logout current device", "logout all devices", "session expiry redirect", "first-time language selection",
        "language persistence after login", "multi-device login", "account lockout", "onboarding farm creation",
        "profile creation after signup", "existing user compatibility", "iOS session recovery", "Android PWA login",
        "admin login", "support login", "security audit logging"
    ],
    "EPIC-DASH": [
        "today milk summary", "morning/evening split", "today income", "pending slip banner", "quick actions",
        "AI card", "goal progress", "urgent reminders", "today reminders", "upcoming reminders", "recent activity",
        "farm snapshot", "monthly performance", "dairy score", "notification bell", "skeleton loading", "offline state",
        "light theme default", "mobile layout", "refresh strategy"
    ],
    "EPIC-FARM": [
        "create farm", "edit farm name", "edit village/taluka/district", "member invite", "member role change",
        "member removal", "farm settings", "veterinarian list", "farm permissions", "farm status", "trial status",
        "farm statistics", "farm profile completion", "storage paths", "location dropdown", "subscription state"
    ],
    "EPIC-COW": [
        "add cow", "edit cow", "archive cow", "mark sold", "cow profile", "cow photo", "breed selection",
        "tag number", "pregnancy status", "AI record", "pregnancy check", "calving status", "health history",
        "vaccination history", "important dates", "cow timeline", "sort pregnant cows by due date", "fast detail navigation"
    ],
    "EPIC-CALF": [
        "add calf", "edit calf", "sell calf", "mark dead", "convert female calf to cow", "link mother cow",
        "calf photo", "gender tracking", "dehorning reminder 30-45 days", "weaning reminder", "health records",
        "vaccination records", "calf age display", "suppress sold calf reminders", "calf lifecycle audit"
    ],
    "EPIC-REC": [
        "manual milk record", "bulk milk record", "feed record", "feed expense impact", "health record",
        "vaccination record", "deworming record", "breeding record", "calving record", "record edit",
        "record delete", "duplicate prevention", "offline record queue", "voice inputs", "validation messages",
        "veterinarian dropdown", "milk source type", "record audit"
    ],
    "EPIC-REM": [
        "pregnancy check reminder", "dry-off reminder", "calving reminder", "next breeding readiness reminder",
        "missed pregnancy alert", "repeat breeding alert", "vaccination reminder", "deworming reminder",
        "dehorning reminder", "weaning reminder", "custom reminder", "snooze reminder", "complete reminder",
        "cancel lifecycle reminders", "slip upload banner not reminder", "reminder filters", "home reminder summary",
        "notification integration"
    ],
    "EPIC-ACC": [
        "daily milk accounting", "15-day settlement manual entry", "settlement OCR save", "feed deduction as expense",
        "manual feed expense inclusion", "other expense", "income entry", "profit calculation", "monthly summary",
        "annual summary", "payment status", "settlement deletion reversal", "source of truth rules",
        "morning/evening settlement totals", "dairy slips list", "date filters", "financial audit", "report reconciliation"
    ],
    "EPIC-OCR": [
        "native camera upload", "gallery upload", "client compression", "clear daily slip extraction", "poor image warning",
        "settlement extraction", "morning/evening table extraction", "OCR fallback to direct GPT", "manual review",
        "confidence indicators", "duplicate slip detection", "save daily slip", "save settlement slip", "retry scan",
        "audit log", "offline capture", "provider billing error handling", "JSON repair"
    ],
    "EPIC-REP": [
        "milk report", "income report", "expense report", "profit report", "annual report", "cow performance report",
        "vaccination report", "settlement report", "print report", "PDF export", "Excel export", "CSV export",
        "Marathi report", "English report", "filters", "charts", "monthly comparison", "data source reconciliation"
    ],
    "EPIC-AI": [
        "open AI chat", "ask today milk", "ask monthly income", "average fat", "highest milk day", "permissions",
        "disable AI", "response style short", "response style detailed", "response style expert", "chat history",
        "delete chat", "feedback", "Marathi answer", "English answer", "no hallucination", "tool audit", "token tracking"
    ],
    "EPIC-NOTIF": [
        "notification inbox", "mark read", "mark all read", "delete notification", "push registration", "test notification",
        "notification preferences", "quiet hours", "admin broadcast", "reminder notification", "goal notification",
        "subscription notification", "push retry", "invalid subscription cleanup", "notification tone", "voice off"
    ],
    "EPIC-SET": [
        "settings home", "profile settings", "security settings", "notification settings", "language settings",
        "theme settings", "font size", "compact mode", "high contrast", "large touch targets", "reduce animations",
        "AI settings", "goals settings", "export settings", "veterinarian settings", "save preferences"
    ],
    "EPIC-PROF": [
        "profile page", "profile photo", "edit personal info", "edit farm name", "village/taluka dropdown",
        "statistics dashboard", "dairy score page", "achievements page", "member since", "farm statistics",
        "profile menu close on outside click", "language preference display"
    ],
    "EPIC-SUP": [
        "help home", "FAQ search", "tutorials", "create ticket", "reply ticket", "upload attachment", "close ticket",
        "reopen ticket", "support rating", "bug report", "feature request", "contact options", "system status",
        "admin reply notification"
    ],
    "EPIC-ACH": [
        "achievement dashboard", "milk production badge", "income badge", "OCR badge", "AI badge", "consistency streak",
        "farm growth badge", "dairy score", "rank page", "leaderboard all farms", "leaderboard taluka",
        "share achievement", "confetti", "achievement notification", "score recalculation"
    ],
    "EPIC-ADMIN": [
        "admin dashboard", "user list", "farm list", "farm details", "farm health score", "device details",
        "subscription control", "trial reduce/extend", "suspend farm", "activate farm", "admin notification center",
        "template edit/delete", "support admin", "audit logs", "analytics", "export farm data", "protected delete"
    ],
    "EPIC-QA": [
        "unit test setup", "API contract tests", "RLS tests", "financial regression", "OCR regression", "AI permission tests",
        "localization audit", "iOS PWA testing", "Android PWA testing", "performance optimization", "security scan",
        "UAT scripts", "release checklist", "monitoring", "backup restore drill"
    ],
}

SPRINT_PLAN = [
    ("Sprint 1", "Authentication, language selection, onboarding", ["EPIC-AUTH", "EPIC-SET"]),
    ("Sprint 2", "Farm management and cow management", ["EPIC-FARM", "EPIC-COW"]),
    ("Sprint 3", "Calf management and milk records", ["EPIC-CALF", "EPIC-REC"]),
    ("Sprint 4", "Reminders and vaccinations", ["EPIC-REM", "EPIC-REC", "EPIC-NOTIF"]),
    ("Sprint 5", "Accounting and settlements", ["EPIC-ACC"]),
    ("Sprint 6", "OCR and AI assistant", ["EPIC-OCR", "EPIC-AI"]),
    ("Sprint 7", "Reports and notifications", ["EPIC-REP", "EPIC-NOTIF"]),
    ("Sprint 8", "Admin panel and support", ["EPIC-ADMIN", "EPIC-SUP"]),
    ("Sprint 9", "Performance, security, bug fixes", ["EPIC-QA", "EPIC-ACH"]),
    ("Sprint 10", "UAT and release preparation", ["EPIC-QA"]),
]


def md_table(headers, rows):
    def cell(v):
        return str(v).replace("\n", "<br>").replace("|", ";")

    lines = ["| " + " | ".join(headers) + " |", "| " + " | ".join(["---"] * len(headers)) + " |"]
    for row in rows:
        lines.append("| " + " | ".join(cell(x) for x in row) + " |")
    return "\n".join(lines) + "\n"


def story_points(seed, idx):
    if any(x in seed for x in ["OCR", "settlement", "AI", "admin", "RLS", "performance", "backup", "subscription"]):
        return 8 if idx % 3 else 13
    if any(x in seed for x in ["delete", "audit", "offline", "report", "push", "language"]):
        return 5
    return [2, 3, 5][idx % 3]


def build_epics():
    rows = []
    for epic_id, name, value, priority, deps in EPICS:
        stories = STORY_SEEDS[epic_id]
        total = sum(story_points(s, i) for i, s in enumerate(stories, 1))
        rows.append(
            {
                "epicId": epic_id,
                "epicName": name,
                "businessValue": value,
                "priority": priority,
                "dependencies": deps,
                "storyCount": len(stories),
                "estimatedPoints": total,
                "acceptanceCriteria": "All linked user stories pass QA, UAT-critical paths are approved, security/access rules are enforced and Marathi/English UX is verified.",
            }
        )
    return rows


def build_stories():
    stories = []
    for epic_id, epic_name, value, priority, deps in EPICS:
        seeds = STORY_SEEDS[epic_id]
        for i, seed in enumerate(seeds, 1):
            story_id = f"US-{epic_id.split('-')[1]}-{i:03d}"
            actor = "farmer" if epic_id not in {"EPIC-ADMIN", "EPIC-SUP"} else ("administrator" if epic_id == "EPIC-ADMIN" else "support user")
            points = story_points(seed, i)
            stories.append(
                {
                    "storyId": story_id,
                    "epicId": epic_id,
                    "epicName": epic_name,
                    "description": f"As a {actor}, I want {seed} so that I can use Majhi Dairy effectively and accurately.",
                    "acceptanceCriteria": "Given valid role and data, when the user completes the action, then the system saves/returns correct data, enforces permissions, shows localized feedback and updates related summaries/audit where applicable.",
                    "businessRules": "Tenant isolation by farm_id; Marathi/English support; financial values require validation; high-risk actions require audit.",
                    "dependencies": deps,
                    "priority": priority,
                    "storyPoints": points,
                    "release": release_for_epic(epic_id),
                    "sprint": sprint_for_epic(epic_id),
                    "status": "Backlog",
                }
            )
            # Add variant stories for richer backlog.
            if len(stories) < 360 and i % 2 == 0:
                stories.append(
                    {
                        "storyId": f"{story_id}A",
                        "epicId": epic_id,
                        "epicName": epic_name,
                        "description": f"As a {actor}, I want validation and error handling for {seed} so that mistakes are prevented before data is saved.",
                        "acceptanceCriteria": "Invalid, duplicate, unauthorized and boundary inputs show clear localized errors and do not corrupt database state.",
                        "businessRules": "Use standard error envelope, field-level validation and audit for protected actions.",
                        "dependencies": deps,
                        "priority": "Must" if priority == "Must" else priority,
                        "storyPoints": 3 if points <= 5 else 5,
                        "release": release_for_epic(epic_id),
                        "sprint": sprint_for_epic(epic_id),
                        "status": "Backlog",
                    }
                )
    # Ensure 300+ and useful cross-cutting stories.
    cross = [
        ("SEC", "cross-farm access prevention", "administrator", "EPIC-QA"),
        ("SEC", "audit log verification", "administrator", "EPIC-QA"),
        ("LANG", "Marathi and English text review", "farmer", "EPIC-SET"),
        ("PERF", "home page sub-second perceived load", "farmer", "EPIC-QA"),
        ("OFF", "offline queue conflict resolution", "farmer", "EPIC-QA"),
        ("IOS", "iOS PWA session stability", "farmer", "EPIC-QA"),
        ("AND", "Android PWA install and push flow", "farmer", "EPIC-QA"),
        ("DATA", "database migration rollback", "developer", "EPIC-QA"),
        ("OBS", "monitoring and alerting", "developer", "EPIC-QA"),
        ("DR", "backup restore drill", "administrator", "EPIC-QA"),
    ]
    for i in range(1, 81):
        code, seed, actor, epic_id = cross[(i - 1) % len(cross)]
        stories.append(
            {
                "storyId": f"US-X-{i:03d}",
                "epicId": epic_id,
                "epicName": next(e[1] for e in EPICS if e[0] == epic_id),
                "description": f"As a {actor}, I want {seed} scenario {i} verified so that launch quality is protected.",
                "acceptanceCriteria": "Scenario passes automated/manual QA, no Critical/High defect remains and evidence is attached.",
                "businessRules": "Follow QA Phase 9 package and release readiness checklist.",
                "dependencies": "All relevant feature epics",
                "priority": "Must",
                "storyPoints": [2, 3, 5, 8][i % 4],
                "release": "Release 4",
                "sprint": "Sprint 9" if i <= 50 else "Sprint 10",
                "status": "Backlog",
            }
        )
    return stories


def release_for_epic(epic_id):
    if epic_id in {"EPIC-AUTH", "EPIC-FARM", "EPIC-COW", "EPIC-CALF", "EPIC-REC", "EPIC-REM", "EPIC-SET"}:
        return "Release 1"
    if epic_id in {"EPIC-ACC", "EPIC-OCR", "EPIC-REP", "EPIC-NOTIF"}:
        return "Release 2"
    if epic_id in {"EPIC-AI", "EPIC-PROF", "EPIC-SUP", "EPIC-ACH"}:
        return "Release 3"
    return "Release 4"


def sprint_for_epic(epic_id):
    for sprint, _, epics in SPRINT_PLAN:
        if epic_id in epics:
            return sprint
    return "Sprint 10"


def build_releases(stories):
    rows = []
    for rel in ["Release 1", "Release 2", "Release 3", "Release 4"]:
        rel_stories = [s for s in stories if s["release"] == rel]
        rows.append(
            {
                "releaseId": rel,
                "theme": {
                    "Release 1": "MVP farm operations",
                    "Release 2": "Financial automation and reporting",
                    "Release 3": "Engagement, AI and support",
                    "Release 4": "Admin, scale, hardening and go-live",
                }[rel],
                "featuresIncluded": ", ".join(sorted(set(s["epicName"] for s in rel_stories))),
                "storyCount": len(rel_stories),
                "storyPoints": sum(int(s["storyPoints"]) for s in rel_stories),
                "dependencies": "Prior release foundation and successful QA gates.",
                "risks": "Scope creep, financial accuracy, provider setup, localization gaps and performance.",
                "acceptanceCriteria": "All Must stories complete, no Critical/High defects, release checklist approved.",
            }
        )
    return rows


def build_sprints(stories):
    rows = []
    for sprint, objective, epics in SPRINT_PLAN:
        sprint_stories = [s for s in stories if s["sprint"] == sprint]
        rows.append(
            {
                "sprint": sprint,
                "length": "2 weeks",
                "objectives": objective,
                "epics": ", ".join(epics),
                "storyIds": ", ".join(s["storyId"] for s in sprint_stories[:40]),
                "storyCount": len(sprint_stories),
                "storyPoints": sum(int(s["storyPoints"]) for s in sprint_stories),
                "dependencies": "Previous sprint deliverables, database/API contracts and QA environment.",
                "definitionOfDone": "Code reviewed, unit/API tests pass, RLS/security checks pass, Marathi/English labels complete, QA evidence attached and no open blocker.",
            }
        )
    return rows


def roadmap():
    return [
        {"quarter": "Q1", "theme": "MVP foundation", "features": "Auth, onboarding, language, farm, cows, calves, records, reminders, base dashboard", "successMetrics": "First 50 pilot farms onboarded; daily milk record flow stable"},
        {"quarter": "Q2", "theme": "Accounting and OCR", "features": "Manual accounting, settlement, OCR slips, reports, notifications", "successMetrics": "80% pilot farms use accounting; OCR review save success > 90%"},
        {"quarter": "Q3", "theme": "AI and engagement", "features": "AI assistant, goals, profile stats, support, achievements, leaderboard", "successMetrics": "AI usage by 40% active farms; retention improved"},
        {"quarter": "Q4", "theme": "Admin, scale and commercialization", "features": "Admin monitoring, subscriptions, analytics, performance, security hardening, go-live", "successMetrics": "Paid conversion, stable production operations, support SLA met"},
    ]


def risks():
    items = [
        ("RISK-001", "Financial calculation mismatch", "Technical/Business", "Medium", "Critical", "Settlement/profit errors reduce trust.", "Automated reconciliation, source-of-truth rules, UAT with real slips."),
        ("RISK-002", "OCR accuracy below expectation", "AI/OCR", "High", "High", "Farmers need repeated rescans.", "Native camera, validation, fallback, manual review, image guidance."),
        ("RISK-003", "Cross-farm data leak", "Security", "Low", "Critical", "Privacy breach.", "RLS tests, admin audit, penetration testing."),
        ("RISK-004", "iOS PWA storage/session issues", "Technical", "Medium", "High", "iPhone users cannot navigate reliably.", "iOS-specific QA and session fallback."),
        ("RISK-005", "Localization gaps", "Product", "Medium", "Medium", "Mixed language reduces usability.", "i18n audit and screenshot QA."),
        ("RISK-006", "Provider cost spike", "AI/OCR", "Medium", "Medium", "OpenAI/OCR usage grows unexpectedly.", "Quotas, compression, cache, usage dashboards."),
        ("RISK-007", "Slow dashboard at scale", "Performance", "Medium", "High", "Poor first impression.", "Materialized views, caching and load tests."),
        ("RISK-008", "Reminder lifecycle bugs", "Functional", "Medium", "High", "Wrong animal care reminders.", "Trigger tests and regression pack."),
        ("RISK-009", "Push notifications unreliable", "Integration", "Medium", "Medium", "Users miss important alerts.", "In-app fallback, retry and device diagnostics."),
        ("RISK-010", "Scope creep", "Project", "High", "High", "Timeline slips.", "MoSCoW control, change request process."),
        ("RISK-011", "Admin protected action misuse", "Security", "Low", "High", "Farm suspension/delete mistakes.", "Confirmation, audit, role limits, protected delete."),
        ("RISK-012", "Database migration failure", "Technical", "Medium", "Critical", "Data loss or downtime.", "Staging rehearsal, backup, rollback and compatibility views."),
    ]
    return [
        {
            "riskId": a,
            "risk": b,
            "category": c,
            "probability": d,
            "impact": e,
            "description": f,
            "mitigation": g,
            "owner": "Product/Tech Lead",
            "status": "Open",
        }
        for a, b, c, d, e, f, g in items
    ]


def costs():
    return [
        {"costItem": "Supabase database/auth/storage", "startupMonthly": "₹2,000-₹8,000", "growthMonthly": "₹15,000-₹45,000", "scaleMonthly": "₹75,000+", "assumptions": "Depends on active farms, storage, backups and compute."},
        {"costItem": "OpenAI AI assistant", "startupMonthly": "₹500-₹2,000", "growthMonthly": "₹5,000-₹25,000", "scaleMonthly": "₹75,000+", "assumptions": "Controlled by quotas, short prompts, function calling and caching."},
        {"costItem": "OCR provider", "startupMonthly": "₹1,000-₹5,000", "growthMonthly": "₹10,000-₹40,000", "scaleMonthly": "₹1,00,000+", "assumptions": "Driven by slip volume and provider billing."},
        {"costItem": "Storage and backups", "startupMonthly": "₹500-₹2,000", "growthMonthly": "₹5,000-₹20,000", "scaleMonthly": "₹50,000+", "assumptions": "Slip images, reports, backups, support files."},
        {"costItem": "Push notifications", "startupMonthly": "₹0-₹1,000", "growthMonthly": "₹2,000-₹10,000", "scaleMonthly": "₹25,000+", "assumptions": "Web push low cost; SMS/WhatsApp future increases cost."},
        {"costItem": "Monitoring/logging", "startupMonthly": "₹1,000-₹5,000", "growthMonthly": "₹10,000-₹30,000", "scaleMonthly": "₹75,000+", "assumptions": "Errors, traces, uptime, logs retention."},
        {"costItem": "Domain/CDN/email/tools", "startupMonthly": "₹1,000-₹5,000", "growthMonthly": "₹5,000-₹20,000", "scaleMonthly": "₹50,000+", "assumptions": "Deployment, email, support and analytics tools."},
    ]


def checklists():
    items = []
    categories = {
        "Development": ["Repo structure ready", "Env variables documented", "Database migrations reviewed", "API contract linked", "Code review process active", "Feature flags configured", "Logging added", "Error boundaries added", "Offline sync reviewed", "i18n keys complete"],
        "QA": ["QA strategy approved", "RTM coverage 100%", "Functional cases imported", "API tests ready", "Security tests ready", "Regression pack ready", "UAT scenarios scheduled", "Performance scripts ready", "Defect workflow agreed", "Release evidence folder created"],
        "Security": ["RLS enabled", "Service role server-only", "Storage buckets private", "Admin actions audited", "Rate limits configured", "Secrets rotated", "Backup access restricted", "AI/OCR privacy reviewed", "Pen test completed", "Security sign-off"],
        "Launch": ["Production backup taken", "UAT sign-off", "Support team trained", "Monitoring active", "Rollback plan ready", "Release notes ready", "Admin credentials verified", "Push keys configured", "Provider billing configured", "Go/no-go approved"],
    }
    for category, rows in categories.items():
        for i, item in enumerate(rows, 1):
            items.append({"checklistId": f"{category[:3].upper()}-{i:03d}", "category": category, "item": item, "owner": "TBD", "status": "Pending", "evidence": ""})
    return items


def project_plan_md(epics, stories, releases, sprints, risk_rows, cost_rows):
    total_points = sum(int(s["storyPoints"]) for s in stories)
    return f"""# Majhi Dairy Project Execution Plan

**Document Version:** 1.0  
**Date:** {DATE}  
**Application:** Majhi Dairy  
**Stack:** Next.js, React, TypeScript, Supabase, PostgreSQL, OpenAI, OCR Services  
**Languages:** Marathi and English

## 1. Product Roadmap

### Product Vision

Majhi Dairy will become a trusted Marathi-first and English-ready digital operating system for dairy farmers, helping them manage animals, milk production, reminders, accounting, reports, AI assistance and farm growth from a mobile-first PWA.

### North Star Metric

Weekly Active Farms with at least one meaningful farm operation recorded: milk entry, reminder completion, slip scan, accounting entry, AI question or report generation.

### Success Metrics

{md_table(['Metric','Target'], [
('Daily active farms','Increase month over month during pilot'),
('Milk records created','80% active farms record milk at least 5 days/week'),
('OCR adoption','50% accounting users scan at least one slip/month'),
('AI usage','40% active farms ask at least one AI question/month'),
('Retention','60%+ 30-day retention after onboarding'),
('Subscription conversion','Pilot-to-paid conversion target defined by business team'),
('Support SLA','Critical support tickets responded within 4 hours'),
])}
### 12-Month Roadmap

{md_table(['Quarter','Theme','Features','Success Metrics'], [(r['quarter'], r['theme'], r['features'], r['successMetrics']) for r in roadmap()])}

## 2. MVP Definition

{md_table(['MoSCoW','Scope'], [
('Must Have','Authentication, language selection, farm setup, cow/calf management, milk records, reminders, accounting basics, reports, settings, admin basics, security/RLS'),
('Should Have','OCR slip scanning, settlement processing, notifications, AI assistant, export, profile statistics'),
('Could Have','Achievements, leaderboard, support center, advanced analytics, shareable cards'),
("Won't Have for MVP",'WhatsApp/SMS automation, full ERP integrations, marketplace, advanced IoT integrations'),
])}

Critical launch features: secure login, farm isolation, animal records, milk records, reminders, accounting/profit accuracy, reports, Marathi/English language, backup/export, admin support visibility and QA/security gates.

## 3. Epics

{md_table(['Epic ID','Epic Name','Business Value','Priority','Dependencies','Story Count','Estimated Points','Acceptance Criteria'], [(e['epicId'], e['epicName'], e['businessValue'], e['priority'], e['dependencies'], e['storyCount'], e['estimatedPoints'], e['acceptanceCriteria']) for e in epics])}

## 4. User Story Backlog Summary

Generated backlog contains **{len(stories)} user stories** with **{total_points} total story points**. Detailed backlog is available in `User_Story_Backlog.xlsx`.

## 5. Release Planning

{md_table(['Release','Theme','Features Included','Story Count','Story Points','Dependencies','Risks','Acceptance Criteria'], [(r['releaseId'], r['theme'], r['featuresIncluded'], r['storyCount'], r['storyPoints'], r['dependencies'], r['risks'], r['acceptanceCriteria']) for r in releases])}

## 6. Sprint Planning

Sprint length: 2 weeks.

{md_table(['Sprint','Objectives','Epics','Story Count','Story Points','Dependencies','Definition of Done'], [(s['sprint'], s['objectives'], s['epics'], s['storyCount'], s['storyPoints'], s['dependencies'], s['definitionOfDone']) for s in sprints])}

## 7. Resource Planning

{md_table(['Team Option','Roles','Best For','Risks'], [
('Solo Founder','1 full-stack founder + part-time QA/user tester','Prototype and pilot','Slow delivery, context overload'),
('Small Startup Team','Product/BA, UI designer, 2 full-stack engineers, QA, part-time DevOps','MVP to launch','Needs prioritization discipline'),
('Growth Team','PM, designer, frontend, backend, QA automation, DevOps, data/AI, support lead','Scale and commercialization','Higher burn rate and coordination needs'),
])}

## 8. Development Strategy

- Frontend: Next.js App Router, React Query/cache discipline, mobile-first PWA, Marathi/English i18n, offline queue where safe.
- Backend: Supabase RLS for tenant CRUD, server APIs/RPC for transactions, AI/OCR, push, reports and backups.
- Database: farm_id tenant boundary, UUID keys, NUMERIC financial fields, materialized summaries, partition high-volume logs.
- AI: function-calling only, no raw SQL, data permissions, token/cost tracking.
- OCR: client compression/native camera, provider OCR, AI structuring, validation, mandatory review.
- Testing: Phase 9 QA package, API contract, financial regression, RLS security tests.
- Deployment: dev/test/staging/prod environments, CI/CD, rollback and backup.

## 9. Risk Management

{md_table(['Risk ID','Risk','Category','Probability','Impact','Description','Mitigation'], [(r['riskId'], r['risk'], r['category'], r['probability'], r['impact'], r['description'], r['mitigation']) for r in risk_rows])}

## 10. Cost Estimation

{md_table(['Cost Item','Startup / Month','Growth / Month','Scale / Month','Assumptions'], [(c['costItem'], c['startupMonthly'], c['growthMonthly'], c['scaleMonthly'], c['assumptions']) for c in cost_rows])}

## 11. DevOps and Environments

{md_table(['Environment','Purpose','Controls'], [
('Development','Local feature development','Local env, dev Supabase, mock provider keys'),
('Testing','QA execution','Seed data, test users, contract/security/performance test access'),
('Staging','UAT and release validation','Production-like data volume, provider staging keys, monitoring'),
('Production','Live users','Strict RLS, backups, monitoring, secrets rotation, rollback plan'),
])}

CI/CD workflow: lint, type check, unit tests, API contract tests, build, migration dry-run, deploy to staging, smoke tests, approval, deploy production, monitor and rollback if needed.

## 12. Go-Live Strategy

Pre-go-live:

- Run full regression pack and UAT.
- Validate RLS, storage policies and environment secrets.
- Validate accounting reconciliation with real sample slips.
- Confirm OCR/AI provider billing and quotas.
- Take production backup before deployment.
- Prepare support scripts and release notes.

Launch day:

- Freeze non-critical changes.
- Deploy during low-usage window.
- Run smoke tests.
- Monitor logs, provider errors, push notifications, auth sessions and support tickets.
- Keep rollback owner on standby.

## 13. Post-Launch Plan

{md_table(['Period','Focus','Actions'], [
('30 days','Stability and onboarding','Monitor defects, support pilot users, fix high-impact bugs, track activation'),
('60 days','Adoption and quality','Improve OCR/AI, refine reminders, optimize dashboard, expand training'),
('90 days','Growth and monetization','Subscription conversion, admin analytics, marketing, scale readiness'),
])}

## 14. Success Measurement

{md_table(['Category','KPIs'], [
('Business','Paid conversion, retention, active farms, support SLA'),
('Product','DAU/MAU, milk records, reminders completed, reports generated, OCR usage'),
('Technical','API latency, error rate, uptime, sync success, push delivery'),
('AI','AI questions, useful feedback %, average latency, token cost per farm'),
('Financial','MRR, infra cost per active farm, OCR/AI cost per scanned slip'),
])}

## 15. Investor / Stakeholder Summary

Majhi Dairy targets a high-friction agricultural workflow where trust, language, accounting accuracy and mobile usability matter. Competitive advantages include Marathi-first UX, AI/OCR slip processing, dairy-specific reminders, unified accounting, admin SaaS controls and offline/mobile-first design. The execution plan prioritizes trust-critical features first, then automation, intelligence, engagement and scale.

## 16. Master Project Package

{md_table(['Phase','Document Output'], [
('Phase 1-6','BRD foundation, detailed requirements, audit and readiness reports'),
('Phase 7','Database design, ERD, Supabase architecture, RLS and backend technical design'),
('Phase 8','API specification, OpenAPI contract, integration and frontend/backend contract'),
('Phase 9','QA strategy, RTM, test cases, UAT, regression, security and release readiness'),
('Phase 10','Execution plan, roadmap, epics, stories, sprints, releases, risks, costs and go-live plan'),
])}
"""


def clean_inline(s):
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
    epics = build_epics()
    stories = build_stories()
    releases = build_releases(stories)
    sprints = build_sprints(stories)
    risk_rows = risks()
    cost_rows = costs()
    checklist_rows = checklists()
    plan = project_plan_md(epics, stories, releases, sprints, risk_rows, cost_rows)
    (BASE / "Majhi_Dairy_Project_Execution_Plan.md").write_text(plan, encoding="utf-8")
    md_to_docx(plan, BASE / "Majhi_Dairy_Project_Execution_Plan.docx")
    catalog = {
        "roadmap": roadmap(),
        "epics": epics,
        "stories": stories,
        "releases": releases,
        "sprints": sprints,
        "risks": risk_rows,
        "costs": cost_rows,
        "checklists": checklist_rows,
    }
    (BASE / "project_execution_catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"epics": len(epics), "stories": len(stories), "releases": len(releases), "sprints": len(sprints), "risks": len(risk_rows)}, indent=2))


if __name__ == "__main__":
    main()
