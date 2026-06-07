# Majhi Dairy Sprint 18 Execution Report

**Date:** 2026-06-07  
**Sprint:** Sprint 18 - UAT Support  
**Status:** Code-level UAT support pass completed; Sprint 19 handoff ready  

## 1. Sprint Objective

Sprint 18 focuses on UAT support: validating real farmer workflows end to end, confirming Sprint 15-17 fixes under production-like usage, and preparing release-readiness evidence.

## 2. UAT Scope Started

| Area | UAT Focus |
| --- | --- |
| Authentication | PIN login, lockout after repeated wrong PIN, session refresh, iPhone fallback behavior. |
| Profile and Settings | Profile load/save, farm name/location updates, language/theme persistence. |
| Cow Management | Cow list load speed, instant cow detail navigation, edit flow, inactive cow handling. |
| Reminders | Pregnancy check, calf care, snooze/complete actions, hidden resolved reminders. |
| Accounting | Milk entries, feed expenses, settlement totals, monthly profit accuracy. |
| Slip Scan | Daily slip upload, 15-day settlement upload, preview, correction and save. |
| Reports | Monthly milk, income, expenses, profit/loss and settlement report alignment. |
| Notifications | In-app inbox, push subscription state, read/delete actions. |
| Admin | Farm details, user/session visibility, subscription actions and notifications. |

## 3. Critical UAT Scenarios

| ID | Scenario | Expected Result |
| --- | --- | --- |
| UAT18-001 | Login with valid PIN on Android and iPhone. | User reaches dashboard; selected language/theme are applied. |
| UAT18-002 | Enter wrong PIN five times. | Login is blocked for 15 minutes with a clear message. |
| UAT18-003 | Open cow list and tap a cow immediately. | Cow detail opens quickly and then refreshes full records without losing data. |
| UAT18-004 | Edit profile location for Ahilyanagar district. | Taluka and village dropdown validation works and farm/profile data stays consistent. |
| UAT18-005 | Add feed expense from records. | Expense appears in monthly expense/profit calculations for the correct month. |
| UAT18-006 | Save 15-day settlement. | Slip summary totals drive milk, income and feed deduction reports. |
| UAT18-007 | Delete settlement. | Related monthly report values update after refresh. |
| UAT18-008 | Complete/snooze pregnancy check reminder. | Correct reminder action succeeds; no stale duplicate reminder remains. |
| UAT18-009 | Upload daily slip from camera and gallery. | Clear image is accepted; extracted values are reviewable before save. |
| UAT18-010 | Admin opens farm details. | No farm ID error; analytics are farm-isolated and actions are protected. |

## 4. Regression Handoff From Sprint 17

| Regression Item | Sprint 18 Verification Needed |
| --- | --- |
| `/api/profile` schema-compatible SELECT | Open profile on existing production data and save editable fields. |
| `/api/profile/statistics` optimized farm SELECT | Open statistics page and download/share report. |
| `/api/cows` optimized cow list | Load list, search/filter, then open details. |
| `fetchCowProfile()` response normalization | Detail page and reminder detail page should show full cow records after refresh. |
| PIN lockout | Wrong PIN attempts should lock only the targeted account and not block valid users. |
| Production JWT secret hardening | Production env must have `JWT_SECRET` and admin secret configured before deployment. |

## 5. Current Sprint 18 Status

| Item | Status |
| --- | --- |
| Sprint 18 started | Pass |
| UAT scope created | Pass |
| Critical scenario checklist created | Pass |
| Code-level manual QA pass | Pass |
| Browser/device execution | Pending for physical Android/iPhone UAT |
| UAT sign-off | Ready for stakeholder/device execution |

## 6. Manual QA Results

| Scenario | Result | Notes |
| --- | --- | --- |
| UAT18-001 Login/session | Pass | Auth context stores token in localStorage and cookie; iPhone fallback path keeps cached user/farm if verify temporarily fails. |
| UAT18-002 PIN lockout | Pass | Server counts recent wrong PIN attempts and returns 429 after configured threshold. |
| UAT18-003 Cow instant detail | Pass | Sprint 17 cow profile shape fix verified against cow list, cow detail, edit and reminder detail consumers. |
| UAT18-004 Profile location | Pass | Profile API validates Ahilyanagar taluka/village dropdown values before saving farm/profile location. |
| UAT18-005 Feed expense monthly impact | Pass | Feed expense paths use finance/accounting summaries and clear cached GET data on mutation. |
| UAT18-006 Settlement save | Pass | Settlement save refreshes month summary and uses settlement summary totals for final accounting. |
| UAT18-007 Settlement delete | Pass | Delete removes generated settlement slips, recomputes affected milk records and refreshes month summaries. |
| UAT18-008 Reminder actions | Pass | Reminder detail uses normalized cow profile data and resolved reminder filters are applied. |
| UAT18-009 Slip upload preview | Pass | Upload/extract/save routes compile; user review remains required before final save. |
| UAT18-010 Admin farm details | Pass | Farm ID is encoded for API calls; admin 401 interceptor redirects to login instead of showing raw session errors. |

## 7. Defects Found In Sprint 18

No new code defects were found during this pass after the Sprint 17 cow profile response-shape fix. Remaining validation is physical browser/device UAT.

## 8. Validation Evidence

| Check | Result |
| --- | --- |
| `git diff --check` | Pass |
| `npm run lint` | Pass |
| `npm run build` | Pass; 79 pages generated |

## 9. Notes

- No code should be auto-saved during UAT flows without user confirmation.
- Financial UAT must compare UI values against database records and slip summary totals.
- iPhone Safari/PWA testing must be included because previous session issues were platform-specific.
