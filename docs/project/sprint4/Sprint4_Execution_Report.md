# Majhi Dairy Sprint 4 Execution Report

**Date:** 2026-06-07  
**Sprint:** Sprint 4 - Calf Management  
**Slice Completed:** Calf lifecycle, permission and data integrity hardening  
**Status:** Started and initial fixes completed for code/build validation

## 1. Scope Executed

Sprint 4 started with the Calf Management flows that affect animal lifecycle and finance:

- Calf list page audit.
- Calf create API audit.
- Calf update/status-change API audit.
- Calf sale finance side-effect audit.
- Calf-to-cow conversion audit.
- Calf reminder generation impact review.
- Browser date input review.

## 2. Issues Found

| Severity | Issue | Risk |
| --- | --- | --- |
| Critical | Calf create/update API used farm access instead of owner/admin access. | Staff users could create calves, sell calves, or trigger finance income changes. |
| High | Calf create/update accepted future birth dates. | Age, milk feeding reminders and lifecycle calculations could become wrong. |
| High | Calf sale accepted future sold dates. | Finance records and monthly summaries could be assigned to invalid future periods. |
| High | Calf-to-cow conversion accepted future AI dates. | Pregnancy checks, expected calving and AI expenses could be scheduled incorrectly. |
| High | Calf-to-cow conversion did not reuse cow validation. | Invalid cow payloads or duplicate active tag numbers could be inserted. |
| Medium | API allowed creating a new calf directly with terminal statuses such as sold/dead/converted. | Lifecycle audit trail could be bypassed. |
| Medium | API used unsafe boolean casting for calf raised status in PATCH. | String values like `"false"` could be treated as raised. |
| Medium | Calf page showed add/edit/sell/convert controls to all authenticated farm users. | Non-owner users saw actions they should not perform. |
| Low | Calf page date inputs did not block future dates at browser level. | Avoidable invalid submissions reached the API. |

## 3. Fixes Implemented

| Area | Fix |
| --- | --- |
| API authorization | Calf POST/PATCH now require `verifyFarmOwner`; read/list remains farm-level access. |
| Mother cow validation | Mother cow references are validated against the authenticated farm before calf create/update. |
| Date validation | Birth date, sold date and conversion AI date now reject future dates server-side. |
| Create lifecycle | New calf creation only accepts active/historical starting states. |
| Status transitions | Dead and converted calf transitions are hardened against unsafe state changes. |
| Boolean parsing | Calf raised status now uses explicit boolean parsing for Marathi/English values. |
| Calf-to-cow conversion | Conversion now validates generated cow payload and blocks duplicate active ear tags. |
| UI permissions | Add/edit/sell/dead/convert controls are wrapped in `AdminOnly`. |
| UI date controls | Calf birth, sale and AI date inputs now use `max={today}`. |

## 4. Files Updated

| File | Purpose |
| --- | --- |
| `app/api/calves/route.js` | Harden calf create/update authorization, dates, state transitions, sale and conversion logic. |
| `app/vasare/page.js` | Hide mutation controls from non-owner users and block future dates in forms. |
| `lib/calfServer.js` | Normalize raised status without unsafe JavaScript boolean casting. |

## 5. Validation Results

| Check | Command | Result |
| --- | --- | --- |
| ESLint | `npm run lint` | Passed. No ESLint warnings or errors. |
| Production build | `npm run build` | Passed. Next.js compiled successfully and generated 79 static pages. |
| Sprint 4 manual QA smoke | Non-destructive review of calf create/update/sale/conversion guards | Passed by code review. Remote Supabase detected, DB mutation skipped. |
| Environment safety | `.env.local` inspection without printing secrets | Remote Supabase detected with service role/JWT configured. |
| Permission surface review | `rg` verification of `verifyFarmOwner`, `AdminOnly`, date guards and conversion checks | Passed. |
| Direct helper smoke | Direct Node import of `lib/calfServer.js` | Not executed because plain Node does not resolve the Next `@/lib` alias. Covered by build import graph. |
| Diff review | `git diff -- app/api/calves/route.js app/vasare/page.js lib/calfServer.js` | Passed by code review. |

## 6. Remaining Manual QA

These require authenticated DB-backed testing. They were not executed automatically because the configured Supabase target is remote and QA should not mutate live farm data without a disposable test farm.

1. Owner adds female raised calf and verifies dehorning/milk reminders.
2. Owner adds male calf and verifies no milk feeding reminders are created.
3. Staff user opens calves page and cannot see add/edit/sell/convert controls.
4. Staff user attempts calf POST/PATCH API and receives 403.
5. Owner attempts future birth date and receives validation error.
6. Owner marks calf sold and verifies finance record plus monthly summary update.
7. Owner attempts future sold date and receives validation error.
8. Owner converts female calf to cow and verifies cow, AI record and reminders.
9. Owner attempts duplicate active tag during conversion and receives validation error.
10. Sold/dead/converted calf state transitions behave as expected.

## 7. Sprint 4 Open Items

1. Full browser role QA should be run on a disposable farm with owner and staff accounts.
2. Offline queued calf mutations need a conflict/retry UX review with the stricter API validations.
3. Calf reminder completion/snooze flows should be tested after real DB reminder creation.
4. Calf photo upload should be tested on Android and iPhone.

## 8. Exit Criteria

| Exit Criteria | Status |
| --- | --- |
| Calf mutations owner/admin-only | Pass |
| Calf lifecycle dates validated | Pass |
| Calf sale finance date safety improved | Pass |
| Calf-to-cow conversion validation improved | Pass |
| UI mutation controls permission-gated | Pass |
| Lint passes | Pass |
| Build passes | Pass |
| Non-destructive manual QA smoke complete | Pass |
| Full DB/browser role QA complete | Pending disposable-farm QA |
