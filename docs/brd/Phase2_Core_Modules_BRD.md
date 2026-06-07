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

