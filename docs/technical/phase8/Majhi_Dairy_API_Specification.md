# Majhi Dairy API Specification

**Document Version:** 1.0  
**Date:** 2026-06-07  
**Application:** Majhi Dairy  
**API Base Path:** `/v1`  
**Future Versions:** `/v2`, `/v3`  
**Frontend:** React, Next.js, TypeScript  
**Backend:** Supabase, PostgreSQL, trusted Next.js server APIs  
**Languages:** Marathi and English  
**Target Scale:** 100,000+ users

## 1. API Architecture Overview

Majhi Dairy uses a hybrid API model:

- Supabase RLS-protected direct reads/writes for simple tenant-scoped CRUD.
- Next.js server API routes for trusted operations that require secrets, service role, AI/OCR providers, push notifications, reports, backups, admin actions or multi-table transactions.
- PostgreSQL RPC functions for transaction-safe domain operations such as settlement save, calving with calf, and summary recalculation.

### 1.1 API Design Principles

| Principle | Standard |
| --- | --- |
| Tenant safety | Every farm-owned request contains or resolves farmId and is validated by RLS/server role checks. |
| No silent financial automation | OCR/AI extracted financial data is never saved without explicit user confirmation. |
| Stable contracts | All endpoints use versioned /v1 paths and stable DTO names. |
| Localized user messages | API returns stable error codes and optional localized messages for Marathi/English. |
| Pagination by default | All list endpoints support page, limit and deterministic sorting. |
| Idempotency where needed | Financial saves, retries and uploads should support Idempotency-Key. |
| Auditability | High-risk actions create audit logs. |

### 1.2 Naming Conventions

- Paths use kebab-case nouns: `/v1/farms/{farmId}/milk-records`.
- JSON fields use camelCase.
- IDs use UUID strings.
- Dates use ISO `YYYY-MM-DD`.
- Timestamps use ISO 8601 UTC.
- Money and milk quantities are decimal numbers; backend stores PostgreSQL `NUMERIC`.

### 1.3 Authentication and Authorization

- Authentication uses Supabase JWT.
- Public auth endpoints do not require bearer token.
- Farm APIs require active `farm_members` membership.
- Admin APIs require `admin` or `super_admin`.
- Support APIs require ticket participant, support, admin or super admin depending on operation.

### 1.4 Standard Success Envelope

```json
{
  "success": true,
  "data": {},
  "meta": {
    "requestId": "req_123",
    "page": 1,
    "limit": 20,
    "total": 100
  },
  "message": "Saved successfully"
}
```

### 1.5 Standard Error Envelope

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Please check required fields.",
    "localizedMessage": {
      "mr": "कृपया आवश्यक माहिती तपासा.",
      "en": "Please check required fields."
    },
    "details": {},
    "fieldErrors": [
      { "field": "amount", "code": "MUST_BE_POSITIVE", "message": "Amount must be positive." }
    ]
  },
  "requestId": "req_123"
}
```

## 2. Endpoint Inventory

### Authentication

| API ID | Method | Endpoint | Purpose | Auth | Request | Response | Validation | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AUTH-API-001 | POST | /v1/auth/signup | Create user, profile, first farm and language onboarding state. | Public / Supabase Auth | SignupRequest | AuthResponse | name plus email or phone required; password policy; language mr/en | 400, 409, 422, 500 |
| AUTH-API-002 | POST | /v1/auth/login | Authenticate by email/phone and password. | Public / Supabase Auth | LoginRequest | AuthResponse | identifier and password required | 400, 401, 423, 429, 500 |
| AUTH-API-003 | POST | /v1/auth/pin/login | Unlock active app session using PIN. | Bearer JWT or active device session | PinLoginRequest | SessionResponse | 4+ digit PIN; rate limited | 400, 401, 423, 429, 500 |
| AUTH-API-004 | POST | /v1/auth/forgot-password | Start password reset flow. | Public / Supabase Auth | ForgotPasswordRequest | MessageResponse | email/phone required | 400, 404, 429, 500 |
| AUTH-API-005 | POST | /v1/auth/reset-password | Reset password using provider token. | Public / Supabase Auth | ResetPasswordRequest | MessageResponse | token valid; password policy | 400, 401, 422, 500 |
| AUTH-API-006 | POST | /v1/auth/refresh | Refresh access token/session. | Refresh token | RefreshTokenRequest | AuthResponse | refresh token valid | 401, 500 |
| AUTH-API-007 | POST | /v1/auth/logout | Logout current device/session. | Bearer JWT | None | MessageResponse | valid session | 401, 500 |
| AUTH-API-008 | GET | /v1/auth/session | Validate current session and return user/farm context. | Bearer JWT | None | SessionResponse | valid token | 401, 403, 500 |
| AUTH-API-009 | PATCH | /v1/auth/password | Change current password. | Bearer JWT | ChangePasswordRequest | MessageResponse | current password verified; new password policy | 400, 401, 422, 500 |
| AUTH-API-010 | PATCH | /v1/auth/pin | Create/change PIN. | Bearer JWT | ChangePinRequest | MessageResponse | current PIN where existing; new PIN policy | 400, 401, 422, 429, 500 |

### Farm Management

| API ID | Method | Endpoint | Purpose | Auth | Request | Response | Validation | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| FARM-API-001 | POST | /v1/farms | Create a new farm and owner membership. | Bearer JWT | FarmCreateRequest | FarmResponse | farm name required; location optional; unique generated farm_code | 400, 401, 409, 422, 500 |
| FARM-API-002 | GET | /v1/farms | List farms accessible to current user. | Bearer JWT | Query: page, limit, status | FarmListResponse | pagination limits | 401, 500 |
| FARM-API-003 | GET | /v1/farms/{farmId} | Get farm profile. | Bearer JWT | Path farmId | FarmResponse | farm access required | 401, 403, 404, 500 |
| FARM-API-004 | PATCH | /v1/farms/{farmId} | Update farm profile and location. | Bearer JWT | FarmUpdateRequest | FarmResponse | owner/admin only; location master validation | 400, 401, 403, 404, 422, 500 |
| FARM-API-005 | DELETE | /v1/farms/{farmId} | Protected farm deletion request. | Bearer JWT | DeleteConfirmationRequest | MessageResponse | owner/admin; confirmation; backup recommended | 400, 401, 403, 409, 500 |
| FARM-API-006 | GET | /v1/farms/{farmId}/statistics | Get farm statistics dashboard data. | Bearer JWT | Query: dateRange | FarmStatisticsResponse | farm access; date range max 366 days for live query | 401, 403, 404, 422, 500 |
| FARM-API-007 | GET | /v1/farms/{farmId}/settings | Get farm-level settings. | Bearer JWT | None | SettingsResponse | farm access | 401, 403, 404, 500 |
| FARM-API-008 | PATCH | /v1/farms/{farmId}/settings | Update farm-level settings. | Bearer JWT | SettingsUpdateRequest | SettingsResponse | owner/admin; category/key validation | 400, 401, 403, 422, 500 |
| FARM-API-009 | GET | /v1/farms/{farmId}/members | List farm members. | Bearer JWT | Query: role,status,page,limit | FarmMemberListResponse | farm access | 401, 403, 500 |
| FARM-API-010 | POST | /v1/farms/{farmId}/members | Invite/add farm member. | Bearer JWT | FarmMemberCreateRequest | FarmMemberResponse | owner/admin; role valid; no duplicate active membership | 400, 401, 403, 409, 422, 500 |
| FARM-API-011 | PATCH | /v1/farms/{farmId}/members/{memberId} | Update member role/status/permissions. | Bearer JWT | FarmMemberUpdateRequest | FarmMemberResponse | owner/admin; cannot remove last owner | 400, 401, 403, 404, 409, 422, 500 |
| FARM-API-012 | DELETE | /v1/farms/{farmId}/members/{memberId} | Remove farm member. | Bearer JWT | None | MessageResponse | owner/admin; cannot remove last owner | 401, 403, 404, 409, 500 |

### Cow Management

| API ID | Method | Endpoint | Purpose | Auth | Request | Response | Validation | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| COW-API-001 | GET | /v1/farms/{farmId}/cows | List cow records with pagination, filtering, sorting and search. | Bearer JWT | Query: page, limit, search, sort, filters | CowResponseListResponse | farm access; pagination max 100 | 401, 403, 422, 500 |
| COW-API-002 | POST | /v1/farms/{farmId}/cows | Create cow record. | Bearer JWT | CowCreateRequest | CowResponse | required fields and business rules | 400, 401, 403, 409, 422, 500 |
| COW-API-003 | GET | /v1/farms/{farmId}/cows/{id} | Get cow details. | Bearer JWT | Path id | CowResponse | farm access and record ownership | 401, 403, 404, 500 |
| COW-API-004 | PATCH | /v1/farms/{farmId}/cows/{id} | Update cow record. | Bearer JWT | CowUpdateRequest | CowResponse | editable fields only; business rules | 400, 401, 403, 404, 409, 422, 500 |
| COW-API-005 | DELETE | /v1/farms/{farmId}/cows/{id} | Delete or archive cow record. | Bearer JWT | DeleteConfirmationRequest | MessageResponse | delete policy; derived data handling | 400, 401, 403, 404, 409, 500 |
| COW-API-006 | GET | /v1/farms/{farmId}/cows/{cowId}/profile | Get cow profile summary, important dates and status. | Bearer JWT | None | CowProfileResponse | farm access | 401, 403, 404, 500 |
| COW-API-007 | GET | /v1/farms/{farmId}/cows/{cowId}/history | Get cow lifecycle timeline. | Bearer JWT | Query: page, limit, type | TimelineResponse | farm access | 401, 403, 404, 500 |
| COW-API-008 | GET | /v1/farms/{farmId}/cows/{cowId}/pregnancy-status | Get current pregnancy/breeding status. | Bearer JWT | None | PregnancyStatusResponse | farm access | 401, 403, 404, 500 |
| COW-API-009 | GET | /v1/farms/{farmId}/cows/{cowId}/vaccinations | Get cow vaccination history. | Bearer JWT | Query: status,dateRange | VaccinationListResponse | farm access | 401, 403, 404, 500 |
| COW-API-010 | GET | /v1/farms/{farmId}/cows/{cowId}/milk-history | Get cow milk history where cow-wise records exist. | Bearer JWT | Query: dateStart,dateEnd | MilkRecordListResponse | farm access | 401, 403, 404, 422, 500 |
| COW-API-011 | GET | /v1/farms/{farmId}/cows/{cowId}/health-records | Get cow health records. | Bearer JWT | Query: dateRange,type | HealthRecordListResponse | farm access | 401, 403, 404, 500 |

### Calf Management

| API ID | Method | Endpoint | Purpose | Auth | Request | Response | Validation | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| CALF-API-001 | GET | /v1/farms/{farmId}/calves | List calf records with pagination, filtering, sorting and search. | Bearer JWT | Query: page, limit, search, sort, filters | CalfResponseListResponse | farm access; pagination max 100 | 401, 403, 422, 500 |
| CALF-API-002 | POST | /v1/farms/{farmId}/calves | Create calf record. | Bearer JWT | CalfCreateRequest | CalfResponse | required fields and business rules | 400, 401, 403, 409, 422, 500 |
| CALF-API-003 | GET | /v1/farms/{farmId}/calves/{id} | Get calf details. | Bearer JWT | Path id | CalfResponse | farm access and record ownership | 401, 403, 404, 500 |
| CALF-API-004 | PATCH | /v1/farms/{farmId}/calves/{id} | Update calf record. | Bearer JWT | CalfUpdateRequest | CalfResponse | editable fields only; business rules | 400, 401, 403, 404, 409, 422, 500 |
| CALF-API-005 | DELETE | /v1/farms/{farmId}/calves/{id} | Delete or archive calf record. | Bearer JWT | DeleteConfirmationRequest | MessageResponse | delete policy; derived data handling | 400, 401, 403, 404, 409, 500 |
| CALF-API-006 | GET | /v1/farms/{farmId}/calves/{calfId}/health-records | Get calf health records. | Bearer JWT | Query: dateRange,type | HealthRecordListResponse | farm access | 401, 403, 404, 500 |
| CALF-API-007 | GET | /v1/farms/{farmId}/calves/{calfId}/vaccinations | Get calf vaccination records. | Bearer JWT | Query: status,dateRange | VaccinationListResponse | farm access | 401, 403, 404, 500 |
| CALF-API-008 | GET | /v1/farms/{farmId}/calves/{calfId}/growth | Get calf growth and lifecycle milestones. | Bearer JWT | None | CalfGrowthResponse | farm access | 401, 403, 404, 500 |

### Records Management

| API ID | Method | Endpoint | Purpose | Auth | Request | Response | Validation | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| REC-API-001 | GET | /v1/farms/{farmId}/records/milk | List milk record records with pagination, filtering, sorting and search. | Bearer JWT | Query: page, limit, search, sort, filters | MilkRecordResponseListResponse | farm access; pagination max 100 | 401, 403, 422, 500 |
| REC-API-002 | POST | /v1/farms/{farmId}/records/milk | Create milk record record. | Bearer JWT | MilkRecordCreateRequest | MilkRecordResponse | required fields and business rules | 400, 401, 403, 409, 422, 500 |
| REC-API-003 | GET | /v1/farms/{farmId}/records/milk/{id} | Get milk record details. | Bearer JWT | Path id | MilkRecordResponse | farm access and record ownership | 401, 403, 404, 500 |
| REC-API-004 | PATCH | /v1/farms/{farmId}/records/milk/{id} | Update milk record record. | Bearer JWT | MilkRecordUpdateRequest | MilkRecordResponse | editable fields only; business rules | 400, 401, 403, 404, 409, 422, 500 |
| REC-API-005 | DELETE | /v1/farms/{farmId}/records/milk/{id} | Delete or archive milk record record. | Bearer JWT | DeleteConfirmationRequest | MessageResponse | delete policy; derived data handling | 400, 401, 403, 404, 409, 500 |
| REC-API-006 | GET | /v1/farms/{farmId}/records/feed | List feed record records with pagination, filtering, sorting and search. | Bearer JWT | Query: page, limit, search, sort, filters | FeedRecordResponseListResponse | farm access; pagination max 100 | 401, 403, 422, 500 |
| REC-API-007 | POST | /v1/farms/{farmId}/records/feed | Create feed record record. | Bearer JWT | FeedRecordCreateRequest | FeedRecordResponse | required fields and business rules | 400, 401, 403, 409, 422, 500 |
| REC-API-008 | GET | /v1/farms/{farmId}/records/feed/{id} | Get feed record details. | Bearer JWT | Path id | FeedRecordResponse | farm access and record ownership | 401, 403, 404, 500 |
| REC-API-009 | PATCH | /v1/farms/{farmId}/records/feed/{id} | Update feed record record. | Bearer JWT | FeedRecordUpdateRequest | FeedRecordResponse | editable fields only; business rules | 400, 401, 403, 404, 409, 422, 500 |
| REC-API-010 | DELETE | /v1/farms/{farmId}/records/feed/{id} | Delete or archive feed record record. | Bearer JWT | DeleteConfirmationRequest | MessageResponse | delete policy; derived data handling | 400, 401, 403, 404, 409, 500 |
| REC-API-011 | GET | /v1/farms/{farmId}/records/health | List health record records with pagination, filtering, sorting and search. | Bearer JWT | Query: page, limit, search, sort, filters | HealthRecordResponseListResponse | farm access; pagination max 100 | 401, 403, 422, 500 |
| REC-API-012 | POST | /v1/farms/{farmId}/records/health | Create health record record. | Bearer JWT | HealthRecordCreateRequest | HealthRecordResponse | required fields and business rules | 400, 401, 403, 409, 422, 500 |
| REC-API-013 | GET | /v1/farms/{farmId}/records/health/{id} | Get health record details. | Bearer JWT | Path id | HealthRecordResponse | farm access and record ownership | 401, 403, 404, 500 |
| REC-API-014 | PATCH | /v1/farms/{farmId}/records/health/{id} | Update health record record. | Bearer JWT | HealthRecordUpdateRequest | HealthRecordResponse | editable fields only; business rules | 400, 401, 403, 404, 409, 422, 500 |
| REC-API-015 | DELETE | /v1/farms/{farmId}/records/health/{id} | Delete or archive health record record. | Bearer JWT | DeleteConfirmationRequest | MessageResponse | delete policy; derived data handling | 400, 401, 403, 404, 409, 500 |
| REC-API-016 | GET | /v1/farms/{farmId}/records/vaccinations | List vaccination record records with pagination, filtering, sorting and search. | Bearer JWT | Query: page, limit, search, sort, filters | VaccinationRecordResponseListResponse | farm access; pagination max 100 | 401, 403, 422, 500 |
| REC-API-017 | POST | /v1/farms/{farmId}/records/vaccinations | Create vaccination record record. | Bearer JWT | VaccinationRecordCreateRequest | VaccinationRecordResponse | required fields and business rules | 400, 401, 403, 409, 422, 500 |
| REC-API-018 | GET | /v1/farms/{farmId}/records/vaccinations/{id} | Get vaccination record details. | Bearer JWT | Path id | VaccinationRecordResponse | farm access and record ownership | 401, 403, 404, 500 |
| REC-API-019 | PATCH | /v1/farms/{farmId}/records/vaccinations/{id} | Update vaccination record record. | Bearer JWT | VaccinationRecordUpdateRequest | VaccinationRecordResponse | editable fields only; business rules | 400, 401, 403, 404, 409, 422, 500 |
| REC-API-020 | DELETE | /v1/farms/{farmId}/records/vaccinations/{id} | Delete or archive vaccination record record. | Bearer JWT | DeleteConfirmationRequest | MessageResponse | delete policy; derived data handling | 400, 401, 403, 404, 409, 500 |
| REC-API-021 | GET | /v1/farms/{farmId}/records/breeding | List breeding record records with pagination, filtering, sorting and search. | Bearer JWT | Query: page, limit, search, sort, filters | BreedingRecordResponseListResponse | farm access; pagination max 100 | 401, 403, 422, 500 |
| REC-API-022 | POST | /v1/farms/{farmId}/records/breeding | Create breeding record record. | Bearer JWT | BreedingRecordCreateRequest | BreedingRecordResponse | required fields and business rules | 400, 401, 403, 409, 422, 500 |
| REC-API-023 | GET | /v1/farms/{farmId}/records/breeding/{id} | Get breeding record details. | Bearer JWT | Path id | BreedingRecordResponse | farm access and record ownership | 401, 403, 404, 500 |
| REC-API-024 | PATCH | /v1/farms/{farmId}/records/breeding/{id} | Update breeding record record. | Bearer JWT | BreedingRecordUpdateRequest | BreedingRecordResponse | editable fields only; business rules | 400, 401, 403, 404, 409, 422, 500 |
| REC-API-025 | DELETE | /v1/farms/{farmId}/records/breeding/{id} | Delete or archive breeding record record. | Bearer JWT | DeleteConfirmationRequest | MessageResponse | delete policy; derived data handling | 400, 401, 403, 404, 409, 500 |
| REC-API-026 | GET | /v1/farms/{farmId}/records/calving | List calving record records with pagination, filtering, sorting and search. | Bearer JWT | Query: page, limit, search, sort, filters | CalvingRecordResponseListResponse | farm access; pagination max 100 | 401, 403, 422, 500 |
| REC-API-027 | POST | /v1/farms/{farmId}/records/calving | Create calving record record. | Bearer JWT | CalvingRecordCreateRequest | CalvingRecordResponse | required fields and business rules | 400, 401, 403, 409, 422, 500 |
| REC-API-028 | GET | /v1/farms/{farmId}/records/calving/{id} | Get calving record details. | Bearer JWT | Path id | CalvingRecordResponse | farm access and record ownership | 401, 403, 404, 500 |
| REC-API-029 | PATCH | /v1/farms/{farmId}/records/calving/{id} | Update calving record record. | Bearer JWT | CalvingRecordUpdateRequest | CalvingRecordResponse | editable fields only; business rules | 400, 401, 403, 404, 409, 422, 500 |
| REC-API-030 | DELETE | /v1/farms/{farmId}/records/calving/{id} | Delete or archive calving record record. | Bearer JWT | DeleteConfirmationRequest | MessageResponse | delete policy; derived data handling | 400, 401, 403, 404, 409, 500 |

### Reminders

| API ID | Method | Endpoint | Purpose | Auth | Request | Response | Validation | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| REM-API-001 | GET | /v1/farms/{farmId}/reminders | List reminder records with pagination, filtering, sorting and search. | Bearer JWT | Query: page, limit, search, sort, filters | ReminderResponseListResponse | farm access; pagination max 100 | 401, 403, 422, 500 |
| REM-API-002 | POST | /v1/farms/{farmId}/reminders | Create reminder record. | Bearer JWT | ReminderCreateRequest | ReminderResponse | required fields and business rules | 400, 401, 403, 409, 422, 500 |
| REM-API-003 | GET | /v1/farms/{farmId}/reminders/{id} | Get reminder details. | Bearer JWT | Path id | ReminderResponse | farm access and record ownership | 401, 403, 404, 500 |
| REM-API-004 | PATCH | /v1/farms/{farmId}/reminders/{id} | Update reminder record. | Bearer JWT | ReminderUpdateRequest | ReminderResponse | editable fields only; business rules | 400, 401, 403, 404, 409, 422, 500 |
| REM-API-005 | DELETE | /v1/farms/{farmId}/reminders/{id} | Delete or archive reminder record. | Bearer JWT | DeleteConfirmationRequest | MessageResponse | delete policy; derived data handling | 400, 401, 403, 404, 409, 500 |
| REM-API-006 | POST | /v1/farms/{farmId}/reminders/{reminderId}/snooze | Snooze reminder to a new date. | Bearer JWT | ReminderSnoozeRequest | ReminderResponse | new date cannot be past | 400, 401, 403, 404, 422, 500 |
| REM-API-007 | POST | /v1/farms/{farmId}/reminders/{reminderId}/complete | Complete reminder and trigger related business action if applicable. | Bearer JWT | ReminderCompleteRequest | ReminderResponse | completion action valid for reminder type | 400, 401, 403, 404, 409, 422, 500 |
| REM-API-008 | GET | /v1/farms/{farmId}/reminder-settings | Get reminder settings. | Bearer JWT | None | SettingsResponse | farm access | 401, 403, 500 |
| REM-API-009 | PATCH | /v1/farms/{farmId}/reminder-settings | Update reminder settings. | Bearer JWT | SettingsUpdateRequest | SettingsResponse | owner/farm manager | 400, 401, 403, 422, 500 |

### Accounting

| API ID | Method | Endpoint | Purpose | Auth | Request | Response | Validation | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACC-API-001 | POST | /v1/farms/{farmId}/accounting/milk-entry | Create manual daily milk accounting entry. | Bearer JWT | MilkRecordCreateRequest | MilkRecordResponse | no future date; duplicate policy; amount formula | 400, 401, 403, 409, 422, 500 |
| ACC-API-002 | GET | /v1/farms/{farmId}/accounting/settlements | List settlement records with pagination, filtering, sorting and search. | Bearer JWT | Query: page, limit, search, sort, filters | SettlementResponseListResponse | farm access; pagination max 100 | 401, 403, 422, 500 |
| ACC-API-003 | POST | /v1/farms/{farmId}/accounting/settlements | Create settlement record. | Bearer JWT | SettlementCreateRequest | SettlementResponse | required fields and business rules | 400, 401, 403, 409, 422, 500 |
| ACC-API-004 | GET | /v1/farms/{farmId}/accounting/settlements/{id} | Get settlement details. | Bearer JWT | Path id | SettlementResponse | farm access and record ownership | 401, 403, 404, 500 |
| ACC-API-005 | PATCH | /v1/farms/{farmId}/accounting/settlements/{id} | Update settlement record. | Bearer JWT | SettlementUpdateRequest | SettlementResponse | editable fields only; business rules | 400, 401, 403, 404, 409, 422, 500 |
| ACC-API-006 | DELETE | /v1/farms/{farmId}/accounting/settlements/{id} | Delete or archive settlement record. | Bearer JWT | DeleteConfirmationRequest | MessageResponse | delete policy; derived data handling | 400, 401, 403, 404, 409, 500 |
| ACC-API-007 | GET | /v1/farms/{farmId}/accounting/expenses | List expense records with pagination, filtering, sorting and search. | Bearer JWT | Query: page, limit, search, sort, filters | ExpenseResponseListResponse | farm access; pagination max 100 | 401, 403, 422, 500 |
| ACC-API-008 | POST | /v1/farms/{farmId}/accounting/expenses | Create expense record. | Bearer JWT | ExpenseCreateRequest | ExpenseResponse | required fields and business rules | 400, 401, 403, 409, 422, 500 |
| ACC-API-009 | GET | /v1/farms/{farmId}/accounting/expenses/{id} | Get expense details. | Bearer JWT | Path id | ExpenseResponse | farm access and record ownership | 401, 403, 404, 500 |
| ACC-API-010 | PATCH | /v1/farms/{farmId}/accounting/expenses/{id} | Update expense record. | Bearer JWT | ExpenseUpdateRequest | ExpenseResponse | editable fields only; business rules | 400, 401, 403, 404, 409, 422, 500 |
| ACC-API-011 | DELETE | /v1/farms/{farmId}/accounting/expenses/{id} | Delete or archive expense record. | Bearer JWT | DeleteConfirmationRequest | MessageResponse | delete policy; derived data handling | 400, 401, 403, 404, 409, 500 |
| ACC-API-012 | POST | /v1/farms/{farmId}/accounting/income | Create non-milk income entry. | Bearer JWT | IncomeCreateRequest | IncomeResponse | amount positive; category valid | 400, 401, 403, 422, 500 |
| ACC-API-013 | GET | /v1/farms/{farmId}/accounting/profit | Calculate profit/loss for period. | Bearer JWT | Query: dateStart,dateEnd,groupBy | ProfitResponse | date range valid | 401, 403, 422, 500 |
| ACC-API-014 | GET | /v1/farms/{farmId}/accounting/dashboard | Get financial dashboard. | Bearer JWT | Query: month | FinancialDashboardResponse | farm access | 401, 403, 422, 500 |
| ACC-API-015 | GET | /v1/farms/{farmId}/accounting/payments | Get dairy payment tracking and outstanding payments. | Bearer JWT | Query: status,dateRange | PaymentListResponse | farm access | 401, 403, 422, 500 |
| ACC-API-016 | GET | /v1/farms/{farmId}/accounting/reports | Get accounting report data. | Bearer JWT | Query: reportType,dateRange | ReportDataResponse | farm access | 401, 403, 422, 500 |

### OCR

| API ID | Method | Endpoint | Purpose | Auth | Request | Response | Validation | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| OCR-API-001 | POST | /v1/farms/{farmId}/ocr/uploads | Create slip upload job and signed upload URL. | Bearer JWT | OCRUploadRequest | OCRUploadResponse | file type/size/slip_type valid | 400, 401, 403, 413, 422, 500 |
| OCR-API-002 | GET | /v1/farms/{farmId}/ocr/uploads/{uploadId} | Get upload status and metadata. | Bearer JWT | None | OCRUploadResponse | farm access | 401, 403, 404, 500 |
| OCR-API-003 | POST | /v1/farms/{farmId}/ocr/uploads/{uploadId}/process | Run OCR processing. | Bearer JWT | OCRProcessRequest | OCRExtractionResponse | upload exists; status processable | 400, 401, 403, 404, 409, 422, 500 |
| OCR-API-004 | POST | /v1/farms/{farmId}/ocr/uploads/{uploadId}/extract | Run AI extraction from OCR text. | Bearer JWT | OCRExtractRequest | OCRExtractionResponse | OCR text exists | 400, 401, 403, 404, 422, 500 |
| OCR-API-005 | POST | /v1/farms/{farmId}/ocr/extractions/{extractionId}/validate | Validate extracted slip data. | Bearer JWT | OCRValidationRequest | OCRValidationResponse | financial formulas and confidence thresholds | 400, 401, 403, 404, 422, 500 |
| OCR-API-006 | PATCH | /v1/farms/{farmId}/ocr/extractions/{extractionId}/review | Save manual corrections/review decision. | Bearer JWT | OCRReviewRequest | OCRExtractionResponse | review status valid; no unconfirmed financial fields | 400, 401, 403, 404, 409, 422, 500 |
| OCR-API-007 | POST | /v1/farms/{farmId}/ocr/extractions/{extractionId}/save | Save reviewed OCR result to milk or settlement records. | Bearer JWT | OCRSaveRequest | OCRSaveResponse | accepted/corrected extraction; transaction-safe | 400, 401, 403, 404, 409, 422, 500 |
| OCR-API-008 | POST | /v1/farms/{farmId}/ocr/uploads/{uploadId}/retry | Retry OCR/AI extraction with fallback strategy. | Bearer JWT | OCRRetryRequest | OCRExtractionResponse | retry limit; status failed/warning | 400, 401, 403, 404, 409, 429, 500 |

### AI Assistant

| API ID | Method | Endpoint | Purpose | Auth | Request | Response | Validation | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| AI-API-001 | POST | /v1/farms/{farmId}/ai/chats | Create AI chat session. | Bearer JWT | AIChatCreateRequest | AIChatResponse | AI enabled; language mr/en | 400, 401, 403, 422, 500 |
| AI-API-002 | POST | /v1/farms/{farmId}/ai/chats/{chatId}/messages | Send AI message and receive assistant response. | Bearer JWT | AIMessageRequest | AIMessageResponse | AI enabled; data permissions; rate limits | 400, 401, 403, 404, 422, 429, 500 |
| AI-API-003 | GET | /v1/farms/{farmId}/ai/chats/{chatId} | Get conversation. | Bearer JWT | None | AIChatDetailResponse | own chat/farm access | 401, 403, 404, 500 |
| AI-API-004 | DELETE | /v1/farms/{farmId}/ai/chats/{chatId} | Delete/archive conversation. | Bearer JWT | None | MessageResponse | own chat; retention policy | 401, 403, 404, 500 |
| AI-API-005 | GET | /v1/farms/{farmId}/ai/chats | List chat history. | Bearer JWT | Query: page,limit,search | AIChatListResponse | farm/user access | 401, 403, 500 |
| AI-API-006 | GET | /v1/farms/{farmId}/ai/settings | Get AI settings and permissions. | Bearer JWT | None | AISettingsResponse | farm/user access | 401, 403, 500 |
| AI-API-007 | PATCH | /v1/farms/{farmId}/ai/settings | Update AI settings and data permissions. | Bearer JWT | AISettingsUpdateRequest | AISettingsResponse | valid response style and permissions | 400, 401, 403, 422, 500 |
| AI-API-008 | POST | /v1/farms/{farmId}/ai/messages/{messageId}/feedback | Submit AI feedback. | Bearer JWT | AIFeedbackRequest | MessageResponse | feedback useful/not_useful | 400, 401, 403, 404, 422, 500 |

### Reports

| API ID | Method | Endpoint | Purpose | Auth | Request | Response | Validation | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| REP-API-001 | GET | /v1/farms/{farmId}/reports/milk | Get milk report data. | Bearer JWT | Query: dateStart,dateEnd,filters | ReportDataResponse | date range and filters valid | 401, 403, 422, 500 |
| REP-API-002 | GET | /v1/farms/{farmId}/reports/income | Get income report data. | Bearer JWT | Query: dateStart,dateEnd,filters | ReportDataResponse | date range and filters valid | 401, 403, 422, 500 |
| REP-API-003 | GET | /v1/farms/{farmId}/reports/expenses | Get expenses report data. | Bearer JWT | Query: dateStart,dateEnd,filters | ReportDataResponse | date range and filters valid | 401, 403, 422, 500 |
| REP-API-004 | GET | /v1/farms/{farmId}/reports/profit | Get profit report data. | Bearer JWT | Query: dateStart,dateEnd,filters | ReportDataResponse | date range and filters valid | 401, 403, 422, 500 |
| REP-API-005 | GET | /v1/farms/{farmId}/reports/annual | Get annual report data. | Bearer JWT | Query: dateStart,dateEnd,filters | ReportDataResponse | date range and filters valid | 401, 403, 422, 500 |
| REP-API-006 | GET | /v1/farms/{farmId}/reports/cow-performance | Get cow performance report data. | Bearer JWT | Query: dateStart,dateEnd,filters | ReportDataResponse | date range and filters valid | 401, 403, 422, 500 |
| REP-API-007 | GET | /v1/farms/{farmId}/reports/vaccinations | Get vaccinations report data. | Bearer JWT | Query: dateStart,dateEnd,filters | ReportDataResponse | date range and filters valid | 401, 403, 422, 500 |
| REP-API-008 | POST | /v1/farms/{farmId}/reports/export | Queue PDF/Excel/CSV/JSON export. | Bearer JWT | ReportExportRequest | ReportJobResponse | format and report type valid | 400, 401, 403, 422, 500 |
| REP-API-009 | GET | /v1/farms/{farmId}/reports/{reportId}/download | Get signed download URL for generated report. | Bearer JWT | None | DownloadUrlResponse | farm access; report completed | 401, 403, 404, 409, 500 |

### Notifications

| API ID | Method | Endpoint | Purpose | Auth | Request | Response | Validation | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| NOTIF-API-001 | GET | /v1/notifications | Get current user's notifications. | Bearer JWT | Query: unread,type,page,limit | NotificationListResponse | pagination | 401, 422, 500 |
| NOTIF-API-002 | POST | /v1/notifications/{notificationId}/read | Mark notification as read. | Bearer JWT | None | NotificationResponse | recipient ownership | 401, 403, 404, 500 |
| NOTIF-API-003 | POST | /v1/notifications/read-all | Mark all notifications as read. | Bearer JWT | NotificationBulkRequest | MessageResponse | recipient ownership | 401, 500 |
| NOTIF-API-004 | DELETE | /v1/notifications/{notificationId} | Archive/delete notification for user. | Bearer JWT | None | MessageResponse | protected notifications may not delete | 401, 403, 404, 409, 500 |
| NOTIF-API-005 | GET | /v1/notification-settings | Get notification preferences. | Bearer JWT | None | NotificationSettingsResponse | own settings | 401, 500 |
| NOTIF-API-006 | PATCH | /v1/notification-settings | Update notification preferences. | Bearer JWT | NotificationSettingsUpdateRequest | NotificationSettingsResponse | valid categories/channels/quiet hours | 400, 401, 422, 500 |
| NOTIF-API-007 | POST | /v1/push/subscriptions | Register push subscription/device. | Bearer JWT | PushSubscriptionRequest | MessageResponse | endpoint and keys valid | 400, 401, 409, 422, 500 |

### Settings

| API ID | Method | Endpoint | Purpose | Auth | Request | Response | Validation | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SET-API-001 | GET | /v1/settings/profile | Get profile settings. | Bearer JWT | None | ProfileSettingsResponse | own/farm access | 401, 403, 500 |
| SET-API-002 | PATCH | /v1/settings/profile | Update profile settings. | Bearer JWT | ProfileSettingsUpdateRequest | ProfileSettingsResponse | setting keys and values valid | 400, 401, 403, 422, 500 |
| SET-API-003 | GET | /v1/settings/security | Get security settings. | Bearer JWT | None | SecuritySettingsResponse | own/farm access | 401, 403, 500 |
| SET-API-004 | PATCH | /v1/settings/security | Update security settings. | Bearer JWT | SecuritySettingsUpdateRequest | SecuritySettingsResponse | setting keys and values valid | 400, 401, 403, 422, 500 |
| SET-API-005 | GET | /v1/settings/language | Get language settings. | Bearer JWT | None | LanguageSettingsResponse | own/farm access | 401, 403, 500 |
| SET-API-006 | PATCH | /v1/settings/language | Update language settings. | Bearer JWT | LanguageSettingsUpdateRequest | LanguageSettingsResponse | setting keys and values valid | 400, 401, 403, 422, 500 |
| SET-API-007 | GET | /v1/settings/theme | Get theme settings. | Bearer JWT | None | ThemeSettingsResponse | own/farm access | 401, 403, 500 |
| SET-API-008 | PATCH | /v1/settings/theme | Update theme settings. | Bearer JWT | ThemeSettingsUpdateRequest | ThemeSettingsResponse | setting keys and values valid | 400, 401, 403, 422, 500 |
| SET-API-009 | GET | /v1/settings/ai | Get ai settings. | Bearer JWT | None | AISettingsResponse | own/farm access | 401, 403, 500 |
| SET-API-010 | PATCH | /v1/settings/ai | Update ai settings. | Bearer JWT | AISettingsUpdateRequest | AISettingsResponse | setting keys and values valid | 400, 401, 403, 422, 500 |
| SET-API-011 | GET | /v1/settings/backup | Get backup settings. | Bearer JWT | None | BackupSettingsResponse | own/farm access | 401, 403, 500 |
| SET-API-012 | PATCH | /v1/settings/backup | Update backup settings. | Bearer JWT | BackupSettingsUpdateRequest | BackupSettingsResponse | setting keys and values valid | 400, 401, 403, 422, 500 |
| SET-API-013 | GET | /v1/settings/appearance | Get appearance settings. | Bearer JWT | None | AppearanceSettingsResponse | own/farm access | 401, 403, 500 |
| SET-API-014 | PATCH | /v1/settings/appearance | Update appearance settings. | Bearer JWT | AppearanceSettingsUpdateRequest | AppearanceSettingsResponse | setting keys and values valid | 400, 401, 403, 422, 500 |

### Support

| API ID | Method | Endpoint | Purpose | Auth | Request | Response | Validation | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| SUP-API-001 | GET | /v1/support/tickets | List support ticket records with pagination, filtering, sorting and search. | Bearer JWT | Query: page, limit, search, sort, filters | SupportTicketResponseListResponse | farm access; pagination max 100 | 401, 403, 422, 500 |
| SUP-API-002 | POST | /v1/support/tickets | Create support ticket record. | Bearer JWT | SupportTicketCreateRequest | SupportTicketResponse | required fields and business rules | 400, 401, 403, 409, 422, 500 |
| SUP-API-003 | GET | /v1/support/tickets/{id} | Get support ticket details. | Bearer JWT | Path id | SupportTicketResponse | farm access and record ownership | 401, 403, 404, 500 |
| SUP-API-004 | PATCH | /v1/support/tickets/{id} | Update support ticket record. | Bearer JWT | SupportTicketUpdateRequest | SupportTicketResponse | editable fields only; business rules | 400, 401, 403, 404, 409, 422, 500 |
| SUP-API-005 | DELETE | /v1/support/tickets/{id} | Delete or archive support ticket record. | Bearer JWT | DeleteConfirmationRequest | MessageResponse | delete policy; derived data handling | 400, 401, 403, 404, 409, 500 |
| SUP-API-006 | POST | /v1/support/tickets/{ticketId}/messages | Reply to support ticket. | Bearer JWT | SupportMessageCreateRequest | SupportMessageResponse | ticket access; message required | 400, 401, 403, 404, 422, 500 |
| SUP-API-007 | POST | /v1/support/tickets/{ticketId}/close | Close support ticket. | Bearer JWT | TicketCloseRequest | SupportTicketResponse | ticket owner/support; closure status valid | 400, 401, 403, 404, 409, 500 |
| SUP-API-008 | POST | /v1/support/attachments | Upload support attachment metadata/signed URL. | Bearer JWT | AttachmentUploadRequest | AttachmentUploadResponse | file type/size allowed | 400, 401, 413, 422, 500 |
| SUP-API-009 | GET | /v1/support/faq | Search FAQ and help articles. | Bearer JWT | Query: q,category,language | FAQListResponse | language mr/en | 401, 422, 500 |

### Achievements

| API ID | Method | Endpoint | Purpose | Auth | Request | Response | Validation | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ACH-API-001 | GET | /v1/farms/{farmId}/achievements | Get achievement catalog and unlocked status. | Bearer JWT | Query: category,status | AchievementListResponse | farm access | 401, 403, 500 |
| ACH-API-002 | GET | /v1/farms/{farmId}/achievements/progress | Get achievement progress. | Bearer JWT | None | AchievementProgressResponse | farm access | 401, 403, 500 |
| ACH-API-003 | GET | /v1/leaderboard | Get leaderboard rankings. | Bearer JWT | Query: metric,scope,period,taluka,district | LeaderboardResponse | metric/scope valid; privacy rules | 401, 422, 500 |
| ACH-API-004 | GET | /v1/farms/{farmId}/rankings | Get farm ranking summary. | Bearer JWT | Query: metric,period | RankingSummaryResponse | farm access | 401, 403, 422, 500 |

### Admin

| API ID | Method | Endpoint | Purpose | Auth | Request | Response | Validation | Errors |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| ADMIN-API-001 | GET | /v1/admin/dashboard | Get admin platform dashboard. | Bearer JWT | Query: dateRange | AdminDashboardResponse | admin role | 401, 403, 422, 500 |
| ADMIN-API-002 | GET | /v1/admin/users | List admin users. | Bearer JWT | Query: page,limit,filters | AdminListResponse | admin role; pagination | 401, 403, 422, 500 |
| ADMIN-API-003 | GET | /v1/admin/farms | List admin farms. | Bearer JWT | Query: page,limit,filters | AdminListResponse | admin role; pagination | 401, 403, 422, 500 |
| ADMIN-API-004 | GET | /v1/admin/notifications | List admin notifications. | Bearer JWT | Query: page,limit,filters | AdminListResponse | admin role; pagination | 401, 403, 422, 500 |
| ADMIN-API-005 | GET | /v1/admin/subscriptions | List admin subscriptions. | Bearer JWT | Query: page,limit,filters | AdminListResponse | admin role; pagination | 401, 403, 422, 500 |
| ADMIN-API-006 | GET | /v1/admin/support/tickets | List admin support/tickets. | Bearer JWT | Query: page,limit,filters | AdminListResponse | admin role; pagination | 401, 403, 422, 500 |
| ADMIN-API-007 | GET | /v1/admin/audit-logs | List admin audit-logs. | Bearer JWT | Query: page,limit,filters | AdminListResponse | admin role; pagination | 401, 403, 422, 500 |
| ADMIN-API-008 | GET | /v1/admin/farms/{farmId} | Get complete farm monitoring dashboard. | Bearer JWT | None | AdminFarmDetailResponse | admin role; audit read | 401, 403, 404, 500 |
| ADMIN-API-009 | PATCH | /v1/admin/farms/{farmId}/subscription | Fully control farm subscription/trial. | Bearer JWT | AdminSubscriptionUpdateRequest | SubscriptionResponse | admin role; confirmation and reason required | 400, 401, 403, 404, 422, 500 |
| ADMIN-API-010 | POST | /v1/admin/notifications/send | Send targeted admin notification. | Bearer JWT | AdminNotificationSendRequest | NotificationSendResponse | audience and message valid | 400, 401, 403, 422, 500 |
| ADMIN-API-011 | GET | /v1/admin/analytics | Get platform analytics. | Bearer JWT | Query: metric,dateRange | AdminAnalyticsResponse | admin role | 401, 403, 422, 500 |
| ADMIN-API-012 | POST | /v1/admin/support/tickets/{ticketId}/assign | Assign support ticket. | Bearer JWT | TicketAssignRequest | SupportTicketResponse | support/admin role | 400, 401, 403, 404, 422, 500 |
| ADMIN-API-013 | POST | /v1/admin/farms/{farmId}/actions/{action} | Run protected farm action: activate, suspend, export, delete, impersonate. | Bearer JWT | AdminProtectedActionRequest | AdminActionResponse | action allowed; confirmation/reason required | 400, 401, 403, 404, 409, 422, 500 |

## 17. Request/Response Schemas

| Schema | Fields | Notes |
| --- | --- | --- |
| StandardResponse | success, data, meta, message | All successful responses use common envelope unless file download. |
| ErrorResponse | success=false, error.code, error.message, error.details, requestId | All errors use stable code and localized message. |
| PaginationMeta | page, limit, total, hasNext | Collection endpoints. |
| SignupRequest | name, email?, phone?, password, language? | email or phone required; language mr/en. |
| AuthResponse | userId, accessToken, refreshToken, expiresAt, profile, farms | Returned after auth success. |
| FarmResponse | id, farmCode, name, owner, location, status, subscription | Farm tenant payload. |
| CowResponse | id, name, tagNumber, breed, status, reproductiveStatus, importantDates | Cow payload. |
| CalfResponse | id, name, gender, birthDate, status, motherCowId, reminders | Calf payload. |
| MilkRecordResponse | id, date, morningLiters, eveningLiters, totalLiters, fat, snf, rate, amount, source | Milk record. |
| SettlementResponse | id, periodStart, periodEnd, morningTotal, eveningTotal, totalIncome, feedDeduction, netAmount, items | 15-day settlement. |
| ExpenseResponse | id, date, category, amount, source, accountingMonth | Expense record. |
| OCRExtractionResponse | id, uploadId, rawText, extractedJson, confidence, warnings, validationErrors, status | OCR/AI extraction. |
| AIMessageResponse | chatId, messageId, answer, toolCalls, dataSources, tokens, latencyMs | AI response. |
| ReportJobResponse | reportId, status, format, downloadUrl?, expiresAt | Report export job. |
| NotificationResponse | id, title, message, type, priority, readAt, actionUrl | Notification. |
| SupportTicketResponse | id, ticketNo, subject, status, priority, assignedTo, updatedAt | Support ticket. |
| AchievementListResponse | achievements[], progress, score, rank | Achievement data. |
| AdminFarmDetailResponse | overview, subscription, healthScore, statistics, analytics, alerts, users, devices, timeline | Admin farm dashboard. |


## 18. Error Handling Standard

| HTTP Status | Code | Meaning |
| --- | --- | --- |
| 400 | BAD_REQUEST | Malformed request or invalid JSON. |
| 401 | AUTH_REQUIRED | Missing or expired authentication. |
| 403 | ACCESS_DENIED | User lacks required role/farm access. |
| 404 | NOT_FOUND | Resource not found or inaccessible. |
| 409 | CONFLICT | Duplicate record or protected state conflict. |
| 422 | VALIDATION_FAILED | Business or field validation failed. |
| 429 | RATE_LIMITED | Too many requests. |
| 500 | INTERNAL_ERROR | Unexpected server/provider failure. |


## 19. Webhooks and Events

Events may be delivered internally through database triggers/jobs and externally through future webhooks.

| Event | Description | Payload Fields |
| --- | --- | --- |
| cow.created | Cow created | farmId, cowId, userId, timestamp |
| milk_record.added | Milk record added | farmId, recordId, date, totalLiters |
| goal.achieved | Goal achieved | farmId, goalId, goalType, progress |
| reminder.completed | Reminder completed | farmId, reminderId, type |
| ocr.completed | OCR processing completed | farmId, uploadId, extractionId, confidence |
| settlement.saved | Settlement saved | farmId, settlementId, periodStart, periodEnd |
| notification.sent | Notification sent | notificationId, targetCount, channels |
| support.ticket.created | Support ticket created | ticketId, farmId, priority |


## 20. Integration Specification Summary

| Integration | Authentication | Retry | Failure Handling |
| --- | --- | --- | --- |
| Supabase | JWT anon key for client; service role server-only | Client retry for idempotent reads; server retry for jobs | RLS blocks unauthorized access; server logs failures |
| OpenAI | Server-side API key | Retry transient 5xx/timeout with backoff | Return AI_UNAVAILABLE and preserve chat state |
| OCR Provider | Server-side API key | Retry provider errors; fallback/direct GPT where policy allows | Mark upload failed; never save financial records automatically |
| Push Notifications | VAPID/server push keys | Retry transient failures; deactivate invalid endpoints | Keep in-app notification as fallback |
| Supabase Storage | Signed URLs/private buckets | Retry uploads with offline queue | Keep upload job pending/failed with retry option |
| Analytics | Server-side event pipeline | Buffered retry | Drop non-critical analytics after retention buffer |


## 21. OpenAPI Specification

The machine-readable OpenAPI 3.1 contract is generated as `OpenAPI_Specification.yaml` in the same folder. It contains endpoint paths, tags, security scheme, shared schemas and standard responses.

## 22. Frontend Contract Summary

- React Query query keys must include `farmId`, date range and filter objects.
- Mutations must invalidate affected list/detail/summary queries.
- Offline queue may create local temporary IDs, but financial records require server conflict resolution.
- Frontend must use stable `error.code` instead of parsing messages.
- Language switching uses localized labels on client; API error payloads include stable codes and optional localized message.

## 23. API Security

- Validate JWT on every protected request.
- Validate farm membership or admin role server-side.
- Apply rate limits to auth, AI, OCR, push registration and admin actions.
- Validate input with schemas before database writes.
- Audit admin, financial, AI/OCR, backup and security-sensitive operations.
- Never expose service role, OpenAI, OCR or push private keys to browser.

## 24. Testing Strategy

| Test Type | Scope |
| --- | --- |
| Unit tests | Validation, DTO parsing, formula/calculation rules, error mapper |
| Integration tests | Supabase RLS, RPC transactions, OCR save, admin actions |
| Contract tests | OpenAPI request/response compatibility for frontend/backend |
| Performance tests | Dashboard, reports, admin farm details, AI/OCR queues |
| Security tests | Cross-farm access, role bypass, rate limits, file access, admin action protection |
| Regression tests | Accounting source-of-truth, reminders, i18n, offline sync, push notifications |

