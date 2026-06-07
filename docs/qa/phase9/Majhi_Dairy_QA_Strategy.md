# Majhi Dairy QA Strategy

**Document Version:** 1.0  
**Date:** 2026-06-07  
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

| Area | In Scope |
| --- | --- |
| Functional | Authentication, dashboard, cows, calves, records, reminders, accounting, OCR, reports, AI, notifications, settings, profile, support, achievements, admin |
| API | All /v1 endpoints and standard schemas from Phase 8 OpenAPI contract |
| Database | Relationships, constraints, indexes, RLS policies, audit logs and transaction integrity |
| Security | Auth, authorization, session, PIN/password, RLS, API, storage, AI/OCR privacy and admin protection |
| Performance | Dashboard, lists, reports, OCR, AI and admin analytics targets |
| Localization | Marathi and English translation, persistence, layout and generated reports |
| UAT | Farmer, owner, veterinarian, support and admin end-to-end business workflows |


### 1.3 Test Pyramid

```text
                 UAT / Exploratory / Production Readiness
              System, E2E, Regression, Security, Performance
           API Contract, Integration, Database/RLS, Provider Tests
        Unit Tests: validation, formulas, mappers, hooks, components
```

### 1.4 Risk-Based Testing

| Risk Area | Risk | QA Focus |
| --- | --- | --- |
| Accounting | Wrong profit/loss or feed deduction month | High-priority calculation and reconciliation tests |
| OCR | Wrong slip value saved | Confidence, validation, manual review and duplicate tests |
| RLS | Cross-farm data leakage | Security and database isolation tests |
| Reminders | Wrong animal lifecycle reminder | Trigger, cancellation and status-based regression tests |
| AI | Hallucinated farm data | Tool-call, permission and source-verification tests |
| Notifications | Push/in-app mismatch | Delivery, fallback and preference tests |
| iOS PWA | Session/storage differences | Device/browser compatibility tests |


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

| Artifact | Count |
| --- | --- |
| Functional BRD requirements parsed | 236 |
| NFR requirements parsed | 15 |
| Functional test cases generated | 472 |
| NFR test cases generated | 30 |
| Language test cases generated | 40 |
| Performance test cases generated | 40 |
| Database test cases generated | 30 |
| API test cases generated | 504 |
| Security test cases generated | 80 |
| Regression test cases generated | 118 |
| UAT scenarios generated | 12 |


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

| Phase | Automation Scope | Target |
| --- | --- | --- |
| Phase 1 | Unit, validation, API contract, smoke tests | Core safety net |
| Phase 2 | Critical path E2E, accounting reconciliation, OCR save flow | Release confidence |
| Phase 3 | Performance, security automation, visual/i18n checks | Scale and production hardening |


Recommended tools: Jest/Vitest, React Testing Library, Playwright, Postman/Newman or Schemathesis, k6, OWASP ZAP, Supabase test project, Lighthouse and custom SQL/RLS tests.

## 18. Defect Management

| Severity | Definition | Examples |
| --- | --- | --- |
| Critical | Blocks release or risks money/security/data loss | Cross-farm data leak, wrong profit calculation, auto-saving OCR financial data |
| High | Major workflow broken or high-risk incorrect output | Settlement save fails, login broken on iOS, reminder lifecycle wrong |
| Medium | Important issue with workaround | Layout issue, non-critical report filter bug |
| Low | Cosmetic/minor content issue | Typo, minor spacing issue |


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
