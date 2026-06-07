# Majhi Dairy Project Execution Plan

**Document Version:** 1.0  
**Date:** 2026-06-07  
**Application:** Majhi Dairy  
**Stack:** Next.js, React, TypeScript, Supabase, PostgreSQL, OpenAI, OCR Services  
**Languages:** Marathi and English

## 1. Product Roadmap

### Product Vision

Majhi Dairy will become a trusted Marathi-first and English-ready digital operating system for dairy farmers, helping them manage animals, milk production, reminders, accounting, reports, AI assistance and farm growth from a mobile-first PWA.

### North Star Metric

Weekly Active Farms with at least one meaningful farm operation recorded: milk entry, reminder completion, slip scan, accounting entry, AI question or report generation.

### Success Metrics

| Metric | Target |
| --- | --- |
| Daily active farms | Increase month over month during pilot |
| Milk records created | 80% active farms record milk at least 5 days/week |
| OCR adoption | 50% accounting users scan at least one slip/month |
| AI usage | 40% active farms ask at least one AI question/month |
| Retention | 60%+ 30-day retention after onboarding |
| Subscription conversion | Pilot-to-paid conversion target defined by business team |
| Support SLA | Critical support tickets responded within 4 hours |

### 12-Month Roadmap

| Quarter | Theme | Features | Success Metrics |
| --- | --- | --- | --- |
| Q1 | MVP foundation | Auth, onboarding, language, farm, cows, calves, records, reminders, base dashboard | First 50 pilot farms onboarded; daily milk record flow stable |
| Q2 | Accounting and OCR | Manual accounting, settlement, OCR slips, reports, notifications | 80% pilot farms use accounting; OCR review save success > 90% |
| Q3 | AI and engagement | AI assistant, goals, profile stats, support, achievements, leaderboard | AI usage by 40% active farms; retention improved |
| Q4 | Admin, scale and commercialization | Admin monitoring, subscriptions, analytics, performance, security hardening, go-live | Paid conversion, stable production operations, support SLA met |


## 2. MVP Definition

| MoSCoW | Scope |
| --- | --- |
| Must Have | Authentication, language selection, farm setup, cow/calf management, milk records, reminders, accounting basics, reports, settings, admin basics, security/RLS |
| Should Have | OCR slip scanning, settlement processing, notifications, AI assistant, export, profile statistics |
| Could Have | Achievements, leaderboard, support center, advanced analytics, shareable cards |
| Won't Have for MVP | WhatsApp/SMS automation, full ERP integrations, marketplace, advanced IoT integrations |


Critical launch features: secure login, farm isolation, animal records, milk records, reminders, accounting/profit accuracy, reports, Marathi/English language, backup/export, admin support visibility and QA/security gates.

## 3. Epics

| Epic ID | Epic Name | Business Value | Priority | Dependencies | Story Count | Estimated Points | Acceptance Criteria |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EPIC-AUTH | Authentication & Onboarding | Secure first-time access, language selection and session foundation. | Must |  | 20 | 84 | All linked user stories pass QA, UAT-critical paths are approved, security/access rules are enforced and Marathi/English UX is verified. |
| EPIC-DASH | Home Dashboard | Give farmers instant farm status, actions, reminders and goals. | Must | AUTH, FARM | 20 | 84 | All linked user stories pass QA, UAT-critical paths are approved, security/access rules are enforced and Marathi/English UX is verified. |
| EPIC-FARM | Farm & Member Management | Manage tenant farm profile, members and permissions. | Must | AUTH | 16 | 58 | All linked user stories pass QA, UAT-critical paths are approved, security/access rules are enforced and Marathi/English UX is verified. |
| EPIC-COW | Cow Management | Manage cow lifecycle, profile, reproduction and health visibility. | Must | FARM | 18 | 65 | All linked user stories pass QA, UAT-critical paths are approved, security/access rules are enforced and Marathi/English UX is verified. |
| EPIC-CALF | Calf Management | Track calf lifecycle, reminders and conversion/sale status. | Must | COW | 15 | 53 | All linked user stories pass QA, UAT-critical paths are approved, security/access rules are enforced and Marathi/English UX is verified. |
| EPIC-REC | Records Management | Capture milk, feed, health, vaccination, breeding and calving records. | Must | COW, CALF | 18 | 65 | All linked user stories pass QA, UAT-critical paths are approved, security/access rules are enforced and Marathi/English UX is verified. |
| EPIC-REM | Reminder Engine | Generate and complete lifecycle, health and operational reminders. | Must | REC | 18 | 60 | All linked user stories pass QA, UAT-critical paths are approved, security/access rules are enforced and Marathi/English UX is verified. |
| EPIC-ACC | Accounting & Settlement | Handle milk income, expenses, settlement slips, feed deduction and profit. | Must | REC | 18 | 91 | All linked user stories pass QA, UAT-critical paths are approved, security/access rules are enforced and Marathi/English UX is verified. |
| EPIC-OCR | AI Slip Scanning & OCR | Digitize daily and settlement slips with review-first financial safety. | Should | ACC | 18 | 84 | All linked user stories pass QA, UAT-critical paths are approved, security/access rules are enforced and Marathi/English UX is verified. |
| EPIC-REP | Reports & Analytics | Generate milk, financial, animal and annual reports. | Should | ACC, REC | 18 | 88 | All linked user stories pass QA, UAT-critical paths are approved, security/access rules are enforced and Marathi/English UX is verified. |
| EPIC-AI | Dugdhmitra AI Assistant | Answer farm questions using real database data and permissions. | Should | REC, ACC | 18 | 73 | All linked user stories pass QA, UAT-critical paths are approved, security/access rules are enforced and Marathi/English UX is verified. |
| EPIC-NOTIF | Notifications | Deliver in-app and push reminders, admin messages and system alerts. | Should | REM | 16 | 82 | All linked user stories pass QA, UAT-critical paths are approved, security/access rules are enforced and Marathi/English UX is verified. |
| EPIC-SET | Settings & Personalization | Manage language, appearance, AI, notification, goals and backup settings. | Must | AUTH | 16 | 64 | All linked user stories pass QA, UAT-critical paths are approved, security/access rules are enforced and Marathi/English UX is verified. |
| EPIC-PROF | Profile & Statistics | Manage user/farm profile, statistics and score visibility. | Should | FARM, REC | 12 | 43 | All linked user stories pass QA, UAT-critical paths are approved, security/access rules are enforced and Marathi/English UX is verified. |
| EPIC-SUP | Support Center | Provide FAQ, tickets, attachments and support communication. | Could | AUTH | 14 | 53 | All linked user stories pass QA, UAT-critical paths are approved, security/access rules are enforced and Marathi/English UX is verified. |
| EPIC-ACH | Achievements & Leaderboard | Increase engagement through score, badges and rankings. | Could | REC, GOAL | 15 | 58 | All linked user stories pass QA, UAT-critical paths are approved, security/access rules are enforced and Marathi/English UX is verified. |
| EPIC-ADMIN | Admin Panel | Manage farms, users, subscriptions, notifications, analytics and support. | Must | AUTH, FARM | 17 | 79 | All linked user stories pass QA, UAT-critical paths are approved, security/access rules are enforced and Marathi/English UX is verified. |
| EPIC-QA | Quality, Security & Performance | Harden app for scale, security, localization and launch readiness. | Must | All | 15 | 93 | All linked user stories pass QA, UAT-critical paths are approved, security/access rules are enforced and Marathi/English UX is verified. |


## 4. User Story Backlog Summary

Generated backlog contains **501 user stories** with **2022 total story points**. Detailed backlog is available in `User_Story_Backlog.xlsx`.

## 5. Release Planning

| Release | Theme | Features Included | Story Count | Story Points | Dependencies | Risks | Acceptance Criteria |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Release 1 | MVP farm operations | Authentication & Onboarding, Calf Management, Cow Management, Farm & Member Management, Records Management, Reminder Engine, Settings & Personalization | 181 | 637 | Prior release foundation and successful QA gates. | Scope creep, financial accuracy, provider setup, localization gaps and performance. | All Must stories complete, no Critical/High defects, release checklist approved. |
| Release 2 | Financial automation and reporting | AI Slip Scanning & OCR, Accounting & Settlement, Notifications, Reports & Analytics | 105 | 468 | Prior release foundation and successful QA gates. | Scope creep, financial accuracy, provider setup, localization gaps and performance. | All Must stories complete, no Critical/High defects, release checklist approved. |
| Release 3 | Engagement, AI and support | Achievements & Leaderboard, Dugdhmitra AI Assistant, Profile & Statistics, Support Center | 73 | 269 | Prior release foundation and successful QA gates. | Scope creep, financial accuracy, provider setup, localization gaps and performance. | All Must stories complete, no Critical/High defects, release checklist approved. |
| Release 4 | Admin, scale, hardening and go-live | Admin Panel, Home Dashboard, Quality, Security & Performance, Settings & Personalization | 142 | 648 | Prior release foundation and successful QA gates. | Scope creep, financial accuracy, provider setup, localization gaps and performance. | All Must stories complete, no Critical/High defects, release checklist approved. |


## 6. Sprint Planning

Sprint length: 2 weeks.

| Sprint | Objectives | Epics | Story Count | Story Points | Dependencies | Definition of Done |
| --- | --- | --- | --- | --- | --- | --- |
| Sprint 1 | Authentication, language selection, onboarding | EPIC-AUTH, EPIC-SET | 54 | 206 | Previous sprint deliverables, database/API contracts and QA environment. | Code reviewed, unit/API tests pass, RLS/security checks pass, Marathi/English labels complete, QA evidence attached and no open blocker. |
| Sprint 2 | Farm management and cow management | EPIC-FARM, EPIC-COW | 51 | 178 | Previous sprint deliverables, database/API contracts and QA environment. | Code reviewed, unit/API tests pass, RLS/security checks pass, Marathi/English labels complete, QA evidence attached and no open blocker. |
| Sprint 3 | Calf management and milk records | EPIC-CALF, EPIC-REC | 49 | 166 | Previous sprint deliverables, database/API contracts and QA environment. | Code reviewed, unit/API tests pass, RLS/security checks pass, Marathi/English labels complete, QA evidence attached and no open blocker. |
| Sprint 4 | Reminders and vaccinations | EPIC-REM, EPIC-REC, EPIC-NOTIF | 51 | 197 | Previous sprint deliverables, database/API contracts and QA environment. | Code reviewed, unit/API tests pass, RLS/security checks pass, Marathi/English labels complete, QA evidence attached and no open blocker. |
| Sprint 5 | Accounting and settlements | EPIC-ACC | 27 | 124 | Previous sprint deliverables, database/API contracts and QA environment. | Code reviewed, unit/API tests pass, RLS/security checks pass, Marathi/English labels complete, QA evidence attached and no open blocker. |
| Sprint 6 | OCR and AI assistant | EPIC-OCR, EPIC-AI | 54 | 215 | Previous sprint deliverables, database/API contracts and QA environment. | Code reviewed, unit/API tests pass, RLS/security checks pass, Marathi/English labels complete, QA evidence attached and no open blocker. |
| Sprint 7 | Reports and notifications | EPIC-REP, EPIC-NOTIF | 27 | 119 | Previous sprint deliverables, database/API contracts and QA environment. | Code reviewed, unit/API tests pass, RLS/security checks pass, Marathi/English labels complete, QA evidence attached and no open blocker. |
| Sprint 8 | Admin panel and support | EPIC-ADMIN, EPIC-SUP | 31 | 132 | Previous sprint deliverables, database/API contracts and QA environment. | Code reviewed, unit/API tests pass, RLS/security checks pass, Marathi/English labels complete, QA evidence attached and no open blocker. |
| Sprint 9 | Performance, security, bug fixes | EPIC-QA, EPIC-ACH | 80 | 375 | Previous sprint deliverables, database/API contracts and QA environment. | Code reviewed, unit/API tests pass, RLS/security checks pass, Marathi/English labels complete, QA evidence attached and no open blocker. |
| Sprint 10 | UAT and release preparation | EPIC-QA | 77 | 310 | Previous sprint deliverables, database/API contracts and QA environment. | Code reviewed, unit/API tests pass, RLS/security checks pass, Marathi/English labels complete, QA evidence attached and no open blocker. |


## 7. Resource Planning

| Team Option | Roles | Best For | Risks |
| --- | --- | --- | --- |
| Solo Founder | 1 full-stack founder + part-time QA/user tester | Prototype and pilot | Slow delivery, context overload |
| Small Startup Team | Product/BA, UI designer, 2 full-stack engineers, QA, part-time DevOps | MVP to launch | Needs prioritization discipline |
| Growth Team | PM, designer, frontend, backend, QA automation, DevOps, data/AI, support lead | Scale and commercialization | Higher burn rate and coordination needs |


## 8. Development Strategy

- Frontend: Next.js App Router, React Query/cache discipline, mobile-first PWA, Marathi/English i18n, offline queue where safe.
- Backend: Supabase RLS for tenant CRUD, server APIs/RPC for transactions, AI/OCR, push, reports and backups.
- Database: farm_id tenant boundary, UUID keys, NUMERIC financial fields, materialized summaries, partition high-volume logs.
- AI: function-calling only, no raw SQL, data permissions, token/cost tracking.
- OCR: client compression/native camera, provider OCR, AI structuring, validation, mandatory review.
- Testing: Phase 9 QA package, API contract, financial regression, RLS security tests.
- Deployment: dev/test/staging/prod environments, CI/CD, rollback and backup.

## 9. Risk Management

| Risk ID | Risk | Category | Probability | Impact | Description | Mitigation |
| --- | --- | --- | --- | --- | --- | --- |
| RISK-001 | Financial calculation mismatch | Technical/Business | Medium | Critical | Settlement/profit errors reduce trust. | Automated reconciliation, source-of-truth rules, UAT with real slips. |
| RISK-002 | OCR accuracy below expectation | AI/OCR | High | High | Farmers need repeated rescans. | Native camera, validation, fallback, manual review, image guidance. |
| RISK-003 | Cross-farm data leak | Security | Low | Critical | Privacy breach. | RLS tests, admin audit, penetration testing. |
| RISK-004 | iOS PWA storage/session issues | Technical | Medium | High | iPhone users cannot navigate reliably. | iOS-specific QA and session fallback. |
| RISK-005 | Localization gaps | Product | Medium | Medium | Mixed language reduces usability. | i18n audit and screenshot QA. |
| RISK-006 | Provider cost spike | AI/OCR | Medium | Medium | OpenAI/OCR usage grows unexpectedly. | Quotas, compression, cache, usage dashboards. |
| RISK-007 | Slow dashboard at scale | Performance | Medium | High | Poor first impression. | Materialized views, caching and load tests. |
| RISK-008 | Reminder lifecycle bugs | Functional | Medium | High | Wrong animal care reminders. | Trigger tests and regression pack. |
| RISK-009 | Push notifications unreliable | Integration | Medium | Medium | Users miss important alerts. | In-app fallback, retry and device diagnostics. |
| RISK-010 | Scope creep | Project | High | High | Timeline slips. | MoSCoW control, change request process. |
| RISK-011 | Admin protected action misuse | Security | Low | High | Farm suspension/delete mistakes. | Confirmation, audit, role limits, protected delete. |
| RISK-012 | Database migration failure | Technical | Medium | Critical | Data loss or downtime. | Staging rehearsal, backup, rollback and compatibility views. |


## 10. Cost Estimation

| Cost Item | Startup / Month | Growth / Month | Scale / Month | Assumptions |
| --- | --- | --- | --- | --- |
| Supabase database/auth/storage | ₹2,000-₹8,000 | ₹15,000-₹45,000 | ₹75,000+ | Depends on active farms, storage, backups and compute. |
| OpenAI AI assistant | ₹500-₹2,000 | ₹5,000-₹25,000 | ₹75,000+ | Controlled by quotas, short prompts, function calling and caching. |
| OCR provider | ₹1,000-₹5,000 | ₹10,000-₹40,000 | ₹1,00,000+ | Driven by slip volume and provider billing. |
| Storage and backups | ₹500-₹2,000 | ₹5,000-₹20,000 | ₹50,000+ | Slip images, reports, backups, support files. |
| Push notifications | ₹0-₹1,000 | ₹2,000-₹10,000 | ₹25,000+ | Web push low cost; SMS/WhatsApp future increases cost. |
| Monitoring/logging | ₹1,000-₹5,000 | ₹10,000-₹30,000 | ₹75,000+ | Errors, traces, uptime, logs retention. |
| Domain/CDN/email/tools | ₹1,000-₹5,000 | ₹5,000-₹20,000 | ₹50,000+ | Deployment, email, support and analytics tools. |


## 11. DevOps and Environments

| Environment | Purpose | Controls |
| --- | --- | --- |
| Development | Local feature development | Local env, dev Supabase, mock provider keys |
| Testing | QA execution | Seed data, test users, contract/security/performance test access |
| Staging | UAT and release validation | Production-like data volume, provider staging keys, monitoring |
| Production | Live users | Strict RLS, backups, monitoring, secrets rotation, rollback plan |


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

| Period | Focus | Actions |
| --- | --- | --- |
| 30 days | Stability and onboarding | Monitor defects, support pilot users, fix high-impact bugs, track activation |
| 60 days | Adoption and quality | Improve OCR/AI, refine reminders, optimize dashboard, expand training |
| 90 days | Growth and monetization | Subscription conversion, admin analytics, marketing, scale readiness |


## 14. Success Measurement

| Category | KPIs |
| --- | --- |
| Business | Paid conversion, retention, active farms, support SLA |
| Product | DAU/MAU, milk records, reminders completed, reports generated, OCR usage |
| Technical | API latency, error rate, uptime, sync success, push delivery |
| AI | AI questions, useful feedback %, average latency, token cost per farm |
| Financial | MRR, infra cost per active farm, OCR/AI cost per scanned slip |


## 15. Investor / Stakeholder Summary

Majhi Dairy targets a high-friction agricultural workflow where trust, language, accounting accuracy and mobile usability matter. Competitive advantages include Marathi-first UX, AI/OCR slip processing, dairy-specific reminders, unified accounting, admin SaaS controls and offline/mobile-first design. The execution plan prioritizes trust-critical features first, then automation, intelligence, engagement and scale.

## 16. Master Project Package

| Phase | Document Output |
| --- | --- |
| Phase 1-6 | BRD foundation, detailed requirements, audit and readiness reports |
| Phase 7 | Database design, ERD, Supabase architecture, RLS and backend technical design |
| Phase 8 | API specification, OpenAPI contract, integration and frontend/backend contract |
| Phase 9 | QA strategy, RTM, test cases, UAT, regression, security and release readiness |
| Phase 10 | Execution plan, roadmap, epics, stories, sprints, releases, risks, costs and go-live plan |

