# Majhi Dairy Sprint 10 Execution Report

**Date:** 2026-06-07  
**Sprint:** Sprint 10 - Reports & Analytics  
**Slice Started:** Reports data-integrity, date handling and final settlement total clarity  
**Status:** Manual QA smoke completed and fixes applied

## 1. Scope Executed

Sprint 10 started after Sprint 9 AI Assistant manual QA smoke. This slice focuses on report correctness because milk, income, expense and profit reports are used for farmer decisions.

- Milk report API review.
- Finance/profit report API review.
- Annual report API review.
- Vaccination report date-status review.
- Ahval report page navigation and month/year query review.
- Settlement final total vs daily OCR row audit wording review.

## 2. Issues Found

| Severity | Issue | Risk |
| --- | --- | --- |
| Medium | Report pages accepted invalid `month`/`year` URL query values into client state before API validation. | Broken external/cross links could show unnecessary report errors instead of falling back to the current India month. |
| Medium | Milk report showed "सर्वाधिक दूध" from daily row data even when monthly final total was settlement-printed total. | Farmer could mistake audit rows for final settlement truth. |
| Medium | Cow performance and print report fetched all-time AI/calving records even when a month was selected. | Monthly cow performance counts could show wrong reटन/व्यायण totals. |
| Low | Annual report API default year used server-local year. | Default annual report could be off around year boundary on non-India hosting regions. |
| Low | Vaccination status helper used server-local date. | Due/overdue status could be off around midnight on non-India hosting regions. |
| Low | A few farmer-facing report labels still used English-heavy terms such as `Daily rows` / `Final settlement total`. | The report could feel unclear for Marathi-first users. |

## 3. Fixes Implemented

| Area | Fix |
| --- | --- |
| Shared report dates | Added report month/year sanitizer helpers in `lib/reportUtils.js`. |
| Month selector | `MonthSelector` now normalizes invalid values before rendering, shifting or applying. |
| Report pages | Milk, income, expense, profit, full-accounting, print and cow-performance pages now sanitize URL month/year values. |
| Annual report | Annual page and annual API now use India date context for default year behavior. |
| Milk report clarity | Milk API marks best/worst day and daily data as audit data when final totals come from settlement printed totals. |
| Milk report UI | Milk report labels now clearly state when daily rows are only for checking and final totals come from settlement slip printed totals. |
| Cow performance | `/api/ai` and `/api/calving` now support safe `from`/`to` filters, and cow performance/print reports use the selected month range. |
| Print report | Printed monthly cow performance now uses month-scoped AI/calving counts and labels daily-audit best-day correctly. |
| Marathi UX | Farmer-facing milk report labels were cleaned up to avoid mixed English in final/audit explanations. |
| Vaccination report status | Vaccination status now uses India today date from `getTodayISODate()`. |

## 4. Files Updated

| File | Purpose |
| --- | --- |
| `lib/reportUtils.js` | Add shared report date sanitizers and India-date vaccination status. |
| `components/MonthSelector.js` | Guard shared month selector against invalid state. |
| `app/api/reports/milk/route.js` | Add daily audit source metadata for settlement-backed reports. |
| `app/api/reports/annual/route.js` | Use India year for annual API default. |
| `app/api/ai/route.js` | Add date range filters for month-scoped report usage. |
| `app/api/calving/route.js` | Add date range filters for month-scoped report usage. |
| `app/ahval/dudh/page.js` | Clarify settlement final totals vs daily row audit data. |
| `app/ahval/utpanna/page.js` | Sanitize report month/year query values. |
| `app/ahval/kharch/page.js` | Sanitize report month/year query values. |
| `app/ahval/nafa/page.js` | Sanitize report month/year query values. |
| `app/ahval/hishob/page.js` | Sanitize report month/year query values. |
| `app/ahval/chapa/page.js` | Sanitize report month/year query values. |
| `app/ahval/chapa/PrintableReport.js` | Label settlement-backed best-day as daily row audit data when printing. |
| `app/ahval/gaykamgiri/page.js` | Sanitize report month/year query values. |
| `app/ahval/varshik/page.js` | Sanitize report year query values. |
| `docs/project/sprint10/Sprint10_Execution_Report.md` | Sprint 10 execution tracking. |

## 5. Validation Results

| Check | Command / Method | Result |
| --- | --- | --- |
| Milk report source audit | Code review of settlement printed total summary and daily row usage | Passed after source-label fix. |
| Finance report formula audit | Code review of milk income, deductions, monthly expenses and annual expenses | Passed. |
| Annual report formula audit | Code review of month rows, total expenses and dairy deductions | Passed. |
| URL query robustness | Code review of report pages and `MonthSelector` | Passed after sanitizer fix. |
| Monthly cow performance audit | Code review of AI/calving data source for selected month | Passed after API range-filter fix. |
| India date robustness | Code review of annual default year and vaccination status date | Passed after India-date fix. |
| Whitespace check | `git diff --check` on Sprint 10/11 modified files | Passed. |
| ESLint | `npm run lint` | Passed. |
| Production build | `npm run build` | Passed. |

## 6. Remaining Manual QA

These require an authenticated farm with report data.

1. Open `/ahval/dudh?month=abc&year=x` and verify it falls back to the current India month.
2. Open `/ahval/utpanna`, `/ahval/kharch`, `/ahval/nafa`, `/ahval/hishob`, `/ahval/chapa` with invalid month/year and verify no client-side crash.
3. Open a month with a 15-day settlement and verify total milk uses settlement printed morning + evening totals.
4. Verify daily chart and best-day card are labeled as daily-row audit when settlement totals are final.
5. Verify income report milk income matches settlement total income.
6. Verify expense report monthly expense includes settlement khadya deduction and manual monthly feed expenses.
7. Verify annual report total expense includes monthly + annual + dairy deductions in summary cards.
8. Verify vaccination due/overdue status around current India date.
9. Verify `/ahval/gaykamgiri` reटन/व्यायण counts change when switching months.
10. Generate print report and verify cow performance uses the selected month only.

## 7. Sprint 10 Open Items

1. Add automated report API tests with fixture settlement totals and conflicting daily rows.
2. Add browser screenshot QA for report pages on small iPhone and Android widths.
3. Add export/print report regression tests once print testing harness is available.
4. Continue Sprint 10 with report export, print and chart QA.

## 8. Exit Criteria Progress

| Exit Criteria | Status |
| --- | --- |
| Reports API data-source audit started | Pass |
| Month/year query robustness improved | Pass |
| Settlement final total clarity improved | Pass |
| Finance report formula reviewed | Pass |
| Lint passes | Pass |
| Build passes | Pass |
| Full DB/browser report QA complete | Pending disposable-farm QA |
| Sprint 10 manual QA smoke complete | Pass |
