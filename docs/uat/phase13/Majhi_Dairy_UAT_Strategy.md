# Majhi Dairy UAT Strategy and Production Readiness Package

**Document Version:** 1.0  
**Date:** 2026-06-07  
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

| Criteria | Requirement |
| --- | --- |
| Build readiness | Latest candidate build deployed to UAT environment |
| Data readiness | Seeded test farms, cows, calves, milk, slips, financial and support data available |
| Access readiness | UAT users created for farmer, owner, veterinarian, support and admin roles |
| Documentation readiness | UAT scripts, training guide and defect process shared |
| QA readiness | No open blocker from system testing that prevents UAT start |


### 1.4 Exit Criteria

| Criteria | Target |
| --- | --- |
| UAT pass rate | >= 95% |
| Critical defects | 0 open |
| High defects | 0 open unless approved waiver |
| OCR accuracy | >= 90% on clear pilot slips |
| AI satisfaction | >= 80% business acceptance |
| System availability | >= 99.5% during pilot monitoring window |


### 1.5 Roles and Responsibilities

| Role | Responsibilities |
| --- | --- |
| Business Stakeholders | Approve business scenarios and sign off |
| Product Owner | Own acceptance decisions and prioritization |
| Farm Owners | Validate accounting, reports, goals and practical usability |
| Farmers | Validate daily workflows, reminders and slip upload |
| Veterinarians | Validate assigned farm health workflows |
| Admin Team | Validate admin monitoring, subscriptions and notifications |
| Support Team | Validate support/ticket readiness and user guidance |
| QA Lead | Coordinate execution, defect triage and evidence |
| Release Manager | Own go/no-go readiness and launch coordination |


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

| Scenario | Actor | Requirement IDs | Objective |
| --- | --- | --- | --- |
| New User Registration | Farmer | AUTH-FR-001, AUTH-FR-008 | Register, select language and reach home dashboard. |
| Farm Creation | Farm Owner | AUTH-FR-007, FARM-FR-001 | Create farm profile with village, taluka and district details. |
| First Cow Registration | Farmer | COW-FR-001 | Add first cow with valid lifecycle and important dates. |
| Calf Registration | Farmer | CALF-FR-001 | Register calf, link mother cow and verify calf reminders. |
| Daily Milk Entry | Farmer | ACC-FR-001, REC-FR-001 | Enter morning/evening milk and verify dashboard/report impact. |
| Feed Entry | Farmer | REC-FR-002, ACC-FR-006 | Record feed/fodder expense and verify monthly expense impact. |
| Vaccination Tracking | Veterinarian | REC-FR-004, REM-FR-004 | Record vaccination and complete due reminder. |
| Breeding Tracking | Farmer | REC-FR-005, REM-FR-001 | Record AI/breeding and verify pregnancy-check reminders. |
| Reminder Completion | Farmer | REM-FR-001 | Complete/snooze reminders and verify future reminder state. |
| Goal Creation | Farm Owner | GOAL-FR-001 | Create milk/fat/SNF goals and verify progress. |
| OCR Slip Upload | Farmer | OCR-FR-001 | Upload clear daily slip and verify extracted values. |
| OCR Data Correction | Farmer | OCR-FR-006 | Correct AI/OCR fields before save and verify audit. |
| Settlement Management | Farm Owner | ACC-FR-003, OCR-FR-002 | Save 15-day settlement and verify totals/feed deduction/profit impact. |
| Expense Recording | Farmer | ACC-FR-006 | Record farm expense and verify monthly reports. |
| Report Generation | Farm Owner | REP-FR-001 | Generate/export milk, expense and profit reports. |
| AI Assistant Usage | Farmer | AI-FR-001 | Ask dairy question and verify answer with database values. |
| Notification Management | Farmer | NOTIF-FR-001 | Receive/read notification and verify preferences. |
| Backup and Restore | Farm Owner | EXP-FR-001 | Create backup, download and verify restore-readiness. |
| Support Ticket Creation | Farmer | SUP-FR-001 | Create support ticket with attachment and receive response. |
| Admin Dashboard Usage | Admin | ADMIN-FR-001, ADMIN-FR-004 | Admin monitors farms, analytics, devices and support signals. |


Detailed UAT cases are delivered in `UAT_Test_Cases.xlsx`.

## 4. End-to-End Business Flows

| Flow ID | Journey | Actors | Flow | Expected Outcome | Acceptance Criteria |
| --- | --- | --- | --- | --- | --- |
| E2E-UAT-001 | Farmer Journey | Farmer | Signup -> Select language -> Create farm -> Add cow -> Record milk -> Generate report | Farmer can start using Majhi Dairy independently and see accurate dashboard/report output. | All steps pass in Marathi and English; no Critical/High defect remains. |
| E2E-UAT-002 | Veterinarian Journey | Veterinarian | Login -> View assigned farm -> Record treatment -> Schedule/complete reminder | Veterinarian can support assigned farms without seeing unauthorized farms. | Assigned farm access works; unassigned farm access is denied and audited. |
| E2E-UAT-003 | Admin Journey | Admin | Login -> Monitor farms -> Open farm details -> Send notification -> Review analytics | Admin can monitor platform and perform protected actions with audit trail. | All protected actions require confirmation/reason and create audit records. |
| E2E-UAT-004 | Farm Owner Financial Journey | Farm Owner | Record daily milk -> Upload settlement -> Reconcile -> Record expense -> View profit report | Owner can verify financial position using settlement as source of truth. | Milk, feed deduction, expense and profit numbers match expected reconciliation. |


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

| Severity | Definition | Response |
| --- | --- | --- |
| Critical | Blocks UAT/launch, data leak, financial corruption | Immediate triage and release block |
| High | Major workflow broken or no acceptable workaround | Same-day owner assignment |
| Medium | Workflow issue with workaround | Resolve before launch or accept with plan |
| Low | Cosmetic or low-risk issue | Can defer with PO approval |


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

| Metric | Target |
| --- | --- |
| UAT pass rate | >= 95% |
| Critical defects | 0 |
| High defects | 0 without waiver |
| OCR accuracy | >= 90% for clear pilot slips |
| AI satisfaction | >= 80% |
| System availability | >= 99.5% |
| Pilot activation | >= 80% farms create core records |
| Support readiness | 100% support workflows tested |


## 15. Final Approval Package

Production approval package is delivered as `Production_Approval_Package.docx` with business, QA, security, technical and production approval templates.
