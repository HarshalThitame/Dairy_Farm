from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from html import escape
import json
import re

BASE = Path("docs/uat/phase13")
BASE.mkdir(parents=True, exist_ok=True)
DATE = "2026-06-07"

SCENARIOS = [
    ("UAT-BUS-001", "New User Registration", "Farmer", "AUTH-FR-001, AUTH-FR-008", "Register, select language and reach home dashboard."),
    ("UAT-BUS-002", "Farm Creation", "Farm Owner", "AUTH-FR-007, FARM-FR-001", "Create farm profile with village, taluka and district details."),
    ("UAT-BUS-003", "First Cow Registration", "Farmer", "COW-FR-001", "Add first cow with valid lifecycle and important dates."),
    ("UAT-BUS-004", "Calf Registration", "Farmer", "CALF-FR-001", "Register calf, link mother cow and verify calf reminders."),
    ("UAT-BUS-005", "Daily Milk Entry", "Farmer", "ACC-FR-001, REC-FR-001", "Enter morning/evening milk and verify dashboard/report impact."),
    ("UAT-BUS-006", "Feed Entry", "Farmer", "REC-FR-002, ACC-FR-006", "Record feed/fodder expense and verify monthly expense impact."),
    ("UAT-BUS-007", "Vaccination Tracking", "Veterinarian", "REC-FR-004, REM-FR-004", "Record vaccination and complete due reminder."),
    ("UAT-BUS-008", "Breeding Tracking", "Farmer", "REC-FR-005, REM-FR-001", "Record AI/breeding and verify pregnancy-check reminders."),
    ("UAT-BUS-009", "Reminder Completion", "Farmer", "REM-FR-001", "Complete/snooze reminders and verify future reminder state."),
    ("UAT-BUS-010", "Goal Creation", "Farm Owner", "GOAL-FR-001", "Create milk/fat/SNF goals and verify progress."),
    ("UAT-BUS-011", "OCR Slip Upload", "Farmer", "OCR-FR-001", "Upload clear daily slip and verify extracted values."),
    ("UAT-BUS-012", "OCR Data Correction", "Farmer", "OCR-FR-006", "Correct AI/OCR fields before save and verify audit."),
    ("UAT-BUS-013", "Settlement Management", "Farm Owner", "ACC-FR-003, OCR-FR-002", "Save 15-day settlement and verify totals/feed deduction/profit impact."),
    ("UAT-BUS-014", "Expense Recording", "Farmer", "ACC-FR-006", "Record farm expense and verify monthly reports."),
    ("UAT-BUS-015", "Report Generation", "Farm Owner", "REP-FR-001", "Generate/export milk, expense and profit reports."),
    ("UAT-BUS-016", "AI Assistant Usage", "Farmer", "AI-FR-001", "Ask dairy question and verify answer with database values."),
    ("UAT-BUS-017", "Notification Management", "Farmer", "NOTIF-FR-001", "Receive/read notification and verify preferences."),
    ("UAT-BUS-018", "Backup and Restore", "Farm Owner", "EXP-FR-001", "Create backup, download and verify restore-readiness."),
    ("UAT-BUS-019", "Support Ticket Creation", "Farmer", "SUP-FR-001", "Create support ticket with attachment and receive response."),
    ("UAT-BUS-020", "Admin Dashboard Usage", "Admin", "ADMIN-FR-001, ADMIN-FR-004", "Admin monitors farms, analytics, devices and support signals."),
]

VARIANTS = [
    ("Primary Happy Path", "Validate business user can complete normal flow without support."),
    ("Mandatory Field Validation", "Validate required field errors are understandable and localized."),
    ("Boundary and Date Validation", "Validate date/range/business calculation boundaries."),
    ("Duplicate or Conflict Handling", "Validate duplicate prevention or conflict resolution."),
    ("Role Permission Validation", "Validate unauthorized role cannot access or mutate data."),
    ("Marathi Language Validation", "Validate Marathi UI, messages, reports and notifications."),
    ("English Language Validation", "Validate English UI, messages, reports and notifications."),
    ("Mobile Responsive Validation", "Validate Android/iPhone mobile layout and touch targets."),
    ("Audit and Traceability Validation", "Validate audit logs, source fields and derived summaries."),
    ("Recovery and Error Handling", "Validate safe recovery from network/provider/server failure."),
    ("Business Report Impact", "Validate dashboard/report/accounting/reminder side effects."),
]


def md_table(headers, rows):
    def cell(v):
        return str(v).replace("\n", "<br>").replace("|", ";")
    lines = ["| " + " | ".join(headers) + " |", "| " + " | ".join(["---"] * len(headers)) + " |"]
    for row in rows:
        lines.append("| " + " | ".join(cell(x) for x in row) + " |")
    return "\n".join(lines) + "\n"


def build_uat_cases():
    rows = []
    for sid, scenario, actor, reqs, objective in SCENARIOS:
        for idx, (variant, criteria) in enumerate(VARIANTS, 1):
            rows.append({
                "uatId": f"{sid}-{idx:02d}",
                "scenario": scenario,
                "requirementIds": reqs,
                "actor": actor,
                "objective": f"{objective} {criteria}",
                "preconditions": "UAT environment is available with seeded farms, users, cows, calves, milk records, slips, support/admin data and Marathi/English language profiles.",
                "steps": "1. Login as target actor. 2. Open relevant module. 3. Execute the business action. 4. Verify UI, database, notifications, reports and audit results. 5. Capture evidence.",
                "expectedResult": "Business action completes correctly or is safely rejected; no data corruption, no cross-farm leakage, selected language is respected and derived values are accurate.",
                "businessValidationCriteria": criteria,
                "priority": "High",
                "passFailStatus": "Not Run",
                "evidence": "",
            })
    return rows


def build_e2e_flows():
    return [
        {
            "flowId": "E2E-UAT-001",
            "journey": "Farmer Journey",
            "actors": "Farmer",
            "flow": "Signup -> Select language -> Create farm -> Add cow -> Record milk -> Generate report",
            "expectedOutcome": "Farmer can start using Majhi Dairy independently and see accurate dashboard/report output.",
            "acceptanceCriteria": "All steps pass in Marathi and English; no Critical/High defect remains.",
        },
        {
            "flowId": "E2E-UAT-002",
            "journey": "Veterinarian Journey",
            "actors": "Veterinarian",
            "flow": "Login -> View assigned farm -> Record treatment -> Schedule/complete reminder",
            "expectedOutcome": "Veterinarian can support assigned farms without seeing unauthorized farms.",
            "acceptanceCriteria": "Assigned farm access works; unassigned farm access is denied and audited.",
        },
        {
            "flowId": "E2E-UAT-003",
            "journey": "Admin Journey",
            "actors": "Admin",
            "flow": "Login -> Monitor farms -> Open farm details -> Send notification -> Review analytics",
            "expectedOutcome": "Admin can monitor platform and perform protected actions with audit trail.",
            "acceptanceCriteria": "All protected actions require confirmation/reason and create audit records.",
        },
        {
            "flowId": "E2E-UAT-004",
            "journey": "Farm Owner Financial Journey",
            "actors": "Farm Owner",
            "flow": "Record daily milk -> Upload settlement -> Reconcile -> Record expense -> View profit report",
            "expectedOutcome": "Owner can verify financial position using settlement as source of truth.",
            "acceptanceCriteria": "Milk, feed deduction, expense and profit numbers match expected reconciliation.",
        },
    ]


def build_multilingual_uat():
    areas = ["Onboarding", "Dashboard", "Forms", "Reports", "Notifications", "AI Assistant", "Admin", "Support", "Exports", "Error Messages"]
    rows = []
    for lang in ["Marathi", "English"]:
        for area in areas:
            rows.append({
                "uatId": f"LANG-UAT-{len(rows)+1:03d}",
                "language": lang,
                "area": area,
                "objective": f"Validate {area} fully works in {lang}.",
                "steps": "1. Set language. 2. Open area. 3. Trigger normal, empty, validation and error states. 4. Refresh and re-login.",
                "expectedResult": "No mixed-language text, truncation, overlap or incorrect fallback appears.",
                "acceptanceCriteria": "Business user confirms language clarity and layout readability.",
                "status": "Not Run",
            })
    return rows


def build_ocr_uat():
    slip_types = ["Daily clear thermal slip", "Daily faded slip", "15-day settlement clear", "15-day settlement folded", "Duplicate slip"]
    checks = ["Upload", "OCR accuracy", "Manual correction", "Financial validation", "Save and audit", "Error recovery"]
    rows = []
    for slip in slip_types:
        for check in checks:
            rows.append({
                "uatId": f"OCR-UAT-{len(rows)+1:03d}",
                "slipType": slip,
                "validationArea": check,
                "objective": f"Validate {check} for {slip}.",
                "steps": "1. Upload sample slip. 2. Review extracted values. 3. Correct if required. 4. Save or reject. 5. Verify database/report/audit.",
                "expectedResult": "OCR/AI values are accurate or clearly flagged; financial values require user confirmation before save.",
                "businessAcceptanceCriteria": "Clear slips >= 90% field accuracy; settlement financial summary matches slip totals.",
                "status": "Not Run",
            })
    return rows


def build_ai_uat():
    prompts = [
        "आज किती दूध झाले?", "या महिन्याचे उत्पन्न किती?", "सर्वाधिक दूध कोणत्या दिवशी?",
        "सरासरी फॅट किती?", "कुठल्या आठवणी बाकी आहेत?", "मासिक लक्ष्य किती पूर्ण झाले?",
        "Why did milk decrease?", "Show this month's profit", "Which reports are available?", "No data available scenario"
    ]
    rows = []
    for prompt in prompts:
        for check in ["Accuracy", "Permission", "Language", "Style", "History", "No hallucination"]:
            rows.append({
                "uatId": f"AI-UAT-{len(rows)+1:03d}",
                "question": prompt,
                "validationArea": check,
                "objective": f"Validate AI {check.lower()} for user question.",
                "steps": "1. Ask question. 2. Compare answer with database/report values. 3. Verify language/style/history and permission behavior.",
                "expectedResult": "AI uses only permitted real database data and gives professional Marathi/English answer as selected.",
                "acceptanceCriteria": "Business user agrees answer is accurate, useful and not misleading.",
                "status": "Not Run",
            })
    return rows


def build_financial_uat():
    flows = ["Daily milk amount", "Manual feed expense", "15-day settlement", "Settlement deletion reversal", "Monthly profit report", "Annual report"]
    checks = ["Input totals", "Deduction handling", "Source-of-truth rule", "Report impact", "Reconciliation"]
    rows = []
    for flow in flows:
        for check in checks:
            rows.append({
                "uatId": f"FIN-UAT-{len(rows)+1:03d}",
                "financialFlow": flow,
                "validationArea": check,
                "objective": f"Validate {check} for {flow}.",
                "steps": "1. Prepare known amounts. 2. Save/update/delete target record. 3. Verify monthly summary, reports and audit. 4. Reconcile expected vs actual.",
                "expectedResult": "Financial values match expected calculations and no stale summary remains after edits/deletes.",
                "businessAcceptanceCriteria": "Difference must be zero except approved rounding.",
                "status": "Not Run",
            })
    return rows


def build_traceability(uat_cases):
    rows = []
    for case in uat_cases:
        rows.append({
            "businessRequirement": f"BO-{((len(rows)) % 12) + 1:03d}",
            "functionalRequirementIds": case["requirementIds"],
            "uatId": case["uatId"],
            "scenario": case["scenario"],
            "actor": case["actor"],
            "coverageType": case["businessValidationCriteria"],
            "coverageStatus": "Covered",
            "approvalOwner": "Product Owner / Business Stakeholder",
        })
    return rows


def build_pilot_plan():
    rows = []
    sizes = [
        ("10 Farms", "Controlled validation with high-touch support", "Founder-led farms, active users, Marathi-first"),
        ("25 Farms", "Operational validation across villages/talukas", "Mix of small/medium farms and OCR users"),
        ("50 Farms", "Scale validation before broader production", "Representative districts, support load and admin workflows"),
    ]
    phases = ["Preparation", "Onboarding", "Daily Monitoring", "Feedback Review", "Go/No-Go Decision"]
    for size, objective, criteria in sizes:
        for phase in phases:
            rows.append({
                "pilotSize": size,
                "phase": phase,
                "objective": objective,
                "farmSelectionCriteria": criteria,
                "activities": "Train users, monitor usage, capture defects, review OCR/AI/accounting accuracy and support requests.",
                "successMetrics": "Activation >= 80%, UAT pass >= 95%, Critical defects = 0, OCR accuracy >= 90%, AI satisfaction >= 80%.",
                "owner": "Product / QA / Support",
                "status": "Planned",
            })
    return rows


def build_readiness_checklist():
    categories = {
        "Business Readiness": ["UAT pass rate >= 95%", "Business sign-off complete", "Pilot farms selected", "Training material ready", "Known issues accepted"],
        "Technical Readiness": ["Production build deployed", "Database migrations verified", "Monitoring enabled", "Rollback plan tested", "Provider configs verified"],
        "Security Readiness": ["RLS tests passed", "Storage policies verified", "Secret scan clean", "Admin protected actions audited", "Incident response contacts ready"],
        "Data Readiness": ["Seed/reference data verified", "Backup created", "Restore drill passed", "Report totals reconciled", "No stale summaries"],
        "Support Readiness": ["Support scripts ready", "Ticket workflow tested", "Escalation matrix ready", "Hypercare roster ready", "FAQ/tutorials ready"],
        "Training Readiness": ["Farmer training complete", "Vet training complete", "Admin training complete", "Support training complete", "Onboarding checklist ready"],
    }
    rows = []
    for category, items in categories.items():
        for idx, item in enumerate(items, 1):
            rows.append({
                "checklistId": f"{category[:3].upper()}-{idx:03d}",
                "category": category,
                "item": item,
                "owner": "TBD",
                "status": "Pending",
                "evidence": "",
            })
    return rows


def build_training_plan():
    audiences = [
        ("Farmers", "Mobile app basics, cow/calf, milk records, reminders, slip upload", "Live demo + Marathi quick guide", "2 hours"),
        ("Farm Owners", "Accounting, settlement, reports, goals, backup", "Workshop + reconciliation examples", "3 hours"),
        ("Veterinarians", "Assigned farms, health records, vaccination/reminder workflows", "Role-based walkthrough", "90 minutes"),
        ("Administrators", "Admin dashboard, farm details, subscriptions, notifications, support", "Admin playbook + sandbox", "4 hours"),
        ("Support Team", "Ticket handling, diagnostics, user guidance, escalation", "Support SOP + role play", "4 hours"),
    ]
    rows = []
    for audience, topics, method, duration in audiences:
        rows.append({
            "audience": audience,
            "topics": topics,
            "method": method,
            "duration": duration,
            "materials": "User guide, screenshots, short videos, FAQ, support scripts",
            "completionCriteria": "Participant completes assigned UAT/training checklist without assistance.",
            "owner": "Product / Support",
            "status": "Planned",
        })
    return rows


def build_signoff_templates():
    return [
        ("Business Sign-Off", "Product Owner / Farm Owner Representative", "All UAT scenarios accepted and business risks understood."),
        ("QA Sign-Off", "QA Lead", "Test execution complete; no blocking defects remain."),
        ("Security Sign-Off", "Security Owner", "Security gate passed or risks formally accepted."),
        ("Technical Sign-Off", "Engineering Lead", "Deployment, monitoring, rollback and data readiness verified."),
        ("Production Approval", "Release Manager / Founder", "Go-live approved with hypercare plan."),
    ]


def strategy_md(catalog):
    return f"""# Majhi Dairy UAT Strategy and Production Readiness Package

**Document Version:** 1.0  
**Date:** {DATE}  
**Application:** Majhi Dairy  
**Languages:** Marathi and English  
**Users:** Farmers, Farm Owners, Veterinarians, Support Teams, Administrators

## 1. UAT Strategy

### 1.1 UAT Objectives

- Confirm Majhi Dairy satisfies business requirements from Phases 1-12.
- Validate that farmers, farm owners, veterinarians, support and admins can complete real workflows.
- Validate Marathi and English user experience.
- Validate financial accuracy, OCR accuracy, AI answer quality, notifications and reports.
- Confirm pilot and production readiness with formal sign-off.

### 1.2 UAT Scope

In scope: signup, farm setup, cow/calf records, milk/feed/health/vaccination/breeding records, reminders, goals, OCR slips, settlements, expenses, reports, AI assistant, notifications, backup/restore, support and admin dashboard.

Out of scope: payment gateway certification, WhatsApp/SMS future channels, external provider internal validation and IoT integrations.

### 1.3 Entry Criteria

{md_table(['Criteria','Requirement'], [
('Build readiness','Latest candidate build deployed to UAT environment'),
('Data readiness','Seeded test farms, cows, calves, milk, slips, financial and support data available'),
('Access readiness','UAT users created for farmer, owner, veterinarian, support and admin roles'),
('Documentation readiness','UAT scripts, training guide and defect process shared'),
('QA readiness','No open blocker from system testing that prevents UAT start'),
])}

### 1.4 Exit Criteria

{md_table(['Criteria','Target'], [
('UAT pass rate','>= 95%'),
('Critical defects','0 open'),
('High defects','0 open unless approved waiver'),
('OCR accuracy','>= 90% on clear pilot slips'),
('AI satisfaction','>= 80% business acceptance'),
('System availability','>= 99.5% during pilot monitoring window'),
])}

### 1.5 Roles and Responsibilities

{md_table(['Role','Responsibilities'], [
('Business Stakeholders','Approve business scenarios and sign off'),
('Product Owner','Own acceptance decisions and prioritization'),
('Farm Owners','Validate accounting, reports, goals and practical usability'),
('Farmers','Validate daily workflows, reminders and slip upload'),
('Veterinarians','Validate assigned farm health workflows'),
('Admin Team','Validate admin monitoring, subscriptions and notifications'),
('Support Team','Validate support/ticket readiness and user guidance'),
('QA Lead','Coordinate execution, defect triage and evidence'),
('Release Manager','Own go/no-go readiness and launch coordination'),
])}

## 2. UAT Environment

The UAT environment should mirror production configuration without real production secrets or real uncontrolled customer data. It must include Supabase Auth, RLS-enabled database, private storage buckets, notification test setup, OCR/AI test provider configuration and monitoring.

Required test data:

- 10+ test farms across village/taluka combinations.
- Farmers, farm owners, veterinarians, support and admin users.
- Sample cows and calves with lifecycle states.
- Daily milk records, feed records, health records, vaccinations and breeding/calving records.
- Settlement slips, daily slips, clear/faded/folded OCR images.
- Accounting records for income, expenses, feed deductions and profit/loss.
- AI sample questions and expected answer facts.
- Marathi and English language profiles.

## 3. Business UAT Scenarios

{md_table(['Scenario','Actor','Requirement IDs','Objective'], [(s[1], s[2], s[3], s[4]) for s in SCENARIOS])}

Detailed UAT cases are delivered in `UAT_Test_Cases.xlsx`.

## 4. End-to-End Business Flows

{md_table(['Flow ID','Journey','Actors','Flow','Expected Outcome','Acceptance Criteria'], [(f['flowId'],f['journey'],f['actors'],f['flow'],f['expectedOutcome'],f['acceptanceCriteria']) for f in catalog['e2eFlows']])}

## 5. Multilingual UAT

Multilingual UAT validates Marathi and English interface, language switching, notification language, report language and AI responses. Scripts are included in `UAT_Test_Cases.xlsx`.

## 6. OCR UAT

OCR UAT validates slip upload, OCR accuracy, AI extraction, manual correction, settlement processing and confidence thresholds. Business acceptance: clear slips should meet at least 90% field accuracy and settlement summary financial totals must match the slip.

## 7. AI Assistant UAT

AI UAT validates dairy questions, milk analytics, farm insights, chat history, permissions and language support. AI must use real permitted database data only.

## 8. Financial UAT

Financial UAT validates milk entries, feed entries, settlements, expenses, profit/loss and reports. Reconciliation difference must be zero except approved rounding.

## 9. Pilot Rollout Plan

Pilot plan is delivered in `Pilot_Rollout_Plan.xlsx` for 10, 25 and 50 farm rollout sizes.

## 10. Defect Triage Process

Defect lifecycle: New -> Triage -> Assigned -> In Progress -> Fixed -> QA Retest -> UAT Retest -> Closed/Reopened.

{md_table(['Severity','Definition','Response'], [
('Critical','Blocks UAT/launch, data leak, financial corruption','Immediate triage and release block'),
('High','Major workflow broken or no acceptable workaround','Same-day owner assignment'),
('Medium','Workflow issue with workaround','Resolve before launch or accept with plan'),
('Low','Cosmetic or low-risk issue','Can defer with PO approval'),
])}

## 11. Go-Live Readiness Review

Readiness checklist is delivered in `Go_Live_Readiness_Checklist.xlsx` and covers business, technical, security, data, support and training readiness.

## 12. Training and Adoption

Training plan is delivered in `Training_Plan.xlsx`. Training must be practical, mobile-first and farmer-friendly, with Marathi quick guides and live demonstrations.

## 13. Post Go-Live Support

Hypercare:

- Day 0-7: daily monitoring, support war room, defect triage.
- Day 8-30: weekly release patches, user feedback review, OCR/AI quality tuning.
- Day 31-60: adoption improvements, training refresh, report/notification tuning.
- Day 61-90: pilot expansion, subscription readiness and scale review.

## 14. Success Criteria

{md_table(['Metric','Target'], [
('UAT pass rate','>= 95%'),
('Critical defects','0'),
('High defects','0 without waiver'),
('OCR accuracy','>= 90% for clear pilot slips'),
('AI satisfaction','>= 80%'),
('System availability','>= 99.5%'),
('Pilot activation','>= 80% farms create core records'),
('Support readiness','100% support workflows tested'),
])}

## 15. Final Approval Package

Production approval package is delivered as `Production_Approval_Package.docx` with business, QA, security, technical and production approval templates.
"""


def approval_md():
    return f"""# Majhi Dairy Production Approval Package

**Date:** {DATE}

## 1. Approval Summary

This document records formal business, QA, security, technical and production approval for Majhi Dairy pilot/production launch.

## 2. Sign-Off Templates

{md_table(['Approval','Approver Role','Approval Criteria','Decision','Name/Signature','Date'], [(name, role, criteria, 'Approved / Conditional / Rejected', '', '') for name,role,criteria in build_signoff_templates()])}

## 3. Open Defect Review

| Severity | Open Count | Launch Rule | Waiver Required |
| --- | --- | --- | --- |
| Critical | 0 | Must be zero | Not allowed |
| High | 0 | Must be zero unless approved | Required |
| Medium | TBD | Allowed with owner/date | Product Owner |
| Low | TBD | Allowed | Product Owner |

## 4. Go/No-Go Decision

Decision options:

- Go: All mandatory readiness gates passed.
- Conditional Go: Accepted Medium/Low issues with owners and dates.
- No-Go: Any Critical defect, unresolved High defect without waiver, security blocker, data integrity blocker or rollback gap.

## 5. Launch Approval Notes

Record business constraints, known limitations, rollback owner, hypercare owner and support escalation channel before release.
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
    uat_cases = build_uat_cases()
    catalog = {
        "uatCases": uat_cases,
        "e2eFlows": build_e2e_flows(),
        "multilingualUat": build_multilingual_uat(),
        "ocrUat": build_ocr_uat(),
        "aiUat": build_ai_uat(),
        "financialUat": build_financial_uat(),
        "traceability": build_traceability(uat_cases),
        "pilotPlan": build_pilot_plan(),
        "readinessChecklist": build_readiness_checklist(),
        "trainingPlan": build_training_plan(),
        "signoffTemplates": [{"approval": a, "approverRole": b, "criteria": c} for a,b,c in build_signoff_templates()],
    }
    (BASE / "phase13_uat_catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=2), encoding="utf-8")
    strategy = strategy_md(catalog)
    approval = approval_md()
    (BASE / "Majhi_Dairy_UAT_Strategy.md").write_text(strategy, encoding="utf-8")
    (BASE / "Production_Approval_Package.md").write_text(approval, encoding="utf-8")
    md_to_docx(strategy, BASE / "Majhi_Dairy_UAT_Strategy.docx")
    md_to_docx(approval, BASE / "Production_Approval_Package.docx")
    print(json.dumps({k: len(v) for k, v in catalog.items()}, indent=2))


if __name__ == "__main__":
    main()
