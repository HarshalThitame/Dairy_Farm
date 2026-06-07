# Majhi Dairy Development Roadmap and Sprint Execution Package

**Document Version:** 1.0  
**Date:** 2026-06-07  
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

| Phase | Name | Timeline | Dependencies | Major Outputs | Exit Criteria |
| --- | --- | --- | --- | --- | --- |
| Phase 1 | Project Setup | Week 1 | Previous phase baseline and approved requirements | Project Setup deliverables, tests, documentation and acceptance evidence | Sprint DoD met and release risks updated |
| Phase 2 | Authentication | Week 3-4 | Previous phase baseline and approved requirements | Authentication deliverables, tests, documentation and acceptance evidence | Sprint DoD met and release risks updated |
| Phase 3 | Farm Management | Week 5-6 | Previous phase baseline and approved requirements | Farm Management deliverables, tests, documentation and acceptance evidence | Sprint DoD met and release risks updated |
| Phase 4 | Cow Management | Week 7-8 | Previous phase baseline and approved requirements | Cow Management deliverables, tests, documentation and acceptance evidence | Sprint DoD met and release risks updated |
| Phase 5 | Calf Management | Week 9-10 | Previous phase baseline and approved requirements | Calf Management deliverables, tests, documentation and acceptance evidence | Sprint DoD met and release risks updated |
| Phase 6 | Records & Reminders | Week 11-12 | Previous phase baseline and approved requirements | Records & Reminders deliverables, tests, documentation and acceptance evidence | Sprint DoD met and release risks updated |
| Phase 7 | Accounting | Week 13-14 | Previous phase baseline and approved requirements | Accounting deliverables, tests, documentation and acceptance evidence | Sprint DoD met and release risks updated |
| Phase 8 | OCR | Week 15-16 | Previous phase baseline and approved requirements | OCR deliverables, tests, documentation and acceptance evidence | Sprint DoD met and release risks updated |
| Phase 9 | AI Assistant | Week 17-18 | Previous phase baseline and approved requirements | AI Assistant deliverables, tests, documentation and acceptance evidence | Sprint DoD met and release risks updated |
| Phase 10 | Reports | Week 19-20 | Previous phase baseline and approved requirements | Reports deliverables, tests, documentation and acceptance evidence | Sprint DoD met and release risks updated |
| Phase 11 | Notifications | Week 21-22 | Previous phase baseline and approved requirements | Notifications deliverables, tests, documentation and acceptance evidence | Sprint DoD met and release risks updated |
| Phase 12 | Admin Panel | Week 23-24 | Previous phase baseline and approved requirements | Admin Panel deliverables, tests, documentation and acceptance evidence | Sprint DoD met and release risks updated |
| Phase 13 | Security Hardening | Week 25-26 | Previous phase baseline and approved requirements | Security Hardening deliverables, tests, documentation and acceptance evidence | Sprint DoD met and release risks updated |
| Phase 14 | Performance Optimization | Week 27-28 | Previous phase baseline and approved requirements | Performance Optimization deliverables, tests, documentation and acceptance evidence | Sprint DoD met and release risks updated |
| Phase 15 | UAT Support | Week 29-30 | Previous phase baseline and approved requirements | UAT Support deliverables, tests, documentation and acceptance evidence | Sprint DoD met and release risks updated |
| Phase 16 | Production Release | Week 31-32 | Previous phase baseline and approved requirements | Production Release deliverables, tests, documentation and acceptance evidence | Sprint DoD met and release risks updated |


## 3. Epic Breakdown

| Epic ID | Epic Name | Business Objective | Technical Objective | Dependencies | Risk | Effort Points | Target Sprint |
| --- | --- | --- | --- | --- | --- | --- | --- |
| EPIC-SETUP | Project Setup | Establish repository, environments, CI/CD and engineering standards. | Create deployable technical foundation. |  | Low | 55 | Sprint 0 |
| EPIC-AUTH | Authentication | Enable secure access, onboarding and language selection. | Supabase Auth, sessions, PIN, language persistence. | SETUP | High | 110 | Sprint 1 |
| EPIC-FARM | Farm Management | Create and manage farm tenant profile, members and locations. | Farm schema, members, permissions and location dropdowns. | AUTH | High | 95 | Sprint 2 |
| EPIC-DASH | Dashboard | Show most important farm status immediately. | Optimized home APIs, cached summaries and responsive cards. | AUTH,FARM | Medium | 85 | Sprint 2 |
| EPIC-COW | Cow Management | Manage cow lifecycle, status and history. | Cow CRUD, profile, timeline and lifecycle rules. | FARM | High | 120 | Sprint 3 |
| EPIC-CALF | Calf Management | Manage calf lifecycle, reminders and conversion/sale states. | Calf CRUD, mother linking, age/reminder logic. | COW | High | 95 | Sprint 4 |
| EPIC-REC | Records | Capture milk, feed, health, vaccination, breeding and calving records. | Record APIs, validation, offline-safe mutations and audit. | COW,CALF | High | 135 | Sprint 5 |
| EPIC-REM | Reminders | Generate and complete accurate animal and farm reminders. | Reminder engine, notification hooks and lifecycle cancellation. | REC | High | 120 | Sprint 6 |
| EPIC-ACC | Accounting | Provide accurate milk, expense, settlement and profit accounting. | Financial schema, source-of-truth rules and reconciliation. | REC | Critical | 160 | Sprint 7 |
| EPIC-OCR | OCR | Process daily and settlement dairy slips with user review. | Upload, compression, OCR/AI extraction, validation and audit. | ACC | Critical | 145 | Sprint 8 |
| EPIC-AI | AI Assistant | Answer farm questions using real permitted database data. | Function-calling tools, permissions, history and settings. | REC,ACC | High | 130 | Sprint 9 |
| EPIC-REP | Reports | Generate business, animal and financial reports. | Report APIs, charts, exports and print layouts. | ACC,REC | High | 125 | Sprint 10 |
| EPIC-NOTIF | Notifications | Deliver in-app and push notifications reliably. | Inbox, preferences, push subscription and admin broadcasts. | REM | High | 105 | Sprint 11 |
| EPIC-SET-PROF | Settings + Profile | Allow users to personalize, secure and manage their profile. | Settings APIs, profile, appearance, language and security UX. | AUTH,FARM | Medium | 110 | Sprint 12 |
| EPIC-SUP | Support | Enable self-service help and support ticket workflows. | FAQ, tickets, attachments and support notifications. | AUTH | Medium | 85 | Sprint 13 |
| EPIC-ACH | Achievements | Increase engagement through score, badges and leaderboard. | Achievement engine, score and ranking refresh. | REC,GOAL | Medium | 80 | Sprint 13 |
| EPIC-ADMIN | Admin Panel | Give platform team farm monitoring and operations control. | Admin dashboards, farm details, subscriptions and audit. | AUTH,FARM,ACC | Critical | 175 | Sprint 14 |
| EPIC-SEC | Security Hardening | Harden auth, RLS, storage, API, AI/OCR and admin actions. | Security tests, RLS validation, secrets, hardening checklist. | ALL | Critical | 120 | Sprint 15 |
| EPIC-PERF | Performance Optimization | Meet page/API/report/OCR/AI performance targets. | Profiling, caching, query tuning and bundle optimization. | ALL | High | 105 | Sprint 16 |
| EPIC-REG | Bug Fixes + Regression | Stabilize release candidate with regression coverage. | Bug triage, automated regression and defect burn-down. | ALL | High | 90 | Sprint 17 |
| EPIC-UAT | UAT Support | Support business users through UAT and pilot preparation. | UAT fixes, training support and acceptance evidence. | REG | Medium | 75 | Sprint 18 |
| EPIC-REL | Production Release | Launch production with monitoring, rollback and hypercare. | Release runbook, migration, launch and hypercare execution. | UAT,SEC,PERF | Critical | 80 | Sprint 19 |


## 4. Feature Breakdown

The full feature, sub-feature and engineering task breakdown is delivered in `Epic_Backlog.xlsx`.

## 5. User Story Execution Plan

The detailed user story inventory is delivered in `User_Story_Backlog.xlsx`.

Summary:

| Metric | Value |
| --- | --- |
| Epics | 22 |
| Features | 110 |
| User stories | 480 |
| Total story points | 2317 |


## 6. Sprint Planning

| Sprint | Theme | Story Count | Story Points | Deliverables |
| --- | --- | --- | --- | --- |
| Sprint 0 | Project Setup | 25 | 100 | Project Setup feature increment, tests, docs and release notes. |
| Sprint 1 | Authentication + Language Selection | 20 | 88 | Authentication + Language Selection feature increment, tests, docs and release notes. |
| Sprint 2 | Farm Management | 40 | 176 | Farm Management feature increment, tests, docs and release notes. |
| Sprint 3 | Cow Management | 20 | 88 | Cow Management feature increment, tests, docs and release notes. |
| Sprint 4 | Calf Management | 20 | 88 | Calf Management feature increment, tests, docs and release notes. |
| Sprint 5 | Milk Records | 20 | 88 | Milk Records feature increment, tests, docs and release notes. |
| Sprint 6 | Reminders + Vaccinations | 20 | 88 | Reminders + Vaccinations feature increment, tests, docs and release notes. |
| Sprint 7 | Accounting | 20 | 148 | Accounting feature increment, tests, docs and release notes. |
| Sprint 8 | OCR | 25 | 175 | OCR feature increment, tests, docs and release notes. |
| Sprint 9 | AI Assistant | 25 | 100 | AI Assistant feature increment, tests, docs and release notes. |
| Sprint 10 | Reports | 20 | 88 | Reports feature increment, tests, docs and release notes. |
| Sprint 11 | Notifications | 25 | 100 | Notifications feature increment, tests, docs and release notes. |
| Sprint 12 | Settings + Profile | 20 | 88 | Settings + Profile feature increment, tests, docs and release notes. |
| Sprint 13 | Support + Achievements | 40 | 176 | Support + Achievements feature increment, tests, docs and release notes. |
| Sprint 14 | Admin Panel | 25 | 175 | Admin Panel feature increment, tests, docs and release notes. |
| Sprint 15 | Security Hardening | 25 | 175 | Security Hardening feature increment, tests, docs and release notes. |
| Sprint 16 | Performance Optimization | 25 | 100 | Performance Optimization feature increment, tests, docs and release notes. |
| Sprint 17 | Bug Fixes + Regression | 20 | 88 | Bug Fixes + Regression feature increment, tests, docs and release notes. |
| Sprint 18 | UAT Support | 20 | 88 | UAT Support feature increment, tests, docs and release notes. |
| Sprint 19 | Release Preparation | 18 | 80 | Release Preparation feature increment, tests, docs and release notes. |
| Sprint 20 | Production Launch | 7 | 27 | Production Launch feature increment, tests, docs and release notes. |


## 7. Team Structure

| Option | Roles | Capacity | Velocity | Responsibilities | Risks |
| --- | --- | --- | --- | --- | --- |
| Solo Founder | Full-stack engineer + PM/QA/support | 20-35 hrs/week | 15-25 points/sprint | Build highest-priority features, manual QA, deployment, support | Context switching, slower QA/security coverage |
| 2-4 Member Startup Team | Full-stack, frontend, QA/product, part-time DevOps | 80-140 hrs/week | 45-75 points/sprint | Parallel frontend/backend/QA delivery | Need tighter backlog grooming and integration discipline |
| 5-10 Member Product Team | PM, designer, frontend, backend, QA automation, DevOps, support | 200-350 hrs/week | 100-180 points/sprint | Feature squads, automation, security/performance in parallel | Coordination overhead and dependency management |


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

| Risk ID | Risk | Category | Probability | Impact | Mitigation | Owner |
| --- | --- | --- | --- | --- | --- | --- |
| DEV-RISK-001 | Financial calculation regression | Technical | Medium | Critical | Automated financial regression and settlement reconciliation | Engineering/QA |
| DEV-RISK-002 | Cross-farm data leakage | Security | Low | Critical | RLS tests, service API guard and security review | Security/Backend |
| DEV-RISK-003 | OCR accuracy below target | OCR | Medium | High | Golden slip set, fallback/manual review and provider monitoring | AI/OCR Engineer |
| DEV-RISK-004 | AI hallucination or unauthorized data usage | AI | Medium | High | Function calling only, permission checks and answer verification tests | AI Engineer |
| DEV-RISK-005 | iOS PWA instability | Technical | Medium | High | Dedicated iOS regression and session/storage QA | Frontend/QA |
| DEV-RISK-006 | Push notification unreliability | Technical | Medium | Medium | Subscription diagnostics, fallback in-app notifications | Frontend/DevOps |
| DEV-RISK-007 | Admin protected action misuse | Security | Low | High | Confirmation, reason, audit and role checks | Admin/Backend |
| DEV-RISK-008 | Performance misses home/report targets | Performance | Medium | High | Caching, query indexes and budget monitoring | Engineering |
| DEV-RISK-009 | Scope creep across settings/support/gamification | Delivery | High | Medium | MoSCoW prioritization and sprint change control | PM |
| DEV-RISK-010 | Provider key/billing issue | Architecture | Medium | High | Provider config validation, quotas, fallback manual path | DevOps |
| DEV-RISK-011 | UAT defects late in release | Delivery | Medium | High | Early pilot walkthroughs and sprint demos | QA/UAT Lead |
| DEV-RISK-012 | Insufficient test data | QA | Medium | Medium | Seed scripts and golden datasets | QA/Data |


## 12. Release Management

| Release | Type | Target Window | Scope | Entry Criteria | Exit Criteria |
| --- | --- | --- | --- | --- | --- |
| R0 | Internal Alpha | After Sprint 5 | Auth, farm, cow, calf and milk records | Core workflows testable | No blocker in core data creation |
| R1 | MVP Beta | After Sprint 10 | Records, reminders, accounting, OCR, AI, reports | Financial/OCR/AI flows ready | Pilot farms can complete key workflows |
| R2 | Pilot Candidate | After Sprint 16 | Notifications, settings, support, achievements, admin, security/performance | Feature complete | Security/performance gates pass |
| R3 | Production Release | After Sprint 20 | Regression fixes, UAT support, release prep and launch | UAT pass >=95% | Go-live approval signed |
| Hotfix | Patch/Hotfix | As needed | Critical production defects only | Approved incident/defect | Fix verified and monitored |


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
