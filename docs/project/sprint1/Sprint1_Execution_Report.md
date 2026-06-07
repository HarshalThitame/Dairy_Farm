# Majhi Dairy Sprint 1 Execution Report

**Date:** 2026-06-07  
**Sprint:** Sprint 1 - Authentication and Language Selection  
**Status:** Completed for code/build validation

## 1. Scope Executed

Sprint 1 focused on the first user entry flow and language preference stability.

Executed items:

- Reviewed signup onboarding language step.
- Reviewed login and token verification flow.
- Verified first-time language selection is present before signup data entry.
- Added language/appearance preference propagation to auth responses.
- Applied preferences immediately in the frontend auth session.
- Preserved backward compatibility when preference tables are unavailable.
- Ran non-destructive browser QA for signup language selection.
- Ran lint and production build validation.

## 2. Functional Changes

| Area | Change |
| --- | --- |
| Signup API | Signup now returns normalized `preferences` with selected language. |
| Login API | Login now returns the user's saved appearance/language preferences. |
| Verify API | Session verification now returns appearance/language preferences. |
| Auth context | Login, signup and verify now apply preferences immediately after session creation. |
| Settings helper | Added safe preference loading with fallback to default Marathi/light settings. |

## 3. Language Flow Validation

| Scenario | Expected Result | Status |
| --- | --- | --- |
| New user opens signup | Language selection appears first | Pass by code review |
| User selects Marathi | App applies Marathi immediately and stores it | Pass by code review |
| User selects English | App applies English immediately and stores it | Pass by code review |
| Signup completes | Selected language saved in `appearance_preferences` and profile where supported | Pass by code review |
| Existing user logs in | Saved language preference is returned and applied | Implemented |
| Session refresh/verify | Saved language preference is returned and applied | Implemented |
| Missing/old preference schema | Login/signup should not fail; default fallback applies | Implemented |
| Browser signup language selection | English selection switches to mobile step with `html lang=en-IN` and stored language `en` | Pass |

## 4. Files Updated

| File | Purpose |
| --- | --- |
| `app/api/auth/signup/route.js` | Normalize selected language, persist signup appearance preference, return preferences in auth response. |
| `app/api/auth/login/route.js` | Load and return safe appearance preferences after successful login. |
| `app/api/auth/verify/route.js` | Load and return safe appearance preferences during token verification. |
| `context/AuthContext.js` | Apply auth response preferences immediately after login/signup/verify. |
| `lib/userSettings.js` | Add safe appearance preference helper with default fallback. |

## 5. Validation Results

| Check | Command | Result |
| --- | --- | --- |
| ESLint | `npm run lint` | Passed. No ESLint warnings or errors. |
| Production build | `npm run build` | Passed. Next.js compiled successfully and generated 79 static pages. |
| Browser QA | Playwright signup flow on `localhost:3000/signup` | Passed. No database writes. |

## 6. Remaining Manual QA

These should still be checked with a real Supabase database:

1. New user signup with Marathi selected.
2. New user signup with English selected.
3. Logout/login language persistence.
4. Browser refresh language persistence.
5. Existing user without `appearance_preferences` row gets Marathi default and can continue login.
6. iPhone Safari and Android Chrome login/session regression.

## 7. Known Project Risks Still Open

These are inherited from Sprint 0 and not solved in Sprint 1:

1. Dependency audit still needs a separate hardening task.
2. Remote Supabase migration applied-state still needs confirmation.
3. Worktree contains many existing uncommitted/generated files outside Sprint 1 scope.
4. Production secrets and cron/admin/VAPID settings need final environment verification.

## 8. Sprint 1 Exit Criteria

| Exit Criteria | Status |
| --- | --- |
| Signup language step exists | Pass |
| Selected language included in signup payload | Pass |
| Language saved server-side | Pass |
| Login returns saved preference | Pass |
| Verify returns saved preference | Pass |
| Frontend applies returned preference | Pass |
| Non-destructive browser QA | Pass |
| Lint passes | Pass |
| Build passes | Pass |
| Full DB/browser/device QA complete | Pending manual QA |

## 9. Sprint 2 Recommendation

Next sprint should begin with Farm Management and location/profile consistency.

Before starting broad Sprint 2 changes, first run the Sprint 1 manual QA checklist on:

- Android Chrome
- iPhone Safari
- Desktop Chrome
