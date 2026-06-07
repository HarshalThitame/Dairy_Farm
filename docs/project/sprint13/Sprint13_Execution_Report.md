# Majhi Dairy Sprint 13 Execution Report

**Date:** 2026-06-07  
**Sprint:** Sprint 13 - Support + Achievements  
**Slice Started:** Help/support tickets, FAQ/tutorials, feature requests, achievements, score pages and leaderboard  
**Status:** Manual QA code audit completed; fixes applied and build verified

## 1. Scope Executed

Sprint 13 started after Sprint 12 Settings + Profile verification. This slice focuses on support workflow reliability and achievement/leaderboard data access.

- Support ticket list, ticket detail, reply and attachment API review.
- FAQ and tutorial article fetch/view tracking review.
- Feature request creation and vote/unvote API review.
- Achievements dashboard and PDF sharing auth review.
- Leaderboard data loading auth review.
- Cookie/localStorage session compatibility review for Safari/PWA flows.
- Support frontend state handling for ticket create/detail, FAQ/tutorial open states, feature voting and status pages.
- Achievement scoring/read paths and leaderboard taluka/all-farm scope behavior.

## 2. Issues Found

| Severity | Issue | Risk |
| --- | --- | --- |
| High | Achievements and leaderboard pages used manual bearer-token headers without same-origin credentials. | iPhone/Safari or cookie-backed sessions could fail even while the user was logged in. |
| Medium | Support ticket list accepted invalid `page`, `pageSize` and `status` query values. | Invalid URLs could produce NaN ranges or inconsistent DB filters. |
| Medium | Ticket detail/reply/attachment routes passed invalid ticket IDs directly to the database. | Bad URLs could become noisy DB errors instead of clear user-facing validation. |
| Medium | FAQ, tutorial and feature vote routes passed invalid IDs directly to the database. | Bad IDs could surface as 500-style errors instead of controlled 400 responses. |
| Low | Achievement share PDF accepted any non-empty achievement ID value before querying. | Invalid input could produce DB errors instead of a simple validation response. |

## 3. Fixes Implemented

| Area | Fix |
| --- | --- |
| Achievements auth | Achievements page and PDF download now use shared `getClientAuthHeaders()` with `credentials: "same-origin"`. |
| Leaderboard auth | Leaderboard data fetch now uses shared `getClientAuthHeaders()` with `credentials: "same-origin"`. |
| Ticket pagination | Ticket list now validates status and clamps page/pageSize to safe integer ranges. |
| Ticket ID safety | Ticket detail, reply and attachment routes now reject invalid UUIDs before querying. |
| Support content ID safety | FAQ article, tutorial and feature request vote routes now reject invalid UUIDs before querying. |
| Achievement share safety | Achievement PDF share route now validates the achievement ID format before querying. |

## 4. Files Updated

| File | Purpose |
| --- | --- |
| `components/achievements/AchievementsClient.js` | Cookie/localStorage-safe auth for achievements and PDF export. |
| `app/leaderboard/page.js` | Cookie/localStorage-safe auth for leaderboard loading. |
| `app/api/achievements/share/route.js` | Achievement ID validation before PDF generation query. |
| `app/api/support/tickets/route.js` | Safe pagination and status validation. |
| `app/api/support/tickets/[id]/route.js` | Ticket UUID validation for detail and status/rating updates. |
| `app/api/support/tickets/[id]/messages/route.js` | Ticket UUID validation for replies. |
| `app/api/support/tickets/[id]/attachments/route.js` | Ticket UUID validation for attachments. |
| `app/api/support/faq/route.js` | FAQ UUID validation for article load and feedback. |
| `app/api/support/tutorials/route.js` | Tutorial UUID validation for detail/view tracking. |
| `app/api/support/features/route.js` | Feature request UUID validation for vote/unvote. |
| `docs/project/sprint13/Sprint13_Execution_Report.md` | Sprint 13 execution tracking. |

## 5. Validation Results

| Check | Command / Method | Result |
| --- | --- | --- |
| Auth scan | `rg "Authorization:|getClientAuthToken|getToken\\(\\)"` over support/achievements/leaderboard scope | Passed; no manual bearer-only calls remain in this scope. |
| ID validation audit | Code review of support IDs, feature votes and achievement share | Passed after UUID guards. |
| Support UI contract audit | Code review of `/support`, `/support/tickets`, `/support/faq`, `/support/tutorials`, `/support/contact`, `/support/status` | Passed. |
| Achievement/leaderboard UI audit | Code review of achievements, score and leaderboard pages | Passed after shared auth header fix. |
| DB constraint alignment | Review of support and achievement migration constraints/triggers | Passed. |
| Whitespace check | `git diff --check` on Sprint 12/13 modified files | Passed. |
| ESLint | `npm run lint` | Passed. |
| Production build | `npm run build` | Passed; 79 static pages generated. |

## 6. Remaining Manual QA

These require an authenticated farm account and browser/device interaction.

1. Open `/support`, search FAQ/tutorial/tickets and verify results.
2. Open `/support/tickets`, create a ticket, reply, attach JPG/PDF and close/reopen/rate it.
3. Open `/support/faq` and `/support/tutorials`, view items and submit FAQ helpful/not-helpful feedback.
4. Open `/support/contact`, submit bug/feature/support flows if enabled in UI.
5. Open `/achievements`, verify score, progress, unlock popups and notification behavior.
6. Download an unlocked achievement PDF.
7. Open `/leaderboard`, switch between "सर्व Farms" and "माझा तालुका"; verify current farm rank and alignment.
8. Repeat critical flows on iPhone Safari/PWA to confirm cookie/session fallback.

## 7. Sprint 13 Open Items

1. Add Playwright smoke tests for ticket create/reply/attachment and leaderboard scope switching.
2. Add API tests for invalid ticket/FAQ/tutorial/feature/achievement IDs.
3. Add localization cleanup pass for support category labels that still intentionally mix product terms like AI, OCR, Slip and Subscription.

## 8. Exit Criteria Progress

| Exit Criteria | Status |
| --- | --- |
| Sprint 13 started | Pass |
| Support ticket API hardening complete | Pass |
| FAQ/tutorial/feature invalid input hardening complete | Pass |
| Achievements and leaderboard auth hardened | Pass |
| Sprint 13 code-level manual QA complete | Pass |
| Lint passes | Pass |
| Build passes | Pass |
| Device manual QA complete | Pending device QA |
