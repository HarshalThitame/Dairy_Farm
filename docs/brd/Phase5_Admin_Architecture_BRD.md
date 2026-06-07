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

