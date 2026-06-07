# Majhi Dairy Master Test Strategy

**Document Version:** 1.0  
**Date:** 2026-06-07  
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

| Level | Purpose | Primary Owners |
| --- | --- | --- |
| Unit | Validate functions, calculations, validators and UI components | Developers |
| Integration | Validate APIs, Supabase, storage, AI/OCR and notification contracts | Developers/QA |
| System | Validate complete app workflows across roles and devices | QA |
| Regression | Protect existing behavior after every release | QA/Automation |
| UAT | Business sign-off by farmers/admin stakeholders | Product/UAT Lead |
| Performance | Validate response time and scale targets | Performance Engineer |
| Security | Validate auth, RLS, API, storage, AI/OCR and admin controls | Security/QA |
| Accessibility | Validate mobile readability, keyboard, contrast and responsive behavior | QA/UX |
| Localization | Validate Marathi/English text, layout and generated outputs | QA/Product |
| Disaster Recovery | Validate backup, restore and rollback readiness | DevOps/QA |


### 1.5 Quality Gates

| Gate | Criteria |
| --- | --- |
| Build Gate | Unit tests pass, lint/build pass, no secret scan failure |
| Integration Gate | API contract, database and provider mocks pass |
| System Gate | Critical path functional tests pass |
| Security Gate | RLS, auth, storage and OWASP security tests pass |
| Performance Gate | Dashboard <2s, Reports <5s, OCR <15s, AI <5s at target profile |
| UAT Gate | All UAT scenarios signed off or waived |
| Release Gate | No open Critical/High defect without approved waiver |


## 2. Requirement Coverage Matrix

The full traceability matrix is included as a sheet in `Functional_Test_Cases.xlsx`.

Coverage summary:

| Artifact | Count |
| --- | --- |
| accessibilityTestCases | 56 |
| aiTestCases | 72 |
| apiTestCases | 840 |
| databaseTestCases | 180 |
| functionalTestCases | 1337 |
| localizationTestCases | 80 |
| negativeTestCases | 210 |
| ocrTestCases | 72 |
| performanceTestCases | 84 |
| regressionTestCases | 139 |
| releaseChecklists | 28 |
| rtm | 191 |
| securityTestCases | 120 |
| uatScenarios | 13 |


Total generated executable/planned test cases across detailed suites: **3190**.

## 3. Test Design Specification

| Technique | Application in Majhi Dairy |
| --- | --- |
| Boundary Value Analysis | Milk liters, fat, SNF, rates, dates, password/PIN length, file size, pagination limits |
| Equivalence Partitioning | Valid/invalid roles, valid/invalid slip types, supported/unsupported files, language options |
| Decision Tables | Reminder triggers, subscription/trial states, AI permissions, OCR confidence save rules |
| State Transition Testing | Cow pregnancy/calving lifecycle, calf active/sold/conversion lifecycle, ticket/reminder states |
| Use Case Testing | End-to-end UAT scenarios such as signup, milk record, slip upload, settlement, report and support |
| Risk-Based Testing | Financial accuracy, cross-farm leakage, admin protected actions, OCR/AI hallucination, backups |
| Exploratory Testing | Mobile PWA camera/upload, iOS session behavior, Marathi layout, admin farm details |


## 4. Functional Test Suites

Detailed functional and negative test cases are delivered in `Functional_Test_Cases.xlsx`.

Module coverage:

| Module | Feature Count |
| --- | --- |
| Authentication | 12 |
| Dashboard | 11 |
| Cow Management | 13 |
| Calf Management | 12 |
| Records | 11 |
| Reminders | 13 |
| Accounting | 13 |
| OCR | 12 |
| Reports | 11 |
| AI Assistant | 11 |
| Notifications | 10 |
| Settings | 11 |
| Profile | 9 |
| Goals | 9 |
| Support | 11 |
| Achievements | 10 |
| Admin Panel | 12 |


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

| Area | Target |
| --- | --- |
| Dashboard | < 2 seconds |
| Reports | < 5 seconds |
| OCR | < 15 seconds |
| AI | < 5 seconds |


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

| Phase | Coverage Target |
| --- | --- |
| Phase A | Smoke, auth, dashboard, milk record, reminder, accounting basics: 35% |
| Phase B | API contract, database/RLS, OCR/AI happy paths, localization smoke: 55% |
| Phase C | Critical regression, security, performance baselines, admin flows: 75% |


## 17. Defect Management

Severity matrix:

| Severity | Definition | Example |
| --- | --- | --- |
| Critical | Blocks release or causes data leak/corruption | Cross-farm data exposure, incorrect profit save |
| High | Major user workflow broken | Slip save fails, login fails on iPhone |
| Medium | Workaround exists but user impact is visible | Layout issue, non-critical report filter bug |
| Low | Cosmetic/minor issue | Text alignment or typo |


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
