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

