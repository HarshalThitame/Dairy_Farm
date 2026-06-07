# Majhi Dairy Sprint 2 Execution Report

**Date:** 2026-06-07  
**Sprint:** Sprint 2 - Farm Management  
**Slice Completed:** Farm/Profile consistency and owner-controlled farm edits  
**Status:** Completed for code/build validation

## 1. Scope Executed

Sprint 2 started with the highest-risk farm management flows:

- Current farm API audit.
- Profile API audit.
- Profile page farm edit behavior audit.
- Location consistency for Ahilyanagar taluka/village dropdowns.
- Farm-wide edit permission checks.
- Profile-to-farm data synchronization.

## 2. Issues Found

| Severity | Issue | Risk |
| --- | --- | --- |
| High | Any authenticated farm user could update farm-wide name/location from profile save. | Farm staff could accidentally change official farm details. |
| Medium | Owner name changes in profile did not sync to `farms.owner_name`. | Admin/support farm details could show stale owner name. |
| Medium | `/api/farms/current` accepted Ahilyanagar location updates without validating taluka/village dropdown values. | Invalid location combinations could be stored. |
| Medium | `/api/farms/current` did not sync owner profile location after farm location updates. | Profile and farm pages could drift apart. |
| Low | Farm update payload did not trim string values. | Extra whitespace could be stored in farm data. |

## 3. Fixes Implemented

| Area | Fix |
| --- | --- |
| Profile API | Farm-wide fields now update only for farm owner/admin users. |
| Profile API | Non-owner users can update their own profile details without changing global farm data. |
| Profile API | When the actual farm owner changes their name, `farms.owner_name` is synced. |
| Current Farm API | String fields are trimmed before save. |
| Current Farm API | Ahilyanagar district updates validate taluka and village against the official dropdown data. |
| Current Farm API | Partial location updates are validated using current farm location context. |
| Current Farm API | Owner profile location is synced after farm location changes. |
| Profile UI | Farm name input is read-only for non-owner/non-admin users with a clear note. |

## 4. Files Updated

| File | Purpose |
| --- | --- |
| `app/api/profile/route.js` | Owner/admin-only farm-wide updates, owner name sync, safer audit fields. |
| `app/api/farms/current/route.js` | Location validation, string trimming, profile sync for farm updates. |
| `app/profile/page.js` | Farm name read-only state for users who cannot manage farm details. |

## 5. Validation Results

| Check | Command | Result |
| --- | --- | --- |
| ESLint | `npm run lint` | Passed. No ESLint warnings or errors. |
| Production build | `npm run build` | Passed. Next.js compiled successfully and generated 79 static pages. |
| Environment safety | `.env.local` inspection without printing secrets | Remote Supabase detected. DB mutation QA intentionally skipped. |
| API safety review | Code review of `/api/profile` and `/api/farms/current` | Non-owner farm-wide update path blocked by code. |
| UI safety review | Code review of `/profile` | Farm name input is disabled/read-only for non-owner/non-admin users. |

## 6. Remaining Manual QA

These require authenticated DB-backed testing. They were not executed automatically because the configured Supabase target is remote and QA should not mutate live farm data without a disposable test farm.

1. Farm owner updates farm name from `/profile`.
2. Farm owner updates Ahilyanagar taluka/village from `/profile`.
3. Farm owner updates farm location through `/api/farms/current` consumer screen, if used.
4. Staff user opens `/profile` and confirms farm name is read-only.
5. Staff user saves own profile and confirms `farms` row is unchanged.
6. Owner name update reflects in admin farm details.
7. Invalid Ahilyanagar taluka/village combination is rejected.

## 7. Sprint 2 Open Items

The first Sprint 2 slice is complete. Remaining Farm Management work for later slices:

1. Dedicated farm settings UI audit, if any active screen uses `/api/farms/current`.
2. Farm member management and worker permissions.
3. Farm location language translation coverage.
4. Admin farm details consistency regression.
5. DB-level constraints/RLS review for farm updates.

## 8. Exit Criteria

| Exit Criteria | Status |
| --- | --- |
| Farm profile permissions reviewed | Pass |
| Non-owner farm edit protection implemented | Pass |
| Owner farm/profile sync improved | Pass |
| Ahilyanagar location validation improved | Pass |
| Lint passes | Pass |
| Build passes | Pass |
| Full DB/browser role QA complete | Pending manual QA |
