from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from html import escape
import json
import re

BASE = Path("docs/project/phase14")
BASE.mkdir(parents=True, exist_ok=True)
DATE = "2026-06-07"

EPICS = [
    ("EPIC-SETUP", "Project Setup", "Establish repository, environments, CI/CD and engineering standards.", "Create deployable technical foundation.", "", "Low", 55, 0),
    ("EPIC-AUTH", "Authentication", "Enable secure access, onboarding and language selection.", "Supabase Auth, sessions, PIN, language persistence.", "SETUP", "High", 110, 1),
    ("EPIC-FARM", "Farm Management", "Create and manage farm tenant profile, members and locations.", "Farm schema, members, permissions and location dropdowns.", "AUTH", "High", 95, 2),
    ("EPIC-DASH", "Dashboard", "Show most important farm status immediately.", "Optimized home APIs, cached summaries and responsive cards.", "AUTH,FARM", "Medium", 85, 2),
    ("EPIC-COW", "Cow Management", "Manage cow lifecycle, status and history.", "Cow CRUD, profile, timeline and lifecycle rules.", "FARM", "High", 120, 3),
    ("EPIC-CALF", "Calf Management", "Manage calf lifecycle, reminders and conversion/sale states.", "Calf CRUD, mother linking, age/reminder logic.", "COW", "High", 95, 4),
    ("EPIC-REC", "Records", "Capture milk, feed, health, vaccination, breeding and calving records.", "Record APIs, validation, offline-safe mutations and audit.", "COW,CALF", "High", 135, 5),
    ("EPIC-REM", "Reminders", "Generate and complete accurate animal and farm reminders.", "Reminder engine, notification hooks and lifecycle cancellation.", "REC", "High", 120, 6),
    ("EPIC-ACC", "Accounting", "Provide accurate milk, expense, settlement and profit accounting.", "Financial schema, source-of-truth rules and reconciliation.", "REC", "Critical", 160, 7),
    ("EPIC-OCR", "OCR", "Process daily and settlement dairy slips with user review.", "Upload, compression, OCR/AI extraction, validation and audit.", "ACC", "Critical", 145, 8),
    ("EPIC-AI", "AI Assistant", "Answer farm questions using real permitted database data.", "Function-calling tools, permissions, history and settings.", "REC,ACC", "High", 130, 9),
    ("EPIC-REP", "Reports", "Generate business, animal and financial reports.", "Report APIs, charts, exports and print layouts.", "ACC,REC", "High", 125, 10),
    ("EPIC-NOTIF", "Notifications", "Deliver in-app and push notifications reliably.", "Inbox, preferences, push subscription and admin broadcasts.", "REM", "High", 105, 11),
    ("EPIC-SET-PROF", "Settings + Profile", "Allow users to personalize, secure and manage their profile.", "Settings APIs, profile, appearance, language and security UX.", "AUTH,FARM", "Medium", 110, 12),
    ("EPIC-SUP", "Support", "Enable self-service help and support ticket workflows.", "FAQ, tickets, attachments and support notifications.", "AUTH", "Medium", 85, 13),
    ("EPIC-ACH", "Achievements", "Increase engagement through score, badges and leaderboard.", "Achievement engine, score and ranking refresh.", "REC,GOAL", "Medium", 80, 13),
    ("EPIC-ADMIN", "Admin Panel", "Give platform team farm monitoring and operations control.", "Admin dashboards, farm details, subscriptions and audit.", "AUTH,FARM,ACC", "Critical", 175, 14),
    ("EPIC-SEC", "Security Hardening", "Harden auth, RLS, storage, API, AI/OCR and admin actions.", "Security tests, RLS validation, secrets, hardening checklist.", "ALL", "Critical", 120, 15),
    ("EPIC-PERF", "Performance Optimization", "Meet page/API/report/OCR/AI performance targets.", "Profiling, caching, query tuning and bundle optimization.", "ALL", "High", 105, 16),
    ("EPIC-REG", "Bug Fixes + Regression", "Stabilize release candidate with regression coverage.", "Bug triage, automated regression and defect burn-down.", "ALL", "High", 90, 17),
    ("EPIC-UAT", "UAT Support", "Support business users through UAT and pilot preparation.", "UAT fixes, training support and acceptance evidence.", "REG", "Medium", 75, 18),
    ("EPIC-REL", "Production Release", "Launch production with monitoring, rollback and hypercare.", "Release runbook, migration, launch and hypercare execution.", "UAT,SEC,PERF", "Critical", 80, 19),
]

FEATURES = {
    "EPIC-SETUP": ["Repository standards", "Environment configuration", "CI/CD pipeline", "Coding conventions", "Observability baseline"],
    "EPIC-AUTH": ["Signup", "Login", "PIN login", "Language onboarding", "Session management"],
    "EPIC-FARM": ["Farm profile", "Farm members", "Location dropdowns", "Veterinarian settings", "Farm permissions"],
    "EPIC-DASH": ["Today summary", "Quick actions", "Reminder summary", "Monthly performance", "Pending slip banner"],
    "EPIC-COW": ["Cow CRUD", "Cow profile", "Pregnancy tracking", "Calving tracking", "Cow timeline"],
    "EPIC-CALF": ["Calf CRUD", "Mother linking", "Sale/conversion status", "Calf reminders", "Growth/age display"],
    "EPIC-REC": ["Milk records", "Feed records", "Health records", "Vaccination records", "Breeding/calving records"],
    "EPIC-REM": ["Reminder engine", "Pregnancy reminders", "Calf care reminders", "Custom reminders", "Notification integration"],
    "EPIC-ACC": ["Milk accounting", "Settlement entry", "Expense management", "Profit/loss", "Financial reconciliation"],
    "EPIC-OCR": ["Native camera/gallery", "Image compression", "OCR extraction", "AI structuring", "Review and save"],
    "EPIC-AI": ["Chat UI", "Tool calling", "AI permissions", "Chat history", "Usage/feedback"],
    "EPIC-REP": ["Milk reports", "Financial reports", "Animal reports", "Export/print", "Charts/filters"],
    "EPIC-NOTIF": ["Inbox", "Push subscription", "Preferences", "Admin broadcasts", "Delivery logs"],
    "EPIC-SET-PROF": ["Profile page", "Security settings", "Appearance/language", "AI/goal/export settings", "Statistics"],
    "EPIC-SUP": ["Help home", "FAQ/tutorials", "Ticket creation", "Ticket replies", "Support notifications"],
    "EPIC-ACH": ["Achievement catalog", "Score engine", "Leaderboard", "Badges", "Sharing"],
    "EPIC-ADMIN": ["Admin dashboard", "Farm details", "User/farm management", "Subscriptions/trials", "Notification center"],
    "EPIC-SEC": ["RLS validation", "API hardening", "Storage hardening", "AI/OCR security", "Audit/monitoring"],
    "EPIC-PERF": ["Home performance", "Query optimization", "Report performance", "OCR/AI latency", "Bundle optimization"],
    "EPIC-REG": ["Regression pack", "Defect triage", "Financial regression", "Mobile regression", "Release candidate stabilization"],
    "EPIC-UAT": ["UAT environment", "UAT defect support", "Training support", "Pilot readiness", "Sign-off evidence"],
    "EPIC-REL": ["Release calendar", "Launch checklist", "Migration runbook", "Rollback plan", "Hypercare"],
}

SPRINTS = [
    (0, "Project Setup", ["EPIC-SETUP"]),
    (1, "Authentication + Language Selection", ["EPIC-AUTH"]),
    (2, "Farm Management", ["EPIC-FARM", "EPIC-DASH"]),
    (3, "Cow Management", ["EPIC-COW"]),
    (4, "Calf Management", ["EPIC-CALF"]),
    (5, "Milk Records", ["EPIC-REC"]),
    (6, "Reminders + Vaccinations", ["EPIC-REM"]),
    (7, "Accounting", ["EPIC-ACC"]),
    (8, "OCR", ["EPIC-OCR"]),
    (9, "AI Assistant", ["EPIC-AI"]),
    (10, "Reports", ["EPIC-REP"]),
    (11, "Notifications", ["EPIC-NOTIF"]),
    (12, "Settings + Profile", ["EPIC-SET-PROF"]),
    (13, "Support + Achievements", ["EPIC-SUP", "EPIC-ACH"]),
    (14, "Admin Panel", ["EPIC-ADMIN"]),
    (15, "Security Hardening", ["EPIC-SEC"]),
    (16, "Performance Optimization", ["EPIC-PERF"]),
    (17, "Bug Fixes + Regression", ["EPIC-REG"]),
    (18, "UAT Support", ["EPIC-UAT"]),
    (19, "Release Preparation", ["EPIC-REL", "EPIC-REG"]),
    (20, "Production Launch", ["EPIC-REL"]),
]


def md_table(headers, rows):
    def cell(v):
        return str(v).replace("\n", "<br>").replace("|", ";")
    lines = ["| " + " | ".join(headers) + " |", "| " + " | ".join(["---"] * len(headers)) + " |"]
    for row in rows:
        lines.append("| " + " | ".join(cell(x) for x in row) + " |")
    return "\n".join(lines) + "\n"


def build_epics():
    rows = []
    for epic_id, name, business, technical, deps, risk, effort, sprint in EPICS:
        rows.append({
            "epicId": epic_id,
            "epicName": name,
            "businessObjective": business,
            "technicalObjective": technical,
            "dependencies": deps,
            "acceptanceCriteria": "Feature works end-to-end, tests pass, RLS/authorization verified, Marathi/English UX validated and no Critical/High defect remains.",
            "riskLevel": risk,
            "estimatedEffortPoints": effort,
            "targetSprint": f"Sprint {sprint}",
            "status": "Planned",
        })
    return rows


def build_features():
    rows = []
    for epic_id, features in FEATURES.items():
        epic_name = next(e[1] for e in EPICS if e[0] == epic_id)
        for idx, feature in enumerate(features, 1):
            rows.append({
                "featureId": f"{epic_id}-F{idx:02d}",
                "epicId": epic_id,
                "epicName": epic_name,
                "feature": feature,
                "subFeatures": f"{feature} UI, API, validation, audit, empty/error states, Marathi/English text",
                "technicalTasks": "Design contract, implement feature, add tests, review performance/security, update docs",
                "backendTasks": "API route/service/RPC, authorization, validation, audit logging",
                "frontendTasks": "Responsive UI, loading/empty/error states, local language text, accessibility",
                "databaseTasks": "Schema/migration/index/RLS changes if required",
                "qaTasks": "Functional, negative, regression, localization and mobile checks",
                "devOpsTasks": "Env vars, monitoring, feature flag and deployment checklist as required",
            })
    return rows


def story_points(epic_id, idx, task_type):
    base = {"Backend": 5, "Frontend": 5, "Database": 3, "QA": 3, "DevOps": 2}.get(task_type, 3)
    if epic_id in {"EPIC-ACC", "EPIC-OCR", "EPIC-ADMIN", "EPIC-SEC"}:
        base += 3
    if idx % 5 == 0:
        base += 2
    return min(base, 13)


def build_stories(features):
    rows = []
    task_types = ["Backend", "Frontend", "Database", "QA"]
    for f in features:
        for task_type in task_types:
            idx = len(rows) + 1
            points = story_points(f["epicId"], idx, task_type)
            rows.append({
                "storyId": f"DEV-US-{idx:04d}",
                "epicId": f["epicId"],
                "featureId": f["featureId"],
                "title": f"{task_type}: {f['feature']}",
                "description": f"As an engineering team, implement {task_type.lower()} work for {f['feature']} so Majhi Dairy can deliver {f['epicName']} safely.",
                "acceptanceCriteria": "Code is reviewed, tested, permission-safe, localized, mobile-ready and linked to QA/UAT evidence.",
                "priority": "High" if f["epicId"] in {"EPIC-AUTH", "EPIC-ACC", "EPIC-SEC", "EPIC-REL"} else "Medium",
                "dependencies": next(e[4] for e in EPICS if e[0] == f["epicId"]),
                "storyPoints": points,
                "estimatedHours": points * 6,
                "targetSprint": next(e[7] for e in EPICS if e[0] == f["epicId"]),
                "status": "Backlog",
            })
        if f["epicId"] in {"EPIC-SETUP", "EPIC-OCR", "EPIC-AI", "EPIC-NOTIF", "EPIC-ADMIN", "EPIC-SEC", "EPIC-PERF", "EPIC-REL"}:
            idx = len(rows) + 1
            points = story_points(f["epicId"], idx, "DevOps")
            rows.append({
                "storyId": f"DEV-US-{idx:04d}",
                "epicId": f["epicId"],
                "featureId": f["featureId"],
                "title": f"DevOps: {f['feature']}",
                "description": f"As an engineering team, configure deployment, monitoring and operational readiness for {f['feature']}.",
                "acceptanceCriteria": "Feature deploys through CI/CD with monitoring, rollback and configuration documented.",
                "priority": "High",
                "dependencies": next(e[4] for e in EPICS if e[0] == f["epicId"]),
                "storyPoints": points,
                "estimatedHours": points * 6,
                "targetSprint": next(e[7] for e in EPICS if e[0] == f["epicId"]),
                "status": "Backlog",
            })
    return rows


def build_sprints(stories):
    rows = []
    for num, theme, epic_ids in SPRINTS:
        sprint_stories = [s for s in stories if s["epicId"] in epic_ids and (s["targetSprint"] == num or num in {19,20})]
        if num == 19:
            sprint_stories = [s for s in stories if s["epicId"] in {"EPIC-REL", "EPIC-REG"}][:18]
        if num == 20:
            sprint_stories = [s for s in stories if s["epicId"] == "EPIC-REL"][18:]
        points = sum(int(s["storyPoints"]) for s in sprint_stories)
        rows.append({
            "sprint": f"Sprint {num}",
            "length": "2 weeks" if num else "1 week setup",
            "theme": theme,
            "objectives": f"Deliver {theme} with tested, localized and permission-safe increments.",
            "epics": ", ".join(epic_ids),
            "storyIds": ", ".join(s["storyId"] for s in sprint_stories[:25]),
            "storyCount": len(sprint_stories),
            "storyPoints": points,
            "deliverables": f"{theme} feature increment, tests, docs and release notes.",
            "dependencies": "Previous sprint deliverables; environment and data readiness.",
            "risks": "Scope creep, integration defects, mobile regressions, security/RLS issues.",
            "definitionOfDone": "Code reviewed, tests pass, QA accepted, no Critical/High defects, Marathi/English verified, audit/security requirements met.",
        })
    return rows


def build_roadmap():
    phases = [
        "Project Setup", "Authentication", "Farm Management", "Cow Management", "Calf Management",
        "Records & Reminders", "Accounting", "OCR", "AI Assistant", "Reports", "Notifications",
        "Admin Panel", "Security Hardening", "Performance Optimization", "UAT Support", "Production Release"
    ]
    rows = []
    for idx, phase in enumerate(phases, 1):
        start = max(0, idx - 1)
        rows.append({
            "phase": f"Phase {idx}",
            "name": phase,
            "timeline": f"Week {start * 2 + 1}-{start * 2 + 2}" if idx > 1 else "Week 1",
            "dependencies": "Previous phase baseline and approved requirements",
            "majorOutputs": f"{phase} deliverables, tests, documentation and acceptance evidence",
            "exitCriteria": "Sprint DoD met and release risks updated",
        })
    return rows


def build_resources():
    return [
        {"option": "Solo Founder", "roles": "Full-stack engineer + PM/QA/support", "capacity": "20-35 hrs/week", "velocity": "15-25 points/sprint", "responsibilities": "Build highest-priority features, manual QA, deployment, support", "risks": "Context switching, slower QA/security coverage"},
        {"option": "2-4 Member Startup Team", "roles": "Full-stack, frontend, QA/product, part-time DevOps", "capacity": "80-140 hrs/week", "velocity": "45-75 points/sprint", "responsibilities": "Parallel frontend/backend/QA delivery", "risks": "Need tighter backlog grooming and integration discipline"},
        {"option": "5-10 Member Product Team", "roles": "PM, designer, frontend, backend, QA automation, DevOps, support", "capacity": "200-350 hrs/week", "velocity": "100-180 points/sprint", "responsibilities": "Feature squads, automation, security/performance in parallel", "risks": "Coordination overhead and dependency management"},
    ]


def build_capacity():
    skills = ["Frontend", "Backend", "Supabase/PostgreSQL", "QA Automation", "Mobile PWA", "AI/OCR", "Security", "DevOps", "Product/UAT"]
    rows = []
    for sprint, theme, _ in SPRINTS:
        for skill in skills:
            weight = 1
            if skill in ["AI/OCR"] and sprint in {8, 9}: weight = 3
            if skill == "Security" and sprint in {15, 17, 19}: weight = 3
            if skill == "QA Automation" and sprint >= 12: weight = 3
            if skill == "DevOps" and sprint in {0, 19, 20}: weight = 3
            rows.append({"sprint": f"Sprint {sprint}", "theme": theme, "skill": skill, "allocationWeight": weight, "notes": "Scale by selected team option and sprint risk."})
    return rows


def build_risks():
    risks = [
        ("DEV-RISK-001", "Financial calculation regression", "Technical", "Medium", "Critical", "Automated financial regression and settlement reconciliation", "Engineering/QA"),
        ("DEV-RISK-002", "Cross-farm data leakage", "Security", "Low", "Critical", "RLS tests, service API guard and security review", "Security/Backend"),
        ("DEV-RISK-003", "OCR accuracy below target", "OCR", "Medium", "High", "Golden slip set, fallback/manual review and provider monitoring", "AI/OCR Engineer"),
        ("DEV-RISK-004", "AI hallucination or unauthorized data usage", "AI", "Medium", "High", "Function calling only, permission checks and answer verification tests", "AI Engineer"),
        ("DEV-RISK-005", "iOS PWA instability", "Technical", "Medium", "High", "Dedicated iOS regression and session/storage QA", "Frontend/QA"),
        ("DEV-RISK-006", "Push notification unreliability", "Technical", "Medium", "Medium", "Subscription diagnostics, fallback in-app notifications", "Frontend/DevOps"),
        ("DEV-RISK-007", "Admin protected action misuse", "Security", "Low", "High", "Confirmation, reason, audit and role checks", "Admin/Backend"),
        ("DEV-RISK-008", "Performance misses home/report targets", "Performance", "Medium", "High", "Caching, query indexes and budget monitoring", "Engineering"),
        ("DEV-RISK-009", "Scope creep across settings/support/gamification", "Delivery", "High", "Medium", "MoSCoW prioritization and sprint change control", "PM"),
        ("DEV-RISK-010", "Provider key/billing issue", "Architecture", "Medium", "High", "Provider config validation, quotas, fallback manual path", "DevOps"),
        ("DEV-RISK-011", "UAT defects late in release", "Delivery", "Medium", "High", "Early pilot walkthroughs and sprint demos", "QA/UAT Lead"),
        ("DEV-RISK-012", "Insufficient test data", "QA", "Medium", "Medium", "Seed scripts and golden datasets", "QA/Data"),
    ]
    return [{"riskId": a, "risk": b, "category": c, "probability": d, "impact": e, "mitigation": f, "owner": g, "status": "Open"} for a,b,c,d,e,f,g in risks]


def build_releases():
    return [
        {"releaseId": "R0", "releaseType": "Internal Alpha", "targetWindow": "After Sprint 5", "scope": "Auth, farm, cow, calf and milk records", "entryCriteria": "Core workflows testable", "exitCriteria": "No blocker in core data creation"},
        {"releaseId": "R1", "releaseType": "MVP Beta", "targetWindow": "After Sprint 10", "scope": "Records, reminders, accounting, OCR, AI, reports", "entryCriteria": "Financial/OCR/AI flows ready", "exitCriteria": "Pilot farms can complete key workflows"},
        {"releaseId": "R2", "releaseType": "Pilot Candidate", "targetWindow": "After Sprint 16", "scope": "Notifications, settings, support, achievements, admin, security/performance", "entryCriteria": "Feature complete", "exitCriteria": "Security/performance gates pass"},
        {"releaseId": "R3", "releaseType": "Production Release", "targetWindow": "After Sprint 20", "scope": "Regression fixes, UAT support, release prep and launch", "entryCriteria": "UAT pass >=95%", "exitCriteria": "Go-live approval signed"},
        {"releaseId": "Hotfix", "releaseType": "Patch/Hotfix", "targetWindow": "As needed", "scope": "Critical production defects only", "entryCriteria": "Approved incident/defect", "exitCriteria": "Fix verified and monitored"},
    ]


def build_dashboard(epics, stories, sprints, risks, releases, resources):
    return {
        "roadmapDashboard": [
            {"metric": "Roadmap phases", "value": 16},
            {"metric": "Sprints including Sprint 0", "value": len(sprints)},
            {"metric": "Epics", "value": len(epics)},
            {"metric": "Stories", "value": len(stories)},
            {"metric": "Total story points", "value": sum(int(s["storyPoints"]) for s in stories)},
        ],
        "sprintDashboard": [{"sprint": s["sprint"], "storyCount": s["storyCount"], "storyPoints": s["storyPoints"], "theme": s["theme"]} for s in sprints],
        "releaseDashboard": releases,
        "riskDashboard": risks,
        "resourceDashboard": resources,
    }


def roadmap_md(catalog):
    return f"""# Majhi Dairy Development Roadmap and Sprint Execution Package

**Document Version:** 1.0  
**Date:** {DATE}  
**Application:** Majhi Dairy  
**Stack:** Next.js, React, TypeScript, Supabase, PostgreSQL, OpenAI, OCR Services  
**Languages:** Marathi and English

## 1. Development Strategy

Majhi Dairy will use an Agile delivery model with two-week sprints, Sprint 0 setup, incremental feature delivery, continuous QA, security review, UAT validation and controlled production release.

### 1.1 Feature Development Workflow

```text
Requirement -> Product/UX Design -> Technical Design -> Development -> Code Review -> QA -> UAT -> Release
```

### 1.2 Definition of Ready

- Requirement and acceptance criteria are clear.
- API/data dependencies are identified.
- Role, language, security and audit requirements are known.
- Test data and QA approach are available.
- Design/state expectations are agreed.

### 1.3 Definition of Done

- Code reviewed and merged.
- Unit/integration/functional tests pass.
- RLS/auth/role rules verified.
- Marathi/English text checked.
- Mobile responsive states checked.
- No open Critical/High defect.
- Documentation/release notes updated.

## 2. Engineering Roadmap

{md_table(['Phase','Name','Timeline','Dependencies','Major Outputs','Exit Criteria'], [(r['phase'],r['name'],r['timeline'],r['dependencies'],r['majorOutputs'],r['exitCriteria']) for r in catalog['roadmap']])}

## 3. Epic Breakdown

{md_table(['Epic ID','Epic Name','Business Objective','Technical Objective','Dependencies','Risk','Effort Points','Target Sprint'], [(e['epicId'],e['epicName'],e['businessObjective'],e['technicalObjective'],e['dependencies'],e['riskLevel'],e['estimatedEffortPoints'],e['targetSprint']) for e in catalog['epics']])}

## 4. Feature Breakdown

The full feature, sub-feature and engineering task breakdown is delivered in `Epic_Backlog.xlsx`.

## 5. User Story Execution Plan

The detailed user story inventory is delivered in `User_Story_Backlog.xlsx`.

Summary:

{md_table(['Metric','Value'], [
('Epics', len(catalog['epics'])),
('Features', len(catalog['features'])),
('User stories', len(catalog['stories'])),
('Total story points', sum(int(s['storyPoints']) for s in catalog['stories'])),
])}

## 6. Sprint Planning

{md_table(['Sprint','Theme','Story Count','Story Points','Deliverables'], [(s['sprint'],s['theme'],s['storyCount'],s['storyPoints'],s['deliverables']) for s in catalog['sprints']])}

## 7. Team Structure

{md_table(['Option','Roles','Capacity','Velocity','Responsibilities','Risks'], [(r['option'],r['roles'],r['capacity'],r['velocity'],r['responsibilities'],r['risks']) for r in catalog['resources']])}

## 8. Resource Planning

Resource allocation and skill requirements are delivered in `Resource_Plan.xlsx`.

## 9. Delivery Governance

- Daily standup: blockers, risks, scope changes and deployment readiness.
- Sprint planning: select stories that meet DoR and fit capacity.
- Sprint review: demo completed functionality with QA evidence.
- Retrospective: identify process, quality and collaboration improvements.
- Backlog grooming: maintain next two sprints ready.
- Release approval: QA, security, UAT and release manager sign-off.

## 10. Technical Debt Management

Debt categories: code quality, test gaps, performance, database/indexing, security hardening, localization, mobile UX and documentation. Track debt as backlog items with owner, severity and payoff. Reserve 10-20% sprint capacity after Sprint 8 for debt reduction.

## 11. Risk Management

{md_table(['Risk ID','Risk','Category','Probability','Impact','Mitigation','Owner'], [(r['riskId'],r['risk'],r['category'],r['probability'],r['impact'],r['mitigation'],r['owner']) for r in catalog['risks']])}

## 12. Release Management

{md_table(['Release','Type','Target Window','Scope','Entry Criteria','Exit Criteria'], [(r['releaseId'],r['releaseType'],r['targetWindow'],r['scope'],r['entryCriteria'],r['exitCriteria']) for r in catalog['releases']])}

## 13. DevOps Execution

Environments:

- Development: local and preview deployments.
- Testing: QA Supabase project with seeded data.
- UAT: production-like environment with pilot data.
- Production: locked down environment with monitoring, backups and rollback.

CI/CD pipeline: lint -> type check -> unit tests -> build -> API/DB tests -> preview deploy -> QA/UAT gate -> production deploy.

## 14. Productivity Metrics

Track velocity, burndown, lead time, cycle time, deployment frequency, defect escape rate, sprint success rate, test pass rate, UAT acceptance and production incident count.

## 15. Production Launch Plan

The production launch plan is delivered as `Production_Launch_Plan.docx`.

## 16. Executive Dashboard

The delivery dashboard is delivered in `Delivery_Dashboard.xlsx` with roadmap, sprint, release, risk and resource dashboards.
"""


def launch_md():
    return f"""# Majhi Dairy Production Launch Plan

**Date:** {DATE}

## 1. Launch Timeline

| Period | Activities |
| --- | --- |
| T-14 days | Code freeze candidate, UAT execution, security/performance checks |
| T-7 days | Final regression, data backup validation, support readiness |
| T-2 days | Go/no-go review, production migration dry run, rollback confirmation |
| Launch Day | Deploy, smoke test, monitor, support war room |
| T+7 days | Hypercare review and priority fixes |
| T+30 days | Adoption, stability and success metrics review |

## 2. Pre-Launch Checklist

- Production environment configured.
- Supabase RLS and storage policies verified.
- Secrets and provider keys configured server-side only.
- Database migration and rollback reviewed.
- Backup/restore validation completed.
- QA, UAT, security and technical sign-offs collected.
- Support and admin teams trained.

## 3. Launch-Day Activities

1. Confirm code freeze and release tag.
2. Create production backup.
3. Apply migrations.
4. Deploy application.
5. Run smoke tests: auth, dashboard, cow, milk, reminders, accounting, OCR, AI, notifications, admin.
6. Monitor logs, provider errors, database performance and support tickets.
7. Communicate launch status.

## 4. Rollback Process

Rollback is triggered for data corruption, login outage, cross-farm access risk, production-wide crash or unrecoverable provider misconfiguration. Rollback owner must preserve logs and incident evidence before reverting.

## 5. Hypercare Support

- Day 0-7: daily triage and rapid fixes.
- Day 8-30: weekly release train and adoption monitoring.
- 30-day success plan: measure active farms, milk records, OCR usage, AI usage, support volume and defect escape rate.
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
    epics = build_epics()
    features = build_features()
    stories = build_stories(features)
    sprints = build_sprints(stories)
    resources = build_resources()
    risks = build_risks()
    releases = build_releases()
    catalog = {
        "roadmap": build_roadmap(),
        "epics": epics,
        "features": features,
        "stories": stories,
        "sprints": sprints,
        "resources": resources,
        "capacity": build_capacity(),
        "risks": risks,
        "releases": releases,
        "dashboard": build_dashboard(epics, stories, sprints, risks, releases, resources),
    }
    roadmap = roadmap_md(catalog)
    launch = launch_md()
    (BASE / "phase14_delivery_catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")
    (BASE / "Majhi_Dairy_Development_Roadmap.md").write_text(roadmap, encoding="utf-8")
    (BASE / "Production_Launch_Plan.md").write_text(launch, encoding="utf-8")
    md_to_docx(roadmap, BASE / "Majhi_Dairy_Development_Roadmap.docx")
    md_to_docx(launch, BASE / "Production_Launch_Plan.docx")
    print(json.dumps({k: len(v) if isinstance(v, list) else len(v.keys()) for k, v in catalog.items()}, indent=2))


if __name__ == "__main__":
    main()
