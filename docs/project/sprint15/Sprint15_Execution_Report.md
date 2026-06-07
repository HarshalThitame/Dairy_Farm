# Majhi Dairy Sprint 15 Execution Report

**Date:** 2026-06-07  
**Sprint:** Sprint 15 - Security Hardening  
**Slice Started:** Authentication secret hardening, admin/session security scan and production readiness checks  
**Status:** Sprint 15 manual QA code audit completed; security defects fixed; browser abuse testing recommended

## 1. Scope Covered

Sprint 15 starts with authentication and session security because these controls protect every farm, admin action and financial record.

- Farm user JWT signing and verification guard review.
- Super admin JWT signing and verification guard review.
- Production fallback secret scan.
- Unsafe client execution pattern scan.
- Public API guard scan.
- PIN brute-force protection review.
- Upload size/type validation review.
- Environment presence check without printing secret values.
- Lint/build validation after security hardening.

## 2. Issues Found

| Severity | Issue | Risk |
| --- | --- | --- |
| High | Farm user auth guard used a hardcoded local fallback JWT secret when `JWT_SECRET` was missing. | A production deployment with a missing env var could accidentally sign/verify tokens using a predictable default secret. |
| High | Super admin auth guard used a hardcoded local fallback JWT secret when both `SUPER_ADMIN_JWT_SECRET` and `JWT_SECRET` were missing. | A production deployment with missing admin secrets could weaken super admin session security. |
| Low | `SUPER_ADMIN_JWT_SECRET` is missing in local `.env.local`; local runtime currently falls back to `JWT_SECRET`. | Acceptable for local development, but production should define a dedicated admin secret. |
| High | Farm user PIN login had only client-side wrong-attempt blocking. | Direct API calls could brute-force a 4-digit PIN without a server-side lockout. |
| Medium | Animal photo upload had no original file-size cap before server-side image processing. | Large uploads could waste memory/CPU during image compression. |

## 3. Fixes Implemented

| Area | Fix |
| --- | --- |
| Farm user JWT secret handling | Production now requires `JWT_SECRET`; the local fallback is only allowed outside production. |
| Super admin JWT secret handling | Production now requires `SUPER_ADMIN_JWT_SECRET` or `JWT_SECRET`; the local fallback is only allowed outside production. |
| Build safety | Secret validation happens at request/signing time so static build does not fail when local development env is incomplete. |
| Farm user PIN brute-force protection | `/api/auth/login` now blocks login for 15 minutes after 5 recent wrong PIN attempts recorded in `user_login_history`. |
| Animal photo upload hardening | `/api/animal-photos` now rejects original images larger than 8 MB before compression. |

## 4. Files Updated

| File | Purpose |
| --- | --- |
| `lib/farmGuard.js` | Farm user JWT runtime secret enforcement. |
| `lib/superAdminGuard.js` | Super admin JWT runtime secret enforcement. |
| `app/api/auth/login/route.js` | Server-side PIN lockout using recent failed login history. |
| `app/api/animal-photos/route.js` | Original upload size cap before image processing. |
| `docs/project/sprint15/Sprint15_Execution_Report.md` | Sprint 15 execution tracking. |

## 5. Validation Results

| Check | Command / Method | Result |
| --- | --- | --- |
| Env presence check | Checked `.env.local` for `JWT_SECRET` and `SUPER_ADMIN_JWT_SECRET` without printing values | `JWT_SECRET` present; `SUPER_ADMIN_JWT_SECRET` missing locally. |
| Fallback secret scan | `rg "local-dev-secret|change-before-production|JWT_SECRET \\|\\|" lib app` | Local fallback remains only behind non-production runtime guards. |
| Unsafe client execution scan | `rg "dangerouslySetInnerHTML|eval|new Function|innerHTML|document.cookie"` | No dynamic `eval`/`new Function`; layout inline script is static appearance bootstrap; cookie access is session utility usage. |
| API guard scan | Listed routes without farm/admin guards | Expected public auth routes and cron-only auto-run route only; OCR routes are guarded. |
| Whitespace check | `git diff --check` on Sprint 15/16 modified files | Passed. |
| ESLint | `npm run lint` | Passed. |
| Production build | `npm run build` | Passed; 79 static pages generated. |

## 6. Sprint 15 Open Items

1. Add `SUPER_ADMIN_JWT_SECRET` to production and local env for secret separation.
2. Add automated tests for missing production secrets in farm and super admin guards.
3. Add broader API rate limiting for mobile lookup and OCR-heavy routes.
4. Continue RLS/API authorization checks against production Supabase policies.

## 7. Exit Criteria Progress

| Exit Criteria | Status |
| --- | --- |
| Sprint 15 started | Pass |
| JWT production fallback removed | Pass |
| Unsafe execution pattern scan complete | Pass |
| Server-side PIN lockout added | Pass |
| Upload original-size cap added | Pass |
| Lint passes | Pass |
| Build passes | Pass |
| Full Sprint 15 security code audit complete | Pass |
