# Majhi Dairy Sprint 5 Execution Report

**Date:** 2026-06-07  
**Sprint:** Sprint 5 - Milk Records  
**Slice Completed:** Daily milk entry validation and offline sync accuracy hardening  
**Status:** Started and initial fixes completed for code/build validation

## 1. Scope Executed

Sprint 5 started with daily milk records because this data feeds dashboard, reports, AI answers, dairy slips and accounting summaries.

- Daily milk entry page audit.
- Milk create API audit.
- Milk update API audit.
- Bulk milk API audit.
- Offline milk sync conflict review.
- Dairy slip synchronization impact review.
- Monthly report/dashboard dependency review.

## 2. Issues Found

| Severity | Issue | Risk |
| --- | --- | --- |
| Critical | Offline milk conflict resolution used `Math.max(local, server)` for litres. | If a user corrected milk downward while offline, sync could keep inflated litres and corrupt reports. |
| High | Milk POST/PUT/bulk APIs did not reject future dates. | Future milk could appear in reports, goals and dashboard incorrectly. |
| High | APIs accepted invalid numeric text by converting it to `0`/`null`. | Bad client/OCR/offline payloads could silently save wrong milk values. |
| High | APIs had no practical upper bounds for litres/rate/fat/SNF/degree. | OCR or manual typo values could create unrealistic financial/report totals. |
| Medium | PUT date change did not pre-check duplicate daily record date. | Unique-index errors could surface as generic failures. |
| Medium | UI date picker allowed future dates. | Avoidable invalid submissions reached the API. |
| Medium | UI inputs had no upper limits for financial/quality fields. | Typo values were easier to submit. |

## 3. Fixes Implemented

| Area | Fix |
| --- | --- |
| Shared validation | Added `validateMilkRecordInput` in `lib/milkRecordFields.js`. |
| Date validation | Milk create/update/bulk now reject invalid or future dates using India-local current date. |
| Numeric validation | Milk litres, rate, fat, SNF and degree now reject invalid, negative and unrealistic values. |
| Create API | `POST /api/milk` now requires valid date and at least one milk session. |
| Update API | `PUT /api/milk/[id]` validates partial inputs and final merged record state. |
| Update API | Date changes now check duplicate overall milk record before update. |
| Bulk API | Every input row and aggregated date payload is validated before saving. |
| Offline sync | Milk conflict resolution now treats the local queued payload as the intended correction instead of keeping max litres. |
| UI validation | `/nondi/dudh` now blocks future date and adds practical max values to milk/rate/fat/SNF/degree inputs. |

## 4. Files Updated

| File | Purpose |
| --- | --- |
| `lib/milkRecordFields.js` | Shared milk input sanitization and validation rules. |
| `app/api/milk/route.js` | Harden milk create validation. |
| `app/api/milk/[id]/route.js` | Harden milk update validation and duplicate-date handling. |
| `app/api/milk/bulk/route.js` | Harden bulk milk validation. |
| `app/nondi/dudh/page.js` | Add browser-level future date and max-value protections. |
| `lib/syncManager.js` | Fix offline milk conflict resolution to avoid inflated synced litres. |

## 5. Validation Results

| Check | Command | Result |
| --- | --- | --- |
| Sprint 5 audit | Non-destructive code review of milk APIs, UI, offline sync and report dependencies | Passed by code review. Remote Supabase detected, DB mutation skipped. |
| Sprint 5 manual QA smoke | Static verification of validation guards, UI max limits and offline conflict behavior | Passed. |
| Environment safety | `.env.local` inspection without printing secrets | Remote Supabase detected with service role/JWT configured. |
| Milk validation surface review | `rg` verification of `validateMilkRecordInput`, future-date guards, duplicate-date checks and UI max attributes | Passed. |
| Whitespace check | `git diff --check` on Sprint 5 files | Passed. |
| ESLint | `npm run lint` | Passed. No ESLint warnings or errors. |
| Production build | `npm run build` | Passed. Next.js compiled successfully and generated 79 static pages. |

## 6. Remaining Manual QA

These require an authenticated disposable farm because the configured Supabase target is remote.

1. Create today milk with morning/evening litres and verify dashboard updates.
2. Edit the same date and verify dairy slips are updated, not duplicated.
3. Try future date and verify Marathi validation error.
4. Try invalid numeric text through API/offline payload and verify rejection.
5. Try fat/SNF greater than 20 and verify rejection.
6. Try date change to an already existing milk record and verify conflict message.
7. Bulk import multiple entries with the same date and verify aggregation.
8. Offline create/correction sync should preserve the local correction exactly.
9. Monthly milk report should use the corrected daily values.
10. Goals achievement check should still fire after valid milk save.

## 7. Sprint 5 Open Items

1. Full browser QA should be run on Android and iPhone for numeric/date input behavior.
2. API-level tests should be added for milk validation once a test harness is available.
3. Offline conflict UX should show a clearer message when server rejects queued invalid milk data.
4. If commercial farms need more than 5000 litres per session, the max thresholds should become farm-configurable.

## 8. Exit Criteria

| Exit Criteria | Status |
| --- | --- |
| Milk create validation hardened | Pass |
| Milk update validation hardened | Pass |
| Bulk milk validation hardened | Pass |
| Future date blocked | Pass |
| Offline milk conflict inflation fixed | Pass |
| UI validation improved | Pass |
| Non-destructive manual QA smoke complete | Pass |
| Lint passes | Pass |
| Build passes | Pass |
| Full DB/browser role QA complete | Pending disposable-farm QA |
