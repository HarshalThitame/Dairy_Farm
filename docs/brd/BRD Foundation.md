# Majhi Dairy - BRD Foundation

**Document Type:** Business Requirements Document Foundation  
**Phase:** Phase 1 - Foundation and Project Analysis  
**Application Name:** Majhi Dairy  
**Prepared For:** Dairy Farm Management Platform  
**Prepared By:** Business Analysis and Product Documentation Team  
**Version:** 0.1  
**Date:** 06 June 2026  
**Document Status:** Foundation Draft  

---

## Document Control

### Revision History

| Version | Date | Author | Description | Status |
|---|---:|---|---|---|
| 0.1 | 06 June 2026 | Business Analysis Team | Initial BRD foundation, project analysis, stakeholder model, scope, taxonomy, and documentation framework | Draft |

### Phase 1 Boundary

This document establishes the BRD foundation for Majhi Dairy. It intentionally does not define detailed feature-level functional requirements. Detailed requirements will be documented in later phases by module, using the requirement taxonomy and ID standards defined in this foundation.

---

# 1. Executive Summary

## 1.1 Product Overview

Majhi Dairy is a multilingual dairy farm management Progressive Web Application designed for Marathi and English speaking dairy farmers, farm owners, dairy operators, veterinarians, support teams, and administrators. The product digitizes day-to-day dairy operations including cow and calf management, milk production tracking, breeding and calving records, vaccination and health reminders, accounting, reports, OCR-based dairy slip scanning, AI-powered assistance, notifications, goals, exports, backups, support, achievements, leaderboards, and platform administration.

The application is designed for rural and semi-urban dairy environments where users often rely on Android phones, intermittent internet connectivity, paper slips, handwritten records, and local language workflows. Majhi Dairy aims to provide a mobile-first, farmer-friendly, offline-aware, and trustworthy system for managing dairy operations and financial records.

## 1.2 Industry Overview

Dairy farming is a high-frequency operational business. Farmers make daily decisions based on milk yield, feed cost, animal health, breeding cycles, settlement payments, and reminders. Even small errors in record keeping can affect profitability, animal health, and cash flow. Many farms still use notebooks, paper slips, phone photos, memory-based reminders, and manual calculations.

The industry is gradually moving toward digital record keeping, AI assistance, automated reminders, and data-driven farm management. However, adoption depends on simplicity, local language support, mobile usability, low cost, and trust in financial accuracy.

## 1.3 Dairy Industry Challenges

Key challenges faced by dairy farmers include:

| Challenge Area | Description |
|---|---|
| Manual Records | Milk, health, breeding, vaccination, expense, and payment information is often maintained in notebooks or scattered photos. |
| Financial Accuracy | Milk slips, 15-day settlements, feed deductions, expenses, and profit calculations require careful reconciliation. |
| Animal Lifecycle Tracking | Heat, breeding, pregnancy, calving, calf care, and dry-period reminders are difficult to track manually. |
| Low Connectivity | Rural users may not always have reliable internet access. |
| Language Barrier | Many farmers prefer Marathi over English interfaces and technical terminology. |
| Data Loss | Paper records can be lost, damaged, or become unreadable. |
| Reporting Gaps | Farmers may not have clear monthly or yearly performance summaries. |
| Support Gap | Platform administrators need visibility into user activity, subscription status, and support issues. |

## 1.4 Digital Transformation Opportunities

Majhi Dairy can create business value by:

- Digitizing farm records in a mobile-first format.
- Providing Marathi and English user experiences.
- Using OCR and AI to reduce manual entry for dairy slips.
- Providing reminders for health, breeding, vaccination, calving, and farm tasks.
- Improving financial visibility through monthly and yearly reports.
- Enabling data backup, export, and auditability.
- Supporting admin monitoring, subscription control, notifications, and customer support.
- Encouraging engagement through achievements, goals, and leaderboards.

## 1.5 Purpose of Majhi Dairy

The purpose of Majhi Dairy is to help dairy farmers and farm managers maintain accurate, accessible, and actionable farm records. It should reduce manual workload, improve reminder discipline, increase financial clarity, and support smarter decisions using real farm data.

## 1.6 Business Value Proposition

Majhi Dairy provides value through:

| Value Area | Business Value |
|---|---|
| Operational Efficiency | Reduces manual writing, searching, and repeated calculations. |
| Financial Control | Improves tracking of milk income, feed deductions, expenses, settlements, and profit. |
| Animal Health | Helps prevent missed vaccination, pregnancy, calving, and calf-care activities. |
| Data Reliability | Centralizes farm records with backup and export options. |
| Farmer Engagement | Uses Marathi-first workflows, reminders, AI assistance, and simple dashboards. |
| Platform Scalability | Enables admin control, notifications, support, and subscription management. |

---

# 2. Problem Statement

Dairy farmers require accurate daily tracking of animals, milk production, health events, breeding cycles, expenses, payments, and reports. In many farms, this information is recorded manually, remembered informally, or stored across paper slips and phone images. This creates operational risk, financial errors, missed animal-care events, and poor visibility into profitability.

## 2.1 Problems Faced by Dairy Farmers

- Farmers need to manage multiple cows, calves, breeding stages, pregnancy stages, and milk records at the same time.
- Farm tasks are date-sensitive and easily missed without automated reminders.
- Milk income and dairy settlement records often require manual comparison.
- Expense categories such as feed, medicine, labor, transport, and other costs are difficult to summarize accurately.
- Farmers may not have quick access to monthly, yearly, or animal-level reports.

## 2.2 Manual Record Keeping Challenges

Manual record keeping creates several issues:

- Paper records may be misplaced, damaged, or incomplete.
- Entries are difficult to search, filter, or summarize.
- Historical trends cannot be easily analyzed.
- Multiple users may maintain different versions of records.
- Manual calculations increase risk of errors.

## 2.3 Milk Accounting Challenges

Milk accounting requires accurate daily and settlement-level data. Common challenges include:

- Daily milk entries may not match 15-day dairy settlement slips.
- Feed deductions may be incorrectly counted as duplicate expenses.
- Settlement totals, morning milk totals, evening milk totals, and net payable amounts require careful handling.
- OCR or manual entry errors can affect profit/loss.
- Farmers need clear separation between milk income, feed deductions, farm expenses, and reports.

## 2.4 Health Tracking Challenges

Animal health workflows include vaccination, deworming, illness treatment, veterinary visits, and preventive care. Without reliable reminders:

- Vaccinations may be missed.
- Disease treatment records may be incomplete.
- Veterinary history may not be available during future diagnosis.
- Calves may miss age-based care activities.

## 2.5 Breeding Tracking Challenges

Breeding and calving workflows are highly date-dependent:

- Heat detection, breeding, pregnancy checks, repeat breeding, dry period, calving, and next breeding readiness require structured tracking.
- If a cow is bred again shortly after a previous breeding, the earlier breeding outcome must be handled correctly.
- Farmers need reminders that are accurate and not duplicated or misleading.

## 2.6 Reporting Challenges

Farmers and owners need simple reports that explain:

- Daily and monthly milk production.
- Morning and evening split.
- Income, expense, and profit.
- Cow and calf status.
- Health and vaccination due lists.
- Yearly performance.

Without digital reports, decisions are based on incomplete information.

## 2.7 Language Barriers

Many farmers are more comfortable with Marathi than English. Technical terms, financial labels, and animal lifecycle terms must be understandable in the farmer's language. Mixed-language screens can reduce trust and usability.

## 2.8 Data Loss Issues

Data loss can happen due to:

- Lost paper notebooks.
- Damaged dairy slips.
- Phone changes.
- Accidental deletion.
- Lack of backup.
- Offline data not synced correctly.

Majhi Dairy must therefore support reliable storage, auditability, exports, backups, and safe user confirmation for AI-generated data.

---

# 3. Vision Statement

To become the most trusted digital dairy management platform for Indian dairy farmers by making farm operations, animal care, milk accounting, and business decisions simple, accurate, and accessible in the farmer's own language.

---

# 4. Mission Statement

Majhi Dairy's mission is to empower dairy farmers with a mobile-first, multilingual, data-driven platform that digitizes farm records, improves animal care, strengthens financial accuracy, supports AI-assisted decisions, and helps farmers manage their dairy business with confidence.

---

# 5. Business Objectives

The following business objectives will guide product development, implementation, and success measurement.

| Objective ID | Objective | Measurement Direction |
|---|---|---|
| BO-001 | Increase digitization of dairy farm records. | At least 80% of active farms create core digital records within 90 days of onboarding. |
| BO-002 | Improve daily milk record discipline. | Increase average milk entry completion rate month over month. |
| BO-003 | Improve reminder-based farm activity completion. | Achieve more than 70% reminder completion for active farms. |
| BO-004 | Improve financial clarity for farmers. | Enable monthly income, expense, feed deduction, and profit reporting for active farms. |
| BO-005 | Reduce time spent on dairy settlement entry. | Use OCR and review workflow to reduce manual settlement entry time by at least 50%. |
| BO-006 | Increase AI adoption for farm insights. | Grow AI assistant usage among active farms while ensuring answers are based on real data. |
| BO-007 | Support multilingual adoption. | Provide Marathi and English experiences with persistent user language preferences. |
| BO-008 | Improve data-driven decisions. | Increase usage of reports, statistics, goals, and analytics. |
| BO-009 | Improve subscription and admin operations. | Provide admin visibility into farms, users, notifications, and support issues. |
| BO-010 | Reduce data loss risk. | Provide export, backup, restore, audit logs, and offline-safe workflows where applicable. |

---

# 6. Success Metrics (KPIs)

## 6.1 Adoption KPIs

| KPI | Description | Measurement |
|---|---|---|
| New Farm Registrations | Number of farms created in a period. | Weekly and monthly count. |
| Activation Rate | Percentage of new farms that add cows, milk records, or first key data. | Activated farms / new farms. |
| Daily Active Users | Users active on a given day. | DAU. |
| Monthly Active Users | Users active in a month. | MAU. |
| DAU/MAU Ratio | Engagement consistency. | DAU divided by MAU. |
| Retention Rate | Users returning after 7, 30, and 90 days. | Cohort retention. |

## 6.2 Operational KPIs

| KPI | Description |
|---|---|
| Milk Records Entered | Count of milk records entered manually or through slips. |
| Reminder Completion Rate | Completed reminders divided by due reminders. |
| Cow Profile Completion | Percentage of cows with required profile data. |
| Calf Profile Completion | Percentage of calves with required profile data. |
| Vaccination Record Coverage | Percentage of animals with vaccination history. |
| Backup Completion Rate | Percentage of active users who create or schedule backups. |

## 6.3 Financial KPIs

| KPI | Description |
|---|---|
| Monthly Income Recorded | Total milk income recorded by month. |
| Expense Coverage | Percentage of farms recording at least one expense category per month. |
| Settlement Reconciliation Usage | Number of settlement slips saved and reviewed. |
| Report Generation Count | Number of monthly and yearly reports generated. |
| Profit/Loss View Usage | Frequency of profit/loss dashboard visits. |

## 6.4 AI and OCR KPIs

| KPI | Description |
|---|---|
| Slip Upload Count | Number of daily and settlement slips uploaded. |
| OCR Success Rate | Successful OCR extractions divided by total OCR attempts. |
| OCR Review Save Rate | OCR extractions accepted and saved after user review. |
| OCR Correction Rate | Percentage of OCR fields edited by users before save. |
| AI Assistant Questions | Total AI questions asked by users. |
| AI Response Usefulness | Positive feedback divided by total feedback. |

## 6.5 Support and Admin KPIs

| KPI | Description |
|---|---|
| Support Tickets Created | Ticket volume by category and priority. |
| Average Resolution Time | Time from ticket creation to resolution. |
| Notification Open Rate | Opened notifications divided by delivered notifications. |
| Subscription Renewal Rate | Renewed subscriptions divided by expiring subscriptions. |

---

# 7. Stakeholder Analysis

## 7.1 Stakeholder Matrix

| Stakeholder | Role | Responsibilities | Goals | Pain Points | Success Metrics |
|---|---|---|---|---|---|
| Farmer | Primary farm user | Enter milk, view reminders, manage cows/calves, upload slips, view reports | Simple daily usage, fewer missed tasks, clear milk and expense records | Low time, low technical literacy, language preference, intermittent internet | Daily usage, milk records entered, reminders completed |
| Farm Owner | Business decision maker | Monitor farm performance, income, expenses, animal inventory, staff activity | Improve profit, reduce errors, track performance | Limited visibility into operations and finances | Profit reports, record completeness, active users |
| Dairy Operator | Operational staff member | Add routine milk, expense, animal, and reminder records | Fast data entry, clear task list | Repeated entry, phone usability, confusion in forms | Entry completion time, error rate |
| Veterinarian | Animal health advisor | Review health, breeding, vaccination, pregnancy, and treatment records | Better animal care decisions | Incomplete medical history, missing dates | Health record completeness, timely reminders |
| Administrator | Platform super-admin | Manage farms, subscriptions, notifications, support, analytics, and platform health | Scalable operations and customer success | Limited farm-level visibility, support diagnosis complexity | Farm health score, subscription metrics, ticket resolution |
| Support Executive | Customer support user | Resolve farmer issues, review tickets, guide users, escalate bugs | Fast and accurate support | Missing user context, unclear issue history | Resolution time, user satisfaction |
| Product Team | Product ownership | Define roadmap, prioritize features, measure adoption | Improve farmer outcomes and product adoption | Unclear usage data, fragmented feedback | Adoption, retention, feature usage |
| Development Team | Engineering delivery | Build, maintain, secure, and optimize platform | Stable, scalable, maintainable application | Changing requirements, data integrity risk | Defect rate, performance, release quality |
| QA Team | Quality assurance | Test workflows, data accuracy, security, regression, and mobile UX | Prevent production defects | Large module coverage, localization complexity | Test pass rate, escaped defects |

---

# 8. User Personas

## 8.1 Persona 1 - Small Farmer

| Attribute | Description |
|---|---|
| Name | Ganesh, small dairy farmer |
| Farm Size | 2 to 8 cows |
| Location | Village or small town |
| Language Preference | Marathi |
| Technical Literacy | Basic smartphone usage, prefers simple visual UI |
| Goals | Record daily milk, remember health tasks, know monthly income and expenses |
| Challenges | Limited time, manual records, low confidence in complex apps, intermittent internet |
| Typical Workflow | Opens app in morning/evening, checks reminders, records milk, occasionally uploads dairy slips, views monthly summary |

## 8.2 Persona 2 - Medium Dairy Farm Owner

| Attribute | Description |
|---|---|
| Name | Savita, farm owner |
| Farm Size | 10 to 40 cows |
| Language Preference | Marathi with some English terms |
| Technical Literacy | Moderate |
| Goals | Track farm profitability, monitor breeding, reduce missed reminders, generate reports |
| Challenges | Multiple animals, multiple workers, settlement reconciliation, expense categorization |
| Typical Workflow | Reviews dashboard, checks pending reminders, reviews milk and expense entries, prints monthly reports |

## 8.3 Persona 3 - Commercial Dairy Operator

| Attribute | Description |
|---|---|
| Name | Rahul, dairy operations manager |
| Farm Size | 40+ animals |
| Language Preference | Marathi and English |
| Technical Literacy | Medium to high |
| Goals | Standardize operations, monitor records, identify issues quickly, manage staff activity |
| Challenges | High data volume, data quality, user permissions, performance |
| Typical Workflow | Uses analytics, reviews reports, monitors slips, uses exports and backups, checks reminders and activity |

## 8.4 Persona 4 - Veterinarian

| Attribute | Description |
|---|---|
| Name | Dr. Patil |
| Role | Veterinary advisor |
| Language Preference | Marathi and English |
| Technical Literacy | Medium |
| Goals | Access accurate health, vaccination, breeding, pregnancy, and calving history |
| Challenges | Incomplete records, unclear previous treatment, missed follow-ups |
| Typical Workflow | Reviews animal profile, checks health records, updates treatment notes, advises next action |

## 8.5 Persona 5 - Admin User

| Attribute | Description |
|---|---|
| Name | Platform administrator |
| Role | Super-admin or support admin |
| Language Preference | English and Marathi |
| Technical Literacy | High |
| Goals | Manage farms, users, subscriptions, notifications, support, and platform health |
| Challenges | Need accurate farm data, prevent support delays, monitor subscription risk |
| Typical Workflow | Opens admin dashboard, reviews farm details, sends notifications, manages subscriptions, checks tickets |

---

# 9. Scope Definition

## 9.1 In Scope

Majhi Dairy currently includes or plans to include the following high-level feature areas:

| Module | In-Scope Capability |
|---|---|
| Authentication | Login, signup, session management, role-based access, language onboarding. |
| Home Dashboard | Farm summary, reminders, quick actions, pending work, performance snapshot. |
| Cow Management | Cow registration, status tracking, important dates, breeding and calving lifecycle. |
| Calf Management | Calf registration, age-based care reminders, status tracking, sale handling. |
| Records Management | Health, expense, feed, breeding, vaccination, notes, and other farm records. |
| Reminders | Date-based reminders for animal care, breeding, pregnancy, calving, vaccination, and farm tasks. |
| Accounting | Milk records, settlements, feed deductions, expenses, income, profit/loss, financial summaries. |
| AI Slip Scanning | Daily and 15-day settlement slip upload, OCR, AI structuring, validation, editable review, save. |
| Reports | Daily, monthly, yearly, animal, accounting, vaccination, and printable reports. |
| AI Assistant | Data-based question answering, suggested questions, chat UI, settings, usage tracking. |
| Notifications | In-app notifications, push notifications, notification settings, admin notifications. |
| Settings | Security, notifications, AI, goals, export, help, appearance, language preferences. |
| Profile | User profile, farm information, statistics, photo, preferences. |
| Goals | Daily, weekly, monthly, fat, SNF goals, progress, achievement notifications. |
| Export and Backup | Data exports, backups, restore workflow, backup history. |
| Support | Help center, tickets, FAQs, contact support, tutorials, bug reports. |
| Achievements and Leaderboard | Dairy score, achievements, rankings, gamification, milestones. |
| Admin Panel | Farm management, user management, subscriptions, notifications, support, analytics, farm monitoring. |

## 9.2 Out of Scope

The following are outside the current BRD scope unless explicitly approved in future phases:

- Direct bank transfer or payment processing.
- Full veterinary diagnosis or medical prescription automation.
- Government compliance filing and regulatory submission.
- Hardware integration with milk machines, RFID readers, weighing scales, or IoT sensors.
- Marketplace, ecommerce, feed ordering, or medicine ordering.
- Full payroll management.
- Enterprise ERP inventory and procurement workflows.
- Autonomous AI saving without user review.
- Replacing professional veterinary advice.
- Guaranteed OCR accuracy for unreadable, torn, or low-quality documents.
- SMS, WhatsApp, and email delivery as mandatory Phase 1 channels unless separately scoped.

---

# 10. Assumptions

## 10.1 Business Assumptions

- Farmers require a simple Marathi-first experience while still supporting English.
- Most users will access the product using smartphones.
- Farm owners value financial accuracy and clear reports.
- Farmers are willing to review AI-extracted slip data before saving.
- Admin users require visibility into farm activity and subscription status.
- Support load can be reduced through self-service help and better diagnostics.

## 10.2 Technical Assumptions

- The application will continue to use a web/PWA architecture.
- Supabase/PostgreSQL will remain the system of record unless changed by architecture governance.
- User-facing AI responses must use real database data and must not invent numbers.
- OCR and AI features require server-side processing and secure API keys.
- Offline support is required for selected workflows, especially capture and data entry.
- Browser and PWA limitations, especially on iOS, must be considered.

## 10.3 Operational Assumptions

- Administrators will manage subscriptions, notifications, support, and farm monitoring.
- Users may need training or onboarding for accounting, slip scanning, and settings.
- Some users will use shared devices or change devices over time.
- Data migration scripts and schema changes must be versioned and auditable.

---

# 11. Constraints

## 11.1 Technical Constraints

- PWA behavior differs across Android, iOS, and desktop browsers.
- Push notification and service worker support can vary by browser and operating system.
- OCR quality depends on image clarity, lighting, crop, angle, and document type.
- AI API usage introduces latency, cost, and availability dependencies.
- Offline-first synchronization can create conflict and duplicate handling challenges.
- Mobile performance must be maintained despite large feature scope.

## 11.2 Business Constraints

- The product must remain affordable for dairy farmers.
- UI must be simple enough for low technical literacy users.
- Financial outputs must be understandable and trustworthy.
- New features should not disrupt existing farmer workflows.

## 11.3 Operational Constraints

- Support teams require accurate logs and audit trails to diagnose issues.
- Admin actions must be protected and traceable.
- Data backup and restore must avoid accidental overwrites or data loss.
- Training material must support Marathi and English users.

## 11.4 Regulatory and Compliance Constraints

- User and farm data must be protected with appropriate access controls.
- Financial records must not be silently modified by AI.
- Medical and veterinary information must not be represented as professional diagnosis unless reviewed by qualified persons.
- Data retention, export, and deletion policies must be defined for production operations.

---

# 12. Risk Assessment

## 12.1 Risk Register

| Risk ID | Description | Impact | Probability | Mitigation Strategy |
|---|---|---|---|---|
| R-001 | Farmers may not adopt the app if workflows feel complex. | High | Medium | Use Marathi-first, mobile-first UX, onboarding, large buttons, and simple language. |
| R-002 | OCR may read financial values incorrectly. | Critical | Medium | Always show editable review, validate math, require confirmation, store audit logs. |
| R-003 | Manual and slip-based milk records may conflict. | High | Medium | Define priority rules, reconciliation logic, and clear user warnings. |
| R-004 | Reminder logic may generate duplicate or incorrect reminders. | High | Medium | Use lifecycle rules, status filters, tests, and audit logs. |
| R-005 | Offline sync may create duplicates or stale data. | High | Medium | Use idempotent sync, local IDs, server IDs, conflict rules, and sync status. |
| R-006 | Financial reports may include wrong categories. | Critical | Medium | Centralize accounting rules, test profit logic, and separate income, feed deduction, and expenses. |
| R-007 | AI assistant may answer outside real data. | High | Medium | Use controlled backend tools, real database queries, and no free-form SQL generation. |
| R-008 | Push notifications may fail on some devices. | Medium | Medium | Provide in-app notification fallback and subscription diagnostics. |
| R-009 | iOS PWA limitations may affect install, storage, or service workers. | Medium | Medium | Test iOS separately and document platform limitations. |
| R-010 | Database migration may fail due to constraints or existing data. | High | Medium | Use pre-checks, rollback scripts, staged migrations, and data cleanup scripts. |
| R-011 | Admin actions may affect wrong farm if farm isolation fails. | Critical | Low | Enforce role checks, farm ID validation, RLS/service-layer checks, and audit logs. |
| R-012 | Data privacy breach through support/admin access. | Critical | Low | Use role-based access, least privilege, audit logs, and secure policies. |
| R-013 | Large data volume may slow reports and dashboards. | Medium | Medium | Add indexes, pagination, summary tables, caching, and query optimization. |
| R-014 | Translation gaps may create mixed-language screens. | Medium | Medium | Centralize localization keys and run localization QA. |
| R-015 | Support volume may increase after new features. | Medium | Medium | Add help center, tutorials, diagnostics, and admin support tools. |

---

# 13. User Role Matrix

## 13.1 Role Definitions

| Role | Purpose | Key Permissions | Access Areas |
|---|---|---|---|
| Farmer | Perform day-to-day farm operations. | Add/edit farm records, view reminders, upload slips, view reports, manage profile/settings based on permissions. | Home, cows, calves, records, reminders, accounting, reports, AI, profile, settings. |
| Farm Owner | Own and supervise farm operations. | Full farm-level access, user management where enabled, financial reports, exports, backups. | All farmer areas plus owner-level dashboards and settings. |
| Veterinarian | Support animal health workflows. | View/update health, vaccination, breeding, pregnancy, treatment records where authorized. | Animal profiles, health records, vaccination, reminders. |
| Support Executive | Help users resolve issues. | View support tickets and permitted diagnostic data, reply to tickets, escalate issues. | Support console, limited farm diagnostics, ticket history. |
| Administrator | Manage platform operations. | Farm management, user management, subscription control, notifications, support, analytics, audit logs. | Admin panel, farm details, notification center, support admin, analytics. |
| Super Administrator | Highest platform control. | All administrator permissions plus protected actions such as delete, impersonation where approved, global settings. | Full admin panel and platform governance areas. |

## 13.2 Access Principles

- Users should access only the farm data they are authorized to view.
- Admin access must be auditable.
- Sensitive actions require confirmation and logging.
- AI should only use data permitted by user settings and backend policy.
- Financial records require review and traceability.

---

# 14. High-Level Business Processes

## 14.1 User Onboarding

1. User signs up or logs in.
2. First-time user selects language preference: Marathi or English.
3. User creates or joins a farm.
4. User enters basic farm profile and owner information.
5. User may add cows, calves, reminders, milk records, and settings.
6. Application stores preferences locally and in the database where applicable.
7. User reaches the home dashboard.

## 14.2 Cow Registration

1. User opens cow management.
2. User adds cow identity, status, purchase/birth information, breed, and important dates.
3. If cow is marked as calved, calf entry may be initiated.
4. System creates lifecycle context for reminders and reporting.
5. Cow profile becomes available for details, records, and reports.

## 14.3 Milk Recording

1. User records morning and/or evening milk manually or through a daily slip.
2. System validates date, session, liters, and relevant quality values.
3. Record is saved with farm association.
4. Dashboard, reports, and accounting summaries update according to business rules.
5. If a settlement slip later contains daily rows, priority and reconciliation rules are applied.

## 14.4 Reminder Management

1. System generates reminders based on animal lifecycle, user records, and dates.
2. User views reminders by due, upcoming, and completed status.
3. User completes, reschedules, or records related activity.
4. Reminder actions update related records where applicable.
5. Incorrect or duplicate reminders must be avoided through lifecycle rules.

## 14.5 Vaccination Management

1. User enters vaccination or deworming records.
2. System determines next due date where rule exists.
3. User receives reminders before or on due dates.
4. Completion creates a historical record.
5. Reports list completed and upcoming vaccination activity.

## 14.6 AI Slip Scanning

1. User selects or captures slip image.
2. Image is compressed and submitted for OCR processing.
3. OCR extracts raw text.
4. AI structures the text into daily slip or settlement slip data.
5. Validation engine checks dates, totals, rates, amounts, and suspicious values.
6. User reviews editable data.
7. Data is saved only after explicit user confirmation.
8. Audit trail stores image, OCR text, AI JSON, confidence, and warnings.

## 14.7 Accounting Workflow

1. Milk records, settlement slips, expenses, and deductions are entered or imported.
2. System applies accounting rules for income, feed deduction, other expenses, and profit/loss.
3. Settlement-level totals are used where defined by business rules.
4. Monthly and yearly reports show financial summaries.
5. Deletion or correction of source records must update dependent summaries.

## 14.8 Report Generation

1. User selects report type and period.
2. System retrieves real farm data for that period.
3. Report is generated in selected language where supported.
4. User views, prints, downloads, or shares report.
5. Generated report should match source records and accounting rules.

## 14.9 Backup and Restore

1. User opens export and backup center.
2. User creates backup for selected data scope.
3. System stores backup metadata and backup file where configured.
4. User can download backup.
5. Restore requires confirmation and validation.
6. Restore actions must be logged to prevent accidental data loss.

---

# 15. Requirement Categorization Strategy

## 15.1 Requirement Categories

| Code | Category |
|---|---|
| AUTH | Authentication and onboarding |
| DASH | Home dashboard |
| COW | Cow management |
| CALF | Calf management |
| REC | Records management |
| REM | Reminders |
| ACC | Accounting |
| OCR | AI slip scanning and OCR |
| REP | Reports |
| AI | AI assistant |
| NOTIF | Notifications |
| SET | Settings |
| PROF | Profile |
| GOAL | Goals |
| EXP | Export and backup |
| SUP | Support |
| ACH | Achievements and leaderboard |
| ADMIN | Admin panel |
| DATA | Data model and data governance |
| SEC | Security and access control |
| NFR | Non-functional requirements |

## 15.2 Requirement Type Codes

| Type Code | Meaning |
|---|---|
| BR | Business Requirement |
| FR | Functional Requirement |
| NFR | Non-Functional Requirement |
| DR | Data Requirement |
| UI | User Interface Requirement |
| RPT | Reporting Requirement |
| AI | AI/OCR Requirement |
| SEC | Security Requirement |
| INT | Integration Requirement |
| OPS | Operational Requirement |

## 15.3 Requirement ID Standard

Requirement IDs will follow this structure:

`<CATEGORY>-<TYPE>-<SEQUENCE>`

Examples:

| Example ID | Meaning |
|---|---|
| AUTH-FR-001 | First functional requirement for authentication. |
| COW-FR-001 | First functional requirement for cow management. |
| ACC-BR-001 | First business requirement for accounting. |
| OCR-AI-001 | First AI/OCR requirement for slip scanning. |
| REP-RPT-001 | First reporting requirement for reports. |
| SEC-SEC-001 | First security requirement. |
| NFR-PERF-001 | First performance non-functional requirement. |

## 15.4 Requirement Attributes

Every detailed requirement in later phases should include:

| Attribute | Description |
|---|---|
| Requirement ID | Unique ID following taxonomy. |
| Requirement Title | Short clear title. |
| Description | Requirement statement. |
| Business Rationale | Why the requirement exists. |
| Stakeholder | Primary stakeholder. |
| Priority | Must, Should, Could, Won't for current release. |
| Acceptance Criteria | Testable expected outcomes. |
| Dependencies | Related modules, data, APIs, or rules. |
| Data Impact | Tables, fields, and data ownership. |
| Security Impact | Permissions, privacy, or audit needs. |
| Localization Impact | Marathi and English text needs. |
| Offline Impact | Whether offline support is required. |
| Status | Draft, Approved, Implemented, Tested, Deferred. |

## 15.5 Traceability Strategy

Requirements should be traceable from business objectives to tests:

Business Objective -> Business Requirement -> Functional Requirement -> Design/API/Data -> Test Case -> UAT Result -> Release Note

---

# 16. BRD Structure

The full enterprise BRD is expected to exceed 100 pages. The following table of contents will be used as the document framework for later phases.

## 16.1 Enterprise BRD Table of Contents

1. Cover Page
2. Document Control
   1. Revision History
   2. Approval Matrix
   3. Distribution List
   4. Document Status
3. Executive Summary
   1. Product Overview
   2. Business Context
   3. Value Proposition
   4. Strategic Fit
4. Background and Current State
   1. Dairy Industry Context
   2. Current Farmer Workflows
   3. Current System Overview
   4. Current Pain Points
5. Problem Statement
6. Vision and Mission
7. Business Objectives
8. Success Metrics and KPIs
9. Stakeholder Analysis
   1. Stakeholder Matrix
   2. Stakeholder Needs
   3. Stakeholder Impact Analysis
10. User Personas
11. Scope Definition
   1. In Scope
   2. Out of Scope
   3. Future Scope
12. Assumptions
13. Constraints
14. Dependencies
15. Risk Assessment
16. User Role and Permission Model
17. High-Level Business Processes
   1. User Onboarding
   2. Cow Registration
   3. Calf Registration
   4. Milk Recording
   5. Reminder Management
   6. Health and Vaccination Management
   7. Breeding and Calving Management
   8. AI Slip Scanning
   9. Accounting
   10. Reporting
   11. Backup and Restore
   12. Support Workflow
   13. Admin Workflow
18. Business Rules Overview
19. Functional Requirement Sections
   1. AUTH - Authentication and Onboarding
   2. DASH - Home Dashboard
   3. COW - Cow Management
   4. CALF - Calf Management
   5. REC - Records Management
   6. REM - Reminders
   7. ACC - Accounting
   8. OCR - AI Slip Scanning
   9. REP - Reports
   10. AI - AI Assistant
   11. NOTIF - Notifications
   12. SET - Settings
   13. PROF - Profile
   14. GOAL - Goals
   15. EXP - Export and Backup
   16. SUP - Support
   17. ACH - Achievements and Leaderboard
   18. ADMIN - Admin Panel
20. Non-Functional Requirements
   1. Performance
   2. Scalability
   3. Availability
   4. Reliability
   5. Usability
   6. Accessibility
   7. Offline Support
   8. Compatibility
   9. Maintainability
   10. Observability
21. Security Requirements
   1. Authentication
   2. Authorization
   3. Farm Data Isolation
   4. Admin Security
   5. Audit Logging
   6. API Security
   7. Sensitive Data Handling
22. Privacy and Data Protection
23. Localization Requirements
   1. Marathi
   2. English
   3. First-Time Language Selection
   4. Translation Governance
24. AI and OCR Requirements
   1. OCR Pipeline
   2. AI Extraction
   3. AI Assistant
   4. Validation Engine
   5. Confidence and Warnings
   6. Auditability
25. Data Requirements
   1. Conceptual Data Model
   2. Logical Data Model
   3. Data Ownership
   4. Data Retention
   5. Data Migration
   6. Backup and Restore
26. Integration Requirements
   1. Supabase
   2. OCR Provider
   3. OpenAI
   4. Push Notifications
   5. Storage
27. Reporting Requirements
   1. Milk Reports
   2. Financial Reports
   3. Animal Reports
   4. Vaccination Reports
   5. Yearly Reports
   6. Admin Reports
28. Notification Requirements
29. Admin Panel Requirements
30. Support and Help Center Requirements
31. Gamification and Leaderboard Requirements
32. Compliance and Audit Requirements
33. Analytics and Monitoring Requirements
34. Data Quality Requirements
35. Error Handling and Recovery
36. User Experience Requirements
37. Mobile and PWA Requirements
38. Acceptance Criteria Framework
39. UAT Strategy
40. Release and Deployment Considerations
41. Open Issues
42. Appendices
   1. Glossary
   2. Acronyms
   3. Sample Reports
   4. Sample User Journeys
   5. Requirement Traceability Matrix
   6. Business Rule Catalog
   7. Data Dictionary

---

# 17. Documentation Roadmap

The following documents should be created after the BRD foundation.

| Document | Purpose | Primary Audience | Timing |
|---|---|---|---|
| BRD | Complete business requirements and business rules. | Product, business, stakeholders, engineering, QA. | Phase 2 onward. |
| FRD | Detailed functional behavior by module. | Product, engineering, QA. | After BRD module approval. |
| SRS | System-level requirements and technical behavior. | Engineering, QA, architecture. | After FRD. |
| API Documentation | API contracts, request/response examples, auth, errors. | Backend, frontend, integrations, QA. | During implementation. |
| Database Design Document | Tables, relationships, indexes, constraints, RLS, migrations. | Backend, DBA, QA. | Before schema changes. |
| Architecture Design Document | System architecture, services, data flow, security model. | Architects and engineers. | Before major development. |
| UX/UI Specification | Screens, states, components, accessibility, responsive rules. | Designers, frontend, QA. | Before UI build. |
| Test Strategy | Test approach, environments, tools, regression, automation. | QA, product, engineering. | Before QA cycles. |
| Test Cases | Detailed test scenarios and expected results. | QA and UAT teams. | Per sprint or release. |
| UAT Scenarios | Business acceptance scenarios for stakeholders. | Farmers, product, business owners. | Before release sign-off. |
| Deployment Guide | Deployment steps, environment variables, migrations, rollback. | DevOps and engineering. | Before production release. |
| User Manual | Farmer-facing and admin-facing operating guide. | End users and support. | Before launch. |
| Support SOP | Ticket handling, escalation, troubleshooting, scripts. | Support and admin teams. | Before support launch. |
| Data Migration Plan | Safe migration approach for existing data. | Engineering and operations. | Before migrations. |
| Security Review Document | Threat model, access controls, audit, data protection. | Security, engineering, admin. | Before production. |
| Release Notes | User-facing and admin-facing change summary. | Users, support, product. | Every release. |
| Training Material | Videos, FAQs, quick guides in Marathi and English. | Farmers, support, sales. | Before adoption push. |

---

# Appendix A - Current Application Module Inventory

| No. | Module |
|---:|---|
| 1 | Authentication |
| 2 | Home Dashboard |
| 3 | Cow Management |
| 4 | Calf Management |
| 5 | Records Management |
| 6 | Reminders |
| 7 | Accounting |
| 8 | AI Slip Scanning |
| 9 | Reports |
| 10 | AI Assistant |
| 11 | Notifications |
| 12 | Settings |
| 13 | Profile |
| 14 | Goals |
| 15 | Export and Backup |
| 16 | Support |
| 17 | Achievements and Leaderboard |
| 18 | Admin Panel |

---

# Appendix B - Glossary

| Term | Definition |
|---|---|
| Farm | A tenant-level dairy business entity in the platform. |
| Farmer | User who performs daily farm operations. |
| Cow | Primary dairy animal record. |
| Calf | Young animal record linked to cow where applicable. |
| Milk Record | Morning or evening milk production entry. |
| Settlement Slip | Dairy-provided payment slip, commonly for 15 days. |
| OCR | Optical Character Recognition used to read text from slip images. |
| AI Assistant | Controlled AI feature that answers using real application data. |
| Reminder | Date-based task or alert related to animal or farm management. |
| PWA | Progressive Web Application installable from browser where supported. |
| Tenant | Isolated farm/business data boundary. |

---

# Appendix C - Phase 2 Direction

Phase 2 should begin detailed requirements for:

1. Authentication and onboarding.
2. Home dashboard.
3. Cow management.
4. Calf management.
5. Records management.
6. Reminders.

Each module should use the requirement ID standard defined in Section 15 and should include business rules, acceptance criteria, data impact, UI impact, localization impact, offline impact, and test traceability.
