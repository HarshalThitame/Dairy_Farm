# Majhi Dairy Sprint 17 Execution Report

**Date:** 2026-06-07  
**Sprint:** Sprint 17 - Bug Fixes and Regression  
**Slice Started:** Regression pass after Sprint 16 performance changes  
**Status:** Sprint 17 regression pass completed; Sprint 18 handoff ready

## 1. Scope Started

Sprint 17 focuses on catching regressions introduced by recent security/performance changes and validating critical user paths.

- Regression scan of Sprint 15/16 touched routes.
- Schema compatibility review for narrowed SELECT column lists.
- Authentication/session and profile route sanity checks.
- Lint/build validation after fixes.

## 2. Issues Found

| Severity | Issue | Risk |
| --- | --- | --- |
| High | The first profile payload optimization included a `user_profiles.full_name` column that does not exist in the current migration set. | `/api/profile` could fail at runtime with a database column error. |
| Medium | The first profile payload optimization selected `user_profiles.language`, which may be absent on databases where the latest language migration has not been applied. | Existing deployments without Phase 52 could fail when opening Profile. |
| High | `fetchCowProfile()` expected a direct cow profile object while `/api/cows/[id]` returns it under `data` and `fetchJson()` already unwraps one response level. | Cow detail and reminder detail screens could show instant cached data only or empty records after background refresh. |

## 3. Fixes Implemented

| Area | Fix |
| --- | --- |
| Profile schema compatibility | Removed non-required `full_name` and `language` from `/api/profile` profile SELECT list. |
| Regression prevention | Kept `/api/profile` response fields aligned with fields actually used by the profile UI. |
| Cow profile response normalization | Updated `fetchCowProfile()` to accept the current cow profile shape safely and cache the real cow/records payload. |

## 4. Files Updated

| File | Purpose |
| --- | --- |
| `app/api/profile/route.js` | Schema-compatible narrow profile SELECT. |
| `lib/offlineActions.js` | Fixed cow profile response normalization for cow detail/reminder detail flows. |
| `docs/project/sprint17/Sprint17_Execution_Report.md` | Sprint 17 execution tracking. |

## 5. Validation Results

| Check | Command / Method | Result |
| --- | --- | --- |
| Schema scan | Compared narrowed profile SELECT columns against Supabase migration files | Fixed missing-column risk before build validation. |
| Consumer review | Checked cow list, cow detail, edit page and reminder detail consumers against API response shapes | Fixed nested cow profile shape mismatch. |
| Whitespace check | `git diff --check` on Sprint 16/17 modified files | Passed. |
| ESLint | `npm run lint` | Passed. |
| Production build | `npm run build` | Passed; 79 static pages generated. |

## 6. Sprint 17 Open Items

1. Browser smoke for login, profile, cow list, cow detail, dashboard and notifications should be repeated during Sprint 18 UAT.
2. Add automated regression tests around `/api/profile` response shape and cow profile loading when a test harness is introduced.

## 7. Exit Criteria Progress

| Exit Criteria | Status |
| --- | --- |
| Sprint 17 started | Pass |
| First regression fixed | Pass |
| Lint passes | Pass |
| Build passes | Pass |
| Full Sprint 17 regression complete | Pass |
