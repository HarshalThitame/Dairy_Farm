# Majhi Dairy Sprint 20 Execution Report

**Date:** 2026-06-07  
**Sprint:** Sprint 20 - Production Launch  
**Status:** Local manual QA pass completed; production/device QA pending  

## 1. Sprint Objective

Sprint 20 is the production launch sprint. The goal is to deploy the release candidate, verify real-device behavior, validate core financial/OCR workflows on production-like data, and complete go/no-go approval.

## 2. Launch Scope

| Area | Launch Validation |
| --- | --- |
| Deployment | Deploy latest build to production and verify route availability. |
| Environment | Confirm production env variables in Vercel/Supabase/Google/OpenAI. |
| Database | Verify required Supabase migrations and storage buckets. |
| PWA | Install app on Android and iPhone; verify service worker and offline shell. |
| Authentication | Login, logout, session refresh and admin session expiry redirect. |
| Push Notifications | Register device, send admin notification and verify mobile notification panel delivery. |
| OCR | Upload one daily slip and one 15-day settlement slip; verify user review before save. |
| Financial Accuracy | Reconcile milk, feed deduction, expense, income and profit/loss against known records. |
| Reminders | Complete/snooze a pregnancy/reminder flow and verify no stale duplicate remains. |
| Admin | Farm details, subscription action, device visibility, notification center and support views. |

## 3. Production Launch Checklist

| ID | Check | Status |
| --- | --- | --- |
| LAUNCH20-001 | Final `npm run lint` pass | Pass |
| LAUNCH20-002 | Final `npm run build` pass | Pass; 79 pages generated |
| LAUNCH20-003 | Vercel env variables verified | Local env coverage pass; actual Vercel values pending |
| LAUNCH20-004 | Supabase migrations verified | Migration inventory pass; production DB status pending |
| LAUNCH20-005 | Storage buckets verified | Bucket names documented; production bucket existence pending |
| LAUNCH20-006 | Production deploy completed | Pending |
| LAUNCH20-007 | Android smoke pass | Pending physical device |
| LAUNCH20-008 | iPhone smoke pass | Pending physical device |
| LAUNCH20-009 | Push notification delivered to phone panel | Pending production HTTPS + device |
| LAUNCH20-010 | Daily slip OCR save verified | Pending real sample |
| LAUNCH20-011 | 15-day settlement OCR save verified | Pending real sample |
| LAUNCH20-012 | Financial report reconciliation verified | Pending production sample data |
| LAUNCH20-013 | Admin farm/subscription actions verified | Code path pass; production user notification pending |
| LAUNCH20-014 | Rollback target identified | Pending |
| LAUNCH20-015 | Go/no-go decision recorded | Pending |

## 4. Required Production Environment Variables

| Category | Variables |
| --- | --- |
| Supabase | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` |
| Auth | `JWT_SECRET`, `SUPER_ADMIN_JWT_SECRET`, `SUPER_ADMIN_EMAILS`, `BCRYPT_ROUNDS` |
| AI/OCR | `OPENAI_API_KEY`, `GOOGLE_VISION_API_KEY`, OpenAI model variables |
| Push | `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` |
| Cron | `CRON_SECRET`, `ACHIEVEMENT_CRON_SECRET`, `EXPORT_BACKUP_CRON_SECRET` |
| Storage | `SUPABASE_STORAGE_BUCKET`, `ANIMAL_PHOTOS_BUCKET`, `PROFILE_PHOTOS_BUCKET` |
| Support/PWA | `NEXT_PUBLIC_APP_VERSION`, `NEXT_PUBLIC_PWA_VERSION`, support contact variables |

## 5. Go/No-Go Rules

Production launch is **No-Go** if any of these fail:

1. Build or lint fails.
2. Production JWT secrets are missing.
3. Supabase service role key is missing.
4. Required migrations are not applied.
5. Login fails on Android or iPhone.
6. Settlement financial totals do not reconcile.
7. Push notification cannot be delivered after permission is granted.
8. OCR saves financial data without user review.

## 6. Rollback Notes

1. Keep the previous Vercel deployment available for instant rollback.
2. Do not run irreversible destructive SQL during launch.
3. If a migration fails, stop deployment and restore the previous deployment.
4. If push/OCR provider fails, keep app live only if manual entry remains functional and users are informed.
5. Financial data defects block launch until corrected and reconciled.

## 7. Initial Sprint 20 Status

| Item | Status |
| --- | --- |
| Sprint 20 started | Pass |
| Launch checklist created | Pass |
| Go/no-go rules documented | Pass |
| Final local validation | Pass |

## 8. Sprint 20 Manual QA Evidence

| Check | Result | Evidence |
| --- | --- | --- |
| Env coverage | Pass | Every app-referenced env variable is represented in `.env.local.example` except platform-provided `NODE_ENV`. |
| Google Vision auth mode | Pass | `@google-cloud/vision` is not installed and no service-account JSON file was found. |
| PWA assets | Pass | `manifest.json`, `sw.js`, `push-sw.js`, `sw-sync.js`, 192/512 icons and Apple icon are present. |
| Production local server | Pass | `next start` served on local port 3050 after build. |
| Login page smoke | Pass | `GET /login` returned `200 text/html`. |
| Signup page smoke | Pass | `GET /signup` returned `200 text/html`. |
| Admin login smoke | Pass | `GET /admin-login` returned `200 text/html`. |
| Slip scan route smoke | Pass | `GET /accounting/slip-scan` returned `200 text/html`. |
| Cow list route smoke | Pass | `GET /gayi` returned `200 text/html`. |
| Settings notifications route smoke | Pass | `GET /settings/notifications` returned `200 text/html`. |
| Manifest smoke | Pass | `GET /manifest.json` returned `200 application/json`. |
| Service worker smoke | Pass | `GET /sw.js` and `GET /push-sw.js` returned `200 application/javascript`. |
| Icon smoke | Pass | `GET /icons/icon-192x192.png` returned `200 image/png`. |
| Protected push status unauthenticated | Pass | `GET /api/notifications/push-status` returned `401`, expected without login token. |

## 9. Sprint 20 QA Findings

No local launch-blocking code defect was found in this pass.

## 10. Remaining Launch Blockers

| Blocker | Required Action |
| --- | --- |
| Production env secrets | Verify actual Vercel values for Supabase, JWT, OpenAI, Google Vision, VAPID and cron secrets. |
| Production database | Confirm all required Supabase migrations through `phase52` and fix scripts are applied. |
| Storage buckets | Confirm `dairy-slips`, `animal-photos` and `profile-photos` buckets exist with correct access. |
| Real mobile PWA | Install and smoke test on Android and iPhone over HTTPS. |
| Real push notification | Grant permission, register subscription, send admin notification and verify phone notification panel. |
| OCR billing/API | Confirm Google Vision billing/API key and OpenAI key are active. |
| Financial reconciliation | Process one daily slip and one 15-day settlement slip; verify reports against known totals. |
