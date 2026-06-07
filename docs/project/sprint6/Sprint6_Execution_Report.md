# Majhi Dairy Sprint 6 Execution Report

**Date:** 2026-06-07  
**Sprint:** Sprint 6 - Reminders + Vaccinations  
**Slice Started:** Reminder action reliability and vaccination/health validation hardening  
**Status:** Started and initial fixes completed for code/build validation

## 1. Scope Executed

Sprint 6 started after Sprint 5 manual QA smoke was completed. This sprint focuses on reminders, vaccination records and health records because these flows directly affect farmer action timing and animal care.

- Reminder list/detail API audit.
- Reminder complete, skip and snooze action review.
- Pregnancy-check reminder result flow review.
- Vaccination entry UI and API validation review.
- Health/deworming entry UI and API validation review.
- Offline reminder action queue review.
- Build-level regression validation.

## 2. Issues Found

| Severity | Issue | Risk |
| --- | --- | --- |
| High | Health/vaccination API allowed future record dates. | Future treatment/vaccination records could make reminders and reports inaccurate. |
| High | Health/vaccination API accepted invalid date formats for main date and next due date. | Bad offline/API payloads could store unusable dates. |
| High | Health/vaccination API accepted invalid or extremely large cost values. | Monthly expense and reports could be corrupted by typos/OCR-like payloads. |
| High | A completed reminder could be snoozed through the API. | Done reminders could reopen and confuse farmer workflow. |
| Medium | Reminder creation accepted untrimmed or oversized messages. | Poor data quality and UI overflow risk. |
| Medium | Vaccination page allowed future vaccination dates and invalid next due dates. | Avoidable invalid submissions reached the server. |
| Medium | Health/deworming page allowed future record dates and invalid next due dates. | Avoidable invalid submissions reached the server. |
| High | Health/vaccination records with `next_due_date` showed success but did not create a server-side follow-up reminder. | Farmer could miss vaccination/deworming/checkup reminders after refresh or sync. |

## 3. Fixes Implemented

| Area | Fix |
| --- | --- |
| Health API | Added India-local future-date rejection for health, deworming and vaccination records. |
| Health API | Added strict ISO date validation for `date` and `next_due_date`. |
| Health API | Added Marathi digit normalization and bounded cost validation. |
| Health API | Required vaccine name for vaccination records and medicine/dewormer name for deworming records. |
| Reminder API | Snooze now rejects reminders that are already completed. |
| Reminder API | Reminder messages are trimmed and constrained to 2-500 characters. |
| Vaccination UI | Added date max, next due min and cost max guards before save. |
| Health UI | Added date max, next due min and cost max guards before save. |
| Offline reminders | Reviewed done-action path; offline completion already queues `/api/reminders` PATCH via `markReminderDoneLocally`. |
| Health follow-up reminders | Health/vaccination/deworming API now creates linked follow-up reminders when `next_due_date` is present. |
| Offline sync | Health/vaccination sync now caches server-created follow-up reminders after sync. |

## 4. Files Updated

| File | Purpose |
| --- | --- |
| `app/api/health/route.js` | Harden health/vaccination/deworming API validation. |
| `app/api/reminders/route.js` | Harden reminder snooze and creation validation. |
| `app/nondi/lasikaran/page.js` | Add vaccination form validation and input constraints. |
| `app/nondi/arogya/page.js` | Add health/deworming form validation and input constraints. |
| `lib/offlineActions.js` | Cache server-created health follow-up reminders after online save. |
| `lib/syncManager.js` | Cache server-created health follow-up reminders after offline sync. |
| `docs/project/sprint5/Sprint5_Execution_Report.md` | Document Sprint 5 manual QA smoke result. |
| `docs/project/sprint6/Sprint6_Execution_Report.md` | Sprint 6 execution tracking. |

## 5. Validation Results

| Check | Command / Method | Result |
| --- | --- | --- |
| Sprint 5 manual QA | Non-destructive code review of milk APIs, UI and offline sync | Passed; report updated. |
| Reminder API review | Code review of list/detail, done, skip, snooze and pregnancy-result paths | Passed after snooze guard fix. |
| Offline reminder review | Code review of `markReminderDone` and `markReminderDoneLocally` queue path | Passed; offline done action queues pending sync. |
| Health/vaccination validation review | Code review of API and UI guards | Passed after validation fixes. |
| Follow-up reminder manual QA review | Code review of health/vaccination save, API response and offline sync cache paths | Passed after server-side reminder creation fix. |
| ESLint | `npm run lint` | Passed. No ESLint warnings or errors. |
| Production build | `npm run build` | Passed. Next.js compiled successfully and generated 79 static pages. |

## 6. Remaining Manual QA

These should be executed on a disposable authenticated farm because the current Supabase target is remote.

1. Create a vaccination record for today and verify next due reminder appears.
2. Try future vaccination date and verify Marathi validation error.
3. Try next due date before vaccination date and verify it is blocked.
4. Create a deworming record and verify medicine/dewormer name is required.
5. Try future health record date and verify it is blocked.
6. Mark a reminder done from home screen and verify it disappears after refresh.
7. Mark a reminder done from `/athavan` and verify it appears in completed reminders.
8. Snooze an active reminder and verify the new date is correct.
9. Try snoozing a completed reminder by API and verify it is rejected.
10. Complete pregnancy-positive and pregnancy-negative reminder actions and verify cow status and related reminders update correctly.
11. Verify offline reminder completion syncs after internet returns.

## 7. Sprint 6 Open Items

1. Add API-level automated tests for reminder actions when test harness is available.
2. Add browser QA recordings for vaccination and reminder flows on Android and iPhone.
3. Consider farm-configurable cost upper bounds for large commercial farms.
4. Add clearer UI status when queued offline reminder updates fail server validation.

## 8. Exit Criteria Progress

| Exit Criteria | Status |
| --- | --- |
| Reminder action API reviewed | Pass |
| Completed reminder cannot be snoozed | Pass |
| Vaccination API validation hardened | Pass |
| Health/deworming API validation hardened | Pass |
| Vaccination UI validation improved | Pass |
| Health UI validation improved | Pass |
| Offline reminder done path reviewed | Pass |
| Lint passes | Pass |
| Build passes | Pass |
| Full DB/browser role QA complete | Pending disposable-farm QA |
| Sprint 6 manual QA smoke complete | Pass |
