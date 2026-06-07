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

