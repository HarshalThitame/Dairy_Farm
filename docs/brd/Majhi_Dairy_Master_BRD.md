# Majhi Dairy - Master Business Requirements Document

**Document Type:** Enterprise Master Business Requirements Document  
**Application Name:** Majhi Dairy  
**Supported Languages:** Marathi, English  
**Target Users:** Farmers, Farm Owners, Veterinarians, Support Teams, Administrators, Super Administrators  
**Version:** 1.0 Draft  
**Date:** 06 June 2026  
**Status:** Complete BRD Package Draft  

---

## Master Revision History

| Version | Date | Author | Description | Status |
|---|---:|---|---|---|
| 0.1 | 06 June 2026 | Business Analysis Team | Phase 1 BRD Foundation | Draft |
| 0.2 | 06 June 2026 | Business Analysis Team | Phase 2 Core Modules BRD | Draft |
| 0.3 | 06 June 2026 | Business Analysis Team | Phase 3 Business Modules BRD | Draft |
| 0.4 | 06 June 2026 | Business Analysis Team | Phase 4 Platform Modules BRD | Draft |
| 1.0 Draft | 06 June 2026 | Business Analysis Team | Phase 5 Admin/Architecture sections and final master assembly | Draft |

---

## Master Document Index

| Part | Source | Coverage |
|---|---|---|
| Part 1 | BRD Foundation | Project analysis, stakeholders, scope, taxonomy, BRD framework |
| Part 2 | Core Modules BRD | Authentication, Dashboard, Cow, Calf, Records, Reminders |
| Part 3 | Business Modules BRD | Accounting, AI Slip Scanning, Reports, Goals, Export and Backup |
| Part 4 | Platform Modules BRD | AI Assistant, Notifications, Settings, Profile, Support, Achievements |
| Part 5 | Admin and Architecture BRD | Admin Panel, Analytics, Subscription, Security, NFRs, Data Model, Integrations, Audit, DR, Traceability |

---

## Master Table of Contents

1. Part 1 - BRD Foundation
2. Part 2 - Core Modules Functional Requirements
3. Part 3 - Business Modules Functional Requirements
4. Part 4 - Platform Modules Functional Requirements
5. Part 5 - Admin, Architecture, Security, NFRs, Data Model and Final Assembly

---


# Part 1 - BRD Foundation

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


---


# Part 2 - Core Modules Functional Requirements

# Majhi Dairy - Phase 2 Core Modules BRD

**Document Type:** Detailed Functional Business Requirements  
**Phase:** Phase 2 - Core Modules  
**Application Name:** Majhi Dairy  
**Supported Languages:** Marathi, English  
**Target Users:** Farmers, Farm Owners, Veterinarians, Administrators  
**Source Foundation:** `docs/brd/BRD Foundation.md`  
**Version:** 0.1  
**Date:** 06 June 2026  
**Status:** Draft for Review  

---

## Document Control

| Version | Date | Author | Description | Status |
|---|---:|---|---|---|
| 0.1 | 06 June 2026 | Business Analysis Team | Detailed functional business requirements for Authentication, Home Dashboard, Cow Management, Calf Management, Records Management, and Reminders | Draft |

## Phase 2 Scope Boundary

This document defines detailed functional business requirements only for the following core modules:

1. Authentication
2. Home Dashboard
3. Cow Management
4. Calf Management
5. Records Management
6. Reminders

Detailed requirements for Accounting, AI Slip Scanning, Reports, AI Assistant, Notifications, Settings, Profile, Goals, Export and Backup, Support, Achievements, Leaderboard, and Admin Panel will be documented in later phases.

---

# 1. Requirement Standard

## 1.1 Requirement ID Strategy

Requirement IDs follow the taxonomy defined in Phase 1:

`<MODULE>-<TYPE>-<SEQUENCE>`

Examples:

| Module | Example ID |
|---|---|
| Authentication | AUTH-FR-001 |
| Home Dashboard | DASH-FR-001 |
| Cow Management | COW-FR-001 |
| Calf Management | CALF-FR-001 |
| Records Management | REC-FR-001 |
| Reminders | REM-FR-001 |

## 1.2 Standard Requirement Attributes

Each feature requirement includes:

- Requirement ID
- Feature Name
- Module Name
- Description
- Business Objective
- Business Rules
- User Story
- Actors
- Preconditions
- Trigger
- Main Flow
- Alternate Flow
- Exception Flow
- Post Conditions
- Validation Rules
- Acceptance Criteria
- Priority
- Dependencies

## 1.3 Priority Definitions

| Priority | Meaning |
|---|---|
| Must | Required for release and core business continuity. |
| Should | Important for usability, accuracy, or operational completeness. |
| Could | Valuable enhancement that can be deferred. |
| Won't | Not included in this phase. |

## 1.4 Localization Standard

All user-facing labels, messages, errors, notifications, and confirmations must support Marathi and English. Marathi is the default language when no preference exists.

| Text Type | Marathi Example | English Example |
|---|---|---|
| Save Button | जतन करा | Save |
| Cancel Button | रद्द करा | Cancel |
| Required Error | हे फील्ड आवश्यक आहे. | This field is required. |
| Success Message | माहिती यशस्वीरित्या जतन झाली. | Information saved successfully. |
| Network Error | इंटरनेट कनेक्शन तपासा. | Please check your internet connection. |
| Permission Error | तुम्हाला ही कृती करण्याची परवानगी नाही. | You do not have permission to perform this action. |

---

# 2. Module 1 - Authentication

## 2.1 Authentication Module Overview

The Authentication module controls user identity, access, onboarding, language preference, session lifecycle, and security controls. It must support simple farmer-friendly login while protecting farm data and preventing unauthorized access.

## 2.2 Authentication Actors

| Actor | Role in Authentication |
|---|---|
| Farmer | Signs up, logs in, uses PIN login, manages recovery. |
| Farm Owner | Signs up, creates farm, manages primary access. |
| Veterinarian | Logs in where invited or authorized. |
| Administrator | Uses separate admin login and stronger security controls. |
| System | Validates credentials, sessions, security rules, language preference. |

## 2.3 Authentication Textual Flow Diagrams

### Signup Flow

User opens app -> selects signup -> enters required information -> selects language if first-time -> creates credentials -> system validates -> farm profile/onboarding starts -> session created -> user lands on home dashboard.

### Login Flow

User opens app -> enters mobile/email and password/PIN -> system validates credentials -> system validates account/farm status -> system loads language preference -> session created/refreshed -> user lands on home dashboard or last permitted route.

### Session Expiry Flow

User session expires -> system clears invalid session -> user is redirected to login -> selected language is retained -> user logs in again -> user returns to permitted dashboard.

## 2.4 Authentication Requirements

### AUTH-FR-001 - User Signup

| Attribute | Details |
|---|---|
| Requirement ID | AUTH-FR-001 |
| Feature Name | User Signup |
| Module Name | Authentication |
| Description | The system shall allow a new user to create an account using required identity, contact, credential, and farm onboarding information. |
| Business Objective | Enable new farmers and farm owners to start using Majhi Dairy with minimum friction while collecting enough data for secure access and farm setup. |
| Business Rules | Mobile/email must be unique where used for login. New users must be assigned to a farm context. Default language is Marathi unless user selects another language. Signup must not create duplicate active users with the same primary login identifier. |
| User Story | As a new farmer, I want to create an account so that I can start managing my dairy farm digitally. |
| Actors | Farmer, Farm Owner, System |
| Preconditions | User is not authenticated. Signup is enabled. Required backend services are available. |
| Trigger | User taps signup or create account. |
| Main Flow | 1. User opens signup screen. 2. User enters name, mobile/email, password or required credentials. 3. User selects language if not already selected. 4. User submits form. 5. System validates fields and uniqueness. 6. System creates user. 7. System starts onboarding/farm setup. 8. System creates session. |
| Alternate Flow | If user already selected language before signup, system reuses stored preference and skips language prompt. |
| Exception Flow | If mobile/email exists, show duplicate account message. If network fails, show retry message. If validation fails, highlight invalid fields. |
| Post Conditions | User account exists, language preference is stored, onboarding can continue, audit event is created. |
| Validation Rules | Name required. Login identifier required. Password must meet configured policy. Mobile/email format must be valid. Language must be Marathi or English. |
| Acceptance Criteria | User can complete signup with valid data. Duplicate login is blocked. Language preference persists. User is routed to onboarding or dashboard. Error messages appear in selected language. |
| Priority | Must |
| Dependencies | User database, farm onboarding, localization, session service, audit logging. |

### AUTH-FR-002 - User Login

| Attribute | Details |
|---|---|
| Requirement ID | AUTH-FR-002 |
| Feature Name | User Login |
| Module Name | Authentication |
| Description | The system shall allow registered users to authenticate using approved credentials and access only permitted farm data. |
| Business Objective | Provide secure and reliable access to farm workflows. |
| Business Rules | Suspended users or farms must not access the app. Invalid credentials must not reveal whether the account exists. Login must load language and role permissions. |
| User Story | As a registered user, I want to log in securely so that I can access my farm information. |
| Actors | Farmer, Farm Owner, Veterinarian, Administrator, System |
| Preconditions | User account exists. User is not blocked. |
| Trigger | User submits login credentials. |
| Main Flow | 1. User enters login identifier and credential. 2. System validates credential. 3. System checks user status and farm status. 4. System loads permissions and language. 5. System creates session. 6. User is redirected to dashboard or intended route. |
| Alternate Flow | If user has PIN enabled and device is trusted, PIN login can be offered. |
| Exception Flow | Invalid credentials show generic error. Expired subscription may show permitted subscription message if applicable. Suspended farm redirects to restricted state. |
| Post Conditions | Valid session is active and user context is loaded. |
| Validation Rules | Required fields cannot be empty. Login identifier format must be valid. Rate limiting applies after repeated failures. |
| Acceptance Criteria | Valid users can log in. Invalid users cannot. Suspended farms are blocked. Language preference is applied after login. |
| Priority | Must |
| Dependencies | Credential service, role permissions, farm status, language preference, audit log. |

### AUTH-FR-003 - PIN Login

| Attribute | Details |
|---|---|
| Requirement ID | AUTH-FR-003 |
| Feature Name | PIN Login |
| Module Name | Authentication |
| Description | The system shall allow eligible users to log in with a secure PIN on trusted devices. |
| Business Objective | Improve farmer convenience while maintaining device-level security. |
| Business Rules | PIN must be set by authenticated user. PIN must be stored securely and never displayed. PIN login should only be available on devices where the user enabled it. Failed PIN attempts must be limited. |
| User Story | As a farmer, I want to unlock the app using a PIN so that I can access the app quickly on my phone. |
| Actors | Farmer, Farm Owner, System |
| Preconditions | User has previously enabled PIN. Device is recognized or local PIN setting exists. |
| Trigger | User opens app and selects PIN login or PIN screen appears. |
| Main Flow | 1. System displays PIN screen. 2. User enters PIN. 3. System validates PIN. 4. System restores or refreshes authenticated session. 5. User lands on dashboard. |
| Alternate Flow | User selects password login instead of PIN. |
| Exception Flow | Wrong PIN shows error. Too many attempts require password login. Missing session redirects to login. |
| Post Conditions | User is authenticated or blocked from PIN after repeated failures. |
| Validation Rules | PIN must meet minimum length and numeric policy. PIN entry must not be logged. |
| Acceptance Criteria | Correct PIN unlocks app. Incorrect PIN is rejected. Too many failures are handled safely. |
| Priority | Should |
| Dependencies | Secure storage, session management, device trust logic. |

### AUTH-FR-004 - Forgot Password

| Attribute | Details |
|---|---|
| Requirement ID | AUTH-FR-004 |
| Feature Name | Forgot Password |
| Module Name | Authentication |
| Description | The system shall allow users to initiate account password recovery through an approved recovery channel. |
| Business Objective | Reduce support dependency for locked-out users. |
| Business Rules | Recovery process must not disclose whether an account exists. Recovery tokens or OTPs must expire. Password reset must invalidate older risky sessions where required. |
| User Story | As a user, I want to reset my password so that I can regain access if I forget it. |
| Actors | User, System |
| Preconditions | User is on login screen. Recovery service is configured. |
| Trigger | User selects forgot password. |
| Main Flow | 1. User enters registered mobile/email. 2. System validates format. 3. System sends recovery instruction or OTP. 4. User verifies recovery. 5. User sets new password. 6. System confirms reset. |
| Alternate Flow | User cancels and returns to login. |
| Exception Flow | Invalid OTP, expired link, weak password, or network failure shows localized error. |
| Post Conditions | Password is updated securely and recovery event is logged. |
| Validation Rules | New password must follow password policy. Confirm password must match. Recovery token must be valid. |
| Acceptance Criteria | User can reset with valid recovery. Expired or invalid recovery is blocked. |
| Priority | Must |
| Dependencies | Notification/recovery provider, password policy, audit log. |

### AUTH-FR-005 - Session Management

| Attribute | Details |
|---|---|
| Requirement ID | AUTH-FR-005 |
| Feature Name | Session Management |
| Module Name | Authentication |
| Description | The system shall manage user sessions across refreshes, app restarts, session expiry, and device changes. |
| Business Objective | Keep users securely logged in while preventing stale or invalid access. |
| Business Rules | Expired sessions must redirect to login instead of showing raw errors. Session must include user, farm, role, and language context. Admin and farmer sessions may have different policies. |
| User Story | As a user, I want the app to remember me safely so that I do not need to repeatedly log in. |
| Actors | User, System |
| Preconditions | User has authenticated previously. |
| Trigger | App loads, route changes, token refresh occurs, or session expires. |
| Main Flow | 1. App starts. 2. System checks local/session token. 3. System validates token. 4. System loads user context. 5. User continues using app. |
| Alternate Flow | If token is near expiry, system refreshes token silently. |
| Exception Flow | If token is invalid or expired, system clears session and redirects to login. |
| Post Conditions | Valid session continues or user is safely logged out. |
| Validation Rules | Session token must be signed/valid. Farm ID must match user access. |
| Acceptance Criteria | Refresh does not break login. Expired session redirects to login. No protected route leaks data. |
| Priority | Must |
| Dependencies | Auth provider, middleware, local preference storage, role permissions. |

### AUTH-FR-006 - Logout

| Attribute | Details |
|---|---|
| Requirement ID | AUTH-FR-006 |
| Feature Name | Logout |
| Module Name | Authentication |
| Description | The system shall allow users to log out from current device and optionally clear sensitive local session data. |
| Business Objective | Give users control over account access on shared or personal devices. |
| Business Rules | Logout must revoke or clear current session. Language preference may remain on device unless user clears all data. Offline queue must not be deleted without confirmation. |
| User Story | As a user, I want to log out so that others cannot access my farm data. |
| Actors | User, System |
| Preconditions | User is authenticated. |
| Trigger | User taps logout. |
| Main Flow | 1. User selects logout. 2. System asks confirmation if needed. 3. System clears session. 4. System redirects to login. |
| Alternate Flow | User cancels confirmation. |
| Exception Flow | If server logout fails, local session is still cleared and retry log is stored. |
| Post Conditions | User cannot access protected routes without logging in again. |
| Validation Rules | Logout action requires active session or local session context. |
| Acceptance Criteria | Protected pages redirect after logout. Language preference remains usable. |
| Priority | Must |
| Dependencies | Session service, route protection, local storage. |

### AUTH-FR-007 - Onboarding

| Attribute | Details |
|---|---|
| Requirement ID | AUTH-FR-007 |
| Feature Name | User Onboarding |
| Module Name | Authentication |
| Description | The system shall guide new users through required setup steps before full application use. |
| Business Objective | Ensure new users have enough farm and profile data to use key modules correctly. |
| Business Rules | Required onboarding steps must be completed or intentionally skipped where allowed. Existing users must not be forced through onboarding unless missing critical data. |
| User Story | As a new farm owner, I want a guided setup so that I can start using the app correctly. |
| Actors | Farmer, Farm Owner, System |
| Preconditions | User signup or first login is successful. |
| Trigger | First authenticated app access. |
| Main Flow | 1. System checks onboarding status. 2. User selects language if not set. 3. User enters profile/farm basics. 4. System saves setup. 5. User reaches dashboard. |
| Alternate Flow | User skips optional steps and completes later from settings/profile. |
| Exception Flow | Save failure shows retry. Missing required farm context blocks dashboard access. |
| Post Conditions | Onboarding status and preferences are saved. |
| Validation Rules | Required fields depend on onboarding step. Language must be valid. Farm name required for new farm owner. |
| Acceptance Criteria | New users see onboarding once. Existing users are not unnecessarily interrupted. |
| Priority | Must |
| Dependencies | Profile, farm setup, language preference, dashboard. |

### AUTH-FR-008 - First-Time Language Selection

| Attribute | Details |
|---|---|
| Requirement ID | AUTH-FR-008 |
| Feature Name | First-Time Language Selection |
| Module Name | Authentication |
| Description | The system shall ask first-time users to select Marathi or English before entering the app. |
| Business Objective | Improve adoption by presenting the app in the user's preferred language from the beginning. |
| Business Rules | New users must select one supported language. Existing users with stored preference must not see the screen again. Default is Marathi if preference is missing. |
| User Story | As a new user, I want to choose my language so that I can understand the app. |
| Actors | New User, System |
| Preconditions | User has no saved language preference. |
| Trigger | First app launch, signup, or first login without language preference. |
| Main Flow | 1. System displays language screen. 2. User selects Marathi or English. 3. System saves preference locally and in profile if authenticated. 4. App reloads text in selected language. |
| Alternate Flow | If user is unauthenticated, preference is saved locally and synced after signup/login. |
| Exception Flow | If database save fails, local preference remains and sync retries later. |
| Post Conditions | Language preference exists and app renders accordingly. |
| Validation Rules | Only `mr` and `en` are valid values. |
| Acceptance Criteria | First-time users cannot proceed without language selection. Existing users are not prompted. Preference persists after restart. |
| Priority | Must |
| Dependencies | Localization store, profile settings, onboarding. |

### AUTH-FR-009 - Language Persistence

| Attribute | Details |
|---|---|
| Requirement ID | AUTH-FR-009 |
| Feature Name | Language Persistence |
| Module Name | Authentication |
| Description | The system shall persist selected language across refresh, logout/login, app restart, and session expiry. |
| Business Objective | Provide consistent multilingual experience and avoid repeated language setup. |
| Business Rules | Authenticated user's database preference has highest priority. Local preference is used before login. Missing preference defaults to Marathi. |
| User Story | As a user, I want the app to remember my language so that I do not need to change it repeatedly. |
| Actors | User, System |
| Preconditions | User has selected or defaulted language. |
| Trigger | App start, login, profile load, settings change. |
| Main Flow | 1. System reads local language. 2. If authenticated, system reads profile preference. 3. System resolves preference. 4. UI renders selected language. |
| Alternate Flow | Settings language change updates database and local storage immediately. |
| Exception Flow | If profile fetch fails, local preference is used and warning is logged. |
| Post Conditions | UI language remains stable. |
| Validation Rules | Unsupported values must fallback to Marathi. |
| Acceptance Criteria | Language persists across logout/login and browser refresh. No mixed-language screen is caused by preference loading. |
| Priority | Must |
| Dependencies | Localization framework, settings, profile API. |

### AUTH-FR-010 - Multi-Device Login

| Attribute | Details |
|---|---|
| Requirement ID | AUTH-FR-010 |
| Feature Name | Multi-Device Login |
| Module Name | Authentication |
| Description | The system shall support login from multiple devices while tracking active sessions where supported. |
| Business Objective | Allow farmers and owners to use the app on phone, desktop, or shared farm devices. |
| Business Rules | Farm data access must remain role-based on every device. Device information should be captured where supported. Logout from one device should not automatically log out all devices unless selected. |
| User Story | As a farm owner, I want to access my farm from multiple devices so that I can manage work anywhere. |
| Actors | User, System |
| Preconditions | User has valid credentials. |
| Trigger | User logs in from another device. |
| Main Flow | 1. User authenticates. 2. System creates device/session record. 3. System loads user context. 4. Active device appears in security/session view if supported. |
| Alternate Flow | User logs out a specific device from security center. |
| Exception Flow | Unknown or suspicious login may require additional confirmation where configured. |
| Post Conditions | Device session exists and is traceable. |
| Validation Rules | Device metadata must be sanitized. Session must belong to user. |
| Acceptance Criteria | User can use multiple devices. Session list does not expose other users' data. |
| Priority | Should |
| Dependencies | Session tracking, security settings, audit logs. |

### AUTH-FR-011 - Account Recovery

| Attribute | Details |
|---|---|
| Requirement ID | AUTH-FR-011 |
| Feature Name | Account Recovery |
| Module Name | Authentication |
| Description | The system shall provide a controlled process to recover accounts when users lose credentials or access to a device. |
| Business Objective | Reduce permanent account loss and support burden. |
| Business Rules | Recovery must verify ownership. Sensitive changes must be logged. Support-assisted recovery requires admin audit trail. |
| User Story | As a farmer, I want to recover my account if I lose my phone or forget credentials. |
| Actors | User, Support Executive, Administrator, System |
| Preconditions | User has an existing account. |
| Trigger | User starts recovery or contacts support. |
| Main Flow | 1. User enters recovery identifier. 2. System validates recovery method. 3. User completes verification. 4. System allows password/PIN reset. 5. System logs recovery. |
| Alternate Flow | Support executive verifies user and initiates approved recovery process. |
| Exception Flow | Failed verification blocks recovery and records event. |
| Post Conditions | User regains access or recovery is denied safely. |
| Validation Rules | Recovery identifier format valid. Verification token valid. New credentials follow policy. |
| Acceptance Criteria | Legitimate users can recover access. Unauthorized users cannot take over account. |
| Priority | Should |
| Dependencies | Support process, audit log, recovery provider. |

### AUTH-FR-012 - Security Controls

| Attribute | Details |
|---|---|
| Requirement ID | AUTH-FR-012 |
| Feature Name | Authentication Security Controls |
| Module Name | Authentication |
| Description | The system shall enforce security controls for authentication, protected routes, credential storage, and farm isolation. |
| Business Objective | Protect farm data, financial information, and user identity. |
| Business Rules | Passwords/PINs must never be stored in plain text. Protected routes require authenticated session. Farm ID must be validated on every data access. Admin routes require admin role. |
| User Story | As a farm owner, I want my data to be protected so that unauthorized users cannot access it. |
| Actors | User, Administrator, System |
| Preconditions | Application has protected resources. |
| Trigger | User authenticates, accesses route, changes credentials, or performs sensitive action. |
| Main Flow | 1. System validates session. 2. System checks route permission. 3. System enforces farm isolation. 4. System logs sensitive events. |
| Alternate Flow | Higher-risk actions require confirmation or re-authentication. |
| Exception Flow | Unauthorized access redirects to login or access denied page. |
| Post Conditions | Access is granted or denied safely. |
| Validation Rules | Role and farm context required. Sensitive payloads must be sanitized. |
| Acceptance Criteria | Unauthorized users cannot access protected pages. Cross-farm data leakage is prevented. Security events are logged. |
| Priority | Must |
| Dependencies | Middleware, database policies, audit logs, role matrix. |

## 2.5 Authentication Error and Success Messages

| Scenario | Marathi | English |
|---|---|---|
| Signup success | खाते तयार झाले. | Account created successfully. |
| Login success | लॉगिन यशस्वी झाले. | Login successful. |
| Invalid credentials | मोबाईल/ईमेल किंवा पासवर्ड चुकीचा आहे. | Mobile/email or password is incorrect. |
| Session expired | सत्र संपले आहे. कृपया पुन्हा लॉगिन करा. | Session expired. Please log in again. |
| Permission denied | तुम्हाला ही कृती करण्याची परवानगी नाही. | You do not have permission to perform this action. |
| Language saved | भाषा जतन झाली. | Language saved. |

## 2.6 Authentication Security Considerations

- All protected routes must validate authentication before data load.
- Farm ID must never be trusted only from client input.
- Login failures should be rate-limited.
- Recovery flows must use expiring tokens.
- PIN should be hashed or stored using secure platform storage where applicable.
- Admin authentication must be separated from farmer-facing access where required.

---

# 3. Module 2 - Home Dashboard

## 3.1 Dashboard Module Overview

The Home Dashboard is the primary landing page after login. It must show the most important farm information immediately: today's milk, income, pending slips, reminders, quick actions, goals, farm snapshot, recent activity, and insights. The dashboard must be fast, mobile-first, and localized.

## 3.2 Dashboard Widget Data Strategy

| Widget | Data Source | Calculation | Refresh Behavior | Empty State |
|---|---|---|---|---|
| Today Milk Summary | Milk records and/or slip-derived daily totals | Morning + evening milk for current date | On page load, after milk save, pull-to-refresh | आज दूध नोंद नाही / No milk recorded today |
| Monthly Summary | Milk records, settlements, expenses | Current month totals using accounting rules | On page load, after relevant save/delete | या महिन्याचा डेटा उपलब्ध नाही / No data for this month |
| Quick Actions | Static config and permissions | No calculation | Immediate | Hidden only if permission missing |
| Farm Snapshot | Cow, calf, status records | Counts by active status | On page load, after animal change | अजून जनावरांची नोंद नाही / No animals added |
| Active Reminders | Reminders table/engine | Due and upcoming reminder count | On page load and reminder action | आज कोणतीही आठवण नाही / No reminders today |
| Recent Activities | Audit/activity records | Last 5 to 10 events | On page load and after save | अलीकडील कृती नाही / No recent activity |
| Goal Progress | Goals and milk data | Current value / target | On page load, after milk save | लक्ष्य सेट केलेले नाही / No goal set |
| Alerts | Derived rules | Risk and pending work | On page load | कोणतेही अलर्ट नाहीत / No alerts |
| Insights | Analytics summaries | Trends, changes, recommendations | On page load, cached | माहिती उपलब्ध नाही / No insight available |

## 3.3 Dashboard Requirements

### DASH-FR-001 - Dashboard Overview

| Attribute | Details |
|---|---|
| Requirement ID | DASH-FR-001 |
| Feature Name | Dashboard Overview |
| Module Name | Home Dashboard |
| Description | The system shall display a consolidated home dashboard after login with prioritized farm information and quick actions. |
| Business Objective | Help farmers understand today's farm status within seconds. |
| Business Rules | Dashboard must only show data for the authenticated farm. High-priority widgets appear above secondary widgets. Empty states must be friendly and actionable. |
| User Story | As a farmer, I want to see today's important information first so that I can take quick action. |
| Actors | Farmer, Farm Owner, System |
| Preconditions | User is authenticated and farm context exists. |
| Trigger | User lands on home page. |
| Main Flow | 1. System loads dashboard shell. 2. System fetches summary data. 3. Widgets render by priority. 4. User taps quick actions or detail cards. |
| Alternate Flow | If offline, cached summary is shown with offline label. |
| Exception Flow | If dashboard API fails, show localized error and retry. |
| Post Conditions | User can navigate to core workflows. |
| Validation Rules | Farm ID must be validated. Date must use user's timezone. |
| Acceptance Criteria | Dashboard loads under expected performance target. Widgets show correct farm data. Empty states are not blank. |
| Priority | Must |
| Dependencies | Auth, farm context, records, reminders, goals, accounting summaries. |

### DASH-FR-002 - Today Milk Summary

| Attribute | Details |
|---|---|
| Requirement ID | DASH-FR-002 |
| Feature Name | Today Milk Summary |
| Module Name | Home Dashboard |
| Description | The system shall show today's morning milk, evening milk, and total milk. |
| Business Objective | Provide immediate visibility into daily production. |
| Business Rules | Current date is based on farm/user timezone. Morning and evening values must not be mixed. If settlement-derived final numbers exist for the period, dashboard daily display still uses daily records for today unless business rules specify settlement override. |
| User Story | As a farmer, I want to see today's milk split so that I know current production. |
| Actors | Farmer, Farm Owner, System |
| Preconditions | User has access to milk records. |
| Trigger | Dashboard loads or milk record changes. |
| Main Flow | 1. System queries today's milk records. 2. System calculates morning, evening, and total. 3. Widget displays values with units. |
| Alternate Flow | If no record exists, show zero and add action. |
| Exception Flow | If calculation fails, show safe empty state and log error. |
| Post Conditions | Dashboard shows current daily milk status. |
| Validation Rules | Milk values must be numeric and non-negative. |
| Acceptance Criteria | Morning and evening split is correct. Total equals morning + evening. Values are localized. |
| Priority | Must |
| Dependencies | Milk records, date utility, localization. |

### DASH-FR-003 - Monthly Summary

| Attribute | Details |
|---|---|
| Requirement ID | DASH-FR-003 |
| Feature Name | Monthly Summary |
| Module Name | Home Dashboard |
| Description | The system shall show current month milk, income, expenses, and profit summary. |
| Business Objective | Give farmers a quick financial and production snapshot. |
| Business Rules | Month is determined by user timezone. Accounting module rules determine income, feed deductions, expenses, and profit. Summary must update after source data changes. |
| User Story | As a farm owner, I want monthly summary on home screen so that I know how the farm is performing. |
| Actors | Farmer, Farm Owner, System |
| Preconditions | User has permission to view financial summary. |
| Trigger | Dashboard load or financial data update. |
| Main Flow | 1. System fetches current month summary. 2. System applies calculation rules. 3. Widget displays totals and trend indicators. |
| Alternate Flow | If no monthly data, show zero and link to records. |
| Exception Flow | If financial query fails, hide sensitive partial data and show retry. |
| Post Conditions | User sees current month performance. |
| Validation Rules | Currency values must be numeric. Profit = income - applicable expenses per approved rules. |
| Acceptance Criteria | Monthly values match reports/accounting source. Deleting source entries updates summary. |
| Priority | Must |
| Dependencies | Accounting, milk records, expenses, reports. |

### DASH-FR-004 - Quick Actions

| Attribute | Details |
|---|---|
| Requirement ID | DASH-FR-004 |
| Feature Name | Quick Actions |
| Module Name | Home Dashboard |
| Description | The system shall show high-use actions such as scan slip, add expense, view reports, add record, or open AI assistant based on configured product design. |
| Business Objective | Reduce taps for daily workflows. |
| Business Rules | Actions must respect user permissions. Actions must be large enough for mobile touch. Removed or hidden actions must not leave broken navigation. |
| User Story | As a farmer, I want quick buttons so that I can complete common tasks quickly. |
| Actors | Farmer, Farm Owner, System |
| Preconditions | User is authenticated. |
| Trigger | Dashboard renders. |
| Main Flow | 1. System reads action configuration. 2. System filters by permission. 3. User taps action. 4. System navigates to target workflow. |
| Alternate Flow | For scan action, system may open native camera/gallery capture where configured. |
| Exception Flow | If route unavailable, show error and log broken action. |
| Post Conditions | User reaches selected workflow. |
| Validation Rules | Action target must be valid route. |
| Acceptance Criteria | All visible actions work. No unauthorized action appears. |
| Priority | Must |
| Dependencies | Routing, permissions, target modules. |

### DASH-FR-005 - Farm Snapshot

| Attribute | Details |
|---|---|
| Requirement ID | DASH-FR-005 |
| Feature Name | Farm Snapshot |
| Module Name | Home Dashboard |
| Description | The system shall show compact counts for cows, pregnant cows, calves, and average milk or other approved farm indicators. |
| Business Objective | Provide at-a-glance farm inventory and health status. |
| Business Rules | Sold, archived, or deleted animals must not be counted as active unless the widget explicitly shows historical counts. |
| User Story | As a farm owner, I want a farm snapshot so that I know my current animal count. |
| Actors | Farmer, Farm Owner, System |
| Preconditions | Animal records exist or empty state is available. |
| Trigger | Dashboard load or animal data change. |
| Main Flow | 1. System counts animals by status. 2. System renders cards. 3. User taps card to open relevant list. |
| Alternate Flow | If no animals, show add cow action. |
| Exception Flow | If count query fails, show fallback and retry. |
| Post Conditions | User sees current farm inventory. |
| Validation Rules | Counts must be integers and filtered by farm. |
| Acceptance Criteria | Counts match cow/calf lists. Sold calves are excluded from active count. |
| Priority | Should |
| Dependencies | Cow management, calf management. |

### DASH-FR-006 - Active Reminders

| Attribute | Details |
|---|---|
| Requirement ID | DASH-FR-006 |
| Feature Name | Active Reminders |
| Module Name | Home Dashboard |
| Description | The system shall show urgent, today, upcoming, and pending reminders on the home dashboard. |
| Business Objective | Reduce missed farm and animal-care tasks. |
| Business Rules | Completed reminders must not appear as active. Reminders for sold or inactive calves must not appear unless historically relevant. Duplicate lifecycle reminders must be avoided. |
| User Story | As a farmer, I want to see important reminders on home screen so that I do not miss work. |
| Actors | Farmer, System |
| Preconditions | Reminder engine is available. |
| Trigger | Dashboard load, reminder creation/update, date change. |
| Main Flow | 1. System fetches active reminders. 2. System groups by priority and date. 3. User opens or completes reminder. |
| Alternate Flow | If no reminders, show positive empty state. |
| Exception Flow | If reminder action fails, keep reminder visible and show error. |
| Post Conditions | User can act on due work. |
| Validation Rules | Reminder due date required. Completed status required. |
| Acceptance Criteria | Reminder counts match reminder page. Completed reminders disappear from active list. |
| Priority | Must |
| Dependencies | Reminder engine, animal records. |

### DASH-FR-007 - Recent Activities

| Attribute | Details |
|---|---|
| Requirement ID | DASH-FR-007 |
| Feature Name | Recent Activities |
| Module Name | Home Dashboard |
| Description | The system shall show recent farm activity such as milk entry, slip upload, expense entry, reminder completion, or animal update. |
| Business Objective | Increase transparency and user confidence in saved actions. |
| Business Rules | Activities must be farm-scoped. Sensitive admin-only events must not appear to normal users unless appropriate. |
| User Story | As a farm owner, I want to see recent actions so that I know what was updated. |
| Actors | Farmer, Farm Owner, System |
| Preconditions | Activity log or source records exist. |
| Trigger | Dashboard load or new activity. |
| Main Flow | 1. System fetches last activities. 2. System formats localized event labels. 3. User taps event where deep link exists. |
| Alternate Flow | If no activity, show empty state. |
| Exception Flow | If activity fetch fails, hide widget safely or show retry. |
| Post Conditions | User sees latest farm activity. |
| Validation Rules | Activity timestamp required. Actor must be valid where available. |
| Acceptance Criteria | Last activities are newest first and farm-scoped. |
| Priority | Should |
| Dependencies | Audit/activity logs, source modules. |

### DASH-FR-008 - Goal Progress

| Attribute | Details |
|---|---|
| Requirement ID | DASH-FR-008 |
| Feature Name | Goal Progress |
| Module Name | Home Dashboard |
| Description | The system shall display daily or configured milk goal progress on the dashboard. |
| Business Objective | Encourage farmers to track production against targets. |
| Business Rules | If no goal is set, show setup call-to-action. Progress must not exceed 100% visually unless overachievement is separately indicated. |
| User Story | As a farmer, I want to see goal progress so that I know how close I am to target. |
| Actors | Farmer, Farm Owner, System |
| Preconditions | Goal module exists. |
| Trigger | Dashboard load or milk/goal change. |
| Main Flow | 1. System reads active goal. 2. System calculates current value. 3. System displays progress and remaining amount. |
| Alternate Flow | If target achieved, show celebration message. |
| Exception Flow | Invalid target shows setup correction message. |
| Post Conditions | User understands progress. |
| Validation Rules | Goal target must be positive. Current value must be non-negative. |
| Acceptance Criteria | Progress percentage is accurate. Language and units are correct. |
| Priority | Should |
| Dependencies | Goals, milk records. |

### DASH-FR-009 - Alerts

| Attribute | Details |
|---|---|
| Requirement ID | DASH-FR-009 |
| Feature Name | Dashboard Alerts |
| Module Name | Home Dashboard |
| Description | The system shall show important alerts such as pending slip uploads, overdue reminders, missing entries, or subscription issues where applicable. |
| Business Objective | Help users resolve important issues before they affect operations. |
| Business Rules | Alerts must be actionable and not duplicated in reminders unless intentionally configured. Alerts must be dismissible only where business rules allow. |
| User Story | As a farmer, I want important alerts to be visible so that I can fix pending work. |
| Actors | User, System |
| Preconditions | Alert rules are configured. |
| Trigger | Dashboard load or alert condition changes. |
| Main Flow | 1. System evaluates alert rules. 2. System displays prioritized alerts. 3. User taps alert to open resolution page. |
| Alternate Flow | If no alerts, show no major issues state. |
| Exception Flow | If alert evaluation fails, do not block dashboard. |
| Post Conditions | User can act on risk items. |
| Validation Rules | Alert must include title, message, severity, and action route where actionable. |
| Acceptance Criteria | Alert count and list match configured conditions. |
| Priority | Should |
| Dependencies | Reminders, accounting, slip uploads, subscription status. |

### DASH-FR-010 - Insights

| Attribute | Details |
|---|---|
| Requirement ID | DASH-FR-010 |
| Feature Name | Dashboard Insights |
| Module Name | Home Dashboard |
| Description | The system shall show simple data insights such as milk trend, production change, or reminder performance using actual farm data. |
| Business Objective | Promote data-driven decisions without requiring users to open detailed reports. |
| Business Rules | Insights must not invent data. If insufficient data exists, show clear no-data message. |
| User Story | As a farmer, I want simple insights so that I can understand my farm performance quickly. |
| Actors | Farmer, Farm Owner, System |
| Preconditions | Sufficient source data exists. |
| Trigger | Dashboard load or data refresh. |
| Main Flow | 1. System checks available data. 2. System calculates insight. 3. System shows localized message and optional action. |
| Alternate Flow | If data insufficient, show setup or no-data message. |
| Exception Flow | Calculation errors are logged and widget falls back safely. |
| Post Conditions | User sees accurate insight or no-data state. |
| Validation Rules | Insight values must be traceable to source records. |
| Acceptance Criteria | Insight matches report calculations. No fake insight appears. |
| Priority | Could |
| Dependencies | Analytics, records, reports. |

---

# 4. Module 3 - Cow Management

## 4.1 Cow Management Overview

Cow Management allows users to maintain cow profiles, lifecycle status, health, vaccination, breeding, calving, production history, and timeline. Cow records are foundational for reminders, reports, breeding workflows, and farm inventory.

## 4.2 Cow Data Fields

| Field | Description | Required | Validation |
|---|---|---:|---|
| Tag Number | Unique visible identifier for cow in farm | Recommended | Unique within farm where provided |
| Name | Farmer-friendly cow name | Yes | 1-80 characters |
| Breed | Cow breed | Optional | Existing breed or custom value |
| DOB | Date of birth | Optional | Cannot be future date |
| Purchase Date | Date cow was purchased | Optional | Cannot be future date |
| Status | Current cow status | Yes | Must be approved lifecycle status |
| Pregnancy Status | Pregnant, not pregnant, unknown, recently calved, etc. | Optional | Must follow workflow rules |
| Last Calving Date | Last delivery date | Conditional | Cannot be future date |
| Expected Calving Date | Calculated or entered expected delivery | Conditional | Must be after breeding date |
| Photo | Cow profile image | Optional | File type and size policy |

## 4.3 Cow Status Workflow

| From Status | To Status | Allowed When | Notes |
|---|---|---|---|
| Active | Pregnant | Pregnancy confirmed | Creates pregnancy reminders. |
| Pregnant | Calved | Calving recorded | May trigger calf registration. |
| Calved | Active | Post-calving cycle completed | Next breeding readiness reminders may apply. |
| Active | Sold | Cow sold | Active reminders must stop unless historical. |
| Active | Dead | Cow death recorded | Future reminders must stop. |
| Any active status | Archived | User archives | Hidden from active lists but retained historically. |

## 4.4 Cow Requirements

### COW-FR-001 - Add Cow

| Attribute | Details |
|---|---|
| Requirement ID | COW-FR-001 |
| Feature Name | Add Cow |
| Module Name | Cow Management |
| Description | The system shall allow users to add a cow with identity, profile, status, and important dates. |
| Business Objective | Digitize animal inventory and enable lifecycle reminders and reports. |
| Business Rules | Cow must belong to authenticated farm. Name is required. Tag number should be unique within farm if provided. Future dates are not allowed for DOB or purchase date. If marked calved, calf registration prompt should be available. |
| User Story | As a farmer, I want to add a cow so that I can track her milk, health, breeding, and reminders. |
| Actors | Farmer, Farm Owner, System |
| Preconditions | User has cow create permission. |
| Trigger | User selects add cow. |
| Main Flow | 1. User opens add cow form. 2. User enters required data. 3. User selects status. 4. System validates. 5. System saves cow. 6. System creates lifecycle reminders where applicable. |
| Alternate Flow | User marks cow as calved and system shows calf add form. |
| Exception Flow | Duplicate tag, invalid date, or save failure shows localized error. |
| Post Conditions | Cow profile exists and appears in cow list. |
| Validation Rules | Name required. Dates not future. Status valid. Tag unique within farm where enforced. |
| Acceptance Criteria | Valid cow is saved. Invalid data is blocked. Cow appears in list and dashboard count. |
| Priority | Must |
| Dependencies | Farm context, reminder engine, profile image storage. |

### COW-FR-002 - Edit Cow

| Attribute | Details |
|---|---|
| Requirement ID | COW-FR-002 |
| Feature Name | Edit Cow |
| Module Name | Cow Management |
| Description | The system shall allow authorized users to edit cow profile information. |
| Business Objective | Keep animal records accurate over time. |
| Business Rules | Edits must preserve historical records. Changing status may affect future reminders. Critical lifecycle changes should be confirmed. |
| User Story | As a farmer, I want to update cow information so that records remain correct. |
| Actors | Farmer, Farm Owner, System |
| Preconditions | Cow exists in user's farm. User has edit permission. |
| Trigger | User taps edit on cow profile. |
| Main Flow | 1. System loads cow. 2. User changes fields. 3. System validates. 4. System saves changes. 5. Related dashboard and reminders update. |
| Alternate Flow | User cancels and no change is saved. |
| Exception Flow | If cow not found or belongs to another farm, access denied or not found is shown. |
| Post Conditions | Cow profile reflects changes and audit log is updated. |
| Validation Rules | Same as add cow. Status transitions must be valid. |
| Acceptance Criteria | Authorized edit succeeds. Unauthorized edit fails. Historical linked records remain intact. |
| Priority | Must |
| Dependencies | Cow database, permissions, audit log, reminders. |

### COW-FR-003 - Delete Cow

| Attribute | Details |
|---|---|
| Requirement ID | COW-FR-003 |
| Feature Name | Delete Cow |
| Module Name | Cow Management |
| Description | The system shall allow protected deletion of cow records where business rules permit. |
| Business Objective | Allow correction of accidental entries while protecting historical data. |
| Business Rules | Deletion must require confirmation. Cows with historical milk/health/breeding records should be archived instead of hard deleted unless admin policy permits. Deleted cow must not appear in active reminders. |
| User Story | As a farmer, I want to remove an incorrect cow entry so that my list is clean. |
| Actors | Farmer, Farm Owner, System |
| Preconditions | Cow exists. User has delete permission. |
| Trigger | User selects delete. |
| Main Flow | 1. User taps delete. 2. System shows confirmation. 3. User confirms. 4. System validates dependency rules. 5. System deletes or recommends archive. |
| Alternate Flow | If cow has linked records, system offers archive. |
| Exception Flow | Unauthorized or protected cow deletion is blocked. |
| Post Conditions | Cow is deleted or archived according to policy. |
| Validation Rules | Confirmation required. Dependency check required. |
| Acceptance Criteria | Accidental deletion is prevented by confirmation. Linked historical data is not orphaned. |
| Priority | Should |
| Dependencies | Linked records, reminders, audit logs. |

### COW-FR-004 - Archive Cow

| Attribute | Details |
|---|---|
| Requirement ID | COW-FR-004 |
| Feature Name | Archive Cow |
| Module Name | Cow Management |
| Description | The system shall allow users to archive cows no longer active while retaining historical records. |
| Business Objective | Preserve historical data without cluttering active farm views. |
| Business Rules | Archived cows are excluded from active counts and future reminders. Historical reports may include archived cows where selected. |
| User Story | As a farmer, I want to archive old cows so that active lists stay useful. |
| Actors | Farmer, Farm Owner, System |
| Preconditions | Cow exists and user has permission. |
| Trigger | User selects archive. |
| Main Flow | 1. User selects archive. 2. System asks confirmation. 3. System marks cow archived. 4. System disables future reminders. |
| Alternate Flow | User restores archived cow. |
| Exception Flow | Save failure shows retry. |
| Post Conditions | Cow is hidden from active list and retained historically. |
| Validation Rules | Archive reason optional but recommended. |
| Acceptance Criteria | Archived cow not counted as active. Historical records remain visible. |
| Priority | Should |
| Dependencies | Cow list filters, reminders, reports. |

### COW-FR-005 - Cow Profile and Details

| Attribute | Details |
|---|---|
| Requirement ID | COW-FR-005 |
| Feature Name | Cow Profile and Details |
| Module Name | Cow Management |
| Description | The system shall display a detailed cow profile with identity, status, important dates, linked records, reminders, and timeline. |
| Business Objective | Provide a single source of truth for each cow. |
| Business Rules | Cow detail must only show records for that cow and farm. Important dates must be formatted in selected language. |
| User Story | As a farmer, I want to open a cow and see complete details so that I can make decisions quickly. |
| Actors | Farmer, Farm Owner, Veterinarian, System |
| Preconditions | Cow exists. User has view permission. |
| Trigger | User taps cow card/list item. |
| Main Flow | 1. System loads cow profile. 2. System loads related records and reminders. 3. System displays sections and actions. |
| Alternate Flow | If no related records, show empty states. |
| Exception Flow | Invalid cow ID shows not found. Unauthorized access is denied. |
| Post Conditions | User can view and navigate cow data. |
| Validation Rules | Cow ID must belong to farm. |
| Acceptance Criteria | Cow detail opens quickly and data matches source records. |
| Priority | Must |
| Dependencies | Cow records, health records, breeding, reminders, timeline. |

### COW-FR-006 - Breed and Tag Number Management

| Attribute | Details |
|---|---|
| Requirement ID | COW-FR-006 |
| Feature Name | Breed and Tag Number Management |
| Module Name | Cow Management |
| Description | The system shall allow users to store breed and tag number information for cows. |
| Business Objective | Improve animal identification and reporting. |
| Business Rules | Tag number should be unique within farm. Breed may be selected from list or entered manually where allowed. |
| User Story | As a farmer, I want to record tag and breed so that I can identify cows easily. |
| Actors | Farmer, Farm Owner, System |
| Preconditions | Cow add/edit form is open. |
| Trigger | User enters breed/tag. |
| Main Flow | 1. User enters tag. 2. User selects or enters breed. 3. System validates. 4. Data is saved with cow. |
| Alternate Flow | User leaves optional field blank. |
| Exception Flow | Duplicate tag shows warning or blocks save per policy. |
| Post Conditions | Cow identity data is stored. |
| Validation Rules | Tag length and characters must follow policy. Breed max length enforced. |
| Acceptance Criteria | Tag and breed display on list/profile. Duplicate tag handling works. |
| Priority | Should |
| Dependencies | Cow forms, breed list config. |

### COW-FR-007 - Pregnancy Tracking

| Attribute | Details |
|---|---|
| Requirement ID | COW-FR-007 |
| Feature Name | Pregnancy Tracking |
| Module Name | Cow Management |
| Description | The system shall track cow pregnancy status, breeding date, expected pregnancy check, and expected calving date. |
| Business Objective | Prevent missed pregnancy checks, dry-off dates, and calving preparation. |
| Business Rules | Pregnancy status must be updated through breeding/pregnancy workflows. If a new breeding is recorded shortly after previous breeding, previous breeding must be marked not pregnant or superseded according to rule. |
| User Story | As a farmer, I want to track pregnancy so that I know when to check and prepare for calving. |
| Actors | Farmer, Veterinarian, System |
| Preconditions | Cow exists and is active. |
| Trigger | User records breeding or pregnancy check. |
| Main Flow | 1. User records breeding. 2. System calculates pregnancy check due date. 3. User records check result. 4. System updates pregnancy status. 5. System creates future reminders. |
| Alternate Flow | User marks not pregnant and system may create repeat breeding reminder. |
| Exception Flow | Invalid date or inactive cow blocks workflow. |
| Post Conditions | Pregnancy status and reminders are updated. |
| Validation Rules | Breeding date cannot be future. Expected calving must be after breeding. Status transition valid. |
| Acceptance Criteria | Pregnancy reminders appear correctly. Not pregnant result updates status and prevents wrong calving reminders. |
| Priority | Must |
| Dependencies | Breeding records, reminders, cow status. |

### COW-FR-008 - Calving Tracking

| Attribute | Details |
|---|---|
| Requirement ID | COW-FR-008 |
| Feature Name | Calving Tracking |
| Module Name | Cow Management |
| Description | The system shall allow users to record cow calving and optionally register calf immediately. |
| Business Objective | Maintain accurate reproduction history and calf linkage. |
| Business Rules | Calving date cannot be future. Calving should update cow status and close pregnancy reminders. Calf registration prompt should appear when calving is recorded. |
| User Story | As a farmer, I want to record calving and add calf so that both cow and calf records are updated. |
| Actors | Farmer, System |
| Preconditions | Cow exists. Cow may be pregnant or manually marked calved. |
| Trigger | User selects calving record or marks cow calved. |
| Main Flow | 1. User enters calving date and details. 2. System validates. 3. System updates cow status. 4. System prompts calf registration. 5. System creates post-calving reminders. |
| Alternate Flow | User skips calf registration and can add later. |
| Exception Flow | Missing required date or invalid cow state shows warning. |
| Post Conditions | Calving record exists, cow status updated, calf can be linked. |
| Validation Rules | Calving date required. Cannot be before relevant breeding date unless manually confirmed. |
| Acceptance Criteria | Calving updates cow timeline and reminders. Calf prompt appears. |
| Priority | Must |
| Dependencies | Calving records, calf management, reminders. |

### COW-FR-009 - Health Tracking

| Attribute | Details |
|---|---|
| Requirement ID | COW-FR-009 |
| Feature Name | Cow Health Tracking |
| Module Name | Cow Management |
| Description | The system shall show and allow navigation to cow-specific health records. |
| Business Objective | Improve treatment history and veterinary decision-making. |
| Business Rules | Health records must be date-based and linked to cow. Veterinarian name may be selected from configured list or entered where allowed. |
| User Story | As a farmer, I want to track cow health so that I know previous illness and treatment. |
| Actors | Farmer, Veterinarian, System |
| Preconditions | Cow exists. |
| Trigger | User adds or views health record. |
| Main Flow | 1. User opens health section. 2. User adds disease/treatment/medicine/vet details. 3. System saves and displays history. |
| Alternate Flow | User attaches notes or photos if supported. |
| Exception Flow | Missing disease/treatment date shows validation error. |
| Post Conditions | Health record appears in cow profile and records module. |
| Validation Rules | Date required. Cow ID required. Medicine fields length-limited. |
| Acceptance Criteria | Cow health history is complete and farm-scoped. |
| Priority | Should |
| Dependencies | Records management, veterinarian settings. |

### COW-FR-010 - Vaccination History

| Attribute | Details |
|---|---|
| Requirement ID | COW-FR-010 |
| Feature Name | Cow Vaccination History |
| Module Name | Cow Management |
| Description | The system shall display cow vaccination and deworming history and due dates. |
| Business Objective | Prevent missed preventive health activities. |
| Business Rules | Completed vaccination records must remain historical. Future due dates may create reminders. |
| User Story | As a farmer, I want to see vaccination history so that I know what is due next. |
| Actors | Farmer, Veterinarian, System |
| Preconditions | Cow exists. |
| Trigger | User opens vaccination section. |
| Main Flow | 1. System fetches vaccination records. 2. System displays completed and upcoming items. 3. User can add new record. |
| Alternate Flow | Empty state suggests adding vaccination. |
| Exception Flow | Fetch failure shows retry. |
| Post Conditions | User can review vaccination status. |
| Validation Rules | Vaccine name and date required when adding. |
| Acceptance Criteria | History matches vaccination records and reminders. |
| Priority | Should |
| Dependencies | Vaccination records, reminders. |

### COW-FR-011 - Production History

| Attribute | Details |
|---|---|
| Requirement ID | COW-FR-011 |
| Feature Name | Cow Production History |
| Module Name | Cow Management |
| Description | The system shall display cow-specific milk production history where individual production records exist. |
| Business Objective | Support animal performance review where farm tracks cow-level milk. |
| Business Rules | If the product does not require cow-wise milk entry, section should show only available linked data and avoid implying missing mandatory data. |
| User Story | As a farm owner, I want to see production history so that I can understand cow performance. |
| Actors | Farm Owner, Farmer, System |
| Preconditions | Cow exists and production data exists or empty state available. |
| Trigger | User opens production section. |
| Main Flow | 1. System fetches linked milk records. 2. System calculates totals/averages. 3. System displays trend. |
| Alternate Flow | If no cow-level data, show no individual production data message. |
| Exception Flow | Data fetch error shows retry. |
| Post Conditions | User sees available production history. |
| Validation Rules | Production values must be numeric and non-negative. |
| Acceptance Criteria | Section does not show misleading data when cow-wise entries are not used. |
| Priority | Could |
| Dependencies | Milk records, reports. |

### COW-FR-012 - Cow Timeline

| Attribute | Details |
|---|---|
| Requirement ID | COW-FR-012 |
| Feature Name | Cow Timeline |
| Module Name | Cow Management |
| Description | The system shall display a chronological timeline of major cow events. |
| Business Objective | Provide quick historical context for animal decisions. |
| Business Rules | Timeline must combine cow creation, breeding, pregnancy check, calving, health, vaccination, status changes, and important reminders. |
| User Story | As a farmer, I want one timeline so that I can understand everything that happened with a cow. |
| Actors | Farmer, Veterinarian, System |
| Preconditions | Cow exists. |
| Trigger | Cow detail page loads. |
| Main Flow | 1. System gathers linked events. 2. System sorts by date descending or selected order. 3. System displays timeline. |
| Alternate Flow | Empty timeline shows profile creation only. |
| Exception Flow | Partial data loads with warning if one source fails. |
| Post Conditions | User sees event history. |
| Validation Rules | Each event requires date, type, title, and source ID. |
| Acceptance Criteria | Timeline event dates and labels match source records. |
| Priority | Should |
| Dependencies | Records, reminders, audit logs. |

---

# 5. Module 4 - Calf Management

## 5.1 Calf Management Overview

Calf Management tracks calves from birth or purchase through active growth, care reminders, health, vaccination, parent linkage, and sold/inactive status. Calf reminders must stop for sold calves and age-based reminders must show actual current age, not future age as if already completed.

## 5.2 Calf Entity Relationships

| Entity | Relationship |
|---|---|
| Calf -> Farm | Every calf belongs to one farm. |
| Calf -> Mother Cow | Calf may be linked to one mother cow. |
| Calf -> Health Records | Calf can have many health records. |
| Calf -> Vaccination Records | Calf can have many vaccination records. |
| Calf -> Reminders | Calf can have many active or historical reminders. |

## 5.3 Calf Status Workflow

| Status | Meaning | Reminder Behavior |
|---|---|---|
| Active | Calf is present on farm | Age-based reminders active |
| Sold | Calf has been sold | Future reminders stop |
| Dead | Calf died | Future reminders stop |
| Archived | Hidden from active list | Future reminders stop unless manually enabled |

## 5.4 Calf Requirements

### CALF-FR-001 - Register Calf

| Attribute | Details |
|---|---|
| Requirement ID | CALF-FR-001 |
| Feature Name | Register Calf |
| Module Name | Calf Management |
| Description | The system shall allow users to register a calf manually or from cow calving workflow. |
| Business Objective | Maintain accurate calf inventory and care reminders. |
| Business Rules | Calf must belong to farm. Birth date cannot be future. Mother cow linkage is optional but recommended when created from calving. Gender must be captured where known. |
| User Story | As a farmer, I want to add a calf so that I can track its age, care, and health. |
| Actors | Farmer, Farm Owner, System |
| Preconditions | User has calf create permission. |
| Trigger | User taps add calf or records cow calving. |
| Main Flow | 1. User opens calf form. 2. User enters name, birth date, gender, mother cow if available. 3. System validates. 4. System saves calf. 5. System creates age-based reminders. |
| Alternate Flow | From calving, system pre-fills mother cow and birth date. |
| Exception Flow | Invalid birth date or save failure shows error. |
| Post Conditions | Calf appears in active calf list and dashboard count. |
| Validation Rules | Name required. Birth date not future. Gender must be allowed value or unknown. |
| Acceptance Criteria | Calf saves correctly and linked mother displays if selected. |
| Priority | Must |
| Dependencies | Cow management, reminder engine. |

### CALF-FR-002 - Edit Calf

| Attribute | Details |
|---|---|
| Requirement ID | CALF-FR-002 |
| Feature Name | Edit Calf |
| Module Name | Calf Management |
| Description | The system shall allow users to update calf profile fields. |
| Business Objective | Keep calf records accurate as information changes. |
| Business Rules | Editing birth date may recalculate age-based reminders. Changing status to sold must stop future calf-care reminders. |
| User Story | As a farmer, I want to edit calf details so that records remain correct. |
| Actors | Farmer, System |
| Preconditions | Calf exists in user's farm. |
| Trigger | User selects edit. |
| Main Flow | 1. System loads calf. 2. User edits fields. 3. System validates. 4. System saves. 5. Related reminders update if needed. |
| Alternate Flow | User cancels edit. |
| Exception Flow | Calf not found or unauthorized access is blocked. |
| Post Conditions | Calf profile updated. |
| Validation Rules | Birth date cannot be future. Status transition valid. |
| Acceptance Criteria | Edits reflect on calf detail, list, reminders, and reports. |
| Priority | Must |
| Dependencies | Calf database, reminder engine. |

### CALF-FR-003 - Delete Calf

| Attribute | Details |
|---|---|
| Requirement ID | CALF-FR-003 |
| Feature Name | Delete Calf |
| Module Name | Calf Management |
| Description | The system shall allow protected deletion of calf records where business rules permit. |
| Business Objective | Allow correction of accidental calf entries. |
| Business Rules | Calves with historical records should be archived or marked sold/dead instead of hard-deleted where policy requires. Confirmation is required. |
| User Story | As a farmer, I want to delete an incorrect calf entry so that my list remains clean. |
| Actors | Farmer, Farm Owner, System |
| Preconditions | Calf exists and user has delete permission. |
| Trigger | User taps delete. |
| Main Flow | 1. System shows confirmation. 2. User confirms. 3. System checks linked records. 4. System deletes or recommends archive. |
| Alternate Flow | User cancels. |
| Exception Flow | Protected deletion is blocked. |
| Post Conditions | Calf removed or archived per policy. |
| Validation Rules | Confirmation required and calf must belong to farm. |
| Acceptance Criteria | No orphan reminders remain after delete/archive. |
| Priority | Should |
| Dependencies | Reminders, health records, vaccination records. |

### CALF-FR-004 - Active and Sold Status

| Attribute | Details |
|---|---|
| Requirement ID | CALF-FR-004 |
| Feature Name | Active and Sold Status |
| Module Name | Calf Management |
| Description | The system shall allow calf status to be managed as active, sold, dead, or archived. |
| Business Objective | Ensure inventory and reminders reflect actual calf ownership. |
| Business Rules | Sold calves must not generate future reminders. Sold calves are excluded from active counts but included in history where selected. |
| User Story | As a farmer, I want to mark a calf sold so that future reminders do not appear. |
| Actors | Farmer, System |
| Preconditions | Calf exists. |
| Trigger | User updates status. |
| Main Flow | 1. User selects status. 2. System asks confirmation for sold/dead. 3. System saves status. 4. System cancels future reminders if needed. |
| Alternate Flow | User reactivates calf where policy allows. |
| Exception Flow | Invalid transition is blocked. |
| Post Conditions | Calf status and reminders updated. |
| Validation Rules | Sold date cannot be future. Status value must be allowed. |
| Acceptance Criteria | Sold calf no longer appears in future reminders or active count. |
| Priority | Must |
| Dependencies | Reminder engine, calf lists, dashboard. |

### CALF-FR-005 - Gender Tracking

| Attribute | Details |
|---|---|
| Requirement ID | CALF-FR-005 |
| Feature Name | Gender Tracking |
| Module Name | Calf Management |
| Description | The system shall capture calf gender as male, female, or unknown. |
| Business Objective | Support herd planning and reporting. |
| Business Rules | Gender can be updated if initially unknown. Gender labels must be localized. |
| User Story | As a farmer, I want to record calf gender so that I know future herd potential. |
| Actors | Farmer, System |
| Preconditions | Calf form open. |
| Trigger | User selects gender. |
| Main Flow | 1. User selects gender. 2. System saves selection. 3. Gender appears on calf profile and reports. |
| Alternate Flow | User chooses unknown. |
| Exception Flow | Unsupported value is blocked. |
| Post Conditions | Gender stored. |
| Validation Rules | Must be one of allowed values. |
| Acceptance Criteria | Gender can be saved and updated. |
| Priority | Should |
| Dependencies | Calf profile, localization. |

### CALF-FR-006 - Growth Tracking

| Attribute | Details |
|---|---|
| Requirement ID | CALF-FR-006 |
| Feature Name | Growth Tracking |
| Module Name | Calf Management |
| Description | The system shall support calf growth observations such as age, optional weight records, and care milestones where configured. |
| Business Objective | Help farmers monitor calf development. |
| Business Rules | Age must be calculated from actual birth date and current date. Future reminder labels must show actual current age and days remaining, not future age as already reached. |
| User Story | As a farmer, I want to track calf growth so that I know when care tasks are due. |
| Actors | Farmer, System |
| Preconditions | Calf has birth date. |
| Trigger | Calf profile or reminder page opens. |
| Main Flow | 1. System calculates current age. 2. System shows growth/care status. 3. User adds observations if supported. |
| Alternate Flow | If birth date missing, system asks user to add birth date. |
| Exception Flow | Invalid birth date shows correction message. |
| Post Conditions | User sees accurate age and growth context. |
| Validation Rules | Birth date not future. Age calculation timezone-safe. |
| Acceptance Criteria | Calf age displays correctly today and for upcoming reminders. |
| Priority | Should |
| Dependencies | Date utility, calf profile, reminders. |

### CALF-FR-007 - Parent Linking

| Attribute | Details |
|---|---|
| Requirement ID | CALF-FR-007 |
| Feature Name | Parent Linking |
| Module Name | Calf Management |
| Description | The system shall allow linking a calf to its mother cow and optional father/bull information. |
| Business Objective | Maintain lineage and calving history. |
| Business Rules | Mother cow must belong to same farm. Linked calf should appear in cow calving history. |
| User Story | As a farmer, I want to link calf to mother so that history is clear. |
| Actors | Farmer, System |
| Preconditions | Cow exists or calf is being created from calving. |
| Trigger | User selects mother cow. |
| Main Flow | 1. User opens parent field. 2. System lists eligible cows. 3. User selects mother. 4. System saves link. |
| Alternate Flow | User leaves mother unknown. |
| Exception Flow | Cow from another farm cannot be linked. |
| Post Conditions | Parent-child relationship stored. |
| Validation Rules | Mother cow ID must be farm-scoped. |
| Acceptance Criteria | Cow profile shows linked calf and calf profile shows mother. |
| Priority | Should |
| Dependencies | Cow management, calving records. |

### CALF-FR-008 - Calf Health Records

| Attribute | Details |
|---|---|
| Requirement ID | CALF-FR-008 |
| Feature Name | Calf Health Records |
| Module Name | Calf Management |
| Description | The system shall support calf-specific health records. |
| Business Objective | Maintain calf treatment and illness history. |
| Business Rules | Health records for sold/dead calves remain historical but future health reminders stop unless manually created. |
| User Story | As a farmer, I want to record calf treatment so that I can refer to it later. |
| Actors | Farmer, Veterinarian, System |
| Preconditions | Calf exists. |
| Trigger | User adds health record. |
| Main Flow | 1. User enters disease/treatment/date. 2. System validates. 3. System saves and links to calf. |
| Alternate Flow | User selects veterinarian from saved list. |
| Exception Flow | Missing date or treatment shows error. |
| Post Conditions | Health record appears on calf profile. |
| Validation Rules | Date required and not future unless follow-up date. |
| Acceptance Criteria | Calf health history displays correct records. |
| Priority | Should |
| Dependencies | Records management, veterinarian settings. |

### CALF-FR-009 - Calf Vaccination Records

| Attribute | Details |
|---|---|
| Requirement ID | CALF-FR-009 |
| Feature Name | Calf Vaccination Records |
| Module Name | Calf Management |
| Description | The system shall track calf vaccination records and due dates. |
| Business Objective | Improve preventive calf health care. |
| Business Rules | Vaccination reminders depend on active calf status and due date. Sold calves must not receive future vaccination reminders. |
| User Story | As a farmer, I want calf vaccination reminders so that I do not miss vaccines. |
| Actors | Farmer, System |
| Preconditions | Calf active and birth date or vaccine schedule available. |
| Trigger | Calf added, vaccine recorded, or reminder engine runs. |
| Main Flow | 1. System calculates due vaccines. 2. User records vaccine. 3. System updates history and next due reminder. |
| Alternate Flow | User creates manual vaccine reminder. |
| Exception Flow | Invalid schedule shows manual entry prompt. |
| Post Conditions | Vaccination history and reminders updated. |
| Validation Rules | Vaccine name and date required. |
| Acceptance Criteria | Due reminders appear only for active calves. |
| Priority | Should |
| Dependencies | Reminder engine, vaccination records. |

### CALF-FR-010 - Calf Care Reminders

| Attribute | Details |
|---|---|
| Requirement ID | CALF-FR-010 |
| Feature Name | Calf Care Reminders |
| Module Name | Calf Management |
| Description | The system shall generate calf care reminders such as dehorning, milk reduction/weaning, vaccination, and deworming according to configured age rules. |
| Business Objective | Help farmers complete age-based calf care tasks on time. |
| Business Rules | Reminder generation must check calf status. Dehorning reminder target range is configurable. Age messages must use current age and due date. |
| User Story | As a farmer, I want calf care reminders so that I do not miss important care tasks. |
| Actors | Farmer, System |
| Preconditions | Active calf with birth date. |
| Trigger | Calf registration, date change, reminder engine run. |
| Main Flow | 1. System reads calf birth date. 2. System calculates due tasks. 3. System creates reminders. 4. User completes or snoozes. |
| Alternate Flow | User manually creates custom calf reminder. |
| Exception Flow | Missing birth date prevents age-based reminder and prompts update. |
| Post Conditions | Active calf reminders exist accurately. |
| Validation Rules | Due dates must be calculated from birth date. Sold calves excluded. |
| Acceptance Criteria | No future reminders appear for sold calves. Upcoming reminders show days remaining correctly. |
| Priority | Must |
| Dependencies | Reminder engine, calf status, date utility. |

---

# 6. Module 5 - Records Management

## 6.1 Records Management Overview

Records Management centralizes operational farm records: milk, feed, health, vaccination, breeding, artificial insemination, and calving. Each record must be farm-scoped, validated, searchable, and available to reports and reminders where applicable.

## 6.2 Records Requirements

### REC-FR-001 - Add Milk Record

| Attribute | Details |
|---|---|
| Requirement ID | REC-FR-001 |
| Feature Name | Add Milk Record |
| Module Name | Records Management |
| Description | The system shall allow users to add daily milk records with morning milk, evening milk, and total milk. |
| Business Objective | Digitize daily milk production and support dashboard, reports, goals, and accounting. |
| Business Rules | Milk record belongs to farm and date. Morning and evening values are non-negative. Total milk is calculated as morning + evening. Duplicate records for same date/session must be handled by update or warning rule. |
| User Story | As a farmer, I want to add milk records so that I can track production accurately. |
| Actors | Farmer, Farm Owner, System |
| Preconditions | User has record create permission. |
| Trigger | User opens milk record form. |
| Main Flow | 1. User selects date. 2. User enters morning/evening milk. 3. System calculates total. 4. User saves. 5. Dashboard/reports update. |
| Alternate Flow | User enters only one session and saves partial day. |
| Exception Flow | Negative value or invalid date blocks save. |
| Post Conditions | Milk record saved and available to reports. |
| Validation Rules | Date required. Values numeric and >= 0. Total = morning + evening. |
| Acceptance Criteria | Saved milk appears in dashboard and monthly reports. Total calculation is accurate. |
| Priority | Must |
| Dependencies | Dashboard, reports, goals, accounting. |

### REC-FR-002 - Feed Record

| Attribute | Details |
|---|---|
| Requirement ID | REC-FR-002 |
| Feature Name | Feed Record |
| Module Name | Records Management |
| Description | The system shall allow users to record feed purchases or feed usage with type, quantity, unit, rate, and cost where applicable. |
| Business Objective | Track feed-related costs and operational usage. |
| Business Rules | Feed expense inclusion in monthly expenses must follow approved accounting rule. If feed is recorded for information only, reports must label it accordingly. If configured as expense, it must reflect in monthly expense. |
| User Story | As a farmer, I want to record feed so that I know feed usage and cost. |
| Actors | Farmer, Farm Owner, System |
| Preconditions | User has record create permission. |
| Trigger | User opens feed record form. |
| Main Flow | 1. User selects feed type. 2. User enters quantity and rate or direct amount. 3. System calculates cost. 4. User saves. |
| Alternate Flow | User enters direct amount only. |
| Exception Flow | Invalid quantity/rate shows error. |
| Post Conditions | Feed record saved and reflected according to accounting rules. |
| Validation Rules | Date required. Quantity/rate non-negative. Cost = quantity x rate when both provided. |
| Acceptance Criteria | Feed record appears in records and correct monthly expense behavior is applied. |
| Priority | Should |
| Dependencies | Accounting rules, records, reports. |

### REC-FR-003 - Health Record

| Attribute | Details |
|---|---|
| Requirement ID | REC-FR-003 |
| Feature Name | Health Record |
| Module Name | Records Management |
| Description | The system shall allow users to record animal health events including disease, treatment, medicine, veterinarian, and notes. |
| Business Objective | Maintain treatment history and support animal care decisions. |
| Business Rules | Health record must link to cow or calf. Veterinarian may be selected from configured list. Follow-up reminder may be created if due date is provided. |
| User Story | As a farmer, I want to record treatment details so that I can track animal health. |
| Actors | Farmer, Veterinarian, System |
| Preconditions | Animal exists. |
| Trigger | User opens health record form. |
| Main Flow | 1. User selects animal. 2. User enters disease, treatment, medicine, vet, date. 3. System validates. 4. System saves. 5. Optional follow-up reminder is created. |
| Alternate Flow | User adds general health note without medicine. |
| Exception Flow | Missing animal or date blocks save. |
| Post Conditions | Health record linked to animal. |
| Validation Rules | Animal required. Date required. Text limits enforced. |
| Acceptance Criteria | Health record appears in animal profile and records list. |
| Priority | Must |
| Dependencies | Cow/calf management, veterinarian settings, reminders. |

### REC-FR-004 - Vaccination Record

| Attribute | Details |
|---|---|
| Requirement ID | REC-FR-004 |
| Feature Name | Vaccination Record |
| Module Name | Records Management |
| Description | The system shall allow users to record vaccination or deworming events and next due dates. |
| Business Objective | Prevent missed preventive care activities. |
| Business Rules | Vaccine name and date are required. Next due date creates a reminder if provided. Sold/inactive animals should not receive new automatic reminders unless manually confirmed. |
| User Story | As a farmer, I want to record vaccines so that I know what is done and what is due next. |
| Actors | Farmer, Veterinarian, System |
| Preconditions | Animal exists. |
| Trigger | User adds vaccination record. |
| Main Flow | 1. User selects animal. 2. User enters vaccine and date. 3. User enters next due date if applicable. 4. System saves. 5. Reminder created if due date exists. |
| Alternate Flow | User records historical vaccine without due date. |
| Exception Flow | Invalid due date or missing vaccine blocks save. |
| Post Conditions | Vaccination history and reminder state updated. |
| Validation Rules | Vaccine required. Date required. Due date must be after vaccination date. |
| Acceptance Criteria | Record appears in animal profile and due reminders are correct. |
| Priority | Must |
| Dependencies | Reminders, cow/calf profiles. |

### REC-FR-005 - Breeding Record

| Attribute | Details |
|---|---|
| Requirement ID | REC-FR-005 |
| Feature Name | Breeding Record |
| Module Name | Records Management |
| Description | The system shall allow users to record breeding events including date, method, bull/semen information, and expected pregnancy check. |
| Business Objective | Track reproductive lifecycle and generate accurate pregnancy reminders. |
| Business Rules | Breeding date cannot be future. Recording a new breeding for the same cow may supersede previous unresolved breeding and mark it as not pregnant where business rules require. |
| User Story | As a farmer, I want to record breeding so that the app reminds me about pregnancy check. |
| Actors | Farmer, Veterinarian, System |
| Preconditions | Cow exists and is active. |
| Trigger | User adds breeding record. |
| Main Flow | 1. User selects cow. 2. User enters breeding date and method. 3. System calculates pregnancy check due date. 4. System saves and creates reminder. |
| Alternate Flow | User enters manual pregnancy check date. |
| Exception Flow | Inactive cow or invalid date blocks save. |
| Post Conditions | Breeding record and pregnancy check reminder created. |
| Validation Rules | Cow required. Date not future. Method must be allowed value. |
| Acceptance Criteria | Pregnancy check reminder appears at correct time. Previous unresolved breeding handled correctly. |
| Priority | Must |
| Dependencies | Cow management, reminders. |

### REC-FR-006 - Artificial Insemination Record

| Attribute | Details |
|---|---|
| Requirement ID | REC-FR-006 |
| Feature Name | Artificial Insemination Record |
| Module Name | Records Management |
| Description | The system shall allow users to record artificial insemination details as a specialized breeding record. |
| Business Objective | Maintain accurate reproduction service history. |
| Business Rules | AI here means artificial insemination, not AI assistant. AI record must link to cow and breeding workflow. Semen/bull details are optional but recommended. |
| User Story | As a farmer, I want to record AI service so that pregnancy tracking is accurate. |
| Actors | Farmer, Veterinarian, System |
| Preconditions | Cow exists and active. |
| Trigger | User selects AI record. |
| Main Flow | 1. User selects cow. 2. User enters AI date, technician/vet, semen/bull details. 3. System calculates pregnancy check due. 4. System saves. |
| Alternate Flow | User saves minimal AI record with date only. |
| Exception Flow | Invalid cow/date blocks save. |
| Post Conditions | AI record exists and reminders updated. |
| Validation Rules | Cow and AI date required. AI date not future. |
| Acceptance Criteria | AI record appears in cow timeline and reminder engine. |
| Priority | Should |
| Dependencies | Breeding records, reminders, veterinarian settings. |

### REC-FR-007 - Calving Record

| Attribute | Details |
|---|---|
| Requirement ID | REC-FR-007 |
| Feature Name | Calving Record |
| Module Name | Records Management |
| Description | The system shall allow users to record calving event, calf information, and complications. |
| Business Objective | Maintain reproduction history and trigger calf workflow. |
| Business Rules | Calving record must link to cow. Calf registration should be offered. Pregnancy-related future reminders should close. |
| User Story | As a farmer, I want to record calving so that cow and calf history is accurate. |
| Actors | Farmer, System |
| Preconditions | Cow exists. |
| Trigger | User records calving. |
| Main Flow | 1. User selects cow. 2. User enters calving date and outcome. 3. User enters calf details or skips. 4. System saves. 5. Cow status and reminders update. |
| Alternate Flow | User records complication notes without calf details. |
| Exception Flow | Future calving date blocks save. |
| Post Conditions | Calving record saved, cow lifecycle updated, calf link optional. |
| Validation Rules | Cow required. Calving date required and not future. |
| Acceptance Criteria | Calving appears in cow timeline and calf prompt works. |
| Priority | Must |
| Dependencies | Cow management, calf management, reminders. |

### REC-FR-008 - Record Search, Edit, and Delete

| Attribute | Details |
|---|---|
| Requirement ID | REC-FR-008 |
| Feature Name | Record Search, Edit, and Delete |
| Module Name | Records Management |
| Description | The system shall allow users to search, filter, edit, and delete records according to permissions and business rules. |
| Business Objective | Enable correction and review of farm records. |
| Business Rules | Editing or deleting source records must update dependent summaries and reminders. Deletion requires confirmation. Financial-impacting records should be audited. |
| User Story | As a farm owner, I want to correct records so that reports stay accurate. |
| Actors | Farmer, Farm Owner, System |
| Preconditions | Records exist. User has permission. |
| Trigger | User searches, edits, or deletes record. |
| Main Flow | 1. User opens records list. 2. User filters by type/date/animal. 3. User opens record. 4. User edits or deletes. 5. System validates and updates dependent data. |
| Alternate Flow | User cancels edit/delete. |
| Exception Flow | Protected record deletion is blocked. |
| Post Conditions | Record state and dependent summaries are consistent. |
| Validation Rules | Record ID must belong to farm. Date filters valid. Confirmation required for delete. |
| Acceptance Criteria | Search returns correct results. Edit/delete updates dashboard/reports/reminders where applicable. |
| Priority | Must |
| Dependencies | All record types, dashboard, reports, reminders, audit logs. |

## 6.3 Records Localized Messages

| Scenario | Marathi | English |
|---|---|---|
| Record saved | नोंद यशस्वीरित्या जतन झाली. | Record saved successfully. |
| Record deleted | नोंद काढली गेली. | Record deleted. |
| Invalid date | तारीख योग्य नाही. | Date is invalid. |
| Negative amount | रक्कम ० पेक्षा कमी असू शकत नाही. | Amount cannot be less than 0. |
| Animal required | जनावर निवडणे आवश्यक आहे. | Animal selection is required. |

---

# 7. Module 6 - Reminders

## 7.1 Reminders Module Overview

The Reminders module generates, displays, notifies, snoozes, completes, and manages reminders. Reminder accuracy is critical because incorrect reminders can cause farmer confusion and missed animal-care activities.

## 7.2 Reminder Global Business Rules

| Rule ID | Rule |
|---|---|
| REM-BR-001 | Reminders must be farm-scoped and user-access controlled. |
| REM-BR-002 | Completed reminders must not appear as active. |
| REM-BR-003 | Future reminders for sold, dead, or archived animals must be stopped unless manually created. |
| REM-BR-004 | Duplicate reminders for the same animal, type, and due date must be prevented. |
| REM-BR-005 | Reminder dates must be calculated using farm/user timezone. |
| REM-BR-006 | Snoozed reminders must preserve original due date and record snooze history. |
| REM-BR-007 | Lifecycle reminders must be recalculated when birth date, breeding date, pregnancy status, calving date, or animal status changes. |

## 7.3 Reminder Requirements

### REM-FR-001 - Reminder Engine

| Attribute | Details |
|---|---|
| Requirement ID | REM-FR-001 |
| Feature Name | Reminder Engine |
| Module Name | Reminders |
| Description | The system shall generate reminders based on configured animal lifecycle, farm activity, and custom rules. |
| Business Objective | Prevent missed farm tasks and animal-care events. |
| Business Rules | Engine must avoid duplicates, exclude inactive animals, and update reminders after lifecycle changes. |
| User Story | As a farmer, I want automatic reminders so that I do not forget important work. |
| Actors | System, Farmer |
| Preconditions | Farm data exists. Reminder rules are configured. |
| Trigger | Animal created/updated, record created, daily job, app load, or manual refresh. |
| Main Flow | 1. Engine reads source data. 2. Engine evaluates rules. 3. Engine creates, updates, or cancels reminders. 4. User views reminders. |
| Alternate Flow | Manual custom reminders bypass automatic rule generation but still follow status and date validation. |
| Exception Flow | Rule evaluation failure logs error and does not create unsafe reminders. |
| Post Conditions | Reminder list reflects current farm state. |
| Validation Rules | Type, due date, status, farm ID, source entity required. |
| Acceptance Criteria | Duplicate reminders are not created. Sold calves/cows do not receive future automatic reminders. |
| Priority | Must |
| Dependencies | Cow, calf, records, notifications, date utilities. |

### REM-FR-002 - Pregnancy Check Reminder

| Attribute | Details |
|---|---|
| Requirement ID | REM-FR-002 |
| Feature Name | Pregnancy Check Reminder |
| Module Name | Reminders |
| Description | The system shall create pregnancy check reminders after breeding or artificial insemination according to configured due interval. |
| Business Objective | Ensure pregnancy status is confirmed on time. |
| Business Rules | Reminder is created only for active cows with unresolved breeding. If pregnancy is confirmed, reminder completes. If not pregnant, repeat breeding logic may apply. If another breeding occurs, previous unresolved breeding must be superseded. |
| User Story | As a farmer, I want pregnancy check reminders so that I know whether cow is pregnant. |
| Actors | Farmer, Veterinarian, System |
| Preconditions | Active cow has breeding/AI record. |
| Trigger | Breeding record saved or reminder engine runs. |
| Main Flow | 1. System calculates pregnancy check due date. 2. Reminder is created. 3. User opens reminder. 4. User records pregnant, not pregnant, or snooze. 5. System updates cow and breeding status. |
| Alternate Flow | User postpones reminder and system creates snoozed due date. |
| Exception Flow | If reminder source is missing, system shows clear message and logs issue instead of generic not found. |
| Post Conditions | Cow pregnancy status and reminders are updated. |
| Validation Rules | Breeding date required. Due date after breeding date. Reminder ID must exist for action. |
| Acceptance Criteria | Pregnancy reminder actions work. Snooze does not show "reminder not found" for valid reminder. |
| Priority | Must |
| Dependencies | Breeding records, cow status, notification settings. |

### REM-FR-003 - Calving Reminder

| Attribute | Details |
|---|---|
| Requirement ID | REM-FR-003 |
| Feature Name | Calving Reminder |
| Module Name | Reminders |
| Description | The system shall create reminders before expected calving date for pregnant cows. |
| Business Objective | Help farmers prepare for delivery. |
| Business Rules | Reminder is based on confirmed pregnancy and expected calving date. If cow calves early, future calving reminders close. If pregnancy is marked not pregnant, calving reminders cancel. |
| User Story | As a farmer, I want calving reminders so that I can prepare in advance. |
| Actors | Farmer, System |
| Preconditions | Cow is pregnant with expected calving date. |
| Trigger | Pregnancy confirmed or expected calving date updated. |
| Main Flow | 1. System calculates reminder dates. 2. Reminder appears before due. 3. User records calving or snoozes. 4. System updates cow lifecycle. |
| Alternate Flow | Early calving recorded manually closes reminder. |
| Exception Flow | Missing expected date prevents reminder and shows data quality prompt. |
| Post Conditions | Calving preparation task is visible and actionable. |
| Validation Rules | Expected date required and after breeding date. |
| Acceptance Criteria | Calving reminder appears for pregnant cows only and closes after calving. |
| Priority | Must |
| Dependencies | Cow pregnancy, calving records. |

### REM-FR-004 - Dry Off Reminder

| Attribute | Details |
|---|---|
| Requirement ID | REM-FR-004 |
| Feature Name | Dry Off Reminder |
| Module Name | Reminders |
| Description | The system shall create dry-off reminders before expected calving date according to configured interval. |
| Business Objective | Support proper pre-calving milk stop management. |
| Business Rules | Dry-off reminder should be created for pregnant milking cows, commonly around 60 days before calving unless configured otherwise. It must not be tied to calf weaning reminders. |
| User Story | As a farmer, I want dry-off reminders so that I know when to stop milking a pregnant cow. |
| Actors | Farmer, System |
| Preconditions | Pregnant cow has expected calving date. |
| Trigger | Expected calving date created/updated. |
| Main Flow | 1. System calculates dry-off due date. 2. Reminder is created. 3. User completes when dry-off is done. |
| Alternate Flow | User snoozes if vet advises delay. |
| Exception Flow | If expected calving date is too close/past, system flags manual review. |
| Post Conditions | Dry-off task tracked. |
| Validation Rules | Dry-off due date must be before expected calving date. |
| Acceptance Criteria | Cow dry-off reminder appears independently from calf care reminders. |
| Priority | Must |
| Dependencies | Pregnancy tracking, reminder engine. |

### REM-FR-005 - Vaccination Reminder

| Attribute | Details |
|---|---|
| Requirement ID | REM-FR-005 |
| Feature Name | Vaccination Reminder |
| Module Name | Reminders |
| Description | The system shall create vaccination reminders based on vaccine due dates and schedules. |
| Business Objective | Improve preventive health compliance. |
| Business Rules | Reminder requires animal, vaccine, and due date. Completed vaccine record completes or closes corresponding reminder. Sold/inactive animals excluded from automatic future reminders. |
| User Story | As a farmer, I want vaccination reminders so that I do not miss vaccines. |
| Actors | Farmer, Veterinarian, System |
| Preconditions | Animal active and vaccination schedule/due date exists. |
| Trigger | Vaccination record saved, animal created, or engine runs. |
| Main Flow | 1. System creates due reminder. 2. User receives/views reminder. 3. User records vaccination. 4. Reminder completes. |
| Alternate Flow | User snoozes due date. |
| Exception Flow | Missing animal/vaccine data shows manual correction. |
| Post Conditions | Vaccination status updated. |
| Validation Rules | Due date valid. Animal active. |
| Acceptance Criteria | Completed vaccination removes active reminder and creates next due where applicable. |
| Priority | Must |
| Dependencies | Vaccination records, notifications. |

### REM-FR-006 - Deworming Reminder

| Attribute | Details |
|---|---|
| Requirement ID | REM-FR-006 |
| Feature Name | Deworming Reminder |
| Module Name | Reminders |
| Description | The system shall create deworming reminders for active animals based on schedule or manual due date. |
| Business Objective | Support preventive parasite control. |
| Business Rules | Deworming reminder must be linked to animal or herd scope. Completion may create next schedule based on configured interval. |
| User Story | As a farmer, I want deworming reminders so that animals receive timely care. |
| Actors | Farmer, System |
| Preconditions | Active animal or herd schedule exists. |
| Trigger | Schedule run or manual due date entry. |
| Main Flow | 1. System calculates due date. 2. Reminder appears. 3. User records deworming. 4. System completes reminder. |
| Alternate Flow | User snoozes or marks not applicable. |
| Exception Flow | Inactive animal prevents reminder creation. |
| Post Conditions | Deworming history and future reminders updated. |
| Validation Rules | Due date required. Animal status active. |
| Acceptance Criteria | Deworming reminders are accurate and not duplicated. |
| Priority | Should |
| Dependencies | Health/vaccination records, reminder engine. |

### REM-FR-007 - Calf Care Reminder

| Attribute | Details |
|---|---|
| Requirement ID | REM-FR-007 |
| Feature Name | Calf Care Reminder |
| Module Name | Reminders |
| Description | The system shall create age-based calf care reminders such as dehorning and milk reduction/weaning according to configured ranges. |
| Business Objective | Help farmers complete calf care tasks at correct age. |
| Business Rules | Only active calves with birth date are eligible. Sold calves excluded. Reminder message must show actual current calf age and days remaining. Dehorning reminder range must follow configured business rule. |
| User Story | As a farmer, I want calf care reminders so that calves get timely care. |
| Actors | Farmer, System |
| Preconditions | Active calf with valid birth date. |
| Trigger | Calf creation, date change, reminder engine run. |
| Main Flow | 1. System calculates calf age. 2. System evaluates due care tasks. 3. System creates reminders. 4. User completes task. |
| Alternate Flow | User snoozes due date. |
| Exception Flow | Missing birth date prompts user to update calf profile. |
| Post Conditions | Calf care task tracked. |
| Validation Rules | Birth date not future. Calf active. Due range valid. |
| Acceptance Criteria | Sold calves have no future calf-care reminders. Upcoming message shows current age, not future completed age. |
| Priority | Must |
| Dependencies | Calf management, date utility. |

### REM-FR-008 - Custom Reminder

| Attribute | Details |
|---|---|
| Requirement ID | REM-FR-008 |
| Feature Name | Custom Reminder |
| Module Name | Reminders |
| Description | The system shall allow users to create custom reminders with title, date, optional animal link, notes, repeat, and notification preference. |
| Business Objective | Support farm-specific tasks not covered by automatic rules. |
| Business Rules | Custom reminder must have title and due date. Repeat reminders must define valid frequency. Animal link must belong to farm. |
| User Story | As a farmer, I want to add my own reminder so that I can remember any farm task. |
| Actors | Farmer, Farm Owner, System |
| Preconditions | User has reminder create permission. |
| Trigger | User selects add custom reminder. |
| Main Flow | 1. User enters title/date. 2. User optionally selects animal/repeat. 3. System validates. 4. Reminder saved. |
| Alternate Flow | User creates one-time reminder without animal. |
| Exception Flow | Invalid date or missing title blocks save. |
| Post Conditions | Custom reminder appears in reminder list and dashboard. |
| Validation Rules | Title required. Due date required. Repeat frequency valid. |
| Acceptance Criteria | Custom reminder can be created, completed, snoozed, and deleted. |
| Priority | Should |
| Dependencies | Notification settings, reminder list. |

### REM-FR-009 - Snooze Reminder

| Attribute | Details |
|---|---|
| Requirement ID | REM-FR-009 |
| Feature Name | Snooze Reminder |
| Module Name | Reminders |
| Description | The system shall allow users to postpone an active reminder to a later date. |
| Business Objective | Allow practical scheduling flexibility without losing task history. |
| Business Rules | Snooze must preserve original due date and record new due date. Snooze cannot be before current date unless policy allows. |
| User Story | As a farmer, I want to postpone a reminder so that I can do it later. |
| Actors | Farmer, System |
| Preconditions | Reminder exists and is active. |
| Trigger | User taps postpone/snooze. |
| Main Flow | 1. User opens reminder action. 2. User selects new date or duration. 3. System validates reminder exists. 4. System updates due date and logs snooze. |
| Alternate Flow | User cancels. |
| Exception Flow | If reminder not found, show meaningful message and refresh list. |
| Post Conditions | Reminder appears with updated due date. |
| Validation Rules | Reminder ID required. New due date valid. |
| Acceptance Criteria | Snooze works without "reminder not found" for valid reminders. |
| Priority | Must |
| Dependencies | Reminder database, audit log. |

### REM-FR-010 - Complete Reminder

| Attribute | Details |
|---|---|
| Requirement ID | REM-FR-010 |
| Feature Name | Complete Reminder |
| Module Name | Reminders |
| Description | The system shall allow users to mark reminders complete and optionally create related records. |
| Business Objective | Track task completion and keep active list clean. |
| Business Rules | Completing certain reminders must open related workflow, such as pregnancy check, vaccination record, calving record, or health record. Completion must update source state. |
| User Story | As a farmer, I want to complete reminders so that the app knows work is done. |
| Actors | Farmer, System |
| Preconditions | Reminder exists and active. |
| Trigger | User taps complete or related action button. |
| Main Flow | 1. User opens reminder. 2. User selects completion action. 3. System collects required information if needed. 4. System saves related record. 5. Reminder marked complete. |
| Alternate Flow | Reminder is informational and completes directly. |
| Exception Flow | Related record save failure prevents completion and shows error. |
| Post Conditions | Reminder no longer active and related state updated. |
| Validation Rules | Required completion fields depend on reminder type. |
| Acceptance Criteria | Completed reminders disappear from active lists and appear in history if available. |
| Priority | Must |
| Dependencies | Records, cow/calf status, dashboard. |

### REM-FR-011 - Reminder Notification Delivery

| Attribute | Details |
|---|---|
| Requirement ID | REM-FR-011 |
| Feature Name | Reminder Notification Delivery |
| Module Name | Reminders |
| Description | The system shall notify users of due reminders through in-app and configured notification channels. |
| Business Objective | Increase reminder completion and reduce missed tasks. |
| Business Rules | Notification delivery must respect user notification settings, quiet hours, and permissions. Push notification failure must not delete reminder. |
| User Story | As a farmer, I want reminders to notify me so that I do not need to open the app every time. |
| Actors | User, System |
| Preconditions | Reminder due and notification settings enabled. |
| Trigger | Reminder due window is reached. |
| Main Flow | 1. System evaluates due reminders. 2. System checks user settings. 3. System sends notification. 4. Delivery is logged. |
| Alternate Flow | If push unavailable, in-app notification remains. |
| Exception Flow | Failed delivery is logged and may retry based on policy. |
| Post Conditions | User receives reminder or delivery failure is traceable. |
| Validation Rules | User and reminder must be active. Channel preference respected. |
| Acceptance Criteria | Notifications are sent only when enabled and due. Delivery failures do not corrupt reminder state. |
| Priority | Should |
| Dependencies | Notifications, settings, service worker/push channel. |

## 7.4 Reminder Notification Timing Matrix

| Reminder Type | Trigger Logic | Notification Timing | Repeat Behavior | Escalation |
|---|---|---|---|---|
| Pregnancy Check | Breeding/AI date + configured interval | Before due and on due date | Snooze or complete | Overdue badge after due date |
| Calving | Expected calving date | Configured days before, on due | Snooze until calving recorded | Urgent if overdue |
| Dry Off | Expected calving date - dry-off interval | Before dry-off due and on due | Snooze or complete | Warning if missed |
| Vaccination | Vaccine due date | Before due and on due | Next due after completion if schedule exists | Overdue badge |
| Deworming | Deworming due date or interval | Before due and on due | Repeat by schedule if configured | Overdue badge |
| Calf Care | Calf age reaches configured range | At start of range and during due window | Complete or snooze | Warning after range end |
| Custom | User-defined date | On selected date/time | Optional repeat | No escalation unless user configured |

## 7.5 Reminder Localized Messages

| Scenario | Marathi | English |
|---|---|---|
| Reminder completed | आठवण पूर्ण झाली. | Reminder completed. |
| Reminder snoozed | आठवण पुढे ढकलली. | Reminder postponed. |
| Reminder not found | आठवण सापडली नाही. यादी पुन्हा लोड करा. | Reminder not found. Please refresh the list. |
| Pregnancy check due | गर्भधारणा तपासणीची वेळ झाली आहे. | Pregnancy check is due. |
| Calving due soon | व्यायण जवळ आले आहे. तयारी करा. | Calving is near. Please prepare. |
| Calf care due | वासराच्या काळजीची वेळ झाली आहे. | Calf care task is due. |

---

# 8. Cross-Module Use Cases

## UC-001 - New Farmer Starts Using App

| Field | Description |
|---|---|
| Primary Actor | Farmer |
| Scope | Authentication, onboarding, dashboard |
| Scenario | Farmer signs up, selects language, creates farm, lands on dashboard. |
| Success Outcome | User can start adding cows and records in selected language. |

## UC-002 - Cow Calves and Calf Is Registered

| Field | Description |
|---|---|
| Primary Actor | Farmer |
| Scope | Cow Management, Calf Management, Records, Reminders |
| Scenario | Farmer records calving for cow and adds calf from prompt. |
| Success Outcome | Cow status updates, calf is linked, pregnancy reminders close, calf reminders begin. |

## UC-003 - Breeding to Pregnancy Check

| Field | Description |
|---|---|
| Primary Actor | Farmer |
| Scope | Records, Cow Management, Reminders |
| Scenario | Farmer records breeding, app creates pregnancy check reminder, farmer records result. |
| Success Outcome | Cow pregnancy status and future reminders are accurate. |

## UC-004 - Daily Milk Entry Updates Dashboard

| Field | Description |
|---|---|
| Primary Actor | Farmer |
| Scope | Records, Dashboard |
| Scenario | Farmer records morning and evening milk. |
| Success Outcome | Dashboard today milk and goal progress update. |

## UC-005 - Sold Calf Does Not Receive Future Reminders

| Field | Description |
|---|---|
| Primary Actor | Farmer |
| Scope | Calf Management, Reminders |
| Scenario | Farmer marks calf as sold. |
| Success Outcome | Future automatic reminders for the calf are cancelled or hidden. |

---

# 9. Cross-Module Edge Cases

| Edge Case ID | Edge Case | Expected Handling |
|---|---|---|
| EC-001 | User refreshes app during onboarding. | Resume current onboarding step without losing language preference. |
| EC-002 | User logs in on iPhone after Android use. | Session and language load correctly; protected tabs do not redirect incorrectly. |
| EC-003 | Cow is sold with future pregnancy reminders. | Future reminders are cancelled or hidden. |
| EC-004 | Calf sold before age-based reminders become due. | Future calf reminders do not appear. |
| EC-005 | Birth date changed after reminders created. | Age-based reminders recalculate. |
| EC-006 | New breeding added before pregnancy result for previous breeding. | Previous breeding is marked not pregnant/superseded according to rule. |
| EC-007 | Milk record deleted after dashboard loaded. | Dashboard refresh reflects deletion. |
| EC-008 | User attempts cross-farm record access by URL. | Access denied or not found without data leakage. |
| EC-009 | Offline record saved then synced. | Duplicate prevention and sync status applied. |
| EC-010 | Language changed while form is open. | Labels/messages update without data loss. |

---

# 10. Security Considerations

| Area | Requirement |
|---|---|
| Farm Isolation | Every record query and mutation must validate farm context. |
| Protected Routes | Unauthenticated users must be redirected to login. |
| Role Permissions | Create, edit, delete, and admin actions must check role permissions. |
| Sensitive Data | Passwords and PINs must never be stored or logged in plain text. |
| Audit Logs | Security-sensitive actions and financial-impacting changes should be auditable. |
| Input Validation | All user inputs must be validated on client and server. |
| Error Safety | Errors must not expose database IDs, stack traces, or private farm data. |
| Offline Storage | Offline data must be scoped and cleared appropriately on logout where required. |

---

# 11. Localization Requirements

## 11.1 Supported Languages

| Code | Language | Default |
|---|---|---|
| mr | Marathi | Yes |
| en | English | No |

## 11.2 Localization Rules

- All visible labels, buttons, helper text, validation messages, empty states, notifications, and confirmation dialogs must use translation keys.
- Hardcoded Marathi or English text is not allowed in reusable components.
- Dynamic values such as dates, currency, and liters must be formatted according to selected language.
- User-entered data such as cow names and notes must not be translated.
- If translation key is missing, system must fallback safely and log missing key.

## 11.3 Common Labels

| Key | Marathi | English |
|---|---|---|
| common.save | जतन करा | Save |
| common.cancel | रद्द करा | Cancel |
| common.edit | संपादित करा | Edit |
| common.delete | काढून टाका | Delete |
| common.archive | संग्रहित करा | Archive |
| common.complete | पूर्ण करा | Complete |
| common.snooze | पुढे ढकला | Postpone |
| common.retry | पुन्हा प्रयत्न करा | Retry |
| common.loading | लोड होत आहे | Loading |
| common.noData | माहिती उपलब्ध नाही | No data available |

---

# 12. Traceability Summary

| Business Objective | Related Requirements |
|---|---|
| BO-001 Record Digitization | AUTH-FR-001, COW-FR-001, CALF-FR-001, REC-FR-001 to REC-FR-008 |
| BO-002 Milk Record Discipline | DASH-FR-002, REC-FR-001, REM-FR-011 |
| BO-003 Reminder Completion | REM-FR-001 to REM-FR-011, DASH-FR-006 |
| BO-004 Financial Clarity | DASH-FR-003, REC-FR-001, REC-FR-002 |
| BO-007 Multilingual Adoption | AUTH-FR-008, AUTH-FR-009, Localization Requirements |
| BO-008 Data-Driven Decisions | DASH-FR-003, DASH-FR-008, DASH-FR-010, COW-FR-011 |

---

# 13. Phase 2 Completion Criteria

Phase 2 is considered complete when:

1. All requirements in this document are reviewed by product and business stakeholders.
2. Requirement IDs are approved and reserved.
3. Acceptance criteria are clear enough for QA test case creation.
4. Dependencies and cross-module impacts are documented.
5. Localization expectations are confirmed.
6. Any open questions are moved to an issue log for later clarification.

---

# Appendix A - Requirement Inventory

| Module | Requirement Count | ID Range |
|---|---:|---|
| Authentication | 12 | AUTH-FR-001 to AUTH-FR-012 |
| Home Dashboard | 10 | DASH-FR-001 to DASH-FR-010 |
| Cow Management | 12 | COW-FR-001 to COW-FR-012 |
| Calf Management | 10 | CALF-FR-001 to CALF-FR-010 |
| Records Management | 8 | REC-FR-001 to REC-FR-008 |
| Reminders | 11 | REM-FR-001 to REM-FR-011 |
| Total | 63 | Core Phase 2 requirements |

---

# Appendix B - Open Questions for Later Phases

| Question ID | Question | Owner |
|---|---|---|
| OQ-001 | Should cow-wise milk production remain optional or become a formal feature? | Product |
| OQ-002 | What exact pregnancy check interval should be configurable by farm? | Product/Veterinary Advisor |
| OQ-003 | What reminder schedules should be default versus farm-configurable? | Product |
| OQ-004 | What data should be stored offline for each module? | Architecture |
| OQ-005 | Which user roles beyond farmer/admin are required for first production release? | Product |



---


# Part 3 - Business Modules Functional Requirements

# Majhi Dairy - Phase 3 Business Modules BRD

**Document Type:** Detailed Functional Business Requirements  
**Phase:** Phase 3 - Accounting, AI Slip Scanning, Reports, Goals, Export and Backup  
**Application Name:** Majhi Dairy  
**Supported Languages:** Marathi, English  
**Target Users:** Farmers, Farm Owners, Veterinarians, Administrators  
**Source Documents:** Phase 1 BRD Foundation, Phase 2 Core Modules BRD  
**Version:** 0.1  
**Date:** 06 June 2026  
**Status:** Draft for Review  

---

## Document Control

| Version | Date | Author | Description | Status |
|---|---:|---|---|---|
| 0.1 | 06 June 2026 | Business Analysis Team | Detailed business module requirements for Accounting, AI Slip Scanning, Reports, Goals, Export and Backup | Draft |

## Phase 3 Scope Boundary

This document defines detailed functional business requirements for:

1. Accounting
2. AI Slip Scanning
3. Reports and Analytics
4. Goals Management
5. Export and Backup

This document does not redefine Phase 2 core modules except where cross-module dependencies are required for financial, OCR, reporting, goals, backup, audit, and localization rules.

---

# 1. Requirement Standard

## 1.1 Requirement ID Prefixes

| Module | Prefix | Example |
|---|---|---|
| Accounting | ACC-FR | ACC-FR-001 |
| AI Slip Scanning | OCR-FR | OCR-FR-001 |
| Reports and Analytics | REP-FR | REP-FR-001 |
| Goals Management | GOAL-FR | GOAL-FR-001 |
| Export and Backup | EXP-FR | EXP-FR-001 |

## 1.2 Standard Requirement Attributes

Every requirement in this document includes:

- Requirement ID
- Feature Name
- Description
- Business Objective
- User Story
- Actors
- Preconditions
- Trigger
- Main Flow
- Alternate Flow
- Exception Flow
- Post Conditions
- Business Rules
- Validation Rules
- Acceptance Criteria
- Dependencies
- Security Considerations
- Localization Requirements

## 1.3 Global Language Rules

| Rule ID | Rule |
|---|---|
| LOC-BR-001 | All user-facing text must support Marathi and English. |
| LOC-BR-002 | Marathi is the default language if no preference exists. |
| LOC-BR-003 | User-entered data such as cow names, notes, supplier names, and dairy names must not be translated. |
| LOC-BR-004 | Currency, dates, liters, percentage, and number formatting must follow selected language display rules. |
| LOC-BR-005 | Generated reports, exported files, OCR preview labels, goal messages, and accounting summaries must use selected language. |

---

# 2. Module 1 - Accounting

## 2.1 Accounting Module Overview

The Accounting module manages milk income, manual milk entries, settlement entries, dairy payments, dairy slips, expenses, profit/loss, cash flow, payment status, outstanding amounts, and financial dashboard summaries. Financial accuracy is critical because the module directly affects farmer trust and business decision-making.

## 2.2 Accounting Data Sources

| Data Source | Used For |
|---|---|
| Milk records | Daily milk, monthly milk, milk reports, goals, income estimates. |
| Daily slips | OCR-based daily milk entries and audit trail. |
| 15-day settlement slips | Final settlement totals, feed deduction, net payable, payment tracking. |
| Expense records | Farm expenses, category analytics, profit/loss. |
| Income records | Other income and non-milk income. |
| Payment records | Paid, pending, partial, overdue tracking. |
| Cow/calf records | Animal-linked expense or production references where applicable. |

## 2.3 Core Accounting Calculation Rules

| Calculation | Formula / Rule |
|---|---|
| Daily Total Milk | Morning Milk + Evening Milk |
| Daily Amount | Total Milk x Rate, unless settlement or slip provides final amount and user confirms override |
| Settlement Gross Amount | Total settlement milk x settlement average rate or sum of settlement amounts |
| Feed Deduction | For 15-day settlement, total deduction on slip is treated as dairy feed deduction where configured business rule applies |
| Net Payable | Gross Amount - Deductions + Adjustments |
| Monthly Profit | Milk Income + Other Income - Feed Deduction - Approved Farm Expenses - Other Approved Deductions |
| Annual Profit | Sum of monthly profit for financial/calendar year based on selected report period |
| Outstanding Payment | Expected payment - received payment |

## 2.4 Accounting Business Rule Catalog

| Rule ID | Rule |
|---|---|
| ACC-BR-001 | No financial data extracted by AI/OCR may be auto-saved without user confirmation. |
| ACC-BR-002 | A daily milk record must not have negative liters, fat, SNF, rate, or amount. |
| ACC-BR-003 | Duplicate milk entries for the same farm, date, and session must be prevented or explicitly updated. |
| ACC-BR-004 | Settlement slip summary totals are the highest priority for settlement-level financial values. |
| ACC-BR-005 | Feed deduction from settlement must reduce profit as feed expense. |
| ACC-BR-006 | Manual feed/fodder expenses must follow configured accounting treatment and must not double-count settlement feed deduction. |
| ACC-BR-007 | Deleting a settlement must remove or reverse dependent accounting summaries and report totals. |
| ACC-BR-008 | Financial reports must be traceable to source records. |
| ACC-BR-009 | All financial create, edit, delete, and adjustment actions must be auditable. |

## 2.5 Accounting Requirements

### ACC-FR-001 - Daily Milk Entry

| Attribute | Details |
|---|---|
| Requirement ID | ACC-FR-001 |
| Feature Name | Daily Milk Entry |
| Description | The system shall allow users to enter daily milk collection values with date, morning milk, evening milk, total milk, fat, SNF, rate, and amount. |
| Business Objective | Digitize daily milk production and provide accurate data for dashboard, reports, goals, and accounting. |
| User Story | As a farmer, I want to enter daily milk so that I can track production and income accurately. |
| Actors | Farmer, Farm Owner, System |
| Preconditions | User is authenticated and has accounting or milk record permission. |
| Trigger | User opens daily milk entry manually or from dashboard quick action. |
| Main Flow | 1. User selects date. 2. User enters morning milk and evening milk. 3. User enters fat, SNF, rate if available. 4. System calculates total milk and amount. 5. User reviews and saves. 6. System updates summaries. |
| Alternate Flow | User enters only morning or only evening milk and saves a partial day entry. |
| Exception Flow | Future date, negative values, invalid rate, or duplicate date/session shows localized error. |
| Post Conditions | Daily milk record is saved, dashboard and reports are refreshed. |
| Business Rules | Total milk is automatic. Amount is automatic when total milk and rate exist. Duplicate prevention applies by farm, date, and session. Settlement integration may reconcile daily entries later. |
| Validation Rules | Date required. No future date. Morning/evening milk >= 0. Fat/SNF/rate within configured range. Amount >= 0. |
| Acceptance Criteria | Total equals morning + evening. Amount equals total milk x rate when rate is provided. Duplicate prevention works. Values appear in reports. |
| Dependencies | Records Management, Home Dashboard, Reports, Goals, Accounting Summary. |
| Security Considerations | User can only create records for own farm. Financial edits are auditable. |
| Localization Requirements | Labels, units, validation messages, and success messages must support Marathi and English. |

### ACC-FR-002 - Manual Milk Collection Entry

| Attribute | Details |
|---|---|
| Requirement ID | ACC-FR-002 |
| Feature Name | Manual Milk Collection Entry |
| Description | The system shall support manual entry of milk collection when slip upload is not used. |
| Business Objective | Ensure farmers can maintain records even without OCR or dairy slip images. |
| User Story | As a farmer, I want to manually enter collection data so that my accounting remains complete. |
| Actors | Farmer, Farm Owner |
| Preconditions | User has permission and collection date is valid. |
| Trigger | User selects manual milk collection entry. |
| Main Flow | 1. User enters date, session, liters, fat, SNF, rate, amount. 2. System validates. 3. System saves manual entry. 4. Entry is marked as manual source. |
| Alternate Flow | User enters amount directly when rate is unknown. |
| Exception Flow | Duplicate session or invalid numeric values block save. |
| Post Conditions | Manual entry is available for accounting and reports. |
| Business Rules | Manual entries must be distinguishable from OCR/slip entries. User edits are permitted with audit. |
| Validation Rules | Session must be valid. Date not future. Liters/rate/amount non-negative. |
| Acceptance Criteria | Manual records appear in milk records list and reports with source indicator. |
| Dependencies | Milk records, reports, audit logs. |
| Security Considerations | Farm ownership validation required. |
| Localization Requirements | Source label must display as "हाताने नोंद" / "Manual Entry". |

### ACC-FR-003 - 15-Day Settlement Entry

| Attribute | Details |
|---|---|
| Requirement ID | ACC-FR-003 |
| Feature Name | 15-Day Settlement Entry |
| Description | The system shall allow users to enter or confirm 15-day dairy settlement details including period, total milk, gross amount, deductions, and net payable. |
| Business Objective | Capture final dairy payment information and improve profit/loss accuracy. |
| User Story | As a farmer, I want to record my 15-day dairy payment so that my income and deductions are accurate. |
| Actors | Farmer, Farm Owner, System |
| Preconditions | User has settlement permission. Period start and end are known. |
| Trigger | User opens settlement entry manually or after settlement slip OCR preview. |
| Main Flow | 1. User enters period start/end. 2. User enters milk totals and gross amount. 3. User enters deductions and net payable. 4. System validates calculations. 5. User saves settlement. |
| Alternate Flow | User imports data from OCR and edits before save. |
| Exception Flow | Period overlap, invalid totals, or net payable mismatch shows warning. |
| Post Conditions | Settlement record is saved and financial dashboard updates. |
| Business Rules | Settlement summary totals are final for settlement-level accounting. Total deduction on slip is treated as feed deduction where configured. |
| Validation Rules | Period start <= period end. No future period end unless explicitly allowed. Values non-negative. Net payable must reconcile within tolerance. |
| Acceptance Criteria | Settlement saves only after valid review. Feed deduction and income appear in correct month based on settlement period/end rule. |
| Dependencies | OCR module, reports, accounting dashboard, payment tracking. |
| Security Considerations | Financial audit log required for create/edit/delete. |
| Localization Requirements | Settlement labels must use farmer-friendly Marathi and English equivalents. |

### ACC-FR-004 - Dairy Payment Tracking

| Attribute | Details |
|---|---|
| Requirement ID | ACC-FR-004 |
| Feature Name | Dairy Payment Tracking |
| Description | The system shall track dairy payment amount, payment date, payment status, and linked settlement. |
| Business Objective | Help farmers know whether dairy payments are received, pending, partial, or overdue. |
| User Story | As a farm owner, I want to track dairy payments so that I know pending receivables. |
| Actors | Farmer, Farm Owner |
| Preconditions | Settlement or expected payment exists. |
| Trigger | User records payment status or settlement is saved. |
| Main Flow | 1. System creates expected payment from settlement. 2. User marks received/partial/pending. 3. User enters received amount and date. 4. System calculates outstanding. |
| Alternate Flow | User records payment without settlement and links later. |
| Exception Flow | Received amount greater than expected shows confirmation or error per policy. |
| Post Conditions | Payment status and outstanding amount are updated. |
| Business Rules | Payment cannot be marked paid without received amount/date unless policy allows. Partial payments track remaining balance. |
| Validation Rules | Received amount >= 0. Payment date not future. Settlement link valid. |
| Acceptance Criteria | Payment status correctly changes to pending, partial, paid, or overdue. Outstanding amount is accurate. |
| Dependencies | Settlement records, financial dashboard, reports. |
| Security Considerations | Payment edits are auditable. |
| Localization Requirements | Status labels localized: Pending, Paid, Partial, Overdue. |

### ACC-FR-005 - Dairy Slip Management

| Attribute | Details |
|---|---|
| Requirement ID | ACC-FR-005 |
| Feature Name | Dairy Slip Management |
| Description | The system shall maintain dairy slip records, image references, OCR status, linked records, and audit trail. |
| Business Objective | Provide traceability from source slip to saved accounting record. |
| User Story | As a farmer, I want to view uploaded slips so that I can verify source documents later. |
| Actors | Farmer, Farm Owner, System |
| Preconditions | Slip upload exists or user has upload permission. |
| Trigger | User opens dairy slip list or saves OCR result. |
| Main Flow | 1. System lists slips by date/type/status. 2. User opens slip. 3. System shows image, extracted data, linked accounting record, and confidence. |
| Alternate Flow | User filters by daily or settlement slips. |
| Exception Flow | Missing image shows metadata and recovery message. |
| Post Conditions | User can audit slip and linked record. |
| Business Rules | Slip must link to saved record when accepted. Failed OCR slips remain in history with error status. |
| Validation Rules | Slip type, upload ID, farm ID, status required. |
| Acceptance Criteria | Slip history shows correct status, image, type, confidence, and linked record. |
| Dependencies | OCR, storage, accounting records, audit logs. |
| Security Considerations | Slip images must be farm-scoped and protected as configured. |
| Localization Requirements | Slip status and type labels localized. |

### ACC-FR-006 - Expense Management

| Attribute | Details |
|---|---|
| Requirement ID | ACC-FR-006 |
| Feature Name | Expense Management |
| Description | The system shall allow users to create, edit, delete, categorize, and analyze farm expenses. |
| Business Objective | Track farm cost and improve profit visibility. |
| User Story | As a farmer, I want to record expenses so that I understand farm profitability. |
| Actors | Farmer, Farm Owner |
| Preconditions | User has expense permission. |
| Trigger | User opens expense entry from records, accounting, or dashboard. |
| Main Flow | 1. User selects date and category. 2. User enters amount and optional details. 3. System validates. 4. System saves expense. 5. Reports update. |
| Alternate Flow | User enters recurring expense schedule. |
| Exception Flow | Invalid category or amount blocks save. |
| Post Conditions | Expense appears in monthly and annual reports according to rules. |
| Business Rules | Supported categories: Feed, Fodder, Veterinary, Medicines, Labour, Transport, Utilities, Equipment, Miscellaneous. Settlement feed deduction must not be double-counted with manual feed where business rule excludes it. |
| Validation Rules | Date required. Amount > 0. Category required. No future date unless scheduled. |
| Acceptance Criteria | Expense is saved, editable, deletable, and reflected in reports. |
| Dependencies | Records, reports, P&L, audit logs. |
| Security Considerations | Financial deletion requires confirmation and audit. |
| Localization Requirements | Category names and messages localized. |

### ACC-FR-007 - Income Tracking

| Attribute | Details |
|---|---|
| Requirement ID | ACC-FR-007 |
| Feature Name | Income Tracking |
| Description | The system shall track milk income and other farm income separately. |
| Business Objective | Provide complete income visibility without mixing income sources. |
| User Story | As a farm owner, I want to track all income so that profit reports are complete. |
| Actors | Farm Owner, Farmer |
| Preconditions | User has income permission. |
| Trigger | Settlement saved, payment received, or user adds other income. |
| Main Flow | 1. System records milk income from settlement or milk records. 2. User records other income if any. 3. System categorizes income source. |
| Alternate Flow | User edits or deletes other income. |
| Exception Flow | Invalid amount/date blocks save. |
| Post Conditions | Income appears in dashboard and reports by category. |
| Business Rules | Milk income and other income must be separately reported. Settlement totals may override calculated milk income for settlement period where approved. |
| Validation Rules | Amount > 0. Date valid. Category required for other income. |
| Acceptance Criteria | Income totals match source records and reports. |
| Dependencies | Settlement, milk records, reports. |
| Security Considerations | Income edits are auditable. |
| Localization Requirements | Income category labels localized. |

### ACC-FR-008 - Profit and Loss Calculation

| Attribute | Details |
|---|---|
| Requirement ID | ACC-FR-008 |
| Feature Name | Profit and Loss Calculation |
| Description | The system shall calculate monthly, quarterly, and annual profit/loss using approved accounting formulas. |
| Business Objective | Help farmers understand whether the farm is profitable. |
| User Story | As a farm owner, I want profit/loss calculation so that I can make financial decisions. |
| Actors | Farmer, Farm Owner, System |
| Preconditions | Income and expense data exists or empty state available. |
| Trigger | User opens P&L report/dashboard or source data changes. |
| Main Flow | 1. System identifies reporting period. 2. System sums income. 3. System sums applicable deductions/expenses. 4. System calculates profit/loss. 5. System displays results. |
| Alternate Flow | User changes period or filters. |
| Exception Flow | Data inconsistency triggers warning and audit flag. |
| Post Conditions | P&L summary is displayed and exportable. |
| Business Rules | Profit = Milk Income + Other Income - Feed Deduction - Farm Expenses - Other Approved Deductions. Loss occurs when result < 0. |
| Validation Rules | Source values numeric. Date range valid. No duplicate source inclusion. |
| Acceptance Criteria | Monthly, quarterly, and annual P&L match source records and calculation rules. |
| Dependencies | Income, expenses, settlement, reports. |
| Security Considerations | Financial summaries visible only to authorized users. |
| Localization Requirements | Currency, month names, and P&L labels localized. |

### ACC-FR-009 - Cash Flow Summary

| Attribute | Details |
|---|---|
| Requirement ID | ACC-FR-009 |
| Feature Name | Cash Flow Summary |
| Description | The system shall show cash inflow, cash outflow, and net cash movement for selected period. |
| Business Objective | Help farm owners understand actual money movement. |
| User Story | As a farm owner, I want cash flow summary so that I know how much money came in and went out. |
| Actors | Farm Owner, System |
| Preconditions | Income/payment and expense data exist. |
| Trigger | User opens cash flow widget/report. |
| Main Flow | 1. User selects period. 2. System calculates received payments and paid expenses. 3. System displays net cash flow. |
| Alternate Flow | User filters by category. |
| Exception Flow | Missing payment dates are listed as data quality issues. |
| Post Conditions | User sees cash flow summary. |
| Business Rules | Cash flow uses actual payment dates, not necessarily settlement period dates. |
| Validation Rules | Payment date required for received cash. Expense date required for outflow. |
| Acceptance Criteria | Cash flow differs from accrual P&L where payments are pending. |
| Dependencies | Payments, expenses, reports. |
| Security Considerations | Financial permissions required. |
| Localization Requirements | Cash flow labels localized. |

### ACC-FR-010 - Payment Status Tracking

| Attribute | Details |
|---|---|
| Requirement ID | ACC-FR-010 |
| Feature Name | Payment Status Tracking |
| Description | The system shall track payment status as pending, partial, paid, overdue, or cancelled where applicable. |
| Business Objective | Make receivables transparent to farmers. |
| User Story | As a farmer, I want to know which payments are pending so that I can follow up. |
| Actors | Farmer, Farm Owner |
| Preconditions | Expected payment exists. |
| Trigger | Settlement saved or user updates status. |
| Main Flow | 1. System creates pending status. 2. User records payment. 3. System updates status automatically. |
| Alternate Flow | User manually marks cancelled with reason. |
| Exception Flow | Invalid transition is blocked. |
| Post Conditions | Payment status is accurate. |
| Business Rules | Paid requires full received amount. Partial requires outstanding > 0. Overdue based on due date. |
| Validation Rules | Status must be allowed value. Payment amount valid. |
| Acceptance Criteria | Payment status updates correctly after received amount changes. |
| Dependencies | Settlement, payment records. |
| Security Considerations | Status changes logged. |
| Localization Requirements | Status chips localized. |

### ACC-FR-011 - Outstanding Payments

| Attribute | Details |
|---|---|
| Requirement ID | ACC-FR-011 |
| Feature Name | Outstanding Payments |
| Description | The system shall calculate and display outstanding dairy payments. |
| Business Objective | Help farmers identify unpaid or partially paid amounts. |
| User Story | As a farm owner, I want to see outstanding payments so that I can follow up with dairy. |
| Actors | Farmer, Farm Owner, System |
| Preconditions | Expected payments exist. |
| Trigger | User opens outstanding payments view. |
| Main Flow | 1. System fetches pending/partial payments. 2. System calculates outstanding amount. 3. User filters by date/status. |
| Alternate Flow | User opens linked settlement. |
| Exception Flow | Missing expected amount shows data quality warning. |
| Post Conditions | Outstanding list shown. |
| Business Rules | Outstanding = expected - received. Fully paid items excluded by default. |
| Validation Rules | Expected and received amounts numeric. |
| Acceptance Criteria | Outstanding total matches payment records. |
| Dependencies | Payment tracking, settlements. |
| Security Considerations | Farm-scoped financial access. |
| Localization Requirements | Outstanding labels localized. |

### ACC-FR-012 - Financial Dashboard

| Attribute | Details |
|---|---|
| Requirement ID | ACC-FR-012 |
| Feature Name | Financial Dashboard |
| Description | The system shall provide a financial dashboard showing income, expenses, feed deduction, profit, cash flow, payment status, and recent financial activity. |
| Business Objective | Give farm owners a fast and accurate financial snapshot. |
| User Story | As a farm owner, I want a financial dashboard so that I understand the farm's financial health quickly. |
| Actors | Farm Owner, Farmer, System |
| Preconditions | User has financial dashboard permission. |
| Trigger | User opens accounting page or dashboard financial section. |
| Main Flow | 1. System loads current month summary. 2. System loads financial cards and charts. 3. User changes period. 4. System refreshes. |
| Alternate Flow | If no data, show setup actions. |
| Exception Flow | Slow query shows skeleton and retry. |
| Post Conditions | User sees financial status. |
| Business Rules | Dashboard values must match reports for same period. |
| Validation Rules | Period valid. User permission required. |
| Acceptance Criteria | Financial dashboard is consistent with P&L and reports. |
| Dependencies | Accounting records, reports, charts. |
| Security Considerations | Financial cards hidden from unauthorized users. |
| Localization Requirements | Dashboard labels localized. |

### ACC-FR-013 - Settlement Creation

| Attribute | Details |
|---|---|
| Requirement ID | ACC-FR-013 |
| Feature Name | Settlement Creation |
| Description | The system shall support creating settlement records from manual entry or OCR-extracted data. |
| Business Objective | Store final dairy payment statements accurately. |
| User Story | As a farmer, I want to save a settlement after checking it so that my accounts are correct. |
| Actors | Farmer, System |
| Preconditions | User has settlement create permission. |
| Trigger | User submits settlement form or accepts OCR preview. |
| Main Flow | 1. User reviews period and totals. 2. User confirms values. 3. System validates period, totals, deductions, net payable. 4. System saves settlement. |
| Alternate Flow | User saves draft if data incomplete. |
| Exception Flow | Conflicting existing settlement triggers duplicate warning. |
| Post Conditions | Settlement is created and linked to slip if applicable. |
| Business Rules | User confirmation required. Summary box values are preferred over daily row OCR values. |
| Validation Rules | Period required. Gross amount, deduction, net payable non-negative. |
| Acceptance Criteria | Saved settlement updates accounting, reports, payment tracking, and audit trail. |
| Dependencies | OCR, payment tracking, reports. |
| Security Considerations | Financial audit required. |
| Localization Requirements | Settlement messages localized. |

### ACC-FR-014 - Settlement Import

| Attribute | Details |
|---|---|
| Requirement ID | ACC-FR-014 |
| Feature Name | Settlement Import |
| Description | The system shall import settlement data from OCR slip scanning into an editable settlement preview. |
| Business Objective | Reduce manual entry while keeping user control over financial values. |
| User Story | As a farmer, I want settlement data to be read from a photo so that I can save time. |
| Actors | Farmer, OCR System, AI System |
| Preconditions | Settlement slip uploaded and OCR processed. |
| Trigger | OCR extraction completes. |
| Main Flow | 1. OCR extracts text. 2. AI structures settlement fields. 3. Validation engine checks totals. 4. Preview is shown. 5. User edits and saves. |
| Alternate Flow | Low confidence requires manual correction before save. |
| Exception Flow | OCR failure asks user to retry or enter manually. |
| Post Conditions | Imported values are available for user review. |
| Business Rules | Import never auto-saves. Suspicious values must be highlighted. |
| Validation Rules | Required settlement fields must exist or be manually filled. |
| Acceptance Criteria | Imported settlement can be edited and saved only after confirmation. |
| Dependencies | OCR module, validation engine. |
| Security Considerations | Uploaded image and extracted data must be farm-scoped. |
| Localization Requirements | Preview labels and warnings localized. |

### ACC-FR-015 - Settlement Validation

| Attribute | Details |
|---|---|
| Requirement ID | ACC-FR-015 |
| Feature Name | Settlement Validation |
| Description | The system shall validate settlement calculations before save. |
| Business Objective | Prevent incorrect financial reports from invalid settlement data. |
| User Story | As a farmer, I want the app to warn me when payment values do not match so that I can correct mistakes. |
| Actors | Farmer, System |
| Preconditions | Settlement data exists in preview or form. |
| Trigger | User changes values or attempts save. |
| Main Flow | 1. System calculates expected totals. 2. System compares gross, deductions, net payable. 3. System shows warnings/errors. 4. User corrects or confirms where allowed. |
| Alternate Flow | User accepts difference with reason if tolerance policy permits. |
| Exception Flow | Critical mismatch blocks direct save. |
| Post Conditions | Settlement is valid or marked for manual review. |
| Business Rules | Summary totals are highest priority. Daily rows are secondary. Deductions must not exceed gross without explicit warning. |
| Validation Rules | Net payable = gross - deductions + adjustments within tolerance. Period valid. Values non-negative. |
| Acceptance Criteria | Invalid settlement is flagged. Valid settlement saves. |
| Dependencies | Settlement form, OCR validation engine. |
| Security Considerations | Override reasons audited. |
| Localization Requirements | Warning messages localized. |

### ACC-FR-016 - Settlement History

| Attribute | Details |
|---|---|
| Requirement ID | ACC-FR-016 |
| Feature Name | Settlement History |
| Description | The system shall display settlement records by period, dairy, payment status, and source. |
| Business Objective | Allow users to review historical dairy payments. |
| User Story | As a farmer, I want settlement history so that I can check past payments. |
| Actors | Farmer, Farm Owner |
| Preconditions | Settlement records exist or empty state available. |
| Trigger | User opens settlement history. |
| Main Flow | 1. System lists settlements newest first. 2. User filters by date/payment/source. 3. User opens detail. |
| Alternate Flow | User exports settlement list. |
| Exception Flow | Fetch failure shows retry. |
| Post Conditions | User can view historical settlements. |
| Business Rules | Deleted settlements must not appear in active history unless audit view. |
| Validation Rules | Filters must be valid. |
| Acceptance Criteria | History matches database and reports. |
| Dependencies | Reports, export, payment tracking. |
| Security Considerations | Farm-scoped data only. |
| Localization Requirements | Filters and statuses localized. |

### ACC-FR-017 - Settlement Adjustments

| Attribute | Details |
|---|---|
| Requirement ID | ACC-FR-017 |
| Feature Name | Settlement Adjustments |
| Description | The system shall allow authorized users to record settlement adjustments with reason. |
| Business Objective | Support correction of rounding, dairy adjustments, or manual reconciliation differences. |
| User Story | As a farm owner, I want to record adjustments so that settlement values match actual payment. |
| Actors | Farm Owner, System |
| Preconditions | Settlement exists. User has edit permission. |
| Trigger | User selects adjustment on settlement. |
| Main Flow | 1. User enters adjustment amount and reason. 2. System recalculates net payable. 3. User confirms. 4. System saves adjustment. |
| Alternate Flow | User removes adjustment with reason. |
| Exception Flow | Missing reason blocks save. |
| Post Conditions | Adjustment appears in settlement detail and reports. |
| Business Rules | Adjustment requires reason and audit. Adjustments affect net payable but must be separately visible. |
| Validation Rules | Amount numeric. Reason required. |
| Acceptance Criteria | Adjustment changes financial summary and remains traceable. |
| Dependencies | Settlement, reports, audit logs. |
| Security Considerations | Authorized users only; audit mandatory. |
| Localization Requirements | Adjustment labels localized. |

### ACC-FR-018 - Expense Approval Flow

| Attribute | Details |
|---|---|
| Requirement ID | ACC-FR-018 |
| Feature Name | Expense Approval Flow |
| Description | The system shall support optional approval workflow for expenses entered by non-owner users. |
| Business Objective | Improve financial control in farms with multiple users. |
| User Story | As a farm owner, I want to approve staff-entered expenses so that reports are accurate. |
| Actors | Dairy Operator, Farm Owner, System |
| Preconditions | Approval workflow enabled for farm. |
| Trigger | Non-owner user creates expense. |
| Main Flow | 1. Staff enters expense. 2. System marks pending approval. 3. Owner reviews. 4. Owner approves/rejects. 5. Approved expenses affect reports. |
| Alternate Flow | Owner edits amount/category before approval. |
| Exception Flow | Rejected expense requires reason. |
| Post Conditions | Expense status set and reports updated if approved. |
| Business Rules | Pending expenses excluded from final reports unless configured. Rejected expenses remain audit-visible. |
| Validation Rules | Approval reason required for rejection. |
| Acceptance Criteria | Approval status controls report inclusion correctly. |
| Dependencies | User roles, expenses, reports, notifications. |
| Security Considerations | Only authorized approvers can approve/reject. |
| Localization Requirements | Approval status and messages localized. |

### ACC-FR-019 - Recurring Expenses

| Attribute | Details |
|---|---|
| Requirement ID | ACC-FR-019 |
| Feature Name | Recurring Expenses |
| Description | The system shall allow users to configure recurring expenses such as labor, rent, utilities, or regular services. |
| Business Objective | Reduce repetitive monthly expense entry. |
| User Story | As a farmer, I want recurring expenses so that regular costs are not missed. |
| Actors | Farmer, Farm Owner, System |
| Preconditions | User has expense permission. |
| Trigger | User creates recurring expense. |
| Main Flow | 1. User enters category, amount, start date, frequency. 2. System validates. 3. System schedules future expense creation/reminder. |
| Alternate Flow | User pauses or ends recurrence. |
| Exception Flow | Invalid recurrence pattern blocks save. |
| Post Conditions | Recurring expense schedule exists. |
| Business Rules | Generated expenses must be distinguishable from manually created expenses. User confirmation may be required before posting based on setting. |
| Validation Rules | Amount > 0. Frequency valid. Start date valid. |
| Acceptance Criteria | Recurring expenses generate/remind correctly and avoid duplicates. |
| Dependencies | Reminders, expense management. |
| Security Considerations | Schedule changes audited. |
| Localization Requirements | Frequency labels localized. |

### ACC-FR-020 - Expense Analytics

| Attribute | Details |
|---|---|
| Requirement ID | ACC-FR-020 |
| Feature Name | Expense Analytics |
| Description | The system shall provide expense analytics by category, month, trend, and top expense type. |
| Business Objective | Help farmers identify cost drivers. |
| User Story | As a farm owner, I want expense analytics so that I can control costs. |
| Actors | Farm Owner, Farmer, System |
| Preconditions | Expense data exists. |
| Trigger | User opens expense analytics. |
| Main Flow | 1. User selects period. 2. System groups expenses by category. 3. System displays totals, trends, and charts. |
| Alternate Flow | User exports analytics. |
| Exception Flow | No data shows empty state. |
| Post Conditions | Expense insights visible. |
| Business Rules | Approved accounting categories must be used. Manual informational records excluded if not financial. |
| Validation Rules | Date range valid. Category values mapped. |
| Acceptance Criteria | Category totals match expense records and reports. |
| Dependencies | Expense records, reports, charts. |
| Security Considerations | Financial permission required. |
| Localization Requirements | Chart labels localized. |

### ACC-FR-021 - Monthly, Quarterly, and Annual P&L

| Attribute | Details |
|---|---|
| Requirement ID | ACC-FR-021 |
| Feature Name | Monthly, Quarterly, and Annual P&L |
| Description | The system shall generate P&L for monthly, quarterly, and annual periods using consistent formulas. |
| Business Objective | Provide period-based financial performance analysis. |
| User Story | As a farm owner, I want P&L by period so that I can compare performance. |
| Actors | Farm Owner, System |
| Preconditions | Financial data exists or empty state available. |
| Trigger | User selects P&L period. |
| Main Flow | 1. User selects period type. 2. System fetches income and expenses. 3. System calculates profit/loss. 4. System displays breakdown. |
| Alternate Flow | User compares current period with previous period. |
| Exception Flow | Data inconsistencies show warnings. |
| Post Conditions | P&L summary and details shown. |
| Business Rules | Same formula must be used across dashboards and reports. |
| Validation Rules | Period dates valid. Source records not double counted. |
| Acceptance Criteria | Monthly, quarterly, and annual totals reconcile to source data. |
| Dependencies | Reports, accounting summaries, expenses, settlements. |
| Security Considerations | Financial data protected. |
| Localization Requirements | Period labels localized. |

---

# 3. Module 2 - AI Slip Scanning

## 3.1 AI Slip Scanning Module Overview

AI Slip Scanning allows users to upload daily dairy slips and settlement slips, process images through OCR, structure data using AI, validate calculations, present editable preview, and save only after user confirmation. The module must never blindly trust OCR or AI because it affects real money.

## 3.2 OCR Workflow

| Step | Description |
|---:|---|
| 1 | User uploads JPG, PNG, or PDF. |
| 2 | System compresses or normalizes file where applicable. |
| 3 | OCR extracts raw text. |
| 4 | AI structures text into supported slip format. |
| 5 | Validation engine checks missing, invalid, duplicate, and suspicious data. |
| 6 | User reviews original image, OCR text summary, extracted fields, warnings, and confidence. |
| 7 | User edits values if required. |
| 8 | User confirms save. |
| 9 | System saves linked accounting record and audit log. |

## 3.3 Confidence Threshold Rules

| Confidence | System Behavior |
|---:|---|
| 95-100 | Show high confidence but still require user confirmation. |
| 80-94 | Show review warning for important fields. |
| 60-79 | Require user review and highlight low-confidence fields. |
| 40-59 | Require manual correction before save. |
| Below 40 | Do not allow direct save; ask user to retry or enter manually. |

## 3.4 OCR Requirements

### OCR-FR-001 - Upload Dairy Slip

| Attribute | Details |
|---|---|
| Requirement ID | OCR-FR-001 |
| Feature Name | Upload Dairy Slip |
| Description | The system shall allow users to upload daily dairy slip or settlement slip files in JPG, PNG, or PDF format. |
| Business Objective | Reduce manual data entry while maintaining source document traceability. |
| User Story | As a farmer, I want to upload a dairy slip so that the app can read it and prepare entry for review. |
| Actors | Farmer, Farm Owner, System |
| Preconditions | User is authenticated and has slip upload permission. |
| Trigger | User selects scan/upload slip. |
| Main Flow | 1. User selects/captures file. 2. System validates file type and size. 3. System stores upload. 4. System starts OCR workflow. |
| Alternate Flow | If user is offline, file is queued locally for later processing. |
| Exception Flow | Unsupported file, oversized file, or unreadable file shows localized error. |
| Post Conditions | Upload record exists with pending/processing status. |
| Business Rules | Supported files: JPG, PNG, PDF. Upload must not create accounting record automatically. |
| Validation Rules | File type allowed. File size within configured maximum. Farm ID required. |
| Acceptance Criteria | Valid files upload successfully. Invalid files are rejected with clear message. |
| Dependencies | Storage, OCR processor, offline queue. |
| Security Considerations | File access must be farm-scoped. Uploaded file must be scanned/validated as configured. |
| Localization Requirements | Upload labels/errors localized. |

### OCR-FR-002 - Daily Dairy Slip Upload

| Attribute | Details |
|---|---|
| Requirement ID | OCR-FR-002 |
| Feature Name | Daily Dairy Slip Upload |
| Description | The system shall process daily milk slips and extract date, session, milk quantity, fat, SNF, CLR, rate, amount, dairy name, and member code where available. |
| Business Objective | Speed up daily milk entry from clear dairy slips. |
| User Story | As a farmer, I want daily slip data read automatically so that I can save time. |
| Actors | Farmer, OCR System, AI System |
| Preconditions | Daily slip image/PDF uploaded. |
| Trigger | OCR processing starts. |
| Main Flow | 1. OCR reads text. 2. AI identifies daily slip. 3. AI extracts fields. 4. Validation checks amount and value ranges. 5. Preview is shown. |
| Alternate Flow | Missing rate but amount/liters present results in manual rate field or calculated warning. |
| Exception Flow | If code number is misread as liters, validation flags suspicious liters and requires correction. |
| Post Conditions | Daily slip data is ready for review. |
| Business Rules | User must confirm before saving. Financial fields cannot be guessed. |
| Validation Rules | Date valid. Liters realistic. Amount = liters x rate within tolerance. Fat/SNF within range. |
| Acceptance Criteria | Extracted fields appear in preview with confidence and warnings. Save creates daily milk record only after confirmation. |
| Dependencies | OCR engine, AI extraction, accounting daily entry. |
| Security Considerations | Raw OCR and AI JSON stored in audit. |
| Localization Requirements | Field labels and warnings localized. |

### OCR-FR-003 - Settlement Slip Upload

| Attribute | Details |
|---|---|
| Requirement ID | OCR-FR-003 |
| Feature Name | Settlement Slip Upload |
| Description | The system shall process 15-day settlement slips and extract period, daily rows where available, morning/evening totals, total milk, total income, feed deduction, net payable, dairy name, and member details. |
| Business Objective | Reduce manual settlement entry and improve financial accuracy. |
| User Story | As a farmer, I want 15-day payment slip data extracted so that my accounting stays accurate. |
| Actors | Farmer, OCR System, AI System |
| Preconditions | Settlement slip uploaded. |
| Trigger | OCR processing starts. |
| Main Flow | 1. OCR reads settlement text. 2. AI identifies settlement format. 3. AI extracts summary totals and rows. 4. Validation prioritizes summary box totals. 5. Preview displays all extracted values. |
| Alternate Flow | If daily rows are incomplete but summary totals are clear, system uses summary totals and marks rows incomplete. |
| Exception Flow | If totals are suspicious or inconsistent, direct save is blocked until user correction. |
| Post Conditions | Settlement preview is available for manual review. |
| Business Rules | Summary totals are highest priority. Total deduction on slip is treated as feed deduction as configured. Morning/evening totals from slip should be used where present. |
| Validation Rules | Period valid. Total milk realistic. Net payable reconciles. Duplicate settlement period flagged. |
| Acceptance Criteria | All visible settlement totals are extracted or marked missing. User can edit before save. |
| Dependencies | Accounting settlement, reports, validation engine. |
| Security Considerations | Settlement image and financial data protected. |
| Localization Requirements | Settlement field labels localized. |

### OCR-FR-004 - OCR Processing

| Attribute | Details |
|---|---|
| Requirement ID | OCR-FR-004 |
| Feature Name | OCR Processing |
| Description | The system shall extract raw text from uploaded slips using configured OCR provider. |
| Business Objective | Convert image/PDF slips into machine-readable text for AI structuring. |
| User Story | As a user, I want the app to read text from slip images so that I do not type everything. |
| Actors | System, OCR Provider |
| Preconditions | Upload exists and file is accessible. |
| Trigger | Upload status changes to pending OCR. |
| Main Flow | 1. System reads file. 2. System calls OCR provider. 3. System receives raw text and confidence. 4. System stores OCR result. |
| Alternate Flow | Cached OCR result reused for duplicate processing. |
| Exception Flow | OCR provider failure records failed status and asks retry/manual entry. |
| Post Conditions | Raw OCR text saved for audit and AI extraction. |
| Business Rules | OCR credentials must remain server-side. OCR result must be reusable to avoid duplicate cost. |
| Validation Rules | Upload ID required. OCR text may be empty but must be handled. |
| Acceptance Criteria | OCR text is stored and available for preview/audit. |
| Dependencies | Storage, OCR provider, audit logs. |
| Security Considerations | API keys server-side only; raw text farm-scoped. |
| Localization Requirements | Processing messages localized. |

### OCR-FR-005 - AI Data Extraction

| Attribute | Details |
|---|---|
| Requirement ID | OCR-FR-005 |
| Feature Name | AI Data Extraction |
| Description | The system shall convert OCR raw text into structured daily or settlement data using AI. |
| Business Objective | Convert unstructured slip text into editable accounting fields. |
| User Story | As a farmer, I want extracted data organized in fields so that I can review easily. |
| Actors | AI System, System, Farmer |
| Preconditions | OCR raw text exists. |
| Trigger | OCR completes successfully. |
| Main Flow | 1. System sends OCR text to AI. 2. AI returns JSON. 3. System parses JSON. 4. System normalizes fields. 5. System sends to validation. |
| Alternate Flow | If JSON parse fails, system retries with stricter repair prompt or marks extraction failed. |
| Exception Flow | Invalid JSON or hallucinated fields are rejected. |
| Post Conditions | Structured data exists or extraction failure is recorded. |
| Business Rules | AI must not invent unreadable financial values. Missing fields must be null or flagged. |
| Validation Rules | JSON schema must match slip type. Required fields checked. |
| Acceptance Criteria | Structured output is valid JSON and traceable to OCR text. |
| Dependencies | OCR text, AI provider, validation engine. |
| Security Considerations | Do not send unrelated user data to AI. |
| Localization Requirements | AI output field names internal; user-facing labels localized. |

### OCR-FR-006 - Data Validation

| Attribute | Details |
|---|---|
| Requirement ID | OCR-FR-006 |
| Feature Name | OCR Data Validation |
| Description | The system shall validate extracted slip data for missing, invalid, duplicate, suspicious, and inconsistent values. |
| Business Objective | Prevent wrong financial or milk records from being saved. |
| User Story | As a farmer, I want the app to warn me about wrong values so that I can correct them. |
| Actors | System, Farmer |
| Preconditions | Structured OCR data exists. |
| Trigger | AI extraction completes or user edits field. |
| Main Flow | 1. System runs schema validation. 2. System runs calculation validation. 3. System checks duplicates. 4. System flags warnings. |
| Alternate Flow | User corrects values and validation reruns. |
| Exception Flow | Critical validation failure blocks save. |
| Post Conditions | Preview shows valid state or required corrections. |
| Business Rules | Financial values must never be silently guessed. Suspicious values require manual review. |
| Validation Rules | Daily amount formula, settlement net payable formula, value ranges, duplicate date/period. |
| Acceptance Criteria | Invalid values are highlighted and save is blocked or warned according to severity. |
| Dependencies | Accounting rules, duplicate detection, value range config. |
| Security Considerations | Validation override reason audited. |
| Localization Requirements | Validation warnings localized. |

### OCR-FR-007 - Manual Review

| Attribute | Details |
|---|---|
| Requirement ID | OCR-FR-007 |
| Feature Name | Manual Review and Edit |
| Description | The system shall show editable preview of extracted slip data before saving. |
| Business Objective | Ensure farmer remains final authority for financial data. |
| User Story | As a farmer, I want to check and edit AI-read data before saving. |
| Actors | Farmer, System |
| Preconditions | Extracted data exists. |
| Trigger | OCR and validation complete. |
| Main Flow | 1. System shows original slip, confidence, warnings, and editable fields. 2. User edits fields. 3. System recalculates values. 4. User confirms save. |
| Alternate Flow | User cancels and uploads new slip. |
| Exception Flow | Required fields missing blocks save. |
| Post Conditions | Corrected data is ready for save or discarded. |
| Business Rules | AI data is never auto-saved. User confirmation required. |
| Validation Rules | Required fields by slip type. Correct field formats. |
| Acceptance Criteria | User can edit every extracted field and save only after validation. |
| Dependencies | Preview UI, validation, accounting save APIs. |
| Security Considerations | Edited values and original AI values stored in audit. |
| Localization Requirements | Preview UI supports Marathi/English. |

### OCR-FR-008 - Audit Trail

| Attribute | Details |
|---|---|
| Requirement ID | OCR-FR-008 |
| Feature Name | OCR Audit Trail |
| Description | The system shall store original image reference, OCR text, AI JSON, confidence, warnings, user edits, and linked accounting record. |
| Business Objective | Provide traceability for debugging and financial trust. |
| User Story | As a farm owner, I want audit trail so that I can verify how a record was created. |
| Actors | System, Farmer, Administrator |
| Preconditions | Slip uploaded or processed. |
| Trigger | OCR, AI extraction, review save, or failure. |
| Main Flow | 1. System stores upload metadata. 2. System stores OCR result. 3. System stores AI output. 4. System stores user edits and linked record. |
| Alternate Flow | Failed OCR still stores failure reason. |
| Exception Flow | Audit storage failure blocks save for OCR-originated financial records or logs critical error per policy. |
| Post Conditions | Audit trail available for support and user verification. |
| Business Rules | Audit trail must not be deleted automatically with normal view deletion unless retention policy allows. |
| Validation Rules | Upload ID and farm ID required. |
| Acceptance Criteria | Every saved OCR record has linked audit trail. |
| Dependencies | Storage, database, accounting. |
| Security Considerations | Audit access role-controlled. |
| Localization Requirements | Audit labels localized in UI; stored raw data unchanged. |

### OCR-FR-009 - Confidence Scoring

| Attribute | Details |
|---|---|
| Requirement ID | OCR-FR-009 |
| Feature Name | Confidence Scoring |
| Description | The system shall calculate and display confidence score for OCR/AI extracted slip data. |
| Business Objective | Communicate extraction reliability to users. |
| User Story | As a farmer, I want to know AI confidence so that I can review carefully when needed. |
| Actors | System, Farmer |
| Preconditions | OCR/AI result exists. |
| Trigger | Extraction completes. |
| Main Flow | 1. System receives OCR/AI confidence. 2. System adjusts based on validation warnings. 3. System displays score and field warnings. |
| Alternate Flow | If provider confidence unavailable, system derives score from missing/warning counts. |
| Exception Flow | Invalid score defaults to low confidence. |
| Post Conditions | Confidence visible in preview and audit. |
| Business Rules | Low confidence increases review strictness. Confidence never replaces user confirmation. |
| Validation Rules | Score must be 0-100 or normalized 0-1 internally. |
| Acceptance Criteria | Confidence affects warnings and save restrictions as defined. |
| Dependencies | OCR, AI, validation engine. |
| Security Considerations | Confidence stored for audit. |
| Localization Requirements | Confidence messages localized. |

### OCR-FR-010 - Error Detection and Duplicate Detection

| Attribute | Details |
|---|---|
| Requirement ID | OCR-FR-010 |
| Feature Name | Error and Duplicate Detection |
| Description | The system shall detect duplicate slips, duplicate records, suspicious values, repeated rows, and OCR misreads. |
| Business Objective | Prevent incorrect and duplicate financial entries. |
| User Story | As a farmer, I want the app to catch duplicate or wrong slip data before saving. |
| Actors | System, Farmer |
| Preconditions | Extracted slip data exists. |
| Trigger | Validation runs before save. |
| Main Flow | 1. System checks existing records by date/session or settlement period. 2. System checks value ranges. 3. System checks repeated row patterns. 4. System shows warnings. |
| Alternate Flow | User confirms update existing record where allowed. |
| Exception Flow | Critical duplicate blocks save unless explicit update flow. |
| Post Conditions | Duplicate/wrong data is blocked or corrected. |
| Business Rules | Daily slip duplicate by date/session/member. Settlement duplicate by period/dairy/member. Unrealistic liters/rates/fat/SNF flagged. |
| Validation Rules | Liters, rate, amount, fat, SNF, period, and duplicate keys validated. |
| Acceptance Criteria | Duplicate daily and settlement slips are detected before save. |
| Dependencies | Accounting records, slip history, validation config. |
| Security Considerations | Duplicate checks must be farm-scoped. |
| Localization Requirements | Duplicate warnings localized. |

## 3.5 AI Validation Engine Requirements

| Validation Area | Requirement |
|---|---|
| Missing Values | Required financial fields must be null/highlighted and require user correction. |
| Invalid Values | Values outside configured ranges must be blocked or warned by severity. |
| Duplicate Records | Existing daily or settlement records must be checked before save. |
| Suspicious Data | Unrealistic liters, repeated rows, impossible rates, or mismatched totals must be flagged. |
| Manual Corrections | User edits must rerun validation and be stored in audit trail. |

---

# 4. Module 3 - Reports and Analytics

## 4.1 Reports Module Overview

Reports and Analytics provide farm owners and farmers with printable, exportable, and filterable summaries for production, income, expenses, profit, cow performance, vaccination, health, settlements, goals, and annual farm performance.

## 4.2 Common Report Filters and Exports

| Filter | Supported Reports |
|---|---|
| Date Range | All time-based reports |
| Cow | Milk, cow performance, health, vaccination |
| Breed | Cow performance and analytics |
| Category | Expense, income, health, vaccination |
| Status | Cow/calf status, payment status, reminder status |

| Export Format | Usage |
|---|---|
| PDF | Printable farmer-friendly report |
| Excel | Analysis and sharing |
| CSV | Data transfer |
| JSON | Backup and technical export |

## 4.3 Report Requirements

### REP-FR-001 - Milk Report

| Attribute | Details |
|---|---|
| Requirement ID | REP-FR-001 |
| Feature Name | Milk Report |
| Description | The system shall generate milk report with daily, morning, evening, total, fat, SNF, rate, and amount where available. |
| Business Objective | Provide clear production visibility for selected period. |
| User Story | As a farmer, I want milk report so that I can review production. |
| Actors | Farmer, Farm Owner |
| Preconditions | User has report permission. |
| Trigger | User opens milk report. |
| Main Flow | 1. User selects date range. 2. System fetches milk records. 3. System calculates totals/averages. 4. Report renders. |
| Alternate Flow | User filters by cow if cow-wise data exists. |
| Exception Flow | No data shows empty report. |
| Post Conditions | Report can be viewed/exported/printed. |
| Business Rules | Morning and evening totals must remain separate and total correctly. |
| Validation Rules | Date range valid. Values non-negative. |
| Acceptance Criteria | Report totals match source milk records and settlement override rules where applicable. |
| Dependencies | Milk records, export. |
| Security Considerations | Farm-scoped access. |
| Localization Requirements | Report headers and dates localized. |

### REP-FR-002 - Income Report

| Attribute | Details |
|---|---|
| Requirement ID | REP-FR-002 |
| Feature Name | Income Report |
| Description | The system shall generate income report showing milk income, other income, received payments, and pending amounts. |
| Business Objective | Help farmers understand income sources and cash realization. |
| User Story | As a farm owner, I want income report so that I know how much income was generated and received. |
| Actors | Farm Owner, Farmer |
| Preconditions | Income data exists or empty state. |
| Trigger | User opens income report. |
| Main Flow | 1. User selects period. 2. System groups income by source. 3. System shows totals and payment status. |
| Alternate Flow | User filters by dairy/payment status. |
| Exception Flow | Missing payment info shows data quality warning. |
| Post Conditions | Income report available for export. |
| Business Rules | Milk income and other income must be separated. |
| Validation Rules | Period valid; source values numeric. |
| Acceptance Criteria | Income total matches accounting dashboard for same period. |
| Dependencies | Accounting, payment tracking. |
| Security Considerations | Financial permission required. |
| Localization Requirements | Currency and labels localized. |

### REP-FR-003 - Expense Report

| Attribute | Details |
|---|---|
| Requirement ID | REP-FR-003 |
| Feature Name | Expense Report |
| Description | The system shall generate expense report by category, date, amount, supplier, and notes where available. |
| Business Objective | Help farmers understand cost structure. |
| User Story | As a farmer, I want expense report so that I know where money is spent. |
| Actors | Farmer, Farm Owner |
| Preconditions | Expense data exists. |
| Trigger | User opens expense report. |
| Main Flow | 1. User selects date/category. 2. System fetches expenses. 3. System groups and totals by category. |
| Alternate Flow | User exports category-wise report. |
| Exception Flow | No expenses shows zero/empty state. |
| Post Conditions | Expense breakdown available. |
| Business Rules | Settlement feed deduction appears as feed deduction where configured. Informational records excluded where configured. |
| Validation Rules | Category mapping valid. Amount non-negative. |
| Acceptance Criteria | Expense category totals match accounting source. |
| Dependencies | Expenses, settlement deductions. |
| Security Considerations | Financial access required. |
| Localization Requirements | Expense category names localized. |

### REP-FR-004 - Profit and Loss Report

| Attribute | Details |
|---|---|
| Requirement ID | REP-FR-004 |
| Feature Name | Profit and Loss Report |
| Description | The system shall generate P&L report with income, expenses, deductions, net profit/loss, and trend comparison. |
| Business Objective | Provide clear profitability statement. |
| User Story | As a farm owner, I want P&L report so that I can see business performance. |
| Actors | Farm Owner, System |
| Preconditions | User has financial report permission. |
| Trigger | User opens P&L report. |
| Main Flow | 1. User selects period. 2. System calculates income and expenses. 3. System displays profit/loss and breakdown. |
| Alternate Flow | User compares previous period. |
| Exception Flow | Missing source records show data quality warning. |
| Post Conditions | P&L report generated and exportable. |
| Business Rules | Report formula must match accounting dashboard. |
| Validation Rules | Date period valid; no duplicate counting. |
| Acceptance Criteria | P&L reconciles with monthly/annual accounting. |
| Dependencies | Accounting, expenses, income. |
| Security Considerations | Financial data protected. |
| Localization Requirements | Report labels localized. |

### REP-FR-005 - Cow Performance Report

| Attribute | Details |
|---|---|
| Requirement ID | REP-FR-005 |
| Feature Name | Cow Performance Report |
| Description | The system shall generate cow performance report using available cow, milk, health, breeding, and status data. |
| Business Objective | Help farmers identify high and low performing animals where data exists. |
| User Story | As a farm owner, I want cow performance report so that I can make herd decisions. |
| Actors | Farmer, Farm Owner, Veterinarian |
| Preconditions | Cow records exist. |
| Trigger | User opens cow performance report. |
| Main Flow | 1. User selects date/cow/breed/status filters. 2. System fetches relevant data. 3. System ranks and summarizes. |
| Alternate Flow | If cow-wise milk absent, report shows available status/health data only. |
| Exception Flow | Insufficient data message displayed. |
| Post Conditions | Cow performance information visible. |
| Business Rules | Do not imply cow-wise production if farm records only aggregate milk. |
| Validation Rules | Cow filters farm-scoped. |
| Acceptance Criteria | Report displays only real available data. |
| Dependencies | Cow management, records. |
| Security Considerations | Animal data farm-scoped. |
| Localization Requirements | Status and report labels localized. |

### REP-FR-006 - Vaccination Report

| Attribute | Details |
|---|---|
| Requirement ID | REP-FR-006 |
| Feature Name | Vaccination Report |
| Description | The system shall generate vaccination report with completed and upcoming vaccines. |
| Business Objective | Support preventive health planning. |
| User Story | As a farmer, I want vaccination report so that I know due and completed vaccines. |
| Actors | Farmer, Veterinarian |
| Preconditions | Animal/vaccination data exists. |
| Trigger | User opens vaccination report. |
| Main Flow | 1. User selects animal/date/status. 2. System fetches vaccination records/reminders. 3. System displays completed/upcoming list. |
| Alternate Flow | User prints due list. |
| Exception Flow | No data shows add vaccination prompt. |
| Post Conditions | Vaccination report available. |
| Business Rules | Sold/inactive animals excluded from upcoming by default. |
| Validation Rules | Due date valid. |
| Acceptance Criteria | Report matches vaccination records and reminders. |
| Dependencies | Records, reminders, animals. |
| Security Considerations | Farm-scoped animal health access. |
| Localization Requirements | Vaccine labels/messages localized. |

### REP-FR-007 - Health Report

| Attribute | Details |
|---|---|
| Requirement ID | REP-FR-007 |
| Feature Name | Health Report |
| Description | The system shall generate animal health report with disease, treatment, medicine, veterinarian, and follow-up information. |
| Business Objective | Improve veterinary decision support and history visibility. |
| User Story | As a veterinarian, I want health report so that I can review treatment history. |
| Actors | Farmer, Veterinarian |
| Preconditions | Health records exist. |
| Trigger | User opens health report. |
| Main Flow | 1. User filters by animal/date/disease. 2. System displays records. 3. User exports or prints. |
| Alternate Flow | User views animal-specific report. |
| Exception Flow | No records shows empty state. |
| Post Conditions | Health history available. |
| Business Rules | Health report must not make diagnosis; it only reports recorded data. |
| Validation Rules | Animal filter farm-scoped. |
| Acceptance Criteria | Health report matches records module. |
| Dependencies | Health records, veterinarian list. |
| Security Considerations | Health data access controlled. |
| Localization Requirements | Medical labels localized but user-entered terms unchanged. |

### REP-FR-008 - Settlement Report

| Attribute | Details |
|---|---|
| Requirement ID | REP-FR-008 |
| Feature Name | Settlement Report |
| Description | The system shall generate settlement report with period, total milk, gross amount, feed deduction, net payable, payment status, and linked slip. |
| Business Objective | Provide auditable view of dairy payments. |
| User Story | As a farmer, I want settlement report so that I can compare dairy payments. |
| Actors | Farmer, Farm Owner |
| Preconditions | Settlement records exist. |
| Trigger | User opens settlement report. |
| Main Flow | 1. User selects date range. 2. System fetches settlements. 3. System calculates totals and statuses. |
| Alternate Flow | User opens linked slip image. |
| Exception Flow | Missing linked slip shows metadata only. |
| Post Conditions | Settlement report shown/exportable. |
| Business Rules | Settlement totals are final financial source for that settlement record. |
| Validation Rules | Period filters valid. |
| Acceptance Criteria | Report matches settlement history and financial dashboard. |
| Dependencies | Accounting, slips, payments. |
| Security Considerations | Financial access required. |
| Localization Requirements | Settlement report localized. |

### REP-FR-009 - Goal Achievement Report

| Attribute | Details |
|---|---|
| Requirement ID | REP-FR-009 |
| Feature Name | Goal Achievement Report |
| Description | The system shall report goal targets, current values, completion percentage, achieved/missed status, and historical goals. |
| Business Objective | Help farmers track performance against targets. |
| User Story | As a farmer, I want goal achievement report so that I know my progress. |
| Actors | Farmer, Farm Owner |
| Preconditions | Goals exist or empty state. |
| Trigger | User opens goal report. |
| Main Flow | 1. System fetches goals and related records. 2. System calculates progress. 3. System displays status. |
| Alternate Flow | User filters by goal type. |
| Exception Flow | Missing source data shows progress unavailable. |
| Post Conditions | Goal report available. |
| Business Rules | Goal completion criteria must match Goals module. |
| Validation Rules | Goal target positive. Period valid. |
| Acceptance Criteria | Goal report matches goal dashboard. |
| Dependencies | Goals, milk records, accounting. |
| Security Considerations | Farm-scoped access. |
| Localization Requirements | Goal labels localized. |

### REP-FR-010 - Annual Farm Report

| Attribute | Details |
|---|---|
| Requirement ID | REP-FR-010 |
| Feature Name | Annual Farm Report |
| Description | The system shall generate annual farm report covering milk, income, expenses, profit, animals, health, vaccination, breeding, goals, and key highlights. |
| Business Objective | Provide a complete yearly business summary for farmers. |
| User Story | As a farm owner, I want annual report so that I can understand full-year performance. |
| Actors | Farm Owner, Farmer |
| Preconditions | User has report permission. |
| Trigger | User selects annual report. |
| Main Flow | 1. User selects year. 2. System aggregates yearly data. 3. System renders sections. 4. User prints/exports. |
| Alternate Flow | User selects financial year instead of calendar year if configured. |
| Exception Flow | Insufficient data shows partial report notice. |
| Post Conditions | Annual report generated. |
| Business Rules | Report must clearly identify missing sections and not invent values. |
| Validation Rules | Year valid. Source data traceable. |
| Acceptance Criteria | Annual report is printable and values match monthly reports. |
| Dependencies | All source modules, export. |
| Security Considerations | Financial and animal data protected. |
| Localization Requirements | Full report localized. |

## 4.4 Analytics Requirements

### REP-FR-011 - Milk Analytics

| Attribute | Details |
|---|---|
| Requirement ID | REP-FR-011 |
| Feature Name | Milk Analytics |
| Description | The system shall provide daily, weekly, monthly, and seasonal milk trend analytics. |
| Business Objective | Help farmers identify production trends. |
| User Story | As a farmer, I want milk trends so that I can understand production changes. |
| Actors | Farmer, Farm Owner |
| Preconditions | Milk data exists. |
| Trigger | User opens analytics. |
| Main Flow | System calculates trends by selected period and displays charts. |
| Alternate Flow | User changes aggregation. |
| Exception Flow | No data shows empty state. |
| Post Conditions | Trend chart visible. |
| Business Rules | Trends use real milk records and approved settlement overrides where applicable. |
| Validation Rules | Date range valid. |
| Acceptance Criteria | Trend totals match milk report. |
| Dependencies | Milk records, charts. |
| Security Considerations | Farm-scoped. |
| Localization Requirements | Chart labels localized. |

### REP-FR-012 - Financial Analytics

| Attribute | Details |
|---|---|
| Requirement ID | REP-FR-012 |
| Feature Name | Financial Analytics |
| Description | The system shall provide revenue, expense, and profit trend analytics. |
| Business Objective | Help farm owners identify financial patterns. |
| User Story | As a farm owner, I want financial trends so that I can plan better. |
| Actors | Farm Owner |
| Preconditions | Financial data exists. |
| Trigger | User opens financial analytics. |
| Main Flow | System calculates revenue, expense, and profit by period and displays trend charts. |
| Alternate Flow | User filters by category. |
| Exception Flow | Missing data shows data quality notice. |
| Post Conditions | Financial trends visible. |
| Business Rules | Uses same formulas as P&L. |
| Validation Rules | No duplicate financial source inclusion. |
| Acceptance Criteria | Trends reconcile with P&L reports. |
| Dependencies | Accounting, reports. |
| Security Considerations | Financial permission required. |
| Localization Requirements | Currency and labels localized. |

### REP-FR-013 - Cow Analytics

| Attribute | Details |
|---|---|
| Requirement ID | REP-FR-013 |
| Feature Name | Cow Analytics |
| Description | The system shall provide production ranking, breed comparison, and lactation performance where sufficient cow-level data exists. |
| Business Objective | Support data-driven herd decisions. |
| User Story | As a farm owner, I want cow analytics so that I can identify high-performing animals. |
| Actors | Farm Owner, Veterinarian |
| Preconditions | Cow data exists; cow-level production available for production analytics. |
| Trigger | User opens cow analytics. |
| Main Flow | System calculates available metrics and displays ranking/comparison. |
| Alternate Flow | If cow-level production missing, system shows non-production analytics only. |
| Exception Flow | Insufficient data shows no-data guidance. |
| Post Conditions | Cow analytics shown without fake values. |
| Business Rules | Do not infer cow production from aggregate milk unless explicit allocation data exists. |
| Validation Rules | Cow IDs farm-scoped. |
| Acceptance Criteria | Analytics only display metrics supported by source data. |
| Dependencies | Cow records, milk records. |
| Security Considerations | Farm-scoped access. |
| Localization Requirements | Analytics labels localized. |

---

# 5. Module 4 - Goals Management

## 5.1 Goals Module Overview

Goals Management helps farmers set and track production, quality, income, expense, and custom targets. Goals should motivate farmers, support dashboard progress, and trigger achievement notifications.

## 5.2 Goal Types

| Goal Type | Source Data |
|---|---|
| Daily Milk Goal | Daily milk records |
| Weekly Milk Goal | Weekly milk totals |
| Monthly Milk Goal | Monthly milk totals |
| Fat Goal | Fat records/slips |
| SNF Goal | SNF records/slips |
| Income Goal | Accounting income |
| Expense Reduction Goal | Expense records |
| Custom Goal | User-defined progress or manual completion |

## 5.3 Goals Requirements

### GOAL-FR-001 - Daily Milk Goal

| Attribute | Details |
|---|---|
| Requirement ID | GOAL-FR-001 |
| Feature Name | Daily Milk Goal |
| Description | The system shall allow users to set and track daily milk target. |
| Business Objective | Encourage daily production monitoring. |
| User Story | As a farmer, I want a daily milk goal so that I know whether today's production is on target. |
| Actors | Farmer, Farm Owner, System |
| Preconditions | User has goal permission. |
| Trigger | User creates or dashboard reads daily goal. |
| Main Flow | 1. User enters daily target liters. 2. System saves goal. 3. System calculates today's progress. |
| Alternate Flow | User edits target. |
| Exception Flow | Invalid target blocks save. |
| Post Conditions | Daily goal appears on dashboard. |
| Business Rules | Progress = today's total milk / daily target x 100. |
| Validation Rules | Target > 0. |
| Acceptance Criteria | Progress updates after milk entry. |
| Dependencies | Milk records, dashboard. |
| Security Considerations | Farm-scoped goal. |
| Localization Requirements | Goal messages localized. |

### GOAL-FR-002 - Weekly Milk Goal

| Attribute | Details |
|---|---|
| Requirement ID | GOAL-FR-002 |
| Feature Name | Weekly Milk Goal |
| Description | The system shall allow users to set and track weekly milk target. |
| Business Objective | Support short-term production planning. |
| User Story | As a farmer, I want weekly goal so that I can track production across the week. |
| Actors | Farmer, System |
| Preconditions | Milk records available or empty state. |
| Trigger | User creates weekly goal. |
| Main Flow | User enters weekly target; system calculates current week milk and progress. |
| Alternate Flow | User selects week start preference if supported. |
| Exception Flow | Invalid target or period shows error. |
| Post Conditions | Weekly progress available. |
| Business Rules | Week period must be consistent across dashboard/report. |
| Validation Rules | Target > 0. |
| Acceptance Criteria | Weekly goal progress matches milk report for same week. |
| Dependencies | Milk records, date utility. |
| Security Considerations | Farm-scoped. |
| Localization Requirements | Week labels localized. |

### GOAL-FR-003 - Monthly Milk Goal

| Attribute | Details |
|---|---|
| Requirement ID | GOAL-FR-003 |
| Feature Name | Monthly Milk Goal |
| Description | The system shall allow users to set monthly milk target and track completion. |
| Business Objective | Help farmers plan monthly production. |
| User Story | As a farm owner, I want monthly milk goal so that I can compare actual production to target. |
| Actors | Farm Owner, Farmer |
| Preconditions | Goal module enabled. |
| Trigger | User sets monthly target. |
| Main Flow | 1. User enters target liters. 2. System saves. 3. System calculates current month total. |
| Alternate Flow | User changes target for future month. |
| Exception Flow | Duplicate active monthly goal handled by update/replace prompt. |
| Post Conditions | Monthly progress visible in dashboard/report. |
| Business Rules | Goal period must be month-specific. |
| Validation Rules | Target > 0. Month valid. |
| Acceptance Criteria | Monthly progress matches monthly milk report. |
| Dependencies | Milk records, reports. |
| Security Considerations | Authorized users only. |
| Localization Requirements | Month names localized. |

### GOAL-FR-004 - Fat Goal

| Attribute | Details |
|---|---|
| Requirement ID | GOAL-FR-004 |
| Feature Name | Fat Goal |
| Description | The system shall allow users to set target average fat percentage. |
| Business Objective | Encourage milk quality tracking. |
| User Story | As a farmer, I want fat goal so that I can track quality. |
| Actors | Farmer, Farm Owner |
| Preconditions | Fat data exists or will be entered. |
| Trigger | User creates fat goal. |
| Main Flow | User enters target fat; system calculates average fat for period. |
| Alternate Flow | If no fat records, show no-data state. |
| Exception Flow | Unrealistic target blocked. |
| Post Conditions | Fat goal progress visible. |
| Business Rules | Average fat uses records with valid fat values only. |
| Validation Rules | Fat target within configured range. |
| Acceptance Criteria | Fat progress matches report average. |
| Dependencies | Milk/slip records, reports. |
| Security Considerations | Farm-scoped. |
| Localization Requirements | Percentage labels localized. |

### GOAL-FR-005 - SNF Goal

| Attribute | Details |
|---|---|
| Requirement ID | GOAL-FR-005 |
| Feature Name | SNF Goal |
| Description | The system shall allow users to set target average SNF. |
| Business Objective | Improve milk quality awareness. |
| User Story | As a farmer, I want SNF goal so that I can track milk quality. |
| Actors | Farmer, System |
| Preconditions | SNF data exists or can be entered. |
| Trigger | User creates SNF goal. |
| Main Flow | User enters SNF target; system calculates current average SNF. |
| Alternate Flow | No SNF data shows guidance. |
| Exception Flow | Invalid SNF range blocks save. |
| Post Conditions | SNF progress visible. |
| Business Rules | Average SNF excludes null/invalid records. |
| Validation Rules | SNF within configured range. |
| Acceptance Criteria | SNF goal progress matches report. |
| Dependencies | Milk records, OCR slips. |
| Security Considerations | Farm-scoped. |
| Localization Requirements | SNF labels localized. |

### GOAL-FR-006 - Income Goal

| Attribute | Details |
|---|---|
| Requirement ID | GOAL-FR-006 |
| Feature Name | Income Goal |
| Description | The system shall allow users to set target income for a selected period. |
| Business Objective | Encourage financial planning. |
| User Story | As a farm owner, I want income goal so that I can track expected earnings. |
| Actors | Farm Owner |
| Preconditions | User has financial goal permission. |
| Trigger | User creates income goal. |
| Main Flow | User selects period and target; system calculates income progress. |
| Alternate Flow | User includes/excludes other income. |
| Exception Flow | Invalid target blocked. |
| Post Conditions | Income goal progress visible. |
| Business Rules | Income source inclusion must be clear. |
| Validation Rules | Target > 0. Period valid. |
| Acceptance Criteria | Progress matches income report for same inclusion rules. |
| Dependencies | Accounting, income report. |
| Security Considerations | Financial permission required. |
| Localization Requirements | Currency labels localized. |

### GOAL-FR-007 - Expense Reduction Goal

| Attribute | Details |
|---|---|
| Requirement ID | GOAL-FR-007 |
| Feature Name | Expense Reduction Goal |
| Description | The system shall allow users to set a goal to reduce expenses by category or total. |
| Business Objective | Help farmers control farm cost. |
| User Story | As a farm owner, I want expense reduction goal so that I can reduce unnecessary cost. |
| Actors | Farm Owner |
| Preconditions | Expense records exist or baseline selected. |
| Trigger | User creates expense reduction goal. |
| Main Flow | User selects baseline period/category and target reduction; system tracks current expense. |
| Alternate Flow | User sets absolute expense cap. |
| Exception Flow | Missing baseline shows setup prompt. |
| Post Conditions | Expense goal tracked. |
| Business Rules | Reduction calculated against selected baseline. |
| Validation Rules | Target reduction non-negative and realistic. |
| Acceptance Criteria | Progress matches expense analytics. |
| Dependencies | Expense records, reports. |
| Security Considerations | Financial permission required. |
| Localization Requirements | Expense goal messages localized. |

### GOAL-FR-008 - Custom Goal

| Attribute | Details |
|---|---|
| Requirement ID | GOAL-FR-008 |
| Feature Name | Custom Goal |
| Description | The system shall allow users to create custom farm goals with title, target, unit, period, and optional manual progress. |
| Business Objective | Support farmer-specific goals not covered by standard templates. |
| User Story | As a farmer, I want custom goals so that I can track my own farm targets. |
| Actors | Farmer, Farm Owner |
| Preconditions | User has goal permission. |
| Trigger | User taps add custom goal. |
| Main Flow | User enters title, target, unit, period; system saves and tracks progress. |
| Alternate Flow | User marks custom goal manually complete. |
| Exception Flow | Missing title/target blocks save. |
| Post Conditions | Custom goal appears in goals list. |
| Business Rules | Custom goals may be manually updated unless linked to data source. |
| Validation Rules | Title required. Target > 0. |
| Acceptance Criteria | Custom goal can be created, edited, completed, and archived. |
| Dependencies | Goals dashboard, notifications. |
| Security Considerations | Farm-scoped. |
| Localization Requirements | System labels localized; user title unchanged. |

### GOAL-FR-009 - Goal Notifications and Insights

| Attribute | Details |
|---|---|
| Requirement ID | GOAL-FR-009 |
| Feature Name | Goal Notifications and Insights |
| Description | The system shall notify users about goal progress, completion, missed targets, and insights. |
| Business Objective | Increase engagement and goal completion. |
| User Story | As a farmer, I want goal updates so that I know when I am close to target. |
| Actors | Farmer, System |
| Preconditions | Active goal exists and notifications enabled. |
| Trigger | Progress changes, goal achieved, period ends. |
| Main Flow | System calculates status and sends in-app/push notification where enabled. |
| Alternate Flow | User disables goal notifications. |
| Exception Flow | Notification failure logged without changing goal state. |
| Post Conditions | Goal message delivered or logged. |
| Business Rules | Achievement notification sent once per goal completion. |
| Validation Rules | Goal active; notification preferences respected. |
| Acceptance Criteria | Goal completion creates one success notification. |
| Dependencies | Notifications, dashboard, goal engine. |
| Security Considerations | User notification preference respected. |
| Localization Requirements | Notification text localized. |

### GOAL-FR-010 - Goal Editing, Completion, and History

| Attribute | Details |
|---|---|
| Requirement ID | GOAL-FR-010 |
| Feature Name | Goal Editing, Completion, and History |
| Description | The system shall allow users to edit active goals, mark manual goals complete, archive goals, and view historical goals. |
| Business Objective | Maintain goal lifecycle and learning history. |
| User Story | As a farmer, I want to review previous goals so that I can improve future targets. |
| Actors | Farmer, Farm Owner |
| Preconditions | Goals exist or can be created. |
| Trigger | User opens goal detail/history. |
| Main Flow | User edits goal, saves changes, views historical completion percentage. |
| Alternate Flow | User archives a goal. |
| Exception Flow | Editing completed historical goal requires confirmation or is read-only based on policy. |
| Post Conditions | Goal history accurate. |
| Business Rules | Completed goals retain original target and final progress. |
| Validation Rules | Edits must not create invalid periods or duplicate active goal conflicts. |
| Acceptance Criteria | Historical goals show completed, missed, or in-progress status. |
| Dependencies | Goal reports, dashboard. |
| Security Considerations | Goal changes audited where required. |
| Localization Requirements | Status labels localized. |

---

# 6. Module 5 - Export and Backup

## 6.1 Export and Backup Module Overview

Export and Backup allows users to download farm data, create backups, restore backups, view backup history, and schedule backups. It supports operational continuity, auditability, and data portability.

## 6.2 Supported Export Formats

| Format | Purpose |
|---|---|
| PDF | Human-readable reports and printing |
| Excel | Analysis and sharing |
| CSV | Structured data transfer |
| JSON | Full data backup and technical restore |

## 6.3 Export and Backup Requirements

### EXP-FR-001 - Export Data

| Attribute | Details |
|---|---|
| Requirement ID | EXP-FR-001 |
| Feature Name | Export Data |
| Description | The system shall allow users to export selected farm data in PDF, Excel, CSV, or JSON formats. |
| Business Objective | Provide data portability and offline record keeping. |
| User Story | As a farmer, I want to download my data so that I can keep a copy. |
| Actors | Farmer, Farm Owner, System |
| Preconditions | User has export permission. |
| Trigger | User opens export center and selects data. |
| Main Flow | 1. User selects data categories and date range. 2. User selects format. 3. System generates export. 4. User downloads file. |
| Alternate Flow | Large exports are processed asynchronously. |
| Exception Flow | Export failure shows retry and logs error. |
| Post Conditions | Export file generated/downloaded. |
| Business Rules | Export must include only user's farm data. |
| Validation Rules | Format supported. Date range valid. Category selected. |
| Acceptance Criteria | Export file opens and contains selected data only. |
| Dependencies | Reports, storage, data access layer. |
| Security Considerations | Export action audited; farm isolation enforced. |
| Localization Requirements | Export labels and report content localized. |

### EXP-FR-002 - Manual Backup Data

| Attribute | Details |
|---|---|
| Requirement ID | EXP-FR-002 |
| Feature Name | Manual Backup Data |
| Description | The system shall allow users to manually create backup of selected or full farm data. |
| Business Objective | Reduce risk of data loss. |
| User Story | As a farm owner, I want to create backup so that my data is safe. |
| Actors | Farm Owner, System |
| Preconditions | User has backup permission. |
| Trigger | User taps create backup. |
| Main Flow | 1. User selects backup type. 2. System validates scope. 3. System creates backup file. 4. Metadata stored. |
| Alternate Flow | User downloads backup immediately. |
| Exception Flow | Backup failure logs error and shows retry. |
| Post Conditions | Backup exists in history. |
| Business Rules | Full backup includes all supported farm data. Incremental backup includes changes since last backup. |
| Validation Rules | Backup type valid. Farm ID required. |
| Acceptance Criteria | Backup can be created and downloaded. |
| Dependencies | Storage, database, export engine. |
| Security Considerations | Backup file access protected; audit required. |
| Localization Requirements | Backup status localized. |

### EXP-FR-003 - Restore Backup

| Attribute | Details |
|---|---|
| Requirement ID | EXP-FR-003 |
| Feature Name | Restore Backup |
| Description | The system shall allow authorized users to restore data from a valid backup with confirmation and validation. |
| Business Objective | Support recovery from accidental data loss or device change. |
| User Story | As a farm owner, I want to restore backup so that I can recover lost data. |
| Actors | Farm Owner, Administrator, System |
| Preconditions | Valid backup exists and user has restore permission. |
| Trigger | User selects restore backup. |
| Main Flow | 1. User selects backup. 2. System validates file and metadata. 3. System shows impact summary. 4. User confirms. 5. System restores safely. |
| Alternate Flow | User chooses dry-run validation only. |
| Exception Flow | Invalid backup, version mismatch, or conflict blocks restore. |
| Post Conditions | Data restored or no changes made if validation fails. |
| Business Rules | Restore requires explicit confirmation. Existing data overwrite/merge strategy must be clear. |
| Validation Rules | Backup signature/version/schema/farm match required. |
| Acceptance Criteria | Restore validates before writing and logs outcome. |
| Dependencies | Backup storage, database migration compatibility, audit logs. |
| Security Considerations | Restore is high-risk action; role and audit required. |
| Localization Requirements | Confirmation and warnings localized. |

### EXP-FR-004 - Backup History

| Attribute | Details |
|---|---|
| Requirement ID | EXP-FR-004 |
| Feature Name | Backup History |
| Description | The system shall display backup history with date, size, type, record count, status, and download/restore actions. |
| Business Objective | Help users verify backup availability. |
| User Story | As a farm owner, I want to see backup history so that I know my data is protected. |
| Actors | Farm Owner, System |
| Preconditions | Backups exist or empty state available. |
| Trigger | User opens backup history. |
| Main Flow | System lists backups newest first with metadata and actions. |
| Alternate Flow | User filters by backup type. |
| Exception Flow | Missing backup file shows unavailable status. |
| Post Conditions | Backup metadata visible. |
| Business Rules | Expired/deleted backups marked according to retention policy. |
| Validation Rules | Backup metadata must include farm ID, type, date, status. |
| Acceptance Criteria | Backup history reflects created backups accurately. |
| Dependencies | Backup metadata table, storage. |
| Security Considerations | User sees only own farm backups. |
| Localization Requirements | Status labels localized. |

### EXP-FR-005 - Scheduled Backups

| Attribute | Details |
|---|---|
| Requirement ID | EXP-FR-005 |
| Feature Name | Scheduled Backups |
| Description | The system shall allow users to configure automatic backup frequency: daily, weekly, monthly, or off. |
| Business Objective | Improve data protection without manual effort. |
| User Story | As a farm owner, I want automatic backups so that I do not forget to back up data. |
| Actors | Farm Owner, System |
| Preconditions | Backup feature enabled. |
| Trigger | User sets backup schedule. |
| Main Flow | 1. User selects frequency. 2. System saves preference. 3. Scheduler creates backups. |
| Alternate Flow | User turns off auto backup. |
| Exception Flow | Scheduled backup failure logged and notification sent. |
| Post Conditions | Backup schedule active or off. |
| Business Rules | Only one active schedule per farm unless policy allows. |
| Validation Rules | Frequency must be allowed value. |
| Acceptance Criteria | Scheduled backups run at configured frequency and appear in history. |
| Dependencies | Scheduler, storage, notifications. |
| Security Considerations | Schedule changes audited. |
| Localization Requirements | Frequency and notifications localized. |

### EXP-FR-006 - Full and Incremental Backup

| Attribute | Details |
|---|---|
| Requirement ID | EXP-FR-006 |
| Feature Name | Full and Incremental Backup |
| Description | The system shall support full backups and incremental backups. |
| Business Objective | Balance data safety and storage efficiency. |
| User Story | As a farm owner, I want full and incremental backups so that backup is efficient and complete. |
| Actors | Farm Owner, System |
| Preconditions | Backup service configured. |
| Trigger | User or scheduler starts backup. |
| Main Flow | System determines backup type, gathers data, creates file, stores metadata. |
| Alternate Flow | Incremental unavailable falls back to full backup with notice. |
| Exception Flow | Missing previous backup for incremental triggers full backup prompt. |
| Post Conditions | Backup file created. |
| Business Rules | Full backup contains complete supported dataset. Incremental contains changes since last successful backup. |
| Validation Rules | Last backup metadata required for incremental. |
| Acceptance Criteria | Backup type and content match metadata. |
| Dependencies | Change tracking, storage. |
| Security Considerations | Backup encrypted/protected according to policy. |
| Localization Requirements | Backup type labels localized. |

### EXP-FR-007 - Backup Retention and Verification

| Attribute | Details |
|---|---|
| Requirement ID | EXP-FR-007 |
| Feature Name | Backup Retention and Verification |
| Description | The system shall apply retention policy and verify backup integrity. |
| Business Objective | Ensure backups remain usable and storage remains controlled. |
| User Story | As a farm owner, I want backups to be verified so that I can trust them. |
| Actors | System, Administrator |
| Preconditions | Backup created. |
| Trigger | Backup completion or retention job. |
| Main Flow | 1. System calculates checksum/metadata. 2. System verifies file. 3. System marks verified. 4. Retention job expires old backups. |
| Alternate Flow | User manually verifies backup. |
| Exception Flow | Verification failure marks backup invalid and notifies user/admin. |
| Post Conditions | Backup status accurate. |
| Business Rules | Invalid backups cannot be restored. Retention policy must be transparent. |
| Validation Rules | Checksum and metadata valid. |
| Acceptance Criteria | Backup history shows verified/failed status. |
| Dependencies | Storage, scheduler. |
| Security Considerations | Retention deletion audited. |
| Localization Requirements | Verification messages localized. |

### EXP-FR-008 - Disaster Recovery Support

| Attribute | Details |
|---|---|
| Requirement ID | EXP-FR-008 |
| Feature Name | Disaster Recovery Support |
| Description | The system shall provide recovery validation and documented restore support for major data loss scenarios. |
| Business Objective | Protect business continuity for farms. |
| User Story | As a farm owner, I want recovery support so that I can restore farm operations after data loss. |
| Actors | Farm Owner, Administrator, Support Executive |
| Preconditions | Backup exists or admin recovery source exists. |
| Trigger | User requests recovery or admin initiates recovery. |
| Main Flow | 1. Support identifies recovery point. 2. System validates backup. 3. Admin/user confirms restore. 4. System restores and logs. |
| Alternate Flow | Partial restore performed where supported. |
| Exception Flow | No valid backup available shows recovery unavailable message. |
| Post Conditions | Farm data restored or support case documented. |
| Business Rules | Disaster recovery actions require high-level authorization and audit. |
| Validation Rules | Recovery point must match farm and schema. |
| Acceptance Criteria | Recovery process is traceable and prevents cross-farm restore. |
| Dependencies | Backup, support, admin audit. |
| Security Considerations | Strict role validation. |
| Localization Requirements | Farmer-facing recovery messages localized. |

---

# 7. Cross-Module Requirements

## 7.1 Localization Requirements

| Area | Requirement |
|---|---|
| Accounting | All financial labels, category names, status, validation, and success/error messages must support Marathi and English. |
| OCR Results | Extracted preview labels, confidence warnings, missing field warnings, and correction prompts must be localized. |
| Reports | Report headers, columns, summaries, print layouts, and exported PDFs must follow selected language. |
| Goals | Goal names, progress messages, achievement notifications, and missed goal messages must be localized. |
| Export/Backup | Export options, backup status, restore warnings, and file metadata labels must be localized. |

## 7.2 Common Localized Messages

| Scenario | Marathi | English |
|---|---|---|
| Save success | माहिती यशस्वीरित्या जतन झाली. | Information saved successfully. |
| Financial save success | आर्थिक नोंद जतन झाली. | Financial record saved. |
| Required field | हे फील्ड आवश्यक आहे. | This field is required. |
| Invalid amount | रक्कम योग्य नाही. | Amount is invalid. |
| Duplicate record | ही नोंद आधीच उपलब्ध आहे. | This record already exists. |
| OCR low confidence | AI ला काही माहिती पूर्ण स्पष्ट नाही. कृपया तपासा. | AI is not fully confident. Please review. |
| Backup created | बॅकअप तयार झाला. | Backup created. |
| Restore warning | Restore केल्याने विद्यमान माहिती बदलू शकते. | Restore may change existing data. |

## 7.3 Security Requirements

| Security Area | Requirement |
|---|---|
| Farm Isolation | Every accounting, OCR, report, goal, export, and backup query must validate farm context. |
| Role Access | Financial reports, exports, restores, and deletion require appropriate permission. |
| Audit | Financial create/edit/delete, OCR save, settlement adjustments, backup restore, and export must be auditable. |
| File Security | Slip images, exports, and backups must be protected by farm/user access. |
| AI Security | Only required OCR text or permitted data should be sent to AI provider. |
| Sensitive Data | Backups and exports must avoid exposing data to unauthorized users. |

## 7.4 Audit Requirements

| Event | Audit Data |
|---|---|
| Milk entry created/edited/deleted | User, farm, date, old value, new value, timestamp |
| Settlement saved/adjusted/deleted | User, farm, settlement ID, values, reason, timestamp |
| Expense created/approved/rejected/deleted | User, category, amount, status, reason |
| OCR slip processed/saved | Upload ID, OCR text reference, AI JSON, confidence, edits |
| Report exported | User, report type, filters, format, timestamp |
| Goal created/edited/completed | User, goal ID, old/new values |
| Backup created/restored/deleted | User, backup ID, type, status, timestamp |

## 7.5 Logging Requirements

| Log Type | Purpose |
|---|---|
| Application logs | Debug failures and errors. |
| Financial audit logs | Trace financial changes. |
| OCR processing logs | Diagnose OCR/AI failures. |
| Export/backup logs | Track file generation and restore actions. |
| Security logs | Track unauthorized access and sensitive actions. |

## 7.6 Data Retention Requirements

| Data Type | Retention Direction |
|---|---|
| Financial records | Retain unless deleted by authorized user and policy permits. |
| OCR audit logs | Retain for audit/debug period defined by policy. |
| Reports exports | Retain temporarily unless user stores in backup/storage. |
| Backups | Retain according to backup retention policy. |
| Logs | Retain according to operational and privacy policy. |

## 7.7 Performance Requirements

| Area | Requirement |
|---|---|
| Dashboard financial cards | Load within 2 seconds for typical farm data. |
| Reports | Paginate or async-generate large reports. |
| OCR upload | Show progress and non-blocking UI during processing. |
| Export | Large exports run in background with status. |
| Backup | Large backups run asynchronously and notify on completion. |
| Analytics | Use indexed queries, summary tables, or caching where needed. |

---

# 8. Requirement Traceability Tables

## 8.1 Business Objective Traceability

| Business Objective | Related Requirements |
|---|---|
| Improve financial management | ACC-FR-001 to ACC-FR-021, REP-FR-002 to REP-FR-004 |
| Reduce manual slip entry | OCR-FR-001 to OCR-FR-010, ACC-FR-014 |
| Improve reporting and data decisions | REP-FR-001 to REP-FR-013 |
| Improve farmer goal tracking | GOAL-FR-001 to GOAL-FR-010 |
| Reduce data loss risk | EXP-FR-001 to EXP-FR-008 |
| Improve multilingual adoption | Cross-module localization requirements |

## 8.2 Requirement Inventory

| Module | Requirement Count | ID Range |
|---|---:|---|
| Accounting | 21 | ACC-FR-001 to ACC-FR-021 |
| AI Slip Scanning | 10 | OCR-FR-001 to OCR-FR-010 |
| Reports and Analytics | 13 | REP-FR-001 to REP-FR-013 |
| Goals Management | 10 | GOAL-FR-001 to GOAL-FR-010 |
| Export and Backup | 8 | EXP-FR-001 to EXP-FR-008 |
| Total | 62 | Phase 3 requirements |

---

# 9. Open Questions for Later Phases

| Question ID | Question | Owner |
|---|---|---|
| OQ3-001 | Should settlement income be recognized by settlement end date, payment date, or configurable accounting basis? | Product/Finance |
| OQ3-002 | What exact tolerance should be allowed for OCR amount calculation mismatch? | Product/QA |
| OQ3-003 | Which users can export full farm backup? | Product/Security |
| OQ3-004 | Should recurring expenses auto-post or require monthly confirmation? | Product |
| OQ3-005 | What is the formal backup retention period for free/trial/paid farms? | Product/Admin |
| OQ3-006 | Which reports must be printable in offline mode? | Product/Architecture |

---

# 10. Phase 3 Completion Criteria

Phase 3 is complete when:

1. All 62 requirements are reviewed and accepted by product stakeholders.
2. Accounting formulas and deduction rules are formally approved.
3. OCR confidence thresholds and save-blocking rules are approved.
4. Report calculations are traceable to accounting source data.
5. Goal progress logic is accepted by business stakeholders.
6. Export and backup security rules are reviewed.
7. QA can derive test cases directly from acceptance criteria.



---


# Part 4 - Platform Modules Functional Requirements

# Majhi Dairy - Phase 4 Platform Modules BRD

**Document Type:** Detailed Functional Business Requirements  
**Phase:** Phase 4 - AI Assistant, Notifications, Settings, Profile, Support, Achievements and Leaderboards  
**Application Name:** Majhi Dairy  
**Supported Languages:** Marathi, English  
**Target Audience:** Farmers, Farm Owners, Veterinarians, Administrators, Support Teams  
**Source Documents:** Phase 1 BRD Foundation, Phase 2 Core Modules BRD, Phase 3 Business Modules BRD  
**Version:** 0.1  
**Date:** 06 June 2026  
**Status:** Draft for Review  

---

## Document Control

| Version | Date | Author | Description | Status |
|---|---:|---|---|---|
| 0.1 | 06 June 2026 | Business Analysis Team | Detailed functional business requirements for AI Assistant, Notifications, Settings, Profile, Support, Achievements, and Leaderboards | Draft |

## Phase 4 Scope Boundary

This document defines detailed functional business requirements for platform engagement, personalization, support, notification, AI, profile, and gamification modules. It does not redefine accounting, OCR, reports, records, reminders, or animal-management requirements except where dependencies are required.

---

# 1. Requirement Standard

## 1.1 Requirement ID Prefixes

| Module | Prefix | Example |
|---|---|---|
| AI Assistant | AI-FR | AI-FR-001 |
| Notifications | NOTIF-FR | NOTIF-FR-001 |
| Settings | SET-FR | SET-FR-001 |
| Profile | PROF-FR | PROF-FR-001 |
| Support | SUP-FR | SUP-FR-001 |
| Achievements and Leaderboards | ACH-FR | ACH-FR-001 |

## 1.2 Standard Requirement Attributes

Every feature requirement includes:

- Requirement ID
- Feature Name
- Description
- Business Objective
- User Story
- Actors
- Preconditions
- Trigger
- Main Flow
- Alternate Flow
- Exception Flow
- Post Conditions
- Business Rules
- Validation Rules
- Acceptance Criteria
- Dependencies
- Security Considerations
- Localization Requirements

## 1.3 Global Platform Principles

| Principle ID | Principle |
|---|---|
| PLAT-BR-001 | User-facing modules must support Marathi and English. |
| PLAT-BR-002 | AI must answer using real permitted farm data only where data-specific answers are requested. |
| PLAT-BR-003 | Notifications must respect user preferences, quiet hours, browser permissions, and platform limitations. |
| PLAT-BR-004 | Settings changes must persist across sessions and devices where account-level preference applies. |
| PLAT-BR-005 | Support and admin access must be auditable. |
| PLAT-BR-006 | Achievement and ranking calculations must be transparent and based on real data. |

---

# 2. Module 1 - AI Assistant

## 2.1 AI Assistant Module Overview

The AI Assistant module provides a conversational dairy assistant for farmers and farm owners. It answers questions, explains farm data, supports reminders and goals, explains OCR results, and provides insights. The assistant must not hallucinate farm data, must respect user data permissions, and must provide friendly, professional, localized responses.

## 2.2 AI Data Access Policy

| Data Area | Permission Required | Examples |
|---|---|---|
| Milk Records | Allow AI to use milk records | Today milk, average milk, trends |
| Slip History | Allow AI to use slip history | Settlement explanation, OCR warnings |
| Analytics | Allow AI to use analytics | Profit, expense trends, performance |
| Animal Data | Allow AI to use animal data | Cow status, calves, vaccinations |
| Reminders | Allow AI to use reminders | Due tasks, overdue tasks |
| Goals | Allow AI to use goals | Goal progress, recommendations |

## 2.3 AI Response Rules

| Rule ID | Rule |
|---|---|
| AI-BR-001 | AI must not invent numbers. |
| AI-BR-002 | If data is unavailable, AI must say that information is not available. |
| AI-BR-003 | AI must use backend-approved tools or queries; GPT must not directly write raw SQL. |
| AI-BR-004 | AI must respect user language preference. |
| AI-BR-005 | AI must respect AI disable setting and data permissions. |
| AI-BR-006 | Financial and veterinary responses must include appropriate caution where needed. |
| AI-BR-007 | AI chat history must follow retention and deletion settings. |

## 2.4 AI Assistant Requirements

### AI-FR-001 - Ask Dairy Question

| Attribute | Details |
|---|---|
| Requirement ID | AI-FR-001 |
| Feature Name | Ask Dairy Question |
| Description | The system shall allow users to ask dairy-related questions in Marathi or English and receive responses based on permitted farm data. |
| Business Objective | Provide conversational access to farm records and insights. |
| User Story | As a farmer, I want to ask questions in my language so that I can understand my farm data quickly. |
| Actors | Farmer, Farm Owner, Veterinarian, AI System |
| Preconditions | User is authenticated, AI assistant is enabled, and required data permissions are available for data-specific answers. |
| Trigger | User sends a message in AI chat. |
| Main Flow | 1. User enters question. 2. System detects language and intent. 3. System checks AI settings and permissions. 4. System retrieves relevant data through approved backend tools. 5. AI generates localized answer. 6. System stores chat history if enabled. |
| Alternate Flow | If question is general and does not need farm data, AI answers without database lookup where policy allows. |
| Exception Flow | If AI disabled, show assistant disabled message. If data permission missing, ask user to enable permission or answer with limited scope. If AI provider fails, show retry message. |
| Post Conditions | Response is displayed and optionally stored in chat history. |
| Business Rules | No fake values. Use real data only for analytics. Response style follows user setting: short, detailed, or expert. |
| Validation Rules | Message must not be empty. Message length within configured limit. User must belong to farm. |
| Acceptance Criteria | AI answers in selected language, uses real data, handles missing data safely, and never exposes another farm's data. |
| Dependencies | AI settings, user permissions, database tools, chat UI, localization. |
| Security Considerations | Farm data access must be scoped by authenticated user and permissions. |
| Localization Requirements | Responses, fallback messages, buttons, and suggested questions support Marathi and English. |

### AI-FR-002 - Intent Detection and Context Awareness

| Attribute | Details |
|---|---|
| Requirement ID | AI-FR-002 |
| Feature Name | Intent Detection and Context Awareness |
| Description | The system shall detect user intent, date ranges, module context, and follow-up references in AI conversations. |
| Business Objective | Make AI responses natural and useful for farmers. |
| User Story | As a user, I want AI to understand follow-up questions so that I do not repeat context. |
| Actors | User, AI System |
| Preconditions | AI chat session exists. |
| Trigger | User asks a new or follow-up question. |
| Main Flow | 1. System analyzes message. 2. System maps intent to approved tool. 3. System resolves date range and prior context. 4. System retrieves data. 5. AI responds. |
| Alternate Flow | If context is ambiguous, AI asks a clarification question. |
| Exception Flow | If intent cannot be detected, show polite fallback with suggested questions. |
| Post Conditions | Intent and tool usage are logged. |
| Business Rules | Context memory is session-scoped unless long-term memory is explicitly enabled. |
| Validation Rules | Date range must be valid. Tool parameters must be sanitized. |
| Acceptance Criteria | AI correctly handles examples like "त्या दिवशी फॅट किती होते?" after previous highest milk day answer. |
| Dependencies | AI orchestration, chat context, date parser, backend tools. |
| Security Considerations | Context must not leak across users or farms. |
| Localization Requirements | Clarification questions localized. |

### AI-FR-003 - Farm Insights Assistant

| Attribute | Details |
|---|---|
| Requirement ID | AI-FR-003 |
| Feature Name | Farm Insights Assistant |
| Description | The system shall provide farm-level insights such as production changes, activity level, data quality, and operational suggestions. |
| Business Objective | Help farmers make data-driven decisions. |
| User Story | As a farm owner, I want AI insights so that I know what needs attention. |
| Actors | Farm Owner, Farmer, AI System |
| Preconditions | AI enabled and relevant data permissions granted. |
| Trigger | User asks for farm status or opens AI insight card. |
| Main Flow | 1. System retrieves summary metrics. 2. AI applies insight rules. 3. AI explains key findings and next actions. |
| Alternate Flow | If data insufficient, AI recommends what records to add. |
| Exception Flow | If analytics query fails, show safe unavailable response. |
| Post Conditions | Insight response displayed and optionally saved. |
| Business Rules | Insights must show source period and cannot infer unavailable data. |
| Validation Rules | Required metrics must be present or marked unavailable. |
| Acceptance Criteria | Insight values match dashboard/reports. |
| Dependencies | Dashboard summaries, reports, records, goals. |
| Security Considerations | Data access permission required. |
| Localization Requirements | Insight text localized. |

### AI-FR-004 - Milk Analytics Assistant

| Attribute | Details |
|---|---|
| Requirement ID | AI-FR-004 |
| Feature Name | Milk Analytics Assistant |
| Description | The system shall answer milk analytics questions such as today milk, monthly milk, trends, highest/lowest day, fat, and SNF. |
| Business Objective | Provide conversational access to production analytics. |
| User Story | As a farmer, I want to ask milk questions so that I can avoid opening reports. |
| Actors | Farmer, Farm Owner, AI System |
| Preconditions | Milk data permission enabled. |
| Trigger | User asks milk-related question. |
| Main Flow | System detects milk intent, retrieves relevant milk data, calculates result, and AI explains in selected language. |
| Alternate Flow | If data missing for period, AI says no records are available. |
| Exception Flow | Invalid date range triggers clarification. |
| Post Conditions | Milk answer shown and logged. |
| Business Rules | Milk totals must match Reports/Analytics module. |
| Validation Rules | Date range valid; liters numeric. |
| Acceptance Criteria | AI milk answers match milk report for same period. |
| Dependencies | Milk records, reports, AI tools. |
| Security Considerations | Farm-scoped data access. |
| Localization Requirements | Liters and dates localized. |

### AI-FR-005 - Record Query Assistant

| Attribute | Details |
|---|---|
| Requirement ID | AI-FR-005 |
| Feature Name | Record Query Assistant |
| Description | The system shall allow users to query records such as health, vaccination, breeding, calving, expenses, and notes through AI. |
| Business Objective | Make historical farm data easy to find. |
| User Story | As a farmer, I want to ask about records so that I can find information quickly. |
| Actors | Farmer, Veterinarian, AI System |
| Preconditions | Relevant data permission enabled. |
| Trigger | User asks a record lookup question. |
| Main Flow | 1. System identifies record type. 2. System retrieves matching records. 3. AI summarizes records with dates and links where available. |
| Alternate Flow | If multiple matches exist, AI asks user to choose animal/date. |
| Exception Flow | No matching records returns no-data message. |
| Post Conditions | User receives record summary. |
| Business Rules | AI must not create or modify records from chat in this phase unless explicit approved workflow exists. |
| Validation Rules | Record filters sanitized. |
| Acceptance Criteria | AI returns only existing records. |
| Dependencies | Records module, cow/calf management, AI tools. |
| Security Considerations | Veterinarian access limited to permitted data. |
| Localization Requirements | Record labels localized; user-entered notes unchanged. |

### AI-FR-006 - Reminder Assistant

| Attribute | Details |
|---|---|
| Requirement ID | AI-FR-006 |
| Feature Name | Reminder Assistant |
| Description | The system shall answer questions about due, overdue, upcoming, and completed reminders. |
| Business Objective | Help farmers prioritize tasks. |
| User Story | As a farmer, I want to ask what reminders are due so that I can plan work. |
| Actors | Farmer, AI System |
| Preconditions | Reminder permission and AI permission enabled. |
| Trigger | User asks reminder question. |
| Main Flow | System retrieves reminder list and AI summarizes by urgency, date, and animal. |
| Alternate Flow | If no reminders, AI provides positive no-task message. |
| Exception Flow | Reminder query failure returns safe error. |
| Post Conditions | User sees reminder summary. |
| Business Rules | Completed reminders excluded unless user asks history. |
| Validation Rules | Date filters valid. |
| Acceptance Criteria | Reminder answer matches reminder page. |
| Dependencies | Reminders, notifications. |
| Security Considerations | Farm-scoped reminders only. |
| Localization Requirements | Reminder messages localized. |

### AI-FR-007 - Goal Coaching Assistant

| Attribute | Details |
|---|---|
| Requirement ID | AI-FR-007 |
| Feature Name | Goal Coaching Assistant |
| Description | The system shall explain goal progress and provide simple coaching based on real goal data. |
| Business Objective | Improve engagement and goal completion. |
| User Story | As a farmer, I want AI coaching so that I know how close I am to my target. |
| Actors | Farmer, Farm Owner, AI System |
| Preconditions | Goal data and AI permission available. |
| Trigger | User asks about goals or opens goal insight. |
| Main Flow | System retrieves active goals, calculates progress, and AI explains remaining target and suggestions. |
| Alternate Flow | If no goals exist, AI suggests creating a goal. |
| Exception Flow | Invalid goal data shows correction prompt. |
| Post Conditions | Goal insight delivered. |
| Business Rules | Recommendations must be practical and cannot guarantee production increases. |
| Validation Rules | Goal target and current value valid. |
| Acceptance Criteria | Goal answer matches Goals module progress. |
| Dependencies | Goals, milk/accounting records. |
| Security Considerations | Financial goal data needs permission. |
| Localization Requirements | Goal coaching localized. |

### AI-FR-008 - OCR Explanation Assistant

| Attribute | Details |
|---|---|
| Requirement ID | AI-FR-008 |
| Feature Name | OCR Explanation Assistant |
| Description | The system shall explain OCR warnings, confidence, missing fields, and calculation mismatches in simple language. |
| Business Objective | Increase user trust in slip scanning review workflow. |
| User Story | As a farmer, I want AI to explain scan warnings so that I know what to correct. |
| Actors | Farmer, AI System |
| Preconditions | OCR result exists and user has access to slip. |
| Trigger | User taps explain warning or asks about slip result. |
| Main Flow | System retrieves OCR audit data and validation warnings; AI explains issue and suggested correction. |
| Alternate Flow | If no warning exists, AI confirms values look consistent but still advises review. |
| Exception Flow | Missing OCR audit shows unavailable message. |
| Post Conditions | User understands OCR issue. |
| Business Rules | AI cannot override validation or save data automatically. |
| Validation Rules | Slip ID farm-scoped. |
| Acceptance Criteria | Explanation references actual warning fields. |
| Dependencies | OCR audit, validation engine. |
| Security Considerations | Slip data protected. |
| Localization Requirements | Explanations localized. |

### AI-FR-009 - Chat History

| Attribute | Details |
|---|---|
| Requirement ID | AI-FR-009 |
| Feature Name | AI Chat History |
| Description | The system shall store, display, search, delete, and export AI chat history according to user settings and retention policy. |
| Business Objective | Allow users to revisit previous AI answers and manage privacy. |
| User Story | As a user, I want chat history so that I can review previous AI answers. |
| Actors | User, System |
| Preconditions | AI chat history enabled. |
| Trigger | User sends message or opens AI settings/history. |
| Main Flow | 1. System stores question, response, timestamp, tools used, and latency. 2. User views/searches history. 3. User deletes/export history if needed. |
| Alternate Flow | User disables history; future chats are not stored beyond operational logs. |
| Exception Flow | Delete failure shows retry. |
| Post Conditions | Chat history reflects user actions. |
| Business Rules | Retention policy applies. Deleted history must not appear to user. |
| Validation Rules | User can only access own/farm-authorized history. |
| Acceptance Criteria | View, search, delete individual, delete all, and export history work. |
| Dependencies | AI settings, export module, audit/logging. |
| Security Considerations | Chat may contain sensitive farm data; access controlled. |
| Localization Requirements | History UI localized; stored question remains as typed. |

### AI-FR-010 - AI Settings

| Attribute | Details |
|---|---|
| Requirement ID | AI-FR-010 |
| Feature Name | AI Settings |
| Description | The system shall allow users to enable/disable AI, choose response style, suggested questions visibility, and history preferences. |
| Business Objective | Give users control over AI behavior and cost/privacy impact. |
| User Story | As a farmer, I want AI settings so that I can control how the assistant behaves. |
| Actors | User, System |
| Preconditions | User authenticated. |
| Trigger | User opens AI settings. |
| Main Flow | User changes AI toggle, response style, suggested questions, history settings; system saves and applies. |
| Alternate Flow | If AI disabled, chat UI shows disabled state. |
| Exception Flow | Save failure reverts UI or shows retry. |
| Post Conditions | AI behavior changes immediately. |
| Business Rules | Disabled AI must prevent chat interactions and AI-triggered insights. |
| Validation Rules | Response style must be short, detailed, or expert. |
| Acceptance Criteria | AI toggle truly disables assistant; response style affects answer length/detail. |
| Dependencies | Settings, AI chat UI. |
| Security Considerations | Settings farm/user scoped as defined. |
| Localization Requirements | Settings labels localized. |

### AI-FR-011 - AI Permissions and Privacy Controls

| Attribute | Details |
|---|---|
| Requirement ID | AI-FR-011 |
| Feature Name | AI Permissions and Privacy Controls |
| Description | The system shall allow users to control whether AI can use milk records, slip history, analytics, animal data, reminders, and goals. |
| Business Objective | Build trust and comply with data minimization expectations. |
| User Story | As a user, I want to control AI data access so that my private data is protected. |
| Actors | User, System |
| Preconditions | User authenticated. |
| Trigger | User opens AI data permissions. |
| Main Flow | User toggles permission categories; system saves; AI tools enforce allowed categories. |
| Alternate Flow | AI asks user to enable permission when a question requires disabled data. |
| Exception Flow | Permission save failure shows error and does not change backend state. |
| Post Conditions | AI data access follows saved permissions. |
| Business Rules | Permission denial must be respected by backend, not only UI. |
| Validation Rules | Permission values boolean and linked to user/farm. |
| Acceptance Criteria | Disabled data categories are not used in AI answers. |
| Dependencies | AI orchestration, settings database. |
| Security Considerations | Server-side permission enforcement mandatory. |
| Localization Requirements | Consent descriptions localized. |

### AI-FR-012 - AI Analytics and Recommendation Engine

| Attribute | Details |
|---|---|
| Requirement ID | AI-FR-012 |
| Feature Name | AI Analytics and Recommendation Engine |
| Description | The system shall generate production, financial, health, vaccination, goal, and farm performance insights using real data and confidence scoring. |
| Business Objective | Provide actionable recommendations without requiring complex reports. |
| User Story | As a farm owner, I want AI recommendations so that I know what to improve. |
| Actors | Farm Owner, Farmer, AI System |
| Preconditions | AI enabled and data permissions granted. |
| Trigger | User asks insight question or opens AI insight card. |
| Main Flow | System retrieves metrics, applies insight rules, generates recommendation with explanation and confidence. |
| Alternate Flow | Insufficient data returns data collection suggestion. |
| Exception Flow | Conflicting data returns caution and asks user to verify records. |
| Post Conditions | Insight delivered with source period and confidence. |
| Business Rules | Recommendations must be explainable and based on available data only. |
| Validation Rules | Source metrics must be non-null or marked unavailable. |
| Acceptance Criteria | Insight shows what was analyzed, confidence, and practical explanation. |
| Dependencies | Reports, goals, records, accounting. |
| Security Considerations | Permission-based data access. |
| Localization Requirements | Insights localized. |

---

# 3. Module 2 - Notifications

## 3.1 Notifications Module Overview

Notifications provide timely in-app and push alerts for reminders, goals, system updates, admin announcements, payments, backups, and AI insights. The notification system must support lifecycle tracking from creation to delivery, read status, archive, and failure logging.

## 3.2 Notification Lifecycle

Create -> Schedule -> Send -> Deliver -> Read -> Archive

| Lifecycle Stage | Description |
|---|---|
| Create | Notification record generated by system/admin/user workflow. |
| Schedule | Notification assigned immediate or future delivery time. |
| Send | Delivery worker attempts channel delivery. |
| Deliver | Device/in-app receipt or delivery success recorded where available. |
| Read | User opens or marks notification as read. |
| Archive | Notification removed from active inbox but retained per policy. |

## 3.3 Notification Type Matrix

| Type | Trigger Event | Priority | Delivery Method | Retry Logic | Expiration |
|---|---|---|---|---|---|
| Pregnancy Reminder | Pregnancy check due | High | In-app, Push | Retry push on failure where token valid | After completion or configured days |
| Calving Reminder | Expected calving near/due | Critical | In-app, Push | Retry and keep in-app | After calving/completion |
| Vaccination Reminder | Vaccine due | High | In-app, Push | Retry if failed | After completion or expiry |
| Deworming Reminder | Deworming due | Medium | In-app, Push | Retry optional | After completion |
| Payment Reminder | Payment pending/overdue | High | In-app, Push | Retry if enabled | After paid/cancelled |
| Goal Achievement | Goal completed | Medium | In-app, Push | No aggressive retry | Short celebration window |
| Goal Missed | Goal period ended below target | Low/Medium | In-app | No retry | After next period |
| Backup Reminder | Backup due/failure | Medium | In-app, Push | Retry for failure notification | Until backup completed |
| Admin Broadcast | Admin sends message | Configured | In-app, Push | Retry based on campaign | Admin-defined expiry |

## 3.4 Notification Requirements

### NOTIF-FR-001 - In-App Notifications

| Attribute | Details |
|---|---|
| Requirement ID | NOTIF-FR-001 |
| Feature Name | In-App Notifications |
| Description | The system shall display notifications inside the application inbox and notification bell. |
| Business Objective | Ensure users receive important messages even if push is unavailable. |
| User Story | As a farmer, I want in-app notifications so that I can see important updates in the app. |
| Actors | User, System |
| Preconditions | User authenticated and notification record exists. |
| Trigger | Notification created or user opens notification inbox. |
| Main Flow | System stores notification, updates unread badge, user opens inbox, reads or archives notification. |
| Alternate Flow | Offline app shows cached notifications and syncs read state later. |
| Exception Flow | Fetch failure shows retry. |
| Post Conditions | Notification read/archive state updated. |
| Business Rules | In-app notification is fallback for all important notifications. |
| Validation Rules | Notification must have title, message, type, target user/farm, status. |
| Acceptance Criteria | Bell count matches unread notifications and read state persists. |
| Dependencies | User/farm targeting, notification database. |
| Security Considerations | Users see only targeted notifications. |
| Localization Requirements | Notification UI localized; admin message may remain as entered. |

### NOTIF-FR-002 - Push Notifications

| Attribute | Details |
|---|---|
| Requirement ID | NOTIF-FR-002 |
| Feature Name | Push Notifications |
| Description | The system shall send push notifications to supported browsers/devices when permission and subscription are active. |
| Business Objective | Reach users outside the app for urgent reminders and announcements. |
| User Story | As a farmer, I want phone notifications so that I do not miss important work. |
| Actors | User, Browser, System |
| Preconditions | Browser supports push, user granted permission, service worker registered, push subscription saved. |
| Trigger | Push-eligible notification is due. |
| Main Flow | System selects active subscription, sends push payload, logs delivery attempt, notification appears on device. |
| Alternate Flow | If push unavailable, notification remains in-app. |
| Exception Flow | Invalid subscription is marked inactive and user is prompted to reconnect. |
| Post Conditions | Delivery status logged. |
| Business Rules | Push must respect preferences, quiet hours, and platform restrictions. |
| Validation Rules | Subscription endpoint/key valid. Notification payload size within limit. |
| Acceptance Criteria | Test notification reaches supported device and failed subscriptions are handled. |
| Dependencies | Service worker, push provider/VAPID, notification preferences. |
| Security Considerations | Push payload must avoid unnecessary sensitive data. |
| Localization Requirements | Push title/body localized based on recipient preference. |

### NOTIF-FR-003 - Reminder Notifications

| Attribute | Details |
|---|---|
| Requirement ID | NOTIF-FR-003 |
| Feature Name | Reminder Notifications |
| Description | The system shall notify users about due and overdue reminders. |
| Business Objective | Improve completion of animal and farm tasks. |
| User Story | As a farmer, I want reminder notifications so that I complete tasks on time. |
| Actors | Farmer, System |
| Preconditions | Active reminder exists and notification settings allow delivery. |
| Trigger | Reminder due window is reached. |
| Main Flow | System checks reminder, user preferences, quiet hours; creates in-app notification and push where enabled. |
| Alternate Flow | Snoozed reminders notify at new due time. |
| Exception Flow | Completed or cancelled reminders do not send. |
| Post Conditions | Notification delivered/logged. |
| Business Rules | No duplicate notifications for same reminder occurrence. |
| Validation Rules | Reminder active and due. |
| Acceptance Criteria | Reminder notifications match reminder page due state. |
| Dependencies | Reminders, notification settings. |
| Security Considerations | Farm-scoped reminder data. |
| Localization Requirements | Reminder content localized. |

### NOTIF-FR-004 - Goal Notifications

| Attribute | Details |
|---|---|
| Requirement ID | NOTIF-FR-004 |
| Feature Name | Goal Notifications |
| Description | The system shall send notifications when goals are achieved, nearly achieved, or missed. |
| Business Objective | Increase farmer engagement and progress awareness. |
| User Story | As a farmer, I want goal notifications so that I know my progress. |
| Actors | Farmer, System |
| Preconditions | Active goal exists and notifications enabled. |
| Trigger | Goal progress threshold crossed or period ends. |
| Main Flow | System calculates progress and creates relevant goal notification. |
| Alternate Flow | If user disables goal notifications, no push is sent but dashboard still shows progress. |
| Exception Flow | Invalid goal data prevents notification and logs issue. |
| Post Conditions | Goal notification recorded. |
| Business Rules | Achievement notification sent once per goal period. |
| Validation Rules | Goal active and progress valid. |
| Acceptance Criteria | Goal completion notification is not duplicated. |
| Dependencies | Goals, notifications. |
| Security Considerations | User preference respected. |
| Localization Requirements | Goal messages localized. |

### NOTIF-FR-005 - AI Notifications

| Attribute | Details |
|---|---|
| Requirement ID | NOTIF-FR-005 |
| Feature Name | AI Notifications |
| Description | The system shall support AI-related notifications such as AI insights, feature updates, or completed AI processing where enabled. |
| Business Objective | Increase awareness of AI assistance without being intrusive. |
| User Story | As a user, I want AI notifications only when useful so that I am not disturbed unnecessarily. |
| Actors | User, AI System |
| Preconditions | AI and AI notifications enabled. |
| Trigger | AI insight available, OCR explanation ready, or admin AI feature announcement sent. |
| Main Flow | System creates AI notification and delivers through allowed channels. |
| Alternate Flow | If AI disabled, AI notifications are not sent except critical system notices. |
| Exception Flow | Failed insight generation does not notify user. |
| Post Conditions | AI notification delivered/logged. |
| Business Rules | AI notifications must be opt-in or controlled by notification preferences. |
| Validation Rules | AI setting active. |
| Acceptance Criteria | Disabling AI stops AI insight notifications. |
| Dependencies | AI settings, notification preferences. |
| Security Considerations | No sensitive details in push payload. |
| Localization Requirements | AI notification text localized. |

### NOTIF-FR-006 - System Alerts

| Attribute | Details |
|---|---|
| Requirement ID | NOTIF-FR-006 |
| Feature Name | System Alerts |
| Description | The system shall notify users about system events such as subscription, backup failure, maintenance, or important app updates. |
| Business Objective | Keep users informed about operational and account-critical events. |
| User Story | As a user, I want system alerts so that I know important platform updates. |
| Actors | User, System |
| Preconditions | Alert condition exists. |
| Trigger | System event or scheduled job. |
| Main Flow | System creates alert, targets users/farms, delivers in-app/push according to priority. |
| Alternate Flow | Maintenance alert can be scheduled for future. |
| Exception Flow | Expired alerts are not shown. |
| Post Conditions | Alert status tracked. |
| Business Rules | Critical alerts may bypass some non-critical preferences where legally/product approved. |
| Validation Rules | Alert type, priority, expiry required. |
| Acceptance Criteria | Active alerts display until read/expired/resolved. |
| Dependencies | Admin/system jobs, notification center. |
| Security Considerations | Admin-created alerts require authorization. |
| Localization Requirements | System-generated alert text localized. |

### NOTIF-FR-007 - Admin Announcements

| Attribute | Details |
|---|---|
| Requirement ID | NOTIF-FR-007 |
| Feature Name | Admin Announcements |
| Description | The system shall allow administrators to send targeted announcements to users or farms. |
| Business Objective | Support platform communication, feature updates, subscription reminders, and support messages. |
| User Story | As an administrator, I want to send announcements so that farms receive important platform messages. |
| Actors | Administrator, User, System |
| Preconditions | Admin authenticated and authorized. |
| Trigger | Admin creates/schedules announcement. |
| Main Flow | Admin enters title/message/target/channel/schedule; system validates and sends/schedules notification. |
| Alternate Flow | Admin saves template or draft. |
| Exception Flow | No valid recipients blocks send. |
| Post Conditions | Announcement delivered/logged. |
| Business Rules | Admin announcements must be auditable and target-scoped. |
| Validation Rules | Title/message required. Target required. Schedule valid. |
| Acceptance Criteria | Targeted users receive announcement and admin sees delivery status. |
| Dependencies | Admin panel, notification delivery, templates. |
| Security Considerations | Super-admin or permitted admin only. |
| Localization Requirements | Admin may enter content in selected language; templates support Marathi/English. |

### NOTIF-FR-008 - Notification Preferences

| Attribute | Details |
|---|---|
| Requirement ID | NOTIF-FR-008 |
| Feature Name | Notification Preferences |
| Description | The system shall allow users to configure categories, channels, quiet hours, and frequency. |
| Business Objective | Reduce notification fatigue and respect user choice. |
| User Story | As a user, I want notification settings so that I control what I receive. |
| Actors | User, System |
| Preconditions | User authenticated. |
| Trigger | User opens notification settings. |
| Main Flow | User toggles categories/channels, sets quiet hours/frequency, saves preferences. |
| Alternate Flow | User sends test notification. |
| Exception Flow | Permission denied by browser shows setup guidance. |
| Post Conditions | Preferences saved and used by delivery engine. |
| Business Rules | Preferences must be enforced server-side for scheduled notifications. |
| Validation Rules | Time ranges valid. Category/channel values valid. |
| Acceptance Criteria | Disabled category does not send non-critical notifications. Test notification works when push is active. |
| Dependencies | Settings, push subscription, notification engine. |
| Security Considerations | User can edit only own preferences. |
| Localization Requirements | Preference labels localized. |

### NOTIF-FR-009 - Notification Search, Read, Archive, Delete

| Attribute | Details |
|---|---|
| Requirement ID | NOTIF-FR-009 |
| Feature Name | Notification Inbox Management |
| Description | The system shall allow users to search, mark read, mark all read, archive, and delete notifications where policy allows. |
| Business Objective | Keep notification inbox manageable. |
| User Story | As a user, I want to manage notifications so that important ones are easy to find. |
| Actors | User, System |
| Preconditions | Notifications exist. |
| Trigger | User opens notification page. |
| Main Flow | User searches/filters notifications, marks read/archive/delete; system updates state. |
| Alternate Flow | Bulk mark all read. |
| Exception Flow | Protected system notification cannot be deleted until expired if policy requires. |
| Post Conditions | Inbox state updated. |
| Business Rules | Read state is per user. Archive removes from active inbox but can remain in history. |
| Validation Rules | Notification ID must belong to user. |
| Acceptance Criteria | Badge count updates after read/archive/delete. |
| Dependencies | Notification database. |
| Security Considerations | User-scoped access mandatory. |
| Localization Requirements | Inbox management labels localized. |

---

# 4. Module 3 - Settings

## 4.1 Settings Module Overview

Settings centralizes user preferences, profile settings, security, notifications, language, theme, AI, goals, backups, veterinarians, and privacy controls. Settings changes should be reliable, persistent, and immediately reflected where applicable.

## 4.2 Settings Requirements

### SET-FR-001 - Profile Settings

| Attribute | Details |
|---|---|
| Requirement ID | SET-FR-001 |
| Feature Name | Profile Settings |
| Description | The system shall allow users to manage personal profile fields and profile photo preferences. |
| Business Objective | Keep user identity and contact information accurate. |
| User Story | As a user, I want to update my profile settings so that my information is correct. |
| Actors | User, System |
| Preconditions | User authenticated. |
| Trigger | User opens profile settings. |
| Main Flow | User edits editable fields, uploads/removes photo, saves changes. |
| Alternate Flow | User cancels without saving. |
| Exception Flow | Invalid photo or save failure shows localized error. |
| Post Conditions | Profile data updated. |
| Business Rules | Read-only fields such as system user ID may be hidden from user-facing UI. |
| Validation Rules | Name required. Mobile/email read-only where configured. Image type/size valid. |
| Acceptance Criteria | Editable fields persist and profile displays updated information. |
| Dependencies | Profile module, storage. |
| Security Considerations | User can edit only own profile unless admin. |
| Localization Requirements | Labels/errors localized. |

### SET-FR-002 - Security Settings

| Attribute | Details |
|---|---|
| Requirement ID | SET-FR-002 |
| Feature Name | Security Settings |
| Description | The system shall allow users to manage password, PIN, active sessions, device management, and login history. |
| Business Objective | Improve account safety and user control. |
| User Story | As a user, I want security settings so that I can protect my account. |
| Actors | User, System |
| Preconditions | User authenticated. |
| Trigger | User opens security settings. |
| Main Flow | User changes password/PIN, reviews sessions/devices/login history, logs out devices. |
| Alternate Flow | User cancels sensitive action. |
| Exception Flow | Wrong current password/PIN or weak new password blocks change. |
| Post Conditions | Security settings updated and audit logged. |
| Business Rules | Current credential verification required for sensitive changes. |
| Validation Rules | Password policy, PIN policy, confirm match, session ownership. |
| Acceptance Criteria | Password/PIN/device/session actions work and are logged. |
| Dependencies | Authentication, session management, audit logs. |
| Security Considerations | Sensitive data never displayed or logged in plain text. |
| Localization Requirements | Security labels and errors localized. |

### SET-FR-003 - Notification Settings

| Attribute | Details |
|---|---|
| Requirement ID | SET-FR-003 |
| Feature Name | Notification Settings |
| Description | The system shall allow users to configure notification categories, channels, quiet hours, and test notification. |
| Business Objective | Respect user notification preferences. |
| User Story | As a farmer, I want to control notifications so that I receive only useful alerts. |
| Actors | User, System |
| Preconditions | User authenticated. |
| Trigger | User opens notification settings. |
| Main Flow | User updates toggles, quiet hours, frequency; system saves and applies. |
| Alternate Flow | User sends test notification. |
| Exception Flow | Push permission unavailable shows guidance. |
| Post Conditions | Notification delivery respects settings. |
| Business Rules | Server-side delivery engine must enforce preferences. |
| Validation Rules | Time ranges valid; channels supported. |
| Acceptance Criteria | Disabled notification category stops non-critical notifications. |
| Dependencies | Notifications, push subscription. |
| Security Considerations | User-scoped preferences. |
| Localization Requirements | Settings localized. |

### SET-FR-004 - Language Settings

| Attribute | Details |
|---|---|
| Requirement ID | SET-FR-004 |
| Feature Name | Language Settings |
| Description | The system shall allow users to switch between Marathi and English and persist language preference. |
| Business Objective | Support multilingual adoption and usability. |
| User Story | As a user, I want to change language so that the app is comfortable for me. |
| Actors | User, System |
| Preconditions | User authenticated or local preference available. |
| Trigger | User selects language in settings or first-time onboarding. |
| Main Flow | User selects Marathi/English, system saves locally and in profile, app re-renders selected language. |
| Alternate Flow | If database unavailable, local preference applies and sync retries. |
| Exception Flow | Unsupported value falls back to Marathi. |
| Post Conditions | Language applied across app. |
| Business Rules | Existing users keep current/default preference and are not forced through first-time selection. |
| Validation Rules | Only Marathi and English supported. |
| Acceptance Criteria | Language persists across refresh, logout/login, and restart. |
| Dependencies | Localization framework, profile settings. |
| Security Considerations | User can edit only own preference. |
| Localization Requirements | No mixed-language UI except user-entered content or intentional brand names. |

### SET-FR-005 - Theme Settings

| Attribute | Details |
|---|---|
| Requirement ID | SET-FR-005 |
| Feature Name | Theme Settings |
| Description | The system shall allow users to select light, dark, or system theme. |
| Business Objective | Improve usability and accessibility across device conditions. |
| User Story | As a user, I want theme settings so that the app is comfortable to read. |
| Actors | User, System |
| Preconditions | User authenticated or local preference available. |
| Trigger | User changes theme. |
| Main Flow | User selects theme; system saves preference; app applies theme immediately. |
| Alternate Flow | System theme follows device preference. |
| Exception Flow | Unsupported theme falls back to light. |
| Post Conditions | Theme applied and persisted. |
| Business Rules | Default theme is light. Text contrast must remain readable in dark mode. |
| Validation Rules | Theme value must be light, dark, or system. |
| Acceptance Criteria | All pages respect selected theme with readable text. |
| Dependencies | Appearance provider, CSS/theme tokens. |
| Security Considerations | None beyond user-scoped preference. |
| Localization Requirements | Theme labels localized. |

### SET-FR-006 - AI Settings

| Attribute | Details |
|---|---|
| Requirement ID | SET-FR-006 |
| Feature Name | AI Settings |
| Description | The system shall expose AI assistant toggle, response style, suggested questions, history, and data permission controls. |
| Business Objective | Give users control over AI usage, privacy, and response behavior. |
| User Story | As a user, I want AI settings so that I control what AI can do. |
| Actors | User, System |
| Preconditions | User authenticated. |
| Trigger | User opens AI settings. |
| Main Flow | User updates toggles and permissions; system saves and AI module enforces changes. |
| Alternate Flow | User deletes chat history from settings. |
| Exception Flow | Save failure shows retry. |
| Post Conditions | AI behavior follows settings. |
| Business Rules | AI disabled means assistant cannot answer or proactively generate insights. |
| Validation Rules | Boolean permission values valid; response style valid. |
| Acceptance Criteria | Settings reflect in AI chat behavior. |
| Dependencies | AI Assistant, chat history. |
| Security Considerations | Server-side permission enforcement. |
| Localization Requirements | AI setting labels localized. |

### SET-FR-007 - Goal Settings

| Attribute | Details |
|---|---|
| Requirement ID | SET-FR-007 |
| Feature Name | Goal Settings |
| Description | The system shall allow users to configure default goal units, goal notification preferences, and visibility preferences. |
| Business Objective | Personalize goal tracking. |
| User Story | As a farmer, I want goal settings so that goals work the way I prefer. |
| Actors | User, System |
| Preconditions | Goals module enabled. |
| Trigger | User opens goal settings. |
| Main Flow | User sets default units, notification rules, and dashboard visibility. |
| Alternate Flow | User resets to defaults. |
| Exception Flow | Invalid defaults are rejected. |
| Post Conditions | Goal module uses saved preferences. |
| Business Rules | Existing goals must not be corrupted by setting changes. |
| Validation Rules | Unit and visibility values valid. |
| Acceptance Criteria | Dashboard and notifications reflect goal settings. |
| Dependencies | Goals, dashboard, notifications. |
| Security Considerations | User/farm-scoped settings. |
| Localization Requirements | Goal settings localized. |

### SET-FR-008 - Backup Settings

| Attribute | Details |
|---|---|
| Requirement ID | SET-FR-008 |
| Feature Name | Backup Settings |
| Description | The system shall allow users to configure backup frequency, backup scope, and backup reminders. |
| Business Objective | Reduce data loss risk. |
| User Story | As a farm owner, I want backup settings so that my data is protected automatically. |
| Actors | Farm Owner, System |
| Preconditions | Backup module enabled. |
| Trigger | User opens backup settings. |
| Main Flow | User selects daily/weekly/monthly/off, backup scope, and reminder options; system saves. |
| Alternate Flow | User creates manual backup from settings. |
| Exception Flow | Unsupported frequency blocks save. |
| Post Conditions | Backup scheduler follows preference. |
| Business Rules | Only authorized users can configure farm-level backup. |
| Validation Rules | Frequency valid; scope valid. |
| Acceptance Criteria | Scheduled backup runs according to saved setting. |
| Dependencies | Export/Backup, notifications. |
| Security Considerations | Backup settings require owner/admin permission where configured. |
| Localization Requirements | Backup settings localized. |

### SET-FR-009 - Veterinarian Settings

| Attribute | Details |
|---|---|
| Requirement ID | SET-FR-009 |
| Feature Name | Veterinarian Settings |
| Description | The system shall allow users to maintain a list of veterinarians for selection in health, vaccination, breeding, and treatment records. |
| Business Objective | Improve data consistency and reduce repeated typing. |
| User Story | As a farmer, I want to save veterinarian names so that I can select them in records. |
| Actors | Farmer, Farm Owner, System |
| Preconditions | User has settings permission. |
| Trigger | User opens veterinarian settings. |
| Main Flow | User adds/edits/deletes veterinarian name, mobile, clinic, notes; records module uses dropdown. |
| Alternate Flow | User marks a veterinarian inactive but keeps history. |
| Exception Flow | Duplicate name/mobile warning shown. |
| Post Conditions | Vet list available in relevant forms. |
| Business Rules | Existing historical records retain vet name even if vet is deleted/inactive. |
| Validation Rules | Name required. Mobile format valid where provided. |
| Acceptance Criteria | Saved veterinarians appear in health/vaccination/breeding dropdowns. |
| Dependencies | Records Management. |
| Security Considerations | Farm-scoped vet list. |
| Localization Requirements | Form labels localized; vet names unchanged. |

### SET-FR-010 - Privacy Settings

| Attribute | Details |
|---|---|
| Requirement ID | SET-FR-010 |
| Feature Name | Privacy Settings |
| Description | The system shall allow users to control data sharing preferences, AI consent, analytics consent, and visibility preferences where supported. |
| Business Objective | Build user trust and comply with privacy expectations. |
| User Story | As a user, I want privacy settings so that I control how my data is used. |
| Actors | User, System |
| Preconditions | User authenticated. |
| Trigger | User opens privacy settings. |
| Main Flow | User reviews privacy controls, changes consent, saves settings. |
| Alternate Flow | User requests data export or account/data deletion where supported. |
| Exception Flow | Required platform data cannot be disabled without explaining impact. |
| Post Conditions | Privacy preferences stored and enforced. |
| Business Rules | Consent changes must be auditable where legally required. |
| Validation Rules | Consent values valid and timestamped. |
| Acceptance Criteria | Disabled consent prevents relevant optional data usage. |
| Dependencies | AI, analytics, export, profile. |
| Security Considerations | Privacy actions logged and access-controlled. |
| Localization Requirements | Privacy explanations localized. |

---

# 5. Module 4 - Profile

## 5.1 Profile Module Overview

The Profile module displays and manages user identity, farm profile, profile completion, statistics dashboard, dairy score, and achievement summary. It must present important farmer and farm information clearly, without exposing unnecessary technical IDs to normal users.

## 5.2 Profile Requirements

### PROF-FR-001 - User Profile

| Attribute | Details |
|---|---|
| Requirement ID | PROF-FR-001 |
| Feature Name | User Profile |
| Description | The system shall display user's name, role, profile photo, mobile/email where allowed, member since, and editable personal fields. |
| Business Objective | Provide a personal account area for identity and preferences. |
| User Story | As a user, I want to see my profile so that I can confirm my information. |
| Actors | User, System |
| Preconditions | User authenticated. |
| Trigger | User opens profile page. |
| Main Flow | System loads profile data and displays header, personal information, and edit actions. |
| Alternate Flow | Missing profile photo shows default avatar. |
| Exception Flow | Profile load failure shows retry. |
| Post Conditions | User profile visible. |
| Business Rules | User-facing profile should not display internal user ID unless admin/support view requires it. |
| Validation Rules | Profile belongs to authenticated user. |
| Acceptance Criteria | Profile page displays accurate user data and editable fields. |
| Dependencies | Authentication, settings, storage. |
| Security Considerations | Personal info protected. |
| Localization Requirements | Profile labels localized. |

### PROF-FR-002 - Farm Profile

| Attribute | Details |
|---|---|
| Requirement ID | PROF-FR-002 |
| Feature Name | Farm Profile |
| Description | The system shall display and allow authorized editing of farm name, location, total cows, total calves, milk capacity, and contact details. |
| Business Objective | Maintain accurate farm identity and location information. |
| User Story | As a farm owner, I want to update farm profile so that reports and support data are correct. |
| Actors | Farm Owner, Administrator, System |
| Preconditions | User has farm profile permission. |
| Trigger | User opens farm profile section. |
| Main Flow | User edits farm name, village, taluka, district, state, contact details; system validates and saves. |
| Alternate Flow | User selects village/taluka from dropdown where configured. |
| Exception Flow | Invalid location or save failure shows error. |
| Post Conditions | Farm profile updated. |
| Business Rules | Farm name editable by authorized owner. Internal farm ID should not be shown to normal users. Village is important display location for farmer-facing profile. |
| Validation Rules | Farm name required. Location values valid. Contact format valid. |
| Acceptance Criteria | Farm profile edits persist and appear in profile/reports. |
| Dependencies | Farm database, location master data. |
| Security Considerations | Only authorized users can edit farm profile. |
| Localization Requirements | Location labels localized; place names may remain as master data. |

### PROF-FR-003 - Profile Editing and Completion Logic

| Attribute | Details |
|---|---|
| Requirement ID | PROF-FR-003 |
| Feature Name | Profile Editing and Completion Logic |
| Description | The system shall calculate profile completion based on required user and farm fields and guide user to complete missing data. |
| Business Objective | Improve data quality and support personalization. |
| User Story | As a farmer, I want to know what profile information is missing so that I can complete it. |
| Actors | User, System |
| Preconditions | Profile fields available. |
| Trigger | Profile page loads or fields are saved. |
| Main Flow | System checks required fields, calculates percentage, displays missing items and actions. |
| Alternate Flow | User dismisses non-critical suggestions. |
| Exception Flow | Missing required master data shows generic completion prompt. |
| Post Conditions | Completion score updated. |
| Business Rules | Completion logic must be consistent with profile/dashboard and achievement scoring. |
| Validation Rules | Required field list configured. |
| Acceptance Criteria | Completion percentage updates after editing fields. |
| Dependencies | Profile, achievements, data quality. |
| Security Considerations | Completion details visible only to authorized user/admin. |
| Localization Requirements | Completion messages localized. |

### PROF-FR-004 - Statistics Dashboard

| Attribute | Details |
|---|---|
| Requirement ID | PROF-FR-004 |
| Feature Name | Personal Statistics Dashboard |
| Description | The system shall show user's/farm's total milk, income, fat, SNF, slips, AI questions, animals count, trends, and best performance where data exists. |
| Business Objective | Provide farmer performance summary. |
| User Story | As a farm owner, I want statistics so that I can understand farm growth. |
| Actors | Farmer, Farm Owner |
| Preconditions | User has statistics permission. |
| Trigger | User opens profile statistics. |
| Main Flow | System fetches data, calculates overview cards and trends, displays charts and AI summary where enabled. |
| Alternate Flow | Empty state shows data entry guidance. |
| Exception Flow | Partial query failure shows partial data notice. |
| Post Conditions | Statistics dashboard visible. |
| Business Rules | All statistics must match reports and source records. |
| Validation Rules | Date ranges valid; null values handled. |
| Acceptance Criteria | Statistics values match reports for same period. |
| Dependencies | Reports, accounting, AI assistant. |
| Security Considerations | Financial statistics protected. |
| Localization Requirements | Statistics labels localized. |

### PROF-FR-005 - Dairy Score

| Attribute | Details |
|---|---|
| Requirement ID | PROF-FR-005 |
| Feature Name | Dairy Score |
| Description | The system shall calculate and display a dairy score based on record consistency, milk tracking, reminders, goals, profile completion, OCR/AI usage, and data quality. |
| Business Objective | Encourage better digital farm management behavior. |
| User Story | As a farmer, I want a score so that I know how well I am managing records. |
| Actors | Farmer, System |
| Preconditions | Score engine configured. |
| Trigger | Profile score page opens or scheduled score calculation runs. |
| Main Flow | System calculates component scores and total, displays rank and improvement suggestions. |
| Alternate Flow | Insufficient data shows starter score and guidance. |
| Exception Flow | Calculation failure uses last known score with timestamp. |
| Post Conditions | Dairy score visible. |
| Business Rules | Score must be explainable and based on real activity. |
| Validation Rules | Score between 0 and 100. |
| Acceptance Criteria | Score components are visible and update when source data changes. |
| Dependencies | Records, reminders, goals, achievements. |
| Security Considerations | Score farm-scoped. |
| Localization Requirements | Score labels and ranks localized. |

### PROF-FR-006 - Achievement Summary

| Attribute | Details |
|---|---|
| Requirement ID | PROF-FR-006 |
| Feature Name | Achievement Summary |
| Description | The system shall show unlocked achievements, progress, rank, and next reward on profile. |
| Business Objective | Increase engagement by showing progress and recognition. |
| User Story | As a farmer, I want to see achievements on profile so that I feel motivated. |
| Actors | Farmer, Farm Owner, System |
| Preconditions | Achievement engine enabled. |
| Trigger | Profile or achievements page opens. |
| Main Flow | System fetches achievement progress, displays unlocked badges and next target. |
| Alternate Flow | No achievements shows starter achievements. |
| Exception Flow | Fetch failure shows retry. |
| Post Conditions | Achievement summary visible. |
| Business Rules | Achievements must be based on real data and not duplicated. |
| Validation Rules | Achievement IDs valid and farm/user scoped. |
| Acceptance Criteria | Profile summary matches achievements page. |
| Dependencies | Achievements, score engine. |
| Security Considerations | Visibility follows leaderboard/privacy settings. |
| Localization Requirements | Badge titles/descriptions localized. |

---

# 6. Module 5 - Support

## 6.1 Support Module Overview

Support provides self-service help, FAQs, tutorials, contact options, tickets, feedback, bug reports, and communication with platform support/admin teams. Support must be simple for farmers and structured enough for support teams.

## 6.2 Ticket Lifecycle

Create -> Assign -> Investigate -> Resolve -> Close

| Stage | Description |
|---|---|
| Create | User submits ticket with title, category, priority, description, attachments. |
| Assign | System or admin assigns ticket to support executive. |
| Investigate | Support reviews issue, asks questions, checks logs where permitted. |
| Resolve | Support provides solution and marks resolved. |
| Close | User/support closes ticket after confirmation or timeout. |

## 6.3 Support Requirements

### SUP-FR-001 - Help Center

| Attribute | Details |
|---|---|
| Requirement ID | SUP-FR-001 |
| Feature Name | Help Center |
| Description | The system shall provide a Help Center with search, categories, FAQs, tutorials, contact support, tickets, bug reporting, and system status links. |
| Business Objective | Reduce support dependency and improve user self-service. |
| User Story | As a farmer, I want help in the app so that I can solve issues quickly. |
| Actors | User, Support Team |
| Preconditions | User can access support pages. |
| Trigger | User opens help/support. |
| Main Flow | System displays support dashboard; user searches or selects support option. |
| Alternate Flow | User opens support without login where public help is allowed. |
| Exception Flow | Support content unavailable shows fallback contact info. |
| Post Conditions | User finds help path. |
| Business Rules | Help content must be categorized and searchable. |
| Validation Rules | Search input sanitized. |
| Acceptance Criteria | Help Center opens and all primary actions work. |
| Dependencies | FAQ, tutorials, ticket system. |
| Security Considerations | Auth required for user-specific tickets. |
| Localization Requirements | Help content supports Marathi and English. |

### SUP-FR-002 - FAQ

| Attribute | Details |
|---|---|
| Requirement ID | SUP-FR-002 |
| Feature Name | FAQ |
| Description | The system shall provide searchable and categorized frequently asked questions. |
| Business Objective | Answer common questions without support tickets. |
| User Story | As a user, I want FAQs so that I can learn quickly. |
| Actors | User, Support Admin |
| Preconditions | FAQ content exists. |
| Trigger | User opens FAQ or searches help. |
| Main Flow | User filters/searches FAQ, opens article, marks helpful/not helpful. |
| Alternate Flow | No result suggests ticket creation. |
| Exception Flow | Article load failure shows retry. |
| Post Conditions | FAQ view tracked and feedback stored. |
| Business Rules | FAQ articles must have category, status, language, and updated date. |
| Validation Rules | Feedback one vote per user/article where tracked. |
| Acceptance Criteria | FAQ search returns relevant articles and feedback is saved. |
| Dependencies | Support content database. |
| Security Considerations | Admin-only FAQ editing. |
| Localization Requirements | Articles support Marathi/English; no question marks from bad encoding. |

### SUP-FR-003 - Tutorials and Guided Tours

| Attribute | Details |
|---|---|
| Requirement ID | SUP-FR-003 |
| Feature Name | Tutorials and Guided Tours |
| Description | The system shall provide beginner tutorials, video tutorials, guided tours, and feature walkthroughs. |
| Business Objective | Improve onboarding and reduce usage errors. |
| User Story | As a new farmer, I want tutorials so that I can learn app features. |
| Actors | User, Product/Support Team |
| Preconditions | Tutorial content exists. |
| Trigger | User opens tutorials or starts guided tour. |
| Main Flow | User selects topic, views article/video/steps, completes tutorial. |
| Alternate Flow | Guided tour starts from relevant page. |
| Exception Flow | Video unavailable shows article fallback. |
| Post Conditions | Tutorial progress tracked where enabled. |
| Business Rules | Tutorials should be mobile-friendly and localized. |
| Validation Rules | Tutorial URL/content valid. |
| Acceptance Criteria | Tutorial categories open and content displays correctly. |
| Dependencies | Support content, media storage. |
| Security Considerations | Public/private content controlled. |
| Localization Requirements | Tutorial text localized; video language tagged. |

### SUP-FR-004 - Contact Support

| Attribute | Details |
|---|---|
| Requirement ID | SUP-FR-004 |
| Feature Name | Contact Support |
| Description | The system shall show support contact options such as WhatsApp, email, phone, and support form where configured. |
| Business Objective | Provide direct help path for unresolved issues. |
| User Story | As a farmer, I want contact options so that I can reach support. |
| Actors | User, Support Team |
| Preconditions | Contact channels configured. |
| Trigger | User opens contact support. |
| Main Flow | System displays channels; user selects channel or form. |
| Alternate Flow | User creates support ticket instead. |
| Exception Flow | Missing channel config hides unavailable option. |
| Post Conditions | User reaches support channel. |
| Business Rules | Contact details must be configurable by admin. |
| Validation Rules | Phone/email/URL valid. |
| Acceptance Criteria | Contact buttons work on mobile and desktop. |
| Dependencies | Support settings, ticket system. |
| Security Considerations | Avoid exposing internal-only contacts. |
| Localization Requirements | Contact labels localized. |

### SUP-FR-005 - Ticket Management

| Attribute | Details |
|---|---|
| Requirement ID | SUP-FR-005 |
| Feature Name | Ticket Management |
| Description | The system shall allow users to create, view, reply to, attach files to, and close support tickets. |
| Business Objective | Provide structured issue resolution workflow. |
| User Story | As a user, I want to raise a ticket so that support can solve my problem. |
| Actors | User, Support Executive, Administrator, System |
| Preconditions | User authenticated for private tickets. |
| Trigger | User submits ticket form. |
| Main Flow | User enters title, description, category, priority, attachments; system validates and creates ticket; support replies; user responds; ticket resolves/closes. |
| Alternate Flow | Admin assigns/reassigns ticket. |
| Exception Flow | Attachment too large or invalid type blocks upload. |
| Post Conditions | Ticket lifecycle status updated. |
| Business Rules | Ticket statuses: Open, In Progress, Waiting For User, Resolved, Closed, Rejected. SLA applies by priority. |
| Validation Rules | Title, description, category, priority required. Attachment size/type valid. |
| Acceptance Criteria | Ticket can be created, replied to, resolved, and closed with history. |
| Dependencies | Notifications, storage, admin support tools. |
| Security Considerations | Users see only own/farm tickets; support access logged. |
| Localization Requirements | Ticket UI and statuses localized. |

### SUP-FR-006 - Feedback and Bug Reporting

| Attribute | Details |
|---|---|
| Requirement ID | SUP-FR-006 |
| Feature Name | Feedback and Bug Reporting |
| Description | The system shall allow users to submit feedback, feature requests, bug reports, screenshots, and device information. |
| Business Objective | Capture product improvement and defect signals. |
| User Story | As a user, I want to report bugs so that issues can be fixed. |
| Actors | User, Product Team, Support Team |
| Preconditions | User can access support. |
| Trigger | User opens feedback or report bug form. |
| Main Flow | User enters title, steps, expected/actual result, screenshot; system captures device/browser info; ticket/feedback saved. |
| Alternate Flow | User submits feature request with expected benefit. |
| Exception Flow | Missing required details shows validation. |
| Post Conditions | Feedback/bug report stored and routed. |
| Business Rules | Bug reports may automatically create support ticket or product backlog item based on configuration. |
| Validation Rules | Title and description required. Attachments valid. |
| Acceptance Criteria | Device info captured and report visible to support/admin. |
| Dependencies | Ticket system, storage, admin panel. |
| Security Considerations | Device info collection disclosed. |
| Localization Requirements | Forms localized. |

### SUP-FR-007 - SLA and Escalation Rules

| Attribute | Details |
|---|---|
| Requirement ID | SUP-FR-007 |
| Feature Name | SLA and Escalation Rules |
| Description | The system shall apply support SLA and escalation rules based on ticket priority and category. |
| Business Objective | Improve support accountability and response time. |
| User Story | As a support manager, I want SLA tracking so that critical issues are handled quickly. |
| Actors | Support Executive, Administrator, System |
| Preconditions | Ticket exists with priority. |
| Trigger | Ticket created or SLA timer runs. |
| Main Flow | System calculates due response/resolution time, flags overdue tickets, notifies assignee/admin. |
| Alternate Flow | SLA paused when waiting for user if policy allows. |
| Exception Flow | Missing priority defaults to medium. |
| Post Conditions | SLA status updated. |
| Business Rules | Critical tickets escalate fastest. |
| Validation Rules | Priority and timestamps required. |
| Acceptance Criteria | Overdue tickets are flagged and escalated. |
| Dependencies | Ticket management, notifications, admin panel. |
| Security Considerations | Admin/support access only. |
| Localization Requirements | SLA labels localized. |

---

# 7. Module 6 - Achievements and Leaderboards

## 7.1 Achievements Module Overview

Achievements and Leaderboards encourage user engagement by rewarding record completion, milk production, goal achievement, consistency, farm health, and AI/OCR usage. Scores and rankings must be explainable and based on real farm data.

## 7.2 Achievement Categories

| Category | Examples |
|---|---|
| Milk Production | 100 liter, 1000 liter, 10000 liter milestones |
| Record Completion | First cow, first milk entry, complete profile |
| Goal Achievement | Daily/monthly goal achieved |
| Farm Health | High data quality, reminder completion |
| Consistency | 7-day, 30-day, 100-day streaks |
| AI Usage | First AI question, AI explorer |
| OCR Usage | First slip upload, OCR milestone |

## 7.3 Achievement and Leaderboard Requirements

### ACH-FR-001 - Achievement Engine

| Attribute | Details |
|---|---|
| Requirement ID | ACH-FR-001 |
| Feature Name | Achievement Engine |
| Description | The system shall evaluate farm and user activity against achievement rules and unlock achievements automatically. |
| Business Objective | Increase engagement and encourage good record-keeping behavior. |
| User Story | As a farmer, I want achievements so that I feel motivated to use the app consistently. |
| Actors | Farmer, System |
| Preconditions | Achievement rules configured and source data available. |
| Trigger | Source data changes or scheduled evaluation runs. |
| Main Flow | System evaluates rules, updates progress, unlocks achievement, sends notification. |
| Alternate Flow | Hidden achievements unlock without revealing criteria before completion. |
| Exception Flow | Rule evaluation failure logs error and does not duplicate unlocks. |
| Post Conditions | Achievement progress/unlock state updated. |
| Business Rules | One achievement can be unlocked once per user/farm unless repeatable rule exists. |
| Validation Rules | Achievement ID valid; progress within 0-100%. |
| Acceptance Criteria | Achievements unlock based on real data and are not duplicated. |
| Dependencies | Records, goals, OCR, AI, notifications. |
| Security Considerations | Farm/user-scoped progress. |
| Localization Requirements | Achievement titles/descriptions localized. |

### ACH-FR-002 - Dairy Score

| Attribute | Details |
|---|---|
| Requirement ID | ACH-FR-002 |
| Feature Name | Dairy Score |
| Description | The system shall calculate a 0-100 dairy score based on milk records, consistency, OCR usage, AI usage, profile completion, data quality, and farm activity. |
| Business Objective | Provide a single engagement and data-quality indicator. |
| User Story | As a farmer, I want a score so that I know how well I am using the app. |
| Actors | Farmer, Farm Owner, System |
| Preconditions | Score formula configured. |
| Trigger | Score page opens or scheduled score update runs. |
| Main Flow | System calculates component scores, total score, rank, and suggestions. |
| Alternate Flow | New farm gets starter score and setup guidance. |
| Exception Flow | Calculation failure uses last known score. |
| Post Conditions | Score visible and stored. |
| Business Rules | Score must be explainable and not punish farms with missing optional modules too heavily unless defined. |
| Validation Rules | Score 0-100; components sum to configured weight. |
| Acceptance Criteria | Score changes when source data improves and explanations are visible. |
| Dependencies | Profile, records, reminders, goals. |
| Security Considerations | Score visibility follows privacy settings. |
| Localization Requirements | Score messages localized. |

### ACH-FR-003 - Farm Ranking

| Attribute | Details |
|---|---|
| Requirement ID | ACH-FR-003 |
| Feature Name | Farm Ranking |
| Description | The system shall rank farms using selected metric such as dairy score, milk production, activity, slip scan usage, or AI usage. |
| Business Objective | Encourage healthy competition and engagement. |
| User Story | As a farmer, I want to see my ranking so that I know where my farm stands. |
| Actors | Farmer, Farm Owner, System |
| Preconditions | Leaderboard enabled and farm visibility allowed. |
| Trigger | User opens leaderboard. |
| Main Flow | User selects metric; system calculates ranking and displays farms. |
| Alternate Flow | User switches between all farms and local area ranking. |
| Exception Flow | Insufficient data shows no leaderboard message. |
| Post Conditions | Ranking visible. |
| Business Rules | Ranking must use normalized and transparent formula. Privacy settings may hide farm name. |
| Validation Rules | Metric supported. Ranking period valid. |
| Acceptance Criteria | Ranking order matches formula and tie-breaking rules. |
| Dependencies | Score engine, records, profile, privacy settings. |
| Security Considerations | Do not expose private financial data in public ranking. |
| Localization Requirements | Leaderboard labels localized. |

### ACH-FR-004 - Taluka Ranking

| Attribute | Details |
|---|---|
| Requirement ID | ACH-FR-004 |
| Feature Name | Taluka Ranking |
| Description | The system shall show leaderboard limited to farms in the user's taluka where location data is available. |
| Business Objective | Provide more relevant local ranking. |
| User Story | As a farmer, I want to compare with my taluka so that ranking feels meaningful. |
| Actors | Farmer, System |
| Preconditions | Farm taluka set and leaderboard visibility allowed. |
| Trigger | User selects "My Taluka" ranking. |
| Main Flow | System filters farms by taluka and metric, calculates ranking, displays list. |
| Alternate Flow | Missing taluka prompts user to update farm profile. |
| Exception Flow | Too few farms shows limited data message. |
| Post Conditions | Taluka ranking visible. |
| Business Rules | Taluka names must come from normalized location data where possible. |
| Validation Rules | Taluka exists and farm-scoped user belongs to selected farm. |
| Acceptance Criteria | My Taluka leaderboard excludes farms outside taluka. |
| Dependencies | Farm profile, location data, leaderboard engine. |
| Security Considerations | Respect privacy and visibility. |
| Localization Requirements | Location labels localized; place names as master data. |

### ACH-FR-005 - Monthly and Annual Leaderboards

| Attribute | Details |
|---|---|
| Requirement ID | ACH-FR-005 |
| Feature Name | Monthly and Annual Leaderboards |
| Description | The system shall provide monthly and annual leaderboards for supported ranking metrics. |
| Business Objective | Encourage recurring engagement and performance tracking. |
| User Story | As a farmer, I want monthly rankings so that I can track progress over time. |
| Actors | Farmer, System |
| Preconditions | Leaderboard metrics and period data available. |
| Trigger | User selects period. |
| Main Flow | System calculates rankings for selected month/year and displays positions. |
| Alternate Flow | User views previous period. |
| Exception Flow | No data for period shows empty state. |
| Post Conditions | Period leaderboard visible. |
| Business Rules | Period ranking must be frozen after period close if configured. |
| Validation Rules | Month/year valid. |
| Acceptance Criteria | Leaderboard changes when period changes and matches source metric. |
| Dependencies | Ranking engine, reports. |
| Security Considerations | Privacy settings enforced. |
| Localization Requirements | Month/year labels localized. |

### ACH-FR-006 - Achievement Notifications

| Attribute | Details |
|---|---|
| Requirement ID | ACH-FR-006 |
| Feature Name | Achievement Notifications |
| Description | The system shall notify users when achievements unlock, rank improves, milestone reached, or leaderboard updates. |
| Business Objective | Increase motivation and retention. |
| User Story | As a farmer, I want to be notified when I earn an achievement. |
| Actors | Farmer, System |
| Preconditions | Achievement/leaderboard event occurs and notifications enabled. |
| Trigger | Achievement unlock or rank change. |
| Main Flow | System creates celebration notification and optional in-app popup. |
| Alternate Flow | User disables achievement notifications. |
| Exception Flow | Notification failure does not rollback achievement. |
| Post Conditions | Achievement event communicated or logged. |
| Business Rules | Celebration should be short, non-intrusive, and not repeated for same unlock. |
| Validation Rules | Achievement event valid. |
| Acceptance Criteria | Unlock notification appears once and links to achievement page. |
| Dependencies | Notifications, achievement engine. |
| Security Considerations | Notification content avoids sensitive rankings if privacy disabled. |
| Localization Requirements | Achievement notifications localized. |

### ACH-FR-007 - Badge and Reward Logic

| Attribute | Details |
|---|---|
| Requirement ID | ACH-FR-007 |
| Feature Name | Badge and Reward Logic |
| Description | The system shall assign badges, titles, profile frames, themes, or icons based on achievement unlock rules. |
| Business Objective | Provide visible rewards for engagement. |
| User Story | As a farmer, I want badges so that my progress is recognized. |
| Actors | Farmer, System |
| Preconditions | Achievement unlocked. |
| Trigger | Achievement unlock event. |
| Main Flow | System assigns reward and displays in profile/achievement page. |
| Alternate Flow | User selects active title/frame where multiple rewards exist. |
| Exception Flow | Reward configuration missing logs admin issue. |
| Post Conditions | Reward available to user. |
| Business Rules | Rewards must be tied to achievement IDs and not granted manually unless admin override is audited. |
| Validation Rules | Reward type valid. |
| Acceptance Criteria | Unlocked rewards display and selectable where supported. |
| Dependencies | Achievement engine, profile. |
| Security Considerations | Reward assignment audited. |
| Localization Requirements | Reward names localized. |

### ACH-FR-008 - Leaderboard Tie-Breaking and Visibility

| Attribute | Details |
|---|---|
| Requirement ID | ACH-FR-008 |
| Feature Name | Leaderboard Tie-Breaking and Visibility |
| Description | The system shall apply deterministic tie-breaking and visibility rules for leaderboard rankings. |
| Business Objective | Ensure fair and trusted rankings. |
| User Story | As a farmer, I want rankings to be fair so that I trust the leaderboard. |
| Actors | Farmer, System, Administrator |
| Preconditions | Leaderboard calculated. |
| Trigger | Ranking generation runs. |
| Main Flow | System sorts by metric, then tie-breakers such as consistency, data completeness, earliest achievement time, or farm age according to configured formula. |
| Alternate Flow | Hidden farms appear as anonymous if privacy setting requires. |
| Exception Flow | Missing tie-breaker data uses next available rule. |
| Post Conditions | Stable leaderboard order generated. |
| Business Rules | Ranking formula and tie-breaking rules must be documented in user-friendly terms. |
| Validation Rules | Visibility setting valid. |
| Acceptance Criteria | Same data produces same rank order and privacy is respected. |
| Dependencies | Profile, privacy settings, ranking engine. |
| Security Considerations | Do not reveal private contact or financial details. |
| Localization Requirements | Formula explanation localized. |

---

# 8. Cross-Module Requirements

## 8.1 Localization Requirements

| Area | Requirement |
|---|---|
| AI Assistant | Chat UI, suggested questions, responses, errors, and permission prompts support Marathi and English. |
| Notifications | Notification titles, bodies, categories, preferences, and statuses support Marathi and English. |
| Settings | All settings pages, toggles, validation, save messages, and confirmations support Marathi and English. |
| Profile | Profile labels, completion messages, statistics labels, score messages, and achievements support Marathi and English. |
| Support | Help content, FAQ, tickets, statuses, SLA labels, and tutorials support Marathi and English. |
| Achievements | Badge names, descriptions, rank names, leaderboard labels, and reward messages support Marathi and English. |

## 8.2 Common Localized Messages

| Scenario | Marathi | English |
|---|---|---|
| Save success | सेटिंग्ज जतन झाली. | Settings saved. |
| Permission needed | ही सुविधा वापरण्यासाठी परवानगी आवश्यक आहे. | Permission is required to use this feature. |
| AI disabled | दुग्धमित्र AI बंद आहे. सेटिंग्जमधून सुरू करा. | Dugdhamitra AI is disabled. Enable it from settings. |
| No data | या कालावधीसाठी माहिती उपलब्ध नाही. | No data is available for this period. |
| Notification sent | सूचना पाठवली गेली. | Notification sent. |
| Ticket created | तिकीट तयार झाले. | Ticket created. |
| Achievement unlocked | अभिनंदन! नवीन achievement मिळाले. | Congratulations! New achievement unlocked. |

## 8.3 Security Requirements

| Area | Requirement |
|---|---|
| AI | AI data retrieval must enforce farm/user permissions on server. |
| Notifications | Users must only see notifications targeted to them or their farm. |
| Settings | Users can edit only their own settings unless admin permission exists. |
| Profile | Internal IDs hidden from normal users; personal data protected. |
| Support | Ticket access limited to creator/farm authorized users and support admins. |
| Achievements | Leaderboard visibility must respect privacy settings. |

## 8.4 Privacy Requirements

| Area | Requirement |
|---|---|
| AI Consent | User controls AI data access categories. |
| Chat History | User can delete history according to policy. |
| Push Notifications | Push payload should minimize sensitive data. |
| Support Attachments | Attachments protected and farm/user scoped. |
| Leaderboards | Farm name visibility controlled by privacy settings. |

## 8.5 Audit Requirements

| Event | Audit Requirement |
|---|---|
| AI permission changed | Store user, old value, new value, timestamp. |
| Notification sent by admin | Store admin, target, message ID, schedule, delivery status. |
| Security setting changed | Store user, action type, timestamp, device/IP where available. |
| Profile/farm profile edited | Store user, changed fields, timestamp. |
| Support ticket status changed | Store actor, old status, new status, timestamp. |
| Achievement manually adjusted | Store admin, reason, old/new state. |

## 8.6 Performance Requirements

| Area | Requirement |
|---|---|
| AI Chat | Show typing/loading state within 500ms and avoid blocking page. |
| Notification Bell | Unread count loads quickly and can be cached. |
| Settings | Settings pages load current preferences without heavy dashboard queries. |
| Profile Statistics | Heavy charts should lazy load or use cached summaries. |
| Support Search | Search should paginate and debounce input. |
| Leaderboards | Ranking queries should use precomputed summaries for scale. |

## 8.7 Accessibility Requirements

| Area | Requirement |
|---|---|
| AI Chat | Send button accessible, keyboard-friendly, and screen-reader labeled. |
| Notifications | Bell and notification actions have accessible labels. |
| Settings | Toggles have visible labels and state. |
| Profile | Forms support large touch targets. |
| Support | Ticket forms provide clear errors and attachment status. |
| Achievements | Badges include text labels, not icon-only meaning. |

---

# 9. Traceability Tables

## 9.1 Business Objective Traceability

| Business Objective | Related Requirements |
|---|---|
| Increase AI adoption using real data | AI-FR-001 to AI-FR-012 |
| Improve task completion and communication | NOTIF-FR-001 to NOTIF-FR-009 |
| Improve personalization and control | SET-FR-001 to SET-FR-010 |
| Improve user and farm identity quality | PROF-FR-001 to PROF-FR-006 |
| Reduce support burden | SUP-FR-001 to SUP-FR-007 |
| Improve engagement and retention | ACH-FR-001 to ACH-FR-008 |

## 9.2 Requirement Inventory

| Module | Requirement Count | ID Range |
|---|---:|---|
| AI Assistant | 12 | AI-FR-001 to AI-FR-012 |
| Notifications | 9 | NOTIF-FR-001 to NOTIF-FR-009 |
| Settings | 10 | SET-FR-001 to SET-FR-010 |
| Profile | 6 | PROF-FR-001 to PROF-FR-006 |
| Support | 7 | SUP-FR-001 to SUP-FR-007 |
| Achievements and Leaderboards | 8 | ACH-FR-001 to ACH-FR-008 |
| Total | 52 | Phase 4 requirements |

---

# 10. Open Questions for Later Phases

| Question ID | Question | Owner |
|---|---|---|
| OQ4-001 | Should AI assistant answer general non-dairy questions or remain farm-focused by product policy? | Product |
| OQ4-002 | What exact notification categories are mandatory and cannot be disabled? | Product/Legal |
| OQ4-003 | Should support tickets be farm-level or user-level by default? | Support/Product |
| OQ4-004 | Should leaderboard be opt-in for public farm names? | Product/Privacy |
| OQ4-005 | What is the formal AI chat retention period by subscription plan? | Product/Security |
| OQ4-006 | Which achievements are hidden and which are public? | Product |

---

# 11. Phase 4 Completion Criteria

Phase 4 is complete when:

1. All 52 requirements are reviewed by product, support, engineering, QA, and stakeholders.
2. AI data permission model is approved.
3. Notification lifecycle and category rules are approved.
4. Settings persistence and localization requirements are accepted.
5. Profile privacy and visible field rules are accepted.
6. Support ticket lifecycle and SLA rules are accepted.
7. Achievement and leaderboard scoring formulas are approved.
8. QA can derive test cases from acceptance criteria.



---


# Part 5 - Admin, Architecture, Security, NFRs, Data Model and Final Assembly

# Majhi Dairy - Phase 5 Admin, Architecture, Security and Final BRD Sections

**Document Type:** Final Enterprise BRD Sections  
**Phase:** Phase 5 - Admin Panel, Analytics, Subscription, Security, NFRs, Data Model, Integrations, Audit, Disaster Recovery, Final Assembly  
**Application Name:** Majhi Dairy  
**Supported Languages:** Marathi, English  
**Target Users:** Farmers, Farm Owners, Veterinarians, Support Teams, Administrators, Super Administrators  
**Source Documents:** Phase 1 BRD Foundation, Phase 2 Core Modules BRD, Phase 3 Business Modules BRD, Phase 4 Platform Modules BRD  
**Version:** 0.1  
**Date:** 06 June 2026  
**Status:** Draft for Review  

---

## Document Control

| Version | Date | Author | Description | Status |
|---|---:|---|---|---|
| 0.1 | 06 June 2026 | Business Analysis Team | Final BRD sections for admin, architecture, security, NFRs, data model, integrations, audit, disaster recovery, and master assembly | Draft |

---

# 1. Admin Panel

## 1.1 Admin Panel Overview

The Admin Panel is the operational control center for Majhi Dairy. It enables authorized administrators and super administrators to manage users, farms, subscriptions, trials, notification campaigns, support operations, platform analytics, content, and system health. Admin functions must be secure, auditable, and protected from accidental destructive actions.

## 1.2 Admin Dashboard Widget Specification

| Widget | Data Source | Refresh Frequency | Filters | Drill Down |
|---|---|---|---|---|
| Total Users | Users table | 5-15 minutes or manual refresh | Date range, role, status | User list |
| Active Users | Activity/session logs | 5-15 minutes | DAU/WAU/MAU, role | User activity |
| Farms | Farms table | 5-15 minutes | Status, district, taluka, plan | Farm details |
| Cows | Cow records | 30 minutes | Farm, district, status | Farm animal list |
| Monthly Milk Volume | Milk records/settlements | 30-60 minutes | Month, district, farm | Milk analytics |
| Revenue Metrics | Subscription/payment records | 30-60 minutes | Plan, month, status | Subscription dashboard |
| Support Tickets | Support tickets | Near real-time | Priority, status, assignee | Ticket queue |
| Subscription Metrics | Subscription/trial records | 30-60 minutes | Active, expired, trial | Subscription list |

## 1.3 Admin Requirements

### ADMIN-FR-001 - Admin Dashboard

| Attribute | Details |
|---|---|
| Requirement ID | ADMIN-FR-001 |
| Feature Name | Admin Dashboard |
| Description | The system shall provide a centralized dashboard for platform metrics, farm activity, user activity, support status, and subscription health. |
| Business Objective | Enable administrators to monitor platform operations and identify risks quickly. |
| Actors | Administrator, Super Administrator |
| User Story | As an administrator, I want a dashboard so that I can understand platform health at a glance. |
| Preconditions | Admin is authenticated and authorized. |
| Main Flow | Admin opens dashboard, system loads KPI widgets, admin filters or drills down to details. |
| Alternate Flow | If some analytics are unavailable, dashboard shows partial data with warning. |
| Exception Flow | Unauthorized user is redirected or denied access. |
| Business Rules | Admin dashboard must not show data outside admin permissions. Widgets must be traceable to source tables. |
| Validation Rules | Filter dates valid. Role and status filters valid. |
| Acceptance Criteria | Dashboard shows total users, active users, farms, cows, milk volume, revenue, support tickets, and subscription metrics with drill-down links. |
| Dependencies | Users, farms, records, subscriptions, support, analytics summaries. |
| Security Requirements | Admin role required, all access logged, sensitive widgets restricted to super admin where required. |

### ADMIN-FR-002 - User Management

| Attribute | Details |
|---|---|
| Requirement ID | ADMIN-FR-002 |
| Feature Name | User Management |
| Description | The system shall allow administrators to create, view, edit, suspend, activate, delete, reset password, and review activity logs for users. |
| Business Objective | Enable controlled platform user administration. |
| Actors | Administrator, Super Administrator |
| User Story | As an admin, I want to manage users so that platform access remains accurate and secure. |
| Preconditions | Admin has user-management permission. |
| Main Flow | Admin searches user, opens user profile, edits allowed fields or performs action, system validates and logs action. |
| Alternate Flow | Admin bulk-filters users by role/status/farm. |
| Exception Flow | Protected owner/super admin changes require elevated permission or are blocked. |
| Business Rules | Role matrix includes Farmer, Veterinarian, Support, Admin, Super Admin. Delete should be protected; suspension is preferred for historical integrity. |
| Validation Rules | User ID valid, role valid, email/mobile format valid, action reason required for suspend/delete. |
| Acceptance Criteria | Admin can manage users according to role, and all sensitive actions are auditable. |
| Dependencies | Authentication, role-based access control, audit logs. |
| Security Requirements | Super admin required for admin role changes and destructive actions. |

### ADMIN-FR-003 - Farm Management

| Attribute | Details |
|---|---|
| Requirement ID | ADMIN-FR-003 |
| Feature Name | Farm Management |
| Description | The system shall allow administrators to view, register, approve, suspend, activate, and analyze farms. |
| Business Objective | Support customer operations, compliance, and platform health monitoring. |
| Actors | Administrator, Super Administrator |
| User Story | As an admin, I want to manage farms so that I can support customers and control platform access. |
| Preconditions | Admin has farm-management permission. |
| Main Flow | Admin opens farm list, filters farms, views farm details, performs approved actions with confirmation. |
| Alternate Flow | Admin approves new farm registration or reactivates suspended farm. |
| Exception Flow | Invalid farm ID or cross-tenant access shows safe not-found/access-denied message. |
| Business Rules | Farm suspension blocks normal user access but preserves data. Farm approval workflow must be auditable. |
| Validation Rules | Farm name, owner, status, location, and subscription state validated. |
| Acceptance Criteria | Farm status actions work and users receive appropriate notifications. |
| Dependencies | Farms, users, subscriptions, notifications, admin audit. |
| Security Requirements | Farm actions require role check, confirmation, and audit log. |

### ADMIN-FR-004 - Farm Details Monitoring Dashboard

| Attribute | Details |
|---|---|
| Requirement ID | ADMIN-FR-004 |
| Feature Name | Farm Details Monitoring Dashboard |
| Description | The system shall provide an enterprise farm detail page showing overview, subscription, health score, statistics, milk analytics, finance, users, devices, activity, OCR, AI usage, alerts, notes, quick actions, data quality, summary, and export center. |
| Business Objective | Give support and admin teams a complete customer context without navigating across multiple modules. |
| Actors | Administrator, Super Administrator, Support Executive |
| User Story | As support/admin, I want a complete farm detail page so that I can diagnose customer issues quickly. |
| Preconditions | Admin/support is authorized for farm detail access. |
| Main Flow | User opens farm detail, system loads sections with real database data, user expands sections or performs permitted actions. |
| Alternate Flow | Slow analytics sections load lazily while overview appears first. |
| Exception Flow | Missing data shows empty state; invalid farm ID shows safe error. |
| Business Rules | No mock data. All values must come from database queries. Financial and user data visible only to authorized roles. |
| Validation Rules | Farm ID must be valid and access-scoped. Date ranges valid. |
| Acceptance Criteria | Every displayed count matches source records and no cross-farm leakage occurs. |
| Dependencies | Farm records, analytics, users, devices, subscriptions, support, OCR, AI logs. |
| Security Requirements | Role-based section visibility, full audit for admin actions. |

### ADMIN-FR-005 - Notification Management

| Attribute | Details |
|---|---|
| Requirement ID | ADMIN-FR-005 |
| Feature Name | Notification Management |
| Description | The system shall allow administrators to create, schedule, target, send, cancel, edit templates, and view delivery analytics for notifications. |
| Business Objective | Enable platform communication at scale. |
| Actors | Administrator, Super Administrator |
| User Story | As an admin, I want to send targeted notifications so that users receive relevant announcements. |
| Preconditions | Admin has notification permission. |
| Main Flow | Admin creates notification, selects audience, channel, schedule, expiry, preview, and sends/schedules. |
| Alternate Flow | Admin saves template or draft. |
| Exception Flow | No recipients, invalid schedule, or missing push subscriptions show actionable error. |
| Business Rules | Notification sends must be auditable. Critical/emergency sends require elevated confirmation where configured. |
| Validation Rules | Title, message, audience, type, priority, schedule, and expiry validated. |
| Acceptance Criteria | Targeted notifications reach intended users and delivery report is available. |
| Dependencies | Notification service, users, farms, push subscriptions, templates. |
| Security Requirements | Super admin approval for high-priority global broadcasts where configured. |

### ADMIN-FR-006 - Support Management

| Attribute | Details |
|---|---|
| Requirement ID | ADMIN-FR-006 |
| Feature Name | Support Management |
| Description | The system shall allow support/admin users to view, assign, escalate, reply, resolve, and analyze support tickets. |
| Business Objective | Improve customer support quality and SLA adherence. |
| Actors | Support Executive, Administrator |
| User Story | As support staff, I want to manage tickets so that customer issues are resolved efficiently. |
| Preconditions | User has support admin permission. |
| Main Flow | Support opens queue, filters tickets, assigns ticket, replies, updates status, resolves or escalates. |
| Alternate Flow | Ticket is converted to bug/feature request. |
| Exception Flow | Unauthorized ticket access denied. |
| Business Rules | SLA timers depend on priority. All status changes and replies must be logged. |
| Validation Rules | Ticket ID valid, status transition valid, reply text required. |
| Acceptance Criteria | Ticket lifecycle works from open to close with history and notifications. |
| Dependencies | Support module, notifications, audit logs. |
| Security Requirements | Support users see only permitted ticket/farm data. |

### ADMIN-FR-007 - Analytics Dashboard

| Attribute | Details |
|---|---|
| Requirement ID | ADMIN-FR-007 |
| Feature Name | Analytics Dashboard |
| Description | The system shall provide executive, KPI, and operational dashboards for users, farms, milk, finance, AI, OCR, goals, and support. |
| Business Objective | Enable data-driven product and business decisions. |
| Actors | Administrator, Super Administrator, Product Team |
| User Story | As a product/admin user, I want analytics dashboards so that I can track platform performance. |
| Preconditions | Analytics data available and user authorized. |
| Main Flow | Admin selects dashboard, filters period/segment, system shows charts and KPIs. |
| Alternate Flow | Admin exports analytics. |
| Exception Flow | Large query uses cached/precomputed summaries or async generation. |
| Business Rules | Analytics must be based on real platform data and respect privacy. |
| Validation Rules | Date and segment filters valid. |
| Acceptance Criteria | Dashboards load within defined performance targets and reconcile with source summaries. |
| Dependencies | Analytics summaries, records, subscriptions, AI/OCR logs. |
| Security Requirements | Sensitive financial/user analytics restricted. |

### ADMIN-FR-008 - Subscription Management

| Attribute | Details |
|---|---|
| Requirement ID | ADMIN-FR-008 |
| Feature Name | Subscription Management |
| Description | The system shall allow admins to create, update, upgrade, downgrade, renew, expire, extend, reduce, suspend, and track subscription plans. |
| Business Objective | Provide full commercial control over farm access and plan features. |
| Actors | Administrator, Super Administrator |
| User Story | As an admin, I want full subscription control so that I can manage customer plans accurately. |
| Preconditions | Admin has subscription permission. |
| Main Flow | Admin opens farm subscription, changes plan/dates/status/payment, confirms action, system updates access and notifies user. |
| Alternate Flow | Admin schedules future plan change. |
| Exception Flow | Invalid date range, unauthorized downgrade, or missing reason blocks action. |
| Business Rules | Both extension and reduction of subscription/trial must be supported with reason and audit. Feature access matrix controls enabled modules. |
| Validation Rules | Start date <= expiry date. Plan valid. Reason required for manual override. |
| Acceptance Criteria | Farm access changes immediately according to subscription state and user receives notification. |
| Dependencies | Subscription tables, feature access matrix, notifications, audit. |
| Security Requirements | Super admin required for protected overrides and deletion. |

### ADMIN-FR-009 - Trial Management

| Attribute | Details |
|---|---|
| Requirement ID | ADMIN-FR-009 |
| Feature Name | Trial Management |
| Description | The system shall support trial creation, extension, reduction, expiry, conversion, and suspension. |
| Business Objective | Enable flexible onboarding and sales operations. |
| Actors | Administrator, Super Administrator |
| User Story | As an admin, I want to control trials so that I can manage customer onboarding. |
| Preconditions | Farm exists and admin authorized. |
| Main Flow | Admin selects farm trial, adjusts dates/status, confirms, system updates trial and feature access. |
| Alternate Flow | Trial converts to paid subscription. |
| Exception Flow | Trial reduction before current date requires confirmation and reason. |
| Business Rules | Trial expiry notifications should be generated. Expired trial access follows product policy. |
| Validation Rules | Trial dates valid; reason required for override. |
| Acceptance Criteria | Trial dates can be extended or reduced and access changes correctly. |
| Dependencies | Subscription management, notifications, access control. |
| Security Requirements | Trial override audited. |

### ADMIN-FR-010 - Content and System Monitoring

| Attribute | Details |
|---|---|
| Requirement ID | ADMIN-FR-010 |
| Feature Name | Content Management and System Monitoring |
| Description | The system shall allow administrators to manage support content/templates and monitor API, database, OCR, AI, notification, backup, and application health. |
| Business Objective | Maintain platform quality and operational readiness. |
| Actors | Administrator, Super Administrator, Support Team |
| User Story | As an admin, I want system monitoring and content management so that the platform remains reliable. |
| Preconditions | Admin authorized. |
| Main Flow | Admin views health status, incidents, templates, FAQ/tutorial content, and updates permitted content. |
| Alternate Flow | Admin schedules maintenance notice. |
| Exception Flow | Monitoring service unavailable shows last known status. |
| Business Rules | Content changes must preserve Marathi/English text and avoid encoding corruption. |
| Validation Rules | Content title/body required, status valid, health records timestamped. |
| Acceptance Criteria | Admin can manage content and monitor service health with audit trail. |
| Dependencies | Support content, notification templates, monitoring logs. |
| Security Requirements | Only authorized admin can publish content or status notices. |

---

# 2. Analytics and Business Intelligence

## 2.1 Analytics KPI Catalog

| KPI Area | KPIs |
|---|---|
| User KPIs | Total Users, DAU, WAU, MAU, Retention, Activation, Churn |
| Farm KPIs | Total Farms, Active Farms, Trial Farms, Average Milk Production, Farm Health |
| Financial KPIs | Platform Revenue, Farm Income, Farm Expenses, Farm Profit, Subscription Revenue |
| AI KPIs | AI Usage, AI Questions, AI Satisfaction, Average Response Time |
| OCR KPIs | Slip Uploads, OCR Success Rate, OCR Accuracy/Confidence, Correction Rate |
| Support KPIs | Ticket Backlog, Resolution Time, SLA Breach, CSAT |

## 2.2 Analytics Requirements

### ANALYTICS-FR-001 - User Analytics

| Attribute | Details |
|---|---|
| Requirement ID | ANALYTICS-FR-001 |
| Feature Name | User Analytics |
| Description | The system shall track user registration, activation, DAU, WAU, MAU, retention, and churn. |
| Business Objective | Measure user adoption and engagement. |
| Actors | Administrator, Product Team |
| User Story | As product/admin, I want user analytics so that I can track adoption. |
| Preconditions | Activity logs and user records exist. |
| Main Flow | User selects period/segment, system calculates and displays metrics. |
| Alternate Flow | Export analytics to CSV/Excel. |
| Exception Flow | Insufficient data shows no-data state. |
| Business Rules | Metrics must use consistent definitions across dashboards. |
| Validation Rules | Date range and segment filters valid. |
| Acceptance Criteria | DAU/WAU/MAU and retention are calculated consistently. |
| Dependencies | Users, sessions, activity logs. |
| Security Requirements | Admin analytics permission required. |

### ANALYTICS-FR-002 - Farm Analytics

| Attribute | Details |
|---|---|
| Requirement ID | ANALYTICS-FR-002 |
| Feature Name | Farm Analytics |
| Description | The system shall provide farm count, active farms, inactive farms, location distribution, animal counts, and farm health metrics. |
| Business Objective | Monitor customer farm activity and operational health. |
| Actors | Administrator, Product Team |
| User Story | As admin, I want farm analytics so that I can identify active and at-risk farms. |
| Preconditions | Farm and activity data available. |
| Main Flow | Admin filters by district/taluka/status/plan and views farm analytics. |
| Alternate Flow | Admin drills down to farm list. |
| Exception Flow | Missing location data appears in unknown bucket. |
| Business Rules | Farm activity definition must be documented. |
| Validation Rules | Status and location filters valid. |
| Acceptance Criteria | Active farm counts reconcile with activity logs. |
| Dependencies | Farms, records, subscriptions. |
| Security Requirements | Admin permission required. |

### ANALYTICS-FR-003 - Milk Analytics

| Attribute | Details |
|---|---|
| Requirement ID | ANALYTICS-FR-003 |
| Feature Name | Milk Analytics |
| Description | The system shall aggregate milk production by day, week, month, farm, location, and platform totals. |
| Business Objective | Measure dairy production trends across the platform. |
| Actors | Administrator, Product Team |
| User Story | As admin, I want milk analytics so that I can understand platform milk volume. |
| Preconditions | Milk records or settlement totals available. |
| Main Flow | Admin selects period/segment and system displays milk trend and totals. |
| Alternate Flow | Use settlement totals where farm accounting rules define final milk totals. |
| Exception Flow | Data quality issue flags missing/inconsistent farms. |
| Business Rules | Platform milk analytics must avoid double counting daily records and settlement totals. |
| Validation Rules | Aggregation period valid; source priority applied. |
| Acceptance Criteria | Milk analytics reconcile with report totals. |
| Dependencies | Milk records, settlements, reports. |
| Security Requirements | Aggregate data only unless admin drill-down permission exists. |

### ANALYTICS-FR-004 - Financial Analytics

| Attribute | Details |
|---|---|
| Requirement ID | ANALYTICS-FR-004 |
| Feature Name | Financial Analytics |
| Description | The system shall provide farm income, expense, profit, subscription revenue, payment, and plan metrics. |
| Business Objective | Track financial health of farms and platform. |
| Actors | Administrator, Super Administrator |
| User Story | As super admin, I want financial analytics so that I can monitor business performance. |
| Preconditions | Financial and subscription data available. |
| Main Flow | Admin selects filters and views revenue, expense, profit, payment, and subscription metrics. |
| Alternate Flow | Admin exports summary. |
| Exception Flow | Permission denied for restricted financial views. |
| Business Rules | Farm financial data and platform revenue must be separated. |
| Validation Rules | Date/plan filters valid. |
| Acceptance Criteria | Financial analytics reconcile with accounting/subscription records. |
| Dependencies | Accounting, subscriptions, payments. |
| Security Requirements | Super admin required for platform revenue. |

### ANALYTICS-FR-005 - Goal Analytics

| Attribute | Details |
|---|---|
| Requirement ID | ANALYTICS-FR-005 |
| Feature Name | Goal Analytics |
| Description | The system shall track goal creation, completion, missed goals, and goal types across users/farms. |
| Business Objective | Measure engagement and goal effectiveness. |
| Actors | Product Team, Administrator |
| User Story | As product, I want goal analytics so that I know whether goals improve engagement. |
| Preconditions | Goal records exist. |
| Main Flow | System aggregates goal usage, completion rates, and trends. |
| Alternate Flow | Filter by goal type/period/plan. |
| Exception Flow | No data shows zero state. |
| Business Rules | Completion criteria must match Goals module. |
| Validation Rules | Goal statuses valid. |
| Acceptance Criteria | Goal analytics match goal reports. |
| Dependencies | Goals, records. |
| Security Requirements | Aggregate-only by default. |

### ANALYTICS-FR-006 - AI Analytics

| Attribute | Details |
|---|---|
| Requirement ID | ANALYTICS-FR-006 |
| Feature Name | AI Analytics |
| Description | The system shall track AI questions, active AI users, response time, satisfaction, tool usage, and estimated cost. |
| Business Objective | Monitor AI adoption, value, and cost. |
| Actors | Product Team, Administrator |
| User Story | As product/admin, I want AI analytics so that I can improve AI quality. |
| Preconditions | AI logs available. |
| Main Flow | Admin views AI usage and satisfaction by period/segment. |
| Alternate Flow | Export AI analytics. |
| Exception Flow | Sensitive chat content hidden unless permitted. |
| Business Rules | Analytics should use metadata; chat content access restricted. |
| Validation Rules | AI log fields valid. |
| Acceptance Criteria | AI usage counts match chat logs and settings. |
| Dependencies | AI assistant logs, feedback. |
| Security Requirements | PII and farm data protected. |

### ANALYTICS-FR-007 - OCR Analytics

| Attribute | Details |
|---|---|
| Requirement ID | ANALYTICS-FR-007 |
| Feature Name | OCR Analytics |
| Description | The system shall track slip uploads, OCR success/failure, confidence, correction rate, duplicate rate, and processing time. |
| Business Objective | Improve OCR reliability and cost control. |
| Actors | Product Team, Administrator |
| User Story | As product/admin, I want OCR analytics so that I can improve slip scanning. |
| Preconditions | OCR audit logs exist. |
| Main Flow | Admin views OCR metrics and failure trends. |
| Alternate Flow | Filter by slip type, farm, period, provider. |
| Exception Flow | Missing audit data flags quality issue. |
| Business Rules | OCR analytics must not expose slip images to unauthorized users. |
| Validation Rules | OCR status/confidence valid. |
| Acceptance Criteria | OCR metrics reconcile with slip audit logs. |
| Dependencies | OCR audit, slip uploads. |
| Security Requirements | Restricted access to raw OCR data/images. |

---

# 3. Admin Notification Center

### ADMIN-NOTIF-FR-001 - Broadcast Notifications

| Attribute | Details |
|---|---|
| Requirement ID | ADMIN-NOTIF-FR-001 |
| Feature Name | Broadcast Notifications |
| Description | The system shall allow authorized admins to send platform-wide announcements. |
| Business Objective | Communicate important messages to all farms/users. |
| Actors | Administrator, Super Administrator |
| User Story | As admin, I want to broadcast notifications so that every user receives important updates. |
| Preconditions | Admin authorized and notification service available. |
| Main Flow | Admin creates message, previews, confirms, system sends to all eligible recipients. |
| Alternate Flow | Admin schedules broadcast for later. |
| Exception Flow | Excessive audience requires confirmation or approval. |
| Business Rules | Global broadcasts must be audited and rate-limited. |
| Validation Rules | Title/message required; expiry valid. |
| Acceptance Criteria | Broadcast reaches all eligible users and delivery report is available. |
| Dependencies | Notification service, user preferences, push subscriptions. |
| Security Requirements | Super admin approval for critical/global where configured. |

### ADMIN-NOTIF-FR-002 - Scheduled Notifications

| Attribute | Details |
|---|---|
| Requirement ID | ADMIN-NOTIF-FR-002 |
| Feature Name | Scheduled Notifications |
| Description | The system shall allow admin notifications to be scheduled for future delivery. |
| Business Objective | Support planned campaigns and reminders. |
| Actors | Administrator |
| User Story | As admin, I want to schedule notifications so that users receive them at the right time. |
| Preconditions | Notification draft valid. |
| Main Flow | Admin selects date/time/timezone, saves schedule, system sends at scheduled time. |
| Alternate Flow | Admin edits/cancels before send. |
| Exception Flow | Past date blocked. |
| Business Rules | Scheduled notification locks after processing begins. |
| Validation Rules | Schedule date future, audience valid. |
| Acceptance Criteria | Scheduled messages send at configured time and can be cancelled before send. |
| Dependencies | Scheduler, notification service. |
| Security Requirements | Schedule changes audited. |

### ADMIN-NOTIF-FR-003 - Emergency Notifications

| Attribute | Details |
|---|---|
| Requirement ID | ADMIN-NOTIF-FR-003 |
| Feature Name | Emergency Notifications |
| Description | The system shall support urgent notifications for outages, security issues, or critical platform events. |
| Business Objective | Communicate urgent issues quickly and reliably. |
| Actors | Super Administrator |
| User Story | As super admin, I want emergency notifications so that users receive critical alerts immediately. |
| Preconditions | Super admin authenticated. |
| Main Flow | Super admin creates emergency alert, confirms elevated action, system sends priority notification. |
| Alternate Flow | Admin saves emergency template. |
| Exception Flow | Missing approval blocks send where dual approval configured. |
| Business Rules | Emergency notifications may bypass non-critical preferences subject to policy. |
| Validation Rules | Reason and expiry required. |
| Acceptance Criteria | Emergency notification sends quickly and appears prominently. |
| Dependencies | Notification service, admin audit. |
| Security Requirements | Super admin only, strong audit, optional dual control. |

### ADMIN-NOTIF-FR-004 - Targeted Notifications and Delivery Reports

| Attribute | Details |
|---|---|
| Requirement ID | ADMIN-NOTIF-FR-004 |
| Feature Name | Targeted Notifications and Delivery Reports |
| Description | The system shall allow targeted notifications by farm, district, taluka, plan, status, role, activity, and user segment, with delivery/open/click reports. |
| Business Objective | Improve relevance and measure communication effectiveness. |
| Actors | Administrator, Product Team |
| User Story | As admin, I want targeted notifications so that the right users receive the right message. |
| Preconditions | Audience data available. |
| Main Flow | Admin selects segment, sends/schedules notification, system tracks delivery/open/click/read metrics. |
| Alternate Flow | Admin tests notification to self before send. |
| Exception Flow | Segment resolves to zero users; send blocked. |
| Business Rules | Audience query must be reproducible and stored for audit. |
| Validation Rules | Segment filters valid. |
| Acceptance Criteria | Delivery report shows sent, delivered, failed, opened, clicked, read rate. |
| Dependencies | User/farm data, notification logs. |
| Security Requirements | Segment access controlled and audited. |

---

# 4. Support Administration

### ADMIN-SUP-FR-001 - Ticket Assignment

| Attribute | Details |
|---|---|
| Requirement ID | ADMIN-SUP-FR-001 |
| Feature Name | Ticket Assignment |
| Description | The system shall allow support tickets to be assigned manually or automatically to support users. |
| Business Objective | Ensure tickets have clear ownership. |
| Actors | Support Executive, Administrator |
| User Story | As support admin, I want to assign tickets so that issues are handled by responsible staff. |
| Preconditions | Ticket exists and assignee available. |
| Main Flow | Admin selects ticket and assignee; system updates assignment and notifies assignee. |
| Alternate Flow | Auto-assignment by category/priority/load. |
| Exception Flow | Invalid assignee blocked. |
| Business Rules | Assignment history retained. |
| Validation Rules | Assignee must have support role. |
| Acceptance Criteria | Ticket assignment updates queue and notification is sent. |
| Dependencies | Support tickets, notifications, users. |
| Security Requirements | Support admin permission required. |

### ADMIN-SUP-FR-002 - Ticket Escalation

| Attribute | Details |
|---|---|
| Requirement ID | ADMIN-SUP-FR-002 |
| Feature Name | Ticket Escalation |
| Description | The system shall escalate tickets based on priority, SLA breach, category, or manual action. |
| Business Objective | Ensure critical issues receive timely attention. |
| Actors | Support Executive, Administrator |
| User Story | As support admin, I want escalation so that critical tickets are not missed. |
| Preconditions | Ticket open/in progress. |
| Main Flow | System detects escalation condition or admin escalates; assignee/admin notified. |
| Alternate Flow | Ticket escalated to development/product. |
| Exception Flow | Already closed ticket cannot be escalated. |
| Business Rules | Critical and payment/data-loss tickets escalate faster. |
| Validation Rules | Escalation reason required for manual escalation. |
| Acceptance Criteria | Escalated ticket is highlighted and notification sent. |
| Dependencies | SLA rules, notifications. |
| Security Requirements | Escalation actions logged. |

### ADMIN-SUP-FR-003 - SLA Tracking

| Attribute | Details |
|---|---|
| Requirement ID | ADMIN-SUP-FR-003 |
| Feature Name | SLA Tracking |
| Description | The system shall track first response time, resolution time, overdue status, and SLA breaches. |
| Business Objective | Improve support accountability. |
| Actors | Support Executive, Administrator |
| User Story | As support manager, I want SLA tracking so that service quality is measurable. |
| Preconditions | Ticket has priority and timestamps. |
| Main Flow | System calculates SLA deadlines and displays status in queue/dashboard. |
| Alternate Flow | Waiting-for-user status pauses SLA if configured. |
| Exception Flow | Missing priority defaults to medium. |
| Business Rules | SLA policy depends on priority/category. |
| Validation Rules | Timestamps valid. |
| Acceptance Criteria | SLA breach count and response time metrics are accurate. |
| Dependencies | Support tickets, analytics. |
| Security Requirements | Admin/support access controlled. |

### ADMIN-SUP-FR-004 - Support Analytics

| Attribute | Details |
|---|---|
| Requirement ID | ADMIN-SUP-FR-004 |
| Feature Name | Support Analytics |
| Description | The system shall show support KPIs including backlog, average resolution time, SLA breach, common issues, and customer satisfaction. |
| Business Objective | Improve support operations and product quality. |
| Actors | Support Manager, Administrator, Product Team |
| User Story | As support manager, I want analytics so that I can improve support performance. |
| Preconditions | Support ticket data exists. |
| Main Flow | User selects period/category; system displays support KPIs and charts. |
| Alternate Flow | Export support analytics. |
| Exception Flow | No ticket data shows empty state. |
| Business Rules | CSAT only calculated from submitted ratings. |
| Validation Rules | Period valid. |
| Acceptance Criteria | Support KPIs match ticket records. |
| Dependencies | Tickets, ratings, analytics. |
| Security Requirements | Support analytics restricted to authorized roles. |

---

# 5. Subscription and Trial Management

## 5.1 Plan Structure and Feature Access Matrix

| Plan Attribute | Description |
|---|---|
| Plan ID | Unique plan identifier |
| Plan Name | Trial, Basic, Premium, Enterprise, or configured plans |
| Billing Type | Trial, Monthly, Yearly |
| Start Date | Subscription activation date |
| Expiry Date | Access end date |
| Feature Access | Modules enabled by plan |
| Farm/User Limits | Limits on farms, users, animals, storage, AI/OCR usage where configured |
| Payment Status | Pending, Paid, Failed, Refunded, Waived |

| Feature | Trial | Basic | Premium | Enterprise |
|---|---:|---:|---:|---:|
| Cow/Calf Management | Yes | Yes | Yes | Yes |
| Milk Records | Yes | Yes | Yes | Yes |
| Reports | Limited | Basic | Advanced | Advanced |
| OCR Slip Scanning | Limited | Limited | Yes | Yes |
| AI Assistant | Limited | Optional | Yes | Yes |
| Export/Backup | Limited | Basic | Yes | Yes |
| Admin/Staff Users | Limited | Limited | More | Custom |

### SUB-FR-001 - Trial Plans

| Attribute | Details |
|---|---|
| Requirement ID | SUB-FR-001 |
| Feature Name | Trial Plans |
| Description | The system shall support configurable trial plans with start date, expiry date, feature limits, and conversion path. |
| Business Objective | Enable farmers to evaluate the app before paid subscription. |
| Actors | Administrator, Farm Owner, System |
| User Story | As a farm owner, I want a trial so that I can test the application. |
| Preconditions | Farm registered and trial plan available. |
| Main Flow | System assigns trial, user uses allowed features, system sends expiry reminders. |
| Alternate Flow | Admin extends or reduces trial with reason. |
| Exception Flow | Expired trial restricts access according to policy. |
| Business Rules | Trial dates and overrides must be auditable. |
| Validation Rules | Trial expiry after start; one active trial unless overridden. |
| Acceptance Criteria | Trial access and expiry behavior match plan rules. |
| Dependencies | Access control, notifications, admin panel. |
| Security Requirements | Admin override logged. |

### SUB-FR-002 - Subscription Plans

| Attribute | Details |
|---|---|
| Requirement ID | SUB-FR-002 |
| Feature Name | Subscription Plans |
| Description | The system shall support paid subscription plans with billing type, expiry, feature access, and payment status. |
| Business Objective | Monetize the platform and control feature access. |
| Actors | Farm Owner, Administrator, System |
| User Story | As a farm owner, I want a subscription plan so that I can access required features. |
| Preconditions | Farm exists. |
| Main Flow | Admin/user activates plan, payment status recorded, feature access enabled. |
| Alternate Flow | Subscription manually waived or sponsored. |
| Exception Flow | Payment failure marks plan unpaid/pending according to policy. |
| Business Rules | Feature access matrix controls modules. |
| Validation Rules | Plan valid; dates valid; payment status valid. |
| Acceptance Criteria | Active subscription enables features and expired subscription restricts access. |
| Dependencies | Farm management, payments, access control. |
| Security Requirements | Subscription changes audited. |

### SUB-FR-003 - Plan Upgrades

| Attribute | Details |
|---|---|
| Requirement ID | SUB-FR-003 |
| Feature Name | Plan Upgrades |
| Description | The system shall allow upgrading a farm subscription to a higher plan. |
| Business Objective | Support customer growth and feature expansion. |
| Actors | Administrator, Farm Owner |
| User Story | As a farm owner, I want to upgrade plan so that I can access more features. |
| Preconditions | Current plan active or eligible. |
| Main Flow | User/admin selects new plan, system calculates dates/price/access, confirms upgrade. |
| Alternate Flow | Upgrade scheduled for next renewal. |
| Exception Flow | Ineligible plan or payment failure blocks activation. |
| Business Rules | Upgrade feature access starts immediately or scheduled based on policy. |
| Validation Rules | Target plan higher/valid; reason/payment required where applicable. |
| Acceptance Criteria | Upgraded plan reflects in farm access and admin history. |
| Dependencies | Subscription, payments, notifications. |
| Security Requirements | Admin upgrades audited. |

### SUB-FR-004 - Plan Downgrades

| Attribute | Details |
|---|---|
| Requirement ID | SUB-FR-004 |
| Feature Name | Plan Downgrades |
| Description | The system shall allow downgrading subscription plan with clear feature impact. |
| Business Objective | Support customer cost control and retention. |
| Actors | Administrator, Farm Owner |
| User Story | As a farm owner, I want to downgrade plan if I need fewer features. |
| Preconditions | Current plan active. |
| Main Flow | User/admin selects lower plan, system shows feature impact, confirmation saves downgrade. |
| Alternate Flow | Downgrade scheduled at expiry. |
| Exception Flow | Protected plan or data limit conflict requires admin review. |
| Business Rules | Downgrade must not delete data; it may restrict access to features. |
| Validation Rules | Target plan valid; confirmation required. |
| Acceptance Criteria | Downgrade changes feature access without data loss. |
| Dependencies | Access control, notifications. |
| Security Requirements | Downgrade actions audited. |

### SUB-FR-005 - Expiry Management

| Attribute | Details |
|---|---|
| Requirement ID | SUB-FR-005 |
| Feature Name | Expiry Management |
| Description | The system shall manage subscription/trial expiry, grace period, restricted access, and reminders. |
| Business Objective | Maintain subscription compliance and reduce churn. |
| Actors | System, Farm Owner, Administrator |
| User Story | As a farm owner, I want expiry reminders so that my access does not stop unexpectedly. |
| Preconditions | Subscription/trial has expiry date. |
| Main Flow | System checks expiry, sends reminders, updates status, applies restrictions after expiry. |
| Alternate Flow | Admin grants grace period. |
| Exception Flow | Invalid expiry date flagged to admin. |
| Business Rules | Expiry rules and grace period configurable. |
| Validation Rules | Expiry date valid. |
| Acceptance Criteria | Expiry status and reminders are accurate. |
| Dependencies | Notifications, access control. |
| Security Requirements | Manual expiry changes audited. |

### SUB-FR-006 - Renewal Management

| Attribute | Details |
|---|---|
| Requirement ID | SUB-FR-006 |
| Feature Name | Renewal Management |
| Description | The system shall support subscription renewal with updated expiry, payment status, and renewal history. |
| Business Objective | Support recurring customer subscriptions. |
| Actors | Farm Owner, Administrator |
| User Story | As a farm owner, I want to renew subscription so that I can continue using the app. |
| Preconditions | Subscription exists. |
| Main Flow | Renewal created, payment/status recorded, expiry extended, user notified. |
| Alternate Flow | Admin renews manually. |
| Exception Flow | Payment failure leaves status pending/failed. |
| Business Rules | Renewal count and history retained. |
| Validation Rules | Renewal period valid; payment status valid. |
| Acceptance Criteria | Renewal extends access and logs history. |
| Dependencies | Payments, notifications, access control. |
| Security Requirements | Manual renewal audited. |

### SUB-FR-007 - Payment Tracking

| Attribute | Details |
|---|---|
| Requirement ID | SUB-FR-007 |
| Feature Name | Payment Tracking |
| Description | The system shall track subscription payments, due amounts, paid amounts, dates, and status. |
| Business Objective | Support revenue operations and customer account status. |
| Actors | Administrator, Farm Owner |
| User Story | As admin, I want payment tracking so that subscription status is accurate. |
| Preconditions | Subscription invoice/payment expected. |
| Main Flow | Admin/system records payment, status updates, receipt/history available. |
| Alternate Flow | Partial or waived payment recorded. |
| Exception Flow | Invalid amount/status blocked. |
| Business Rules | Payment status affects subscription according to policy. |
| Validation Rules | Amount non-negative; date valid. |
| Acceptance Criteria | Payment status reflects access and renewal state. |
| Dependencies | Subscription, finance/admin reports. |
| Security Requirements | Payment edits restricted and audited. |

---

# 6. Security Architecture

## 6.1 Security Architecture Overview

Majhi Dairy uses a multi-tenant security model where every user action is authenticated, authorized, farm-scoped, validated, and auditable where sensitive. Security must protect farmer records, financial information, AI/OCR data, support attachments, backups, and admin controls.

## 6.2 Threat Model

| Threat | Impact | Control |
|---|---|---|
| Unauthorized farm access | Critical data breach | RBAC, farm isolation, RLS/service checks |
| Admin misuse | Critical operational risk | Least privilege, audit logs, confirmations |
| Credential attack | Account takeover | Password policy, rate limiting, lockout |
| Push notification leakage | Privacy exposure | Minimal payload, user targeting |
| Backup leak | Large data breach | Protected storage, access control, audit |
| AI hallucination | Wrong decisions | Tool-based data retrieval, no fake values |
| OCR financial error | Wrong accounting | Validation, review, no auto-save |

### SEC-FR-001 - Authentication Security

| Attribute | Details |
|---|---|
| Requirement ID | SEC-FR-001 |
| Feature Name | Authentication Security |
| Description | The system shall enforce secure authentication for users and administrators. |
| Business Objective | Prevent unauthorized platform access. |
| Actors | User, Admin, System |
| User Story | As a user, I want secure login so that my farm data is protected. |
| Preconditions | User account exists. |
| Main Flow | User authenticates, system validates credentials and status, session created. |
| Alternate Flow | PIN login or recovery flow. |
| Exception Flow | Invalid/locked account blocked. |
| Business Rules | Admin login may require stronger controls. |
| Validation Rules | Credential policy and account status checked. |
| Acceptance Criteria | Invalid users cannot access protected routes. |
| Dependencies | Auth provider, sessions. |
| Security Requirements | Password/PIN secure handling, lockout, rate limiting. |

### SEC-FR-002 - Authorization and RBAC

| Attribute | Details |
|---|---|
| Requirement ID | SEC-FR-002 |
| Feature Name | Role-Based Access Control |
| Description | The system shall enforce permissions based on role, farm, and action. |
| Business Objective | Ensure users perform only authorized operations. |
| Actors | Farmer, Vet, Support, Admin, Super Admin |
| User Story | As a farm owner, I want access controlled so that only authorized users manage my data. |
| Preconditions | User authenticated. |
| Main Flow | System checks role/permission before route/API/data action. |
| Alternate Flow | Read-only role sees limited views. |
| Exception Flow | Unauthorized access denied. |
| Business Rules | Super admin has highest privileges but all sensitive actions audited. |
| Validation Rules | Role and permission must be valid. |
| Acceptance Criteria | Restricted features are blocked for unauthorized roles. |
| Dependencies | Role matrix, middleware, API layer. |
| Security Requirements | Server-side enforcement mandatory. |

### SEC-FR-003 - Session Management

| Attribute | Details |
|---|---|
| Requirement ID | SEC-FR-003 |
| Feature Name | Secure Session Management |
| Description | The system shall manage secure sessions, expiry, refresh, multi-device login, and logout. |
| Business Objective | Balance convenience and security. |
| Actors | User, System |
| User Story | As a user, I want sessions to work safely across devices. |
| Preconditions | User authenticated. |
| Main Flow | Session created, refreshed, expired, or revoked according to policy. |
| Alternate Flow | User logs out all devices. |
| Exception Flow | Expired session redirects to login. |
| Business Rules | Admin sessions may have shorter expiry. |
| Validation Rules | Session token valid and scoped. |
| Acceptance Criteria | Expired sessions never show raw errors or protected data. |
| Dependencies | Auth, middleware, device/session logs. |
| Security Requirements | Secure storage and revocation support. |

### SEC-FR-004 - Password and PIN Policies

| Attribute | Details |
|---|---|
| Requirement ID | SEC-FR-004 |
| Feature Name | Password and PIN Policies |
| Description | The system shall enforce password and PIN complexity, change, reset, and storage policies. |
| Business Objective | Reduce account compromise risk. |
| Actors | User, Admin, System |
| User Story | As a user, I want secure password/PIN controls so that my account is safe. |
| Preconditions | Security settings accessible. |
| Main Flow | User changes password/PIN, system validates current and new credentials, saves securely. |
| Alternate Flow | Password reset via recovery. |
| Exception Flow | Weak or reused credentials rejected. |
| Business Rules | PIN/password never stored in plain text. |
| Validation Rules | Password complexity, PIN length, confirm match. |
| Acceptance Criteria | Weak credentials blocked and secure change works. |
| Dependencies | Security settings, auth provider. |
| Security Requirements | Hashing, secure transport, no logging secrets. |

### SEC-FR-005 - API Security

| Attribute | Details |
|---|---|
| Requirement ID | SEC-FR-005 |
| Feature Name | API Security |
| Description | The system shall protect APIs with authentication, authorization, input validation, rate limiting, and safe error handling. |
| Business Objective | Protect platform services and data integrity. |
| Actors | System, Client, Admin |
| User Story | As a platform owner, I want secure APIs so that data cannot be abused. |
| Preconditions | API endpoint exists. |
| Main Flow | API validates token, role, farm, input, executes action, returns safe response. |
| Alternate Flow | Public endpoints use limited access and anti-abuse controls. |
| Exception Flow | Invalid request returns safe localized/generic error. |
| Business Rules | Client-provided farm ID cannot be trusted without server validation. |
| Validation Rules | Schema validation required for mutations. |
| Acceptance Criteria | Unauthorized and malformed requests are blocked. |
| Dependencies | Middleware, validation schemas, logs. |
| Security Requirements | Rate limiting, CSRF/CORS policy, safe errors. |

### SEC-FR-006 - Encryption and Data Privacy

| Attribute | Details |
|---|---|
| Requirement ID | SEC-FR-006 |
| Feature Name | Encryption and Data Privacy |
| Description | The system shall protect sensitive data in transit and at rest according to platform policy. |
| Business Objective | Protect user trust and reduce privacy risk. |
| Actors | System, Admin |
| User Story | As a user, I want my data protected from unauthorized access. |
| Preconditions | Sensitive data stored/transmitted. |
| Main Flow | System uses HTTPS, protected storage, and access controls. |
| Alternate Flow | Sensitive exports/backups protected by access permissions. |
| Exception Flow | Unauthorized access attempt logged. |
| Business Rules | Only minimum necessary data included in notifications/AI calls. |
| Validation Rules | Sensitive fields not logged. |
| Acceptance Criteria | Data access follows privacy and role policies. |
| Dependencies | Hosting, storage, database, APIs. |
| Security Requirements | TLS, protected storage, privacy controls. |

### SEC-FR-007 - Rate Limiting and Account Lockout

| Attribute | Details |
|---|---|
| Requirement ID | SEC-FR-007 |
| Feature Name | Rate Limiting and Account Lockout |
| Description | The system shall protect login, recovery, AI, OCR, notifications, and public/support endpoints from abuse. |
| Business Objective | Prevent brute force, spam, and cost abuse. |
| Actors | System |
| User Story | As platform owner, I want abuse controls so that services stay reliable. |
| Preconditions | Endpoint receives requests. |
| Main Flow | System tracks request frequency and blocks/throttles excessive attempts. |
| Alternate Flow | Trusted admin/internal jobs use separate limits. |
| Exception Flow | Blocked user receives safe retry-after message. |
| Business Rules | AI/OCR endpoints may have plan-based usage limits. |
| Validation Rules | Limit keys based on user/IP/device/action. |
| Acceptance Criteria | Excessive requests are throttled and logged. |
| Dependencies | API layer, logs, subscription plans. |
| Security Requirements | Rate-limit bypass restricted. |

### SEC-FR-008 - Audit Logging Security

| Attribute | Details |
|---|---|
| Requirement ID | SEC-FR-008 |
| Feature Name | Audit Logging Security |
| Description | The system shall record sensitive actions with actor, target, timestamp, old/new values where appropriate, and reason. |
| Business Objective | Enable investigation, accountability, and compliance. |
| Actors | User, Admin, System |
| User Story | As platform owner, I want audit logs so that sensitive changes are traceable. |
| Preconditions | Sensitive action occurs. |
| Main Flow | System writes audit event after or during action. |
| Alternate Flow | Failed attempts also logged for security events. |
| Exception Flow | Critical audit failure blocks high-risk action where policy requires. |
| Business Rules | Audit logs are append-only for normal users. |
| Validation Rules | Actor, action, target, timestamp required. |
| Acceptance Criteria | Sensitive actions are searchable in audit logs. |
| Dependencies | Audit module, admin panel. |
| Security Requirements | Audit log access restricted and tamper-resistant. |

---

# 7. Non-Functional Requirements

## 7.1 NFR Catalog

| Requirement ID | Category | Requirement | Acceptance Target |
|---|---|---|---|
| NFR-001 | Performance | Home page should load key summary quickly for typical farms. | Initial visible dashboard under 2 seconds on normal 4G. |
| NFR-002 | Performance | API response time for common reads. | p95 under 1.5 seconds for typical queries. |
| NFR-003 | Performance | Report generation time. | Small reports under 5 seconds; large reports async. |
| NFR-004 | Performance | OCR processing time. | Progress shown immediately; typical processing target under 60 seconds where providers respond. |
| NFR-005 | Performance | AI response time. | Typing/loading within 500ms; typical answer under 15 seconds. |
| NFR-006 | Availability | Production system availability. | Target 99.5%+ excluding planned maintenance for initial SaaS stage. |
| NFR-007 | Scalability | Support growth stages. | Architecture supports 10k users, evolves to 50k and 100k with indexing/caching/queues. |
| NFR-008 | Reliability | No silent data loss. | Writes either succeed, fail visibly, or queue offline where supported. |
| NFR-009 | Maintainability | Modular code and documented APIs. | Feature modules maintainable with tests and docs. |
| NFR-010 | Accessibility | Mobile-first and readable UI. | Large touch targets, contrast, keyboard/screen-reader basics. |
| NFR-011 | Localization | Marathi and English support. | No user-facing untranslated hardcoded text in scoped modules. |
| NFR-012 | Observability | Logs and monitoring. | Errors, API failures, OCR/AI failures, notification failures observable. |
| NFR-013 | Compliance | Data privacy and auditability. | Sensitive actions audited and access controlled. |
| NFR-014 | Backup Duration | Backup workflow performance. | Small farm backup under 2 minutes; large backup async. |
| NFR-015 | Compatibility | Android/iOS PWA compatibility. | Core workflows usable on supported mobile browsers, with documented limitations. |

## 7.2 Scalability Stages

| Scale Stage | Expected Users | Required Controls |
|---|---:|---|
| Stage 1 | 10,000 users | Indexes, pagination, basic queues, summary tables for dashboards |
| Stage 2 | 50,000 users | Background jobs, cached analytics, optimized storage, push batching |
| Stage 3 | 100,000 users | Horizontal scaling, read replicas/analytics store, advanced queue workers, deeper observability |

---

# 8. Data Model

## 8.1 Logical Entity Model

| Entity | Description | Primary Key | Key Foreign Keys | Retention Direction |
|---|---|---|---|---|
| Users | Platform users across farms/admin/support | id | farm_id where farm user | Retain while account active; audit after deletion per policy |
| Farms | Tenant-level farm entity | id | owner_user_id | Retain unless deleted by policy/admin |
| Cows | Cow profile records | id | farm_id | Retain historical records; archive preferred |
| Calves | Calf profile records | id | farm_id, mother_cow_id | Retain historical records; sold status retained |
| Milk Records | Daily milk data | id | farm_id, cow_id optional | Retain financial/reporting history |
| Feed Records | Feed/fodder records | id | farm_id | Retain for expense/history |
| Health Records | Animal health events | id | farm_id, animal_id | Retain health history |
| Vaccinations | Vaccine/deworming records | id | farm_id, animal_id | Retain health history |
| Breeding Records | Breeding/AI events | id | farm_id, cow_id | Retain reproduction history |
| Calving Records | Calving events | id | farm_id, cow_id, calf_id optional | Retain reproduction history |
| Reminders | Reminder tasks | id | farm_id, source_entity_id optional | Retain completion history per policy |
| Goals | Farm/user goals | id | farm_id, user_id optional | Retain history |
| Notifications | User/farm notifications | id | farm_id/user_id | Retain by notification policy |
| Reports | Generated report metadata | id | farm_id, user_id | Retain temporary/per policy |
| Expenses | Farm expenses | id | farm_id | Retain financial history |
| Settlements | Dairy payment settlements | id | farm_id | Retain financial history |
| AI Chats | AI question/response records | id | farm_id, user_id | Retain by AI history setting/policy |
| Support Tickets | Support issue records | id | farm_id, user_id | Retain support history |
| Backups | Backup metadata and storage references | id | farm_id | Retain by backup retention policy |
| Audit Logs | Sensitive action logs | id | actor_user_id, farm_id | Retain by audit policy |

## 8.2 Relationship and Cardinality Summary

| Relationship | Cardinality |
|---|---|
| Farm -> Users | One farm has many users |
| Farm -> Cows | One farm has many cows |
| Farm -> Calves | One farm has many calves |
| Cow -> Calves | One cow may have many calves |
| Cow/Calf -> Health Records | One animal has many health records |
| Cow/Calf -> Vaccinations | One animal has many vaccination records |
| Cow -> Breeding Records | One cow has many breeding records |
| Cow -> Calving Records | One cow has many calving records |
| Farm -> Milk Records | One farm has many milk records |
| Farm -> Settlements | One farm has many settlements |
| Farm -> Expenses | One farm has many expenses |
| Farm/User -> Notifications | One farm/user has many notifications |
| Farm/User -> AI Chats | One farm/user has many AI chats |
| Farm/User -> Support Tickets | One farm/user has many tickets |

## 8.3 Data Requirements

### DATA-FR-001 - Tenant Data Isolation

| Attribute | Details |
|---|---|
| Requirement ID | DATA-FR-001 |
| Feature Name | Tenant Data Isolation |
| Description | All farm data must be stored and queried with farm-level isolation. |
| Business Objective | Prevent cross-farm data leakage. |
| Actors | System, User, Admin |
| User Story | As a farm owner, I want only my farm data visible to my users. |
| Preconditions | Farm-scoped data exists. |
| Main Flow | Every query/mutation validates farm context. |
| Alternate Flow | Super admin may access across farms through audited admin path. |
| Exception Flow | Missing/invalid farm context blocks request. |
| Business Rules | Farm ID from client cannot be trusted alone. |
| Validation Rules | Farm ID required and authorized. |
| Acceptance Criteria | Cross-farm URL/API attempts are denied. |
| Dependencies | Auth, RBAC, database policies. |
| Security Requirements | Server-side and database-layer controls. |

### DATA-FR-002 - Data Retention Rules

| Attribute | Details |
|---|---|
| Requirement ID | DATA-FR-002 |
| Feature Name | Data Retention Rules |
| Description | The system shall apply retention policies for financial, animal, AI, OCR, support, backup, and audit data. |
| Business Objective | Balance compliance, storage, audit, and privacy. |
| Actors | System, Administrator |
| User Story | As platform owner, I want retention policies so that data is managed responsibly. |
| Preconditions | Data records exist. |
| Main Flow | System retains or expires records according to policy. |
| Alternate Flow | User/admin requests export before deletion. |
| Exception Flow | Protected financial/audit records cannot be deleted by normal user action. |
| Business Rules | Financial/audit data retention is stricter than temporary reports. |
| Validation Rules | Retention policy configured by data type. |
| Acceptance Criteria | Data lifecycle follows documented retention policy. |
| Dependencies | Audit, backup, support, reports. |
| Security Requirements | Retention/deletion actions logged. |

### DATA-FR-003 - Physical Database Considerations

| Attribute | Details |
|---|---|
| Requirement ID | DATA-FR-003 |
| Feature Name | Physical Database Considerations |
| Description | The database design shall include primary keys, foreign keys, indexes, constraints, and migration governance. |
| Business Objective | Maintain performance and data integrity. |
| Actors | Database Architect, Development Team |
| User Story | As engineering team, we need a reliable schema so the app remains accurate and fast. |
| Preconditions | Database schema exists. |
| Main Flow | Schema changes use migrations, constraints, indexes, and review. |
| Alternate Flow | Data cleanup migration handles legacy values before constraint changes. |
| Exception Flow | Migration failure rolls back or stops deployment. |
| Business Rules | Financial and reminder type constraints must be kept in sync with app values. |
| Validation Rules | FK integrity, check constraints, unique indexes where needed. |
| Acceptance Criteria | Migrations run without violating existing data constraints. |
| Dependencies | Supabase/PostgreSQL, CI/deployment. |
| Security Requirements | RLS/service access rules reviewed. |

### DATA-FR-004 - ERD Requirements

| Attribute | Details |
|---|---|
| Requirement ID | DATA-FR-004 |
| Feature Name | ERD Requirements |
| Description | The BRD/SRS package shall include high-level, logical, and physical ERD descriptions for key entities. |
| Business Objective | Support shared understanding of data relationships. |
| Actors | BA, Architect, Development, QA |
| User Story | As QA/developer, I need ERD clarity so that I can test relationships correctly. |
| Preconditions | Entity model approved. |
| Main Flow | Data architect maintains ERD and maps entities to tables/relationships. |
| Alternate Flow | Module-specific ERDs added in appendices. |
| Exception Flow | Unknown relationship flagged as open question. |
| Business Rules | ERD must align with actual migrations. |
| Validation Rules | Cardinalities and FK names verified. |
| Acceptance Criteria | ERD supports development, QA, and audit review. |
| Dependencies | Database design doc. |
| Security Requirements | Sensitive table access rules documented. |

---

# 9. System Integrations

### INT-FR-001 - OCR Engine Integration

| Attribute | Details |
|---|---|
| Requirement ID | INT-FR-001 |
| Feature Name | OCR Engine Integration |
| Description | The system shall integrate with OCR service to extract text from slip images/PDFs. |
| Business Objective | Enable slip scanning automation. |
| Actors | System, OCR Provider |
| User Story | As a farmer, I want slips read automatically to reduce typing. |
| Preconditions | Upload exists and OCR credentials configured. |
| Main Flow | System sends file/text payload, receives OCR response, stores raw text and status. |
| Alternate Flow | Retry or fallback provider if configured. |
| Exception Flow | Provider failure marks OCR failed and user can retry/manual entry. |
| Business Rules | Credentials server-side only; OCR result cached to reduce duplicate cost. |
| Validation Rules | File valid and farm-scoped. |
| Acceptance Criteria | OCR result stored and linked to upload. |
| Dependencies | Storage, OCR provider, audit logs. |
| Security Requirements | API key protected; raw text access controlled. |

### INT-FR-002 - AI Engine Integration

| Attribute | Details |
|---|---|
| Requirement ID | INT-FR-002 |
| Feature Name | AI Engine Integration |
| Description | The system shall integrate with AI provider for assistant responses and OCR text structuring. |
| Business Objective | Provide AI assistance and structured extraction. |
| Actors | System, AI Provider |
| User Story | As a user, I want AI answers and structured slip data. |
| Preconditions | AI key configured and user permission allows AI. |
| Main Flow | System sends approved context/tool result, receives response, validates, returns to user. |
| Alternate Flow | Provider failure returns fallback error. |
| Exception Flow | Invalid JSON from extraction rejected/repaired. |
| Business Rules | AI cannot access raw database directly or invent values. |
| Validation Rules | Inputs minimized and output schema validated. |
| Acceptance Criteria | AI responses use permitted data and extraction output is schema-valid. |
| Dependencies | AI assistant, OCR, backend tools. |
| Security Requirements | API key server-side; privacy permissions enforced. |

### INT-FR-003 - Push Notification Service

| Attribute | Details |
|---|---|
| Requirement ID | INT-FR-003 |
| Feature Name | Push Notification Service Integration |
| Description | The system shall integrate with web push service for browser/PWA notifications. |
| Business Objective | Deliver reminders and admin messages to phones/desktops. |
| Actors | System, Browser Push Service |
| User Story | As a farmer, I want phone notifications for important tasks. |
| Preconditions | Service worker and push subscription available. |
| Main Flow | System sends push payload to active subscription and logs status. |
| Alternate Flow | In-app fallback if push unavailable. |
| Exception Flow | Invalid subscription deactivated and user prompted. |
| Business Rules | Respect preferences and quiet hours. |
| Validation Rules | Subscription endpoint/keys valid. |
| Acceptance Criteria | Test push reaches supported devices. |
| Dependencies | Notifications, service worker, VAPID/config. |
| Security Requirements | Minimize sensitive push payload. |

### INT-FR-004 - Backup Storage Service

| Attribute | Details |
|---|---|
| Requirement ID | INT-FR-004 |
| Feature Name | Backup Storage Service Integration |
| Description | The system shall integrate with storage service for backups, exports, support attachments, and slip images. |
| Business Objective | Store files safely and make them available to authorized users. |
| Actors | System, Storage Service |
| User Story | As a user, I want files/backups stored safely. |
| Preconditions | Storage bucket/config exists. |
| Main Flow | System uploads file, stores metadata, returns protected URL/reference. |
| Alternate Flow | Large files use background upload. |
| Exception Flow | Upload failure shows retry. |
| Business Rules | File access must be farm/user scoped. |
| Validation Rules | File type/size/path valid. |
| Acceptance Criteria | Files are stored, downloadable by authorized users, and blocked for others. |
| Dependencies | Supabase/storage, export, support, OCR. |
| Security Requirements | Protected buckets or signed URLs as policy requires. |

### INT-FR-005 - Analytics Service

| Attribute | Details |
|---|---|
| Requirement ID | INT-FR-005 |
| Feature Name | Analytics Service Integration |
| Description | The system shall support analytics data aggregation, dashboards, and exports. |
| Business Objective | Enable product, admin, and farm insights. |
| Actors | System, Admin, Product Team |
| User Story | As an admin, I want analytics so that I can make decisions. |
| Preconditions | Source events/records exist. |
| Main Flow | System aggregates data into dashboard summaries and analytics views. |
| Alternate Flow | Heavy analytics uses background jobs/caches. |
| Exception Flow | Aggregation failure shows last successful refresh timestamp. |
| Business Rules | Metrics definitions must remain consistent. |
| Validation Rules | Aggregations reconcile with source data. |
| Acceptance Criteria | Analytics dashboards load within NFR targets and match source data. |
| Dependencies | Activity logs, records, reporting tables. |
| Security Requirements | Sensitive analytics restricted. |

---

# 10. Audit and Compliance

### AUDIT-FR-001 - Audit Logs

| Attribute | Details |
|---|---|
| Requirement ID | AUDIT-FR-001 |
| Feature Name | Audit Logs |
| Description | The system shall record audit logs for sensitive user, admin, financial, security, OCR, AI, backup, and support actions. |
| Business Objective | Ensure accountability and investigation readiness. |
| Actors | System, Administrator |
| User Story | As platform owner, I want audit logs so that important changes are traceable. |
| Preconditions | Auditable action occurs. |
| Main Flow | System captures actor, action, target, old/new values, timestamp, IP/device where available. |
| Alternate Flow | Failed attempts logged for security events. |
| Exception Flow | Critical audit failure blocks high-risk action where configured. |
| Business Rules | Audit logs append-only for normal operations. |
| Validation Rules | Required audit fields present. |
| Acceptance Criteria | Sensitive actions appear in audit search. |
| Dependencies | All modules, admin panel. |
| Security Requirements | Audit access restricted; tamper resistance. |

### AUDIT-FR-002 - User Activity Logs

| Attribute | Details |
|---|---|
| Requirement ID | AUDIT-FR-002 |
| Feature Name | User Activity Logs |
| Description | The system shall track user activities such as login, record creation, slip upload, report export, settings change, and support actions. |
| Business Objective | Support usage analytics and troubleshooting. |
| Actors | System, Support, Admin |
| User Story | As support, I want activity logs so that I can diagnose issues. |
| Preconditions | User action occurs. |
| Main Flow | System records activity event and makes it available where permitted. |
| Alternate Flow | Offline activity syncs later with local timestamp. |
| Exception Flow | Logging failure does not block non-critical action but is monitored. |
| Business Rules | Activity logs must not contain secrets. |
| Validation Rules | User/farm/action/timestamp required. |
| Acceptance Criteria | Activity timeline displays relevant events. |
| Dependencies | Activity log service, admin/farm details. |
| Security Requirements | Farm/user scope enforced. |

### AUDIT-FR-003 - Admin Activity Logs

| Attribute | Details |
|---|---|
| Requirement ID | AUDIT-FR-003 |
| Feature Name | Admin Activity Logs |
| Description | The system shall record all admin actions including user/farm/subscription/notification/support changes. |
| Business Objective | Prevent misuse and support accountability. |
| Actors | Administrator, Super Administrator, System |
| User Story | As platform owner, I want admin actions logged so that changes are accountable. |
| Preconditions | Admin action occurs. |
| Main Flow | System writes admin audit event with reason and target. |
| Alternate Flow | Read-only access logs for sensitive farm detail views where configured. |
| Exception Flow | Missing reason blocks protected action. |
| Business Rules | Admin destructive/protected actions require confirmation and reason. |
| Validation Rules | Admin ID, action, target, timestamp required. |
| Acceptance Criteria | Admin activity log shows who did what and when. |
| Dependencies | Admin panel, audit service. |
| Security Requirements | Super admin access for audit review. |

### AUDIT-FR-004 - Data Change Logs

| Attribute | Details |
|---|---|
| Requirement ID | AUDIT-FR-004 |
| Feature Name | Data Change Logs |
| Description | The system shall record before/after values for critical data changes. |
| Business Objective | Enable rollback analysis and financial/data integrity investigation. |
| Actors | System, Admin |
| User Story | As support/admin, I want change history so that I can understand corrections. |
| Preconditions | Critical record is created/updated/deleted. |
| Main Flow | System stores old/new values for configured fields. |
| Alternate Flow | Large payload stores diff/reference. |
| Exception Flow | Sensitive fields masked. |
| Business Rules | Financial changes must include old/new values and reason where applicable. |
| Validation Rules | Record ID and change type required. |
| Acceptance Criteria | Change logs support investigation of incorrect reports. |
| Dependencies | Data layer, audit logs. |
| Security Requirements | Change log access restricted. |

### AUDIT-FR-005 - Security Logs

| Attribute | Details |
|---|---|
| Requirement ID | AUDIT-FR-005 |
| Feature Name | Security Logs |
| Description | The system shall log login attempts, password/PIN changes, account lockouts, permission denials, suspicious API usage, and recovery actions. |
| Business Objective | Detect and investigate security events. |
| Actors | System, Security/Admin |
| User Story | As admin, I want security logs so that I can detect suspicious activity. |
| Preconditions | Security event occurs. |
| Main Flow | System logs event with severity and metadata. |
| Alternate Flow | High severity event triggers admin alert. |
| Exception Flow | Logging failure escalated to monitoring. |
| Business Rules | Do not log secrets. |
| Validation Rules | Event type/severity valid. |
| Acceptance Criteria | Security events searchable and alertable. |
| Dependencies | Auth, API, monitoring. |
| Security Requirements | Restricted access and retention policy. |

### AUDIT-FR-006 - Backup Logs and Investigation Workflow

| Attribute | Details |
|---|---|
| Requirement ID | AUDIT-FR-006 |
| Feature Name | Backup Logs and Investigation Workflow |
| Description | The system shall log backup creation, verification, download, restore, failure, and deletion, and provide investigation workflow for incidents. |
| Business Objective | Ensure recovery actions are traceable. |
| Actors | System, Admin, Support |
| User Story | As admin, I want backup logs so that recovery events are auditable. |
| Preconditions | Backup event occurs. |
| Main Flow | System logs backup event, admin can review incident timeline and related actions. |
| Alternate Flow | Failed backup triggers support/admin notification. |
| Exception Flow | Invalid backup marked non-restorable. |
| Business Rules | Restore events require reason and confirmation. |
| Validation Rules | Backup ID, farm ID, status, actor, timestamp required. |
| Acceptance Criteria | Backup and restore history is complete and investigation-ready. |
| Dependencies | Export/Backup, audit, support. |
| Security Requirements | Restore/download logs restricted. |

---

# 11. Disaster Recovery

## 11.1 Recovery Targets

| Target | Initial Target |
|---|---|
| RPO - Recovery Point Objective | 24 hours for standard farm data, lower where backup/sync supports |
| RTO - Recovery Time Objective | 4-8 business hours for major farm recovery, subject to incident severity |
| Backup Verification | Every backup should have metadata and integrity verification status |
| DR Test Frequency | At least quarterly for production once operational process matures |

### DR-FR-001 - Backup Recovery

| Attribute | Details |
|---|---|
| Requirement ID | DR-FR-001 |
| Feature Name | Backup Recovery |
| Description | The system shall support restoring farm data from valid backups. |
| Business Objective | Recover from accidental deletion, device loss, or data corruption. |
| Actors | Farm Owner, Support, Administrator |
| User Story | As a farm owner, I want recovery so that my data is not permanently lost. |
| Preconditions | Valid backup exists and user/admin authorized. |
| Main Flow | Select backup, validate, show impact, confirm, restore, log. |
| Alternate Flow | Partial restore where supported. |
| Exception Flow | Invalid backup blocks restore. |
| Business Rules | Restore requires confirmation and audit. |
| Validation Rules | Farm/schema/version match. |
| Acceptance Criteria | Valid backup restores safely and cross-farm restore is impossible. |
| Dependencies | Backup storage, data model, audit. |
| Security Requirements | High-risk action permission required. |

### DR-FR-002 - Database Recovery

| Attribute | Details |
|---|---|
| Requirement ID | DR-FR-002 |
| Feature Name | Database Recovery |
| Description | The platform shall define database recovery procedures for major failure or corruption. |
| Business Objective | Restore system operations after database incidents. |
| Actors | Engineering, DBA/Admin |
| User Story | As operations, we need database recovery procedures to minimize downtime. |
| Preconditions | Database backup/restore mechanisms available. |
| Main Flow | Identify incident, select recovery point, restore to safe environment, validate, promote/recover. |
| Alternate Flow | Restore individual farm data where feasible. |
| Exception Flow | Recovery failure escalates to provider/incident team. |
| Business Rules | Production restore must follow change approval process. |
| Validation Rules | Integrity checks pass before production use. |
| Acceptance Criteria | Recovery procedure documented and tested. |
| Dependencies | Supabase/PostgreSQL backups, operations guide. |
| Security Requirements | Restricted operations access. |

### DR-FR-003 - System Recovery and Business Continuity

| Attribute | Details |
|---|---|
| Requirement ID | DR-FR-003 |
| Feature Name | System Recovery and Business Continuity |
| Description | The platform shall define recovery procedures for application, API, storage, OCR, AI, notification, and backup service failures. |
| Business Objective | Maintain continuity and graceful degradation. |
| Actors | Engineering, Admin, Support |
| User Story | As platform owner, I want recovery procedures so users can continue critical workflows. |
| Preconditions | Incident occurs. |
| Main Flow | Detect service failure, activate fallback/degraded mode, communicate status, recover service. |
| Alternate Flow | Disable non-critical AI/OCR while core records continue. |
| Exception Flow | Full outage triggers status notification and support process. |
| Business Rules | Core data entry should be prioritized over AI/OCR features. |
| Validation Rules | Incident status and recovery steps documented. |
| Acceptance Criteria | Critical workflows have documented fallback behavior. |
| Dependencies | Monitoring, notifications, support. |
| Security Requirements | Incident access controlled and logged. |

### DR-FR-004 - DR Testing Procedures

| Attribute | Details |
|---|---|
| Requirement ID | DR-FR-004 |
| Feature Name | DR Testing Procedures |
| Description | The system operations process shall include regular DR testing for backup restore, database recovery, and service fallback. |
| Business Objective | Validate recovery readiness before real incidents. |
| Actors | Engineering, QA, Admin |
| User Story | As platform owner, I want DR tests so that recovery plans are reliable. |
| Preconditions | DR procedures and test environment available. |
| Main Flow | Plan test, execute restore/fallback, validate data, document results, fix gaps. |
| Alternate Flow | Tabletop exercise when full test not possible. |
| Exception Flow | Failed DR test creates corrective action. |
| Business Rules | DR test results should be reviewed and retained. |
| Validation Rules | Test scope, result, issues, and owner recorded. |
| Acceptance Criteria | DR tests produce evidence and improvement actions. |
| Dependencies | Backup, database, operations docs. |
| Security Requirements | Test data protected. |

---

# 12. Final Requirement Traceability Framework

## 12.1 Traceability Matrix Structure

| Business Objective | Functional Requirement | Test Scenario | Acceptance Criteria |
|---|---|---|---|
| BO-001 Digitize Records | AUTH-FR-001, COW-FR-001, CALF-FR-001, REC-FR-001 | Signup and add first cow/calf/milk record | User can create records and view dashboard update |
| BO-002 Improve Milk Discipline | REC-FR-001, DASH-FR-002, REP-FR-001 | Enter daily milk and verify reports | Morning/evening/total values reconcile |
| BO-003 Improve Reminders | REM-FR-001 to REM-FR-011, NOTIF-FR-003 | Generate and complete reminders | Reminder lifecycle works without duplicates |
| BO-004 Financial Clarity | ACC-FR-001 to ACC-FR-021, REP-FR-004 | Save settlement/expenses and check P&L | P&L matches source records |
| BO-005 Reduce Settlement Entry Time | OCR-FR-001 to OCR-FR-010, ACC-FR-014 | Upload settlement slip and save after review | OCR preview editable and no auto-save |
| BO-006 Increase AI Adoption | AI-FR-001 to AI-FR-012 | Ask AI dairy questions | AI uses real permitted data only |
| BO-007 Multilingual Adoption | AUTH-FR-008, SET-FR-004, LOC requirements | Switch language and verify screens | Marathi/English persists with no mixed UI |
| BO-008 Data Decisions | REP-FR-001 to REP-FR-013, ANALYTICS-FR-001 to ANALYTICS-FR-007 | Generate reports/analytics | Values match source records |
| BO-009 Admin Operations | ADMIN-FR-001 to ADMIN-FR-010, SUB-FR-001 to SUB-FR-007 | Admin manages farm/subscription | Actions are controlled, logged, and notified |
| BO-010 Reduce Data Loss | EXP-FR-001 to EXP-FR-008, DR-FR-001 to DR-FR-004 | Backup and restore test | Recovery validated and audited |

## 12.2 Test Scenario Categories

| Category | Examples |
|---|---|
| Functional | Create/edit/delete records, reminders, goals, tickets |
| Financial Accuracy | Settlement, feed deduction, P&L, reports |
| AI/OCR | Upload slip, validate extraction, AI query, permissions |
| Security | Unauthorized route, cross-farm access, admin action |
| Localization | Marathi/English switching and generated reports |
| Offline/PWA | Offline entry, sync, push, iOS/Android compatibility |
| Performance | Dashboard, report, analytics, OCR/AI response |
| DR/Backup | Export, backup, restore, retention, recovery |

---

# 13. Final BRD Assembly Framework

## 13.1 Master BRD Table of Contents

1. Cover Page
2. Revision History
3. Document Control
4. Executive Summary
5. Problem Statement
6. Vision and Mission
7. Business Objectives
8. Success Metrics
9. Stakeholder Analysis
10. User Personas
11. Scope Definition
12. Assumptions and Constraints
13. Risk Assessment
14. User Role Matrix
15. High-Level Business Processes
16. Requirement Taxonomy and ID Standards
17. Core Functional Requirements
    1. Authentication
    2. Home Dashboard
    3. Cow Management
    4. Calf Management
    5. Records Management
    6. Reminders
18. Business Functional Requirements
    1. Accounting
    2. AI Slip Scanning
    3. Reports and Analytics
    4. Goals Management
    5. Export and Backup
19. Platform Functional Requirements
    1. AI Assistant
    2. Notifications
    3. Settings
    4. Profile
    5. Support
    6. Achievements and Leaderboards
20. Admin and Enterprise Requirements
    1. Admin Panel
    2. Analytics and BI
    3. Admin Notification Center
    4. Support Administration
    5. Subscription and Trial Management
21. Security Architecture
22. Non-Functional Requirements
23. Data Model and ERD Description
24. System Integrations
25. Audit and Compliance
26. Disaster Recovery and Business Continuity
27. Requirement Traceability Matrix
28. Open Questions
29. Glossary
30. Acronyms
31. Appendices

## 13.2 Document Index

| Source Document | Purpose |
|---|---|
| Phase 1 - BRD Foundation | Project analysis, stakeholders, scope, taxonomy, BRD framework |
| Phase 2 - Core Modules BRD | Authentication, Dashboard, Cow, Calf, Records, Reminders requirements |
| Phase 3 - Business Modules BRD | Accounting, OCR, Reports, Goals, Export and Backup requirements |
| Phase 4 - Platform Modules BRD | AI Assistant, Notifications, Settings, Profile, Support, Achievements requirements |
| Phase 5 - Admin/Architecture BRD | Admin, analytics, subscriptions, security, NFR, data, integrations, audit, DR |

## 13.3 Glossary and Acronyms

| Term | Meaning |
|---|---|
| BRD | Business Requirements Document |
| FRD | Functional Requirements Document |
| SRS | Software Requirements Specification |
| NFR | Non-Functional Requirement |
| OCR | Optical Character Recognition |
| AI | Artificial Intelligence or Artificial Insemination depending on context; context must clarify |
| PWA | Progressive Web Application |
| RPO | Recovery Point Objective |
| RTO | Recovery Time Objective |
| SLA | Service Level Agreement |
| DAU | Daily Active Users |
| WAU | Weekly Active Users |
| MAU | Monthly Active Users |
| RBAC | Role-Based Access Control |
| ERD | Entity Relationship Diagram |
| CSAT | Customer Satisfaction |

## 13.4 Appendices

| Appendix | Description |
|---|---|
| Appendix A | Requirement Inventory by Module |
| Appendix B | Business Rule Catalog |
| Appendix C | Validation Rule Catalog |
| Appendix D | Localization Key Strategy |
| Appendix E | Test Scenario Framework |
| Appendix F | Data Dictionary Starter |
| Appendix G | Risk Register |
| Appendix H | Open Questions and Decisions |



---

