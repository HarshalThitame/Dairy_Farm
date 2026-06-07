# Majhi Dairy Incident Response Plan

**Document Version:** 1.0  
**Date:** 2026-06-07

## 1. Objective

Provide a repeatable process to identify, contain, eradicate, recover from and learn from security incidents affecting Majhi Dairy.

## 2. Incident Severity Levels

| Severity | Definition | Examples | Target Response |
| --- | --- | --- | --- |
| Critical | Active breach, data leak, financial data tampering or platform-wide outage | Cross-farm data leak, service role exposure, backup leak | Immediate response; executive notification |
| High | High-risk vulnerability or major tenant impact | Admin misuse, OCR/report private URL exposure | Same business day |
| Medium | Limited impact or contained issue | Single account compromise, suspicious rate limit event | 2 business days |
| Low | Low-risk event or policy deviation | Minor misconfiguration without exposure | 5 business days |


## 3. Response Phases

1. Preparation: owners, access, runbooks, backups and communication templates ready.
2. Identification: alerts, user reports, logs and anomaly detection.
3. Containment: revoke sessions/keys, disable affected feature, block abusive IP/token.
4. Eradication: patch vulnerability, rotate secrets, remove malicious files.
5. Recovery: restore service, verify data integrity and monitor.
6. Post-incident review: root cause, timeline, lessons, corrective actions.

## 4. Escalation Matrix

| Incident Type | Primary Owner | Escalation |
| --- | --- | --- |
| Data leak / RLS failure | Security Architect | Founder, Engineering Lead, Legal/Compliance |
| Financial tampering | Engineering Lead | Product Owner, Security, affected farm owner |
| Provider key exposure | DevOps/Security | Engineering Lead, provider support |
| AI/OCR abuse | AI Engineer | Security, Product Owner |
| Production outage | DevOps | Engineering Lead, Support Lead |


## 5. Communication Plan

- Internal incident channel opened immediately for Critical/High.
- Affected user/farm communication prepared with facts only.
- Avoid speculation; include impact, action taken, user action required and next update time.
- Preserve evidence and audit logs before cleanup.

## 6. Recovery Validation

- Confirm RLS and API authorization tests pass.
- Confirm no ongoing unauthorized sessions/tokens.
- Confirm affected data integrity through reconciliation queries.
- Confirm backups and restore points are valid.
- Monitor for recurrence for at least 72 hours after Critical/High incidents.
