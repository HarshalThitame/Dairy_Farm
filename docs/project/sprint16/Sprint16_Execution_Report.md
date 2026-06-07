# Majhi Dairy Sprint 16 Execution Report

**Date:** 2026-06-07  
**Sprint:** Sprint 16 - Performance Optimization  
**Slice Started:** Dashboard/API payload audit, heavy route scan and first payload reduction  
**Status:** Sprint 16 manual QA code audit completed; safe payload optimizations applied

## 1. Scope Started

Sprint 16 focuses on making high-traffic pages faster without changing business logic.

- Home dashboard API and cache behavior review.
- Build output route-size review.
- Heavy `select("*")` route scan.
- Profile statistics API payload optimization.
- Profile API payload optimization.
- Cow list API payload optimization.
- Lint/build validation after performance patch.

## 2. Issues Found

| Severity | Issue | Risk |
| --- | --- | --- |
| Medium | Profile statistics API loaded the full farm row using `select("*")`. | Extra database payload and serialization cost on a statistics page that already performs analytics work. |
| Medium | Profile API loaded the full farm/profile rows although the profile page only needs a subset. | Extra database payload on a frequently opened settings/profile path. |
| Medium | Cow list API loaded full cow rows for the listing page. | Larger response payload and slower cow list rendering as farms grow. |

## 3. Fixes Implemented

| Area | Fix |
| --- | --- |
| Profile statistics payload | `/api/profile/statistics` now selects only farm columns needed by `normalizeFarm`/PDF output instead of all columns. |
| Profile payload | `/api/profile` now selects only the farm/profile columns used by the profile UI and response normalizers. |
| Cow list payload | `/api/cows` now selects only list-card and instant-cache fields for active cows. |

## 4. Files Updated

| File | Purpose |
| --- | --- |
| `app/api/profile/statistics/route.js` | Narrow farm SELECT columns for faster statistics responses. |
| `app/api/profile/route.js` | Narrow farm/profile SELECT columns for faster profile responses. |
| `app/api/cows/route.js` | Narrow active cow list SELECT columns for faster cow list loading. |
| `docs/project/sprint16/Sprint16_Execution_Report.md` | Sprint 16 execution tracking. |

## 5. Validation Results

| Check | Command / Method | Result |
| --- | --- | --- |
| Heavy query scan | `rg "select(\"*\")"` across dashboard/profile/cow/admin routes | High-confidence profile/statistics/cow list payload issues fixed; admin farm details remains intentionally broad for monitoring dashboard. |
| Whitespace check | `git diff --check` on Sprint 16/17 modified files | Passed. |
| ESLint | `npm run lint` | Passed. |
| Production build | `npm run build` | Passed; 79 static pages generated. |

## 6. Sprint 16 Open Items

1. Measure real dashboard API response time with authenticated farm data.
2. Add request-level timing logs for `/api/dashboard`, `/api/profile/statistics` and admin farm details.
3. Continue replacing broad selects in analytics routes where UI does not need all columns.
4. Review bundle-heavy routes from build output, especially `/profile/statistics`, `/admin/farms/[id]` and `/admin/analytics`.

## 7. Exit Criteria Progress

| Exit Criteria | Status |
| --- | --- |
| Sprint 16 started | Pass |
| First payload optimization applied | Pass |
| Profile/statistics payload optimized | Pass |
| Cow list payload optimized | Pass |
| Lint passes | Pass |
| Build passes | Pass |
| Full Sprint 16 performance code audit complete | Pass |
