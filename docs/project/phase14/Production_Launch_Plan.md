# Majhi Dairy Production Launch Plan

**Date:** 2026-06-07

## 1. Launch Timeline

| Period | Activities |
| --- | --- |
| T-14 days | Code freeze candidate, UAT execution, security/performance checks |
| T-7 days | Final regression, data backup validation, support readiness |
| T-2 days | Go/no-go review, production migration dry run, rollback confirmation |
| Launch Day | Deploy, smoke test, monitor, support war room |
| T+7 days | Hypercare review and priority fixes |
| T+30 days | Adoption, stability and success metrics review |

## 2. Pre-Launch Checklist

- Production environment configured.
- Supabase RLS and storage policies verified.
- Secrets and provider keys configured server-side only.
- Database migration and rollback reviewed.
- Backup/restore validation completed.
- QA, UAT, security and technical sign-offs collected.
- Support and admin teams trained.

## 3. Launch-Day Activities

1. Confirm code freeze and release tag.
2. Create production backup.
3. Apply migrations.
4. Deploy application.
5. Run smoke tests: auth, dashboard, cow, milk, reminders, accounting, OCR, AI, notifications, admin.
6. Monitor logs, provider errors, database performance and support tickets.
7. Communicate launch status.

## 4. Rollback Process

Rollback is triggered for data corruption, login outage, cross-farm access risk, production-wide crash or unrecoverable provider misconfiguration. Rollback owner must preserve logs and incident evidence before reverting.

## 5. Hypercare Support

- Day 0-7: daily triage and rapid fixes.
- Day 8-30: weekly release train and adoption monitoring.
- 30-day success plan: measure active farms, milk records, OCR usage, AI usage, support volume and defect escape rate.
