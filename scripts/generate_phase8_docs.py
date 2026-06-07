from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED
from html import escape
import json
import re

OUT = Path("docs/technical/phase8")
OUT.mkdir(parents=True, exist_ok=True)
DATE = "2026-06-07"


def md_table(headers, rows):
    def cell(value):
        return str(value).replace("\n", "<br>").replace("|", ";")

    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join(["---"] * len(headers)) + " |",
    ]
    for row in rows:
        lines.append("| " + " | ".join(cell(v) for v in row) + " |")
    return "\n".join(lines) + "\n"


counter = {}
endpoints = []


def add(prefix, tag, method, path, purpose, auth="Bearer JWT", request="None", response="StandardResponse", validation="Standard validation", errors="400, 401, 403, 404, 422, 500", success="200", roles="Farm member"):
    counter[prefix] = counter.get(prefix, 0) + 1
    api_id = f"{prefix}-API-{counter[prefix]:03d}"
    endpoints.append(
        {
            "id": api_id,
            "prefix": prefix,
            "tag": tag,
            "method": method,
            "path": path,
            "purpose": purpose,
            "auth": auth,
            "request": request,
            "response": response,
            "validation": validation,
            "errors": errors,
            "success": success,
            "roles": roles,
        }
    )


# Authentication
auth_public = "Public / Supabase Auth"
add("AUTH", "Authentication", "POST", "/v1/auth/signup", "Create user, profile, first farm and language onboarding state.", auth_public, "SignupRequest", "AuthResponse", "name plus email or phone required; password policy; language mr/en", "400, 409, 422, 500", "201", "New user")
add("AUTH", "Authentication", "POST", "/v1/auth/login", "Authenticate by email/phone and password.", auth_public, "LoginRequest", "AuthResponse", "identifier and password required", "400, 401, 423, 429, 500")
add("AUTH", "Authentication", "POST", "/v1/auth/pin/login", "Unlock active app session using PIN.", "Bearer JWT or active device session", "PinLoginRequest", "SessionResponse", "4+ digit PIN; rate limited", "400, 401, 423, 429, 500")
add("AUTH", "Authentication", "POST", "/v1/auth/forgot-password", "Start password reset flow.", auth_public, "ForgotPasswordRequest", "MessageResponse", "email/phone required", "400, 404, 429, 500")
add("AUTH", "Authentication", "POST", "/v1/auth/reset-password", "Reset password using provider token.", auth_public, "ResetPasswordRequest", "MessageResponse", "token valid; password policy", "400, 401, 422, 500")
add("AUTH", "Authentication", "POST", "/v1/auth/refresh", "Refresh access token/session.", "Refresh token", "RefreshTokenRequest", "AuthResponse", "refresh token valid", "401, 500")
add("AUTH", "Authentication", "POST", "/v1/auth/logout", "Logout current device/session.", "Bearer JWT", "None", "MessageResponse", "valid session", "401, 500")
add("AUTH", "Authentication", "GET", "/v1/auth/session", "Validate current session and return user/farm context.", "Bearer JWT", "None", "SessionResponse", "valid token", "401, 403, 500")
add("AUTH", "Authentication", "PATCH", "/v1/auth/password", "Change current password.", "Bearer JWT", "ChangePasswordRequest", "MessageResponse", "current password verified; new password policy", "400, 401, 422, 500", roles="Authenticated user")
add("AUTH", "Authentication", "PATCH", "/v1/auth/pin", "Create/change PIN.", "Bearer JWT", "ChangePinRequest", "MessageResponse", "current PIN where existing; new PIN policy", "400, 401, 422, 429, 500", roles="Authenticated user")

# Farm
add("FARM", "Farm Management", "POST", "/v1/farms", "Create a new farm and owner membership.", "Bearer JWT", "FarmCreateRequest", "FarmResponse", "farm name required; location optional; unique generated farm_code", "400, 401, 409, 422, 500", "201", "Authenticated user")
add("FARM", "Farm Management", "GET", "/v1/farms", "List farms accessible to current user.", "Bearer JWT", "Query: page, limit, status", "FarmListResponse", "pagination limits", "401, 500")
add("FARM", "Farm Management", "GET", "/v1/farms/{farmId}", "Get farm profile.", "Bearer JWT", "Path farmId", "FarmResponse", "farm access required", "401, 403, 404, 500")
add("FARM", "Farm Management", "PATCH", "/v1/farms/{farmId}", "Update farm profile and location.", "Bearer JWT", "FarmUpdateRequest", "FarmResponse", "owner/admin only; location master validation", "400, 401, 403, 404, 422, 500", roles="Owner/Admin")
add("FARM", "Farm Management", "DELETE", "/v1/farms/{farmId}", "Protected farm deletion request.", "Bearer JWT", "DeleteConfirmationRequest", "MessageResponse", "owner/admin; confirmation; backup recommended", "400, 401, 403, 409, 500", roles="Owner/Super Admin")
add("FARM", "Farm Management", "GET", "/v1/farms/{farmId}/statistics", "Get farm statistics dashboard data.", "Bearer JWT", "Query: dateRange", "FarmStatisticsResponse", "farm access; date range max 366 days for live query", "401, 403, 404, 422, 500")
add("FARM", "Farm Management", "GET", "/v1/farms/{farmId}/settings", "Get farm-level settings.", "Bearer JWT", "None", "SettingsResponse", "farm access", "401, 403, 404, 500")
add("FARM", "Farm Management", "PATCH", "/v1/farms/{farmId}/settings", "Update farm-level settings.", "Bearer JWT", "SettingsUpdateRequest", "SettingsResponse", "owner/admin; category/key validation", "400, 401, 403, 422, 500", roles="Owner/Admin")
add("FARM", "Farm Management", "GET", "/v1/farms/{farmId}/members", "List farm members.", "Bearer JWT", "Query: role,status,page,limit", "FarmMemberListResponse", "farm access", "401, 403, 500")
add("FARM", "Farm Management", "POST", "/v1/farms/{farmId}/members", "Invite/add farm member.", "Bearer JWT", "FarmMemberCreateRequest", "FarmMemberResponse", "owner/admin; role valid; no duplicate active membership", "400, 401, 403, 409, 422, 500", "201", "Owner/Admin")
add("FARM", "Farm Management", "PATCH", "/v1/farms/{farmId}/members/{memberId}", "Update member role/status/permissions.", "Bearer JWT", "FarmMemberUpdateRequest", "FarmMemberResponse", "owner/admin; cannot remove last owner", "400, 401, 403, 404, 409, 422, 500", roles="Owner/Admin")
add("FARM", "Farm Management", "DELETE", "/v1/farms/{farmId}/members/{memberId}", "Remove farm member.", "Bearer JWT", "None", "MessageResponse", "owner/admin; cannot remove last owner", "401, 403, 404, 409, 500", roles="Owner/Admin")


def crud(prefix, tag, base_path, item_name, request_schema, response_schema, roles="Farm member"):
    add(prefix, tag, "GET", base_path, f"List {item_name} records with pagination, filtering, sorting and search.", "Bearer JWT", "Query: page, limit, search, sort, filters", f"{response_schema}ListResponse", "farm access; pagination max 100", "401, 403, 422, 500", roles=roles)
    add(prefix, tag, "POST", base_path, f"Create {item_name} record.", "Bearer JWT", request_schema, response_schema, "required fields and business rules", "400, 401, 403, 409, 422, 500", "201", roles)
    add(prefix, tag, "GET", base_path + "/{id}", f"Get {item_name} details.", "Bearer JWT", "Path id", response_schema, "farm access and record ownership", "401, 403, 404, 500", roles=roles)
    add(prefix, tag, "PATCH", base_path + "/{id}", f"Update {item_name} record.", "Bearer JWT", request_schema.replace("Create", "Update"), response_schema, "editable fields only; business rules", "400, 401, 403, 404, 409, 422, 500", roles=roles)
    add(prefix, tag, "DELETE", base_path + "/{id}", f"Delete or archive {item_name} record.", "Bearer JWT", "DeleteConfirmationRequest", "MessageResponse", "delete policy; derived data handling", "400, 401, 403, 404, 409, 500", roles=roles)


# Cow and calf
crud("COW", "Cow Management", "/v1/farms/{farmId}/cows", "cow", "CowCreateRequest", "CowResponse")
add("COW", "Cow Management", "GET", "/v1/farms/{farmId}/cows/{cowId}/profile", "Get cow profile summary, important dates and status.", "Bearer JWT", "None", "CowProfileResponse", "farm access", "401, 403, 404, 500")
add("COW", "Cow Management", "GET", "/v1/farms/{farmId}/cows/{cowId}/history", "Get cow lifecycle timeline.", "Bearer JWT", "Query: page, limit, type", "TimelineResponse", "farm access", "401, 403, 404, 500")
add("COW", "Cow Management", "GET", "/v1/farms/{farmId}/cows/{cowId}/pregnancy-status", "Get current pregnancy/breeding status.", "Bearer JWT", "None", "PregnancyStatusResponse", "farm access", "401, 403, 404, 500")
add("COW", "Cow Management", "GET", "/v1/farms/{farmId}/cows/{cowId}/vaccinations", "Get cow vaccination history.", "Bearer JWT", "Query: status,dateRange", "VaccinationListResponse", "farm access", "401, 403, 404, 500")
add("COW", "Cow Management", "GET", "/v1/farms/{farmId}/cows/{cowId}/milk-history", "Get cow milk history where cow-wise records exist.", "Bearer JWT", "Query: dateStart,dateEnd", "MilkRecordListResponse", "farm access", "401, 403, 404, 422, 500")
add("COW", "Cow Management", "GET", "/v1/farms/{farmId}/cows/{cowId}/health-records", "Get cow health records.", "Bearer JWT", "Query: dateRange,type", "HealthRecordListResponse", "farm access", "401, 403, 404, 500")

crud("CALF", "Calf Management", "/v1/farms/{farmId}/calves", "calf", "CalfCreateRequest", "CalfResponse")
add("CALF", "Calf Management", "GET", "/v1/farms/{farmId}/calves/{calfId}/health-records", "Get calf health records.", "Bearer JWT", "Query: dateRange,type", "HealthRecordListResponse", "farm access", "401, 403, 404, 500")
add("CALF", "Calf Management", "GET", "/v1/farms/{farmId}/calves/{calfId}/vaccinations", "Get calf vaccination records.", "Bearer JWT", "Query: status,dateRange", "VaccinationListResponse", "farm access", "401, 403, 404, 500")
add("CALF", "Calf Management", "GET", "/v1/farms/{farmId}/calves/{calfId}/growth", "Get calf growth and lifecycle milestones.", "Bearer JWT", "None", "CalfGrowthResponse", "farm access", "401, 403, 404, 500")

# Records
for key, label, schema in [
    ("milk", "milk record", "MilkRecord"),
    ("feed", "feed record", "FeedRecord"),
    ("health", "health record", "HealthRecord"),
    ("vaccinations", "vaccination record", "VaccinationRecord"),
    ("breeding", "breeding record", "BreedingRecord"),
    ("calving", "calving record", "CalvingRecord"),
]:
    crud("REC", "Records Management", f"/v1/farms/{{farmId}}/records/{key}", label, f"{schema}CreateRequest", f"{schema}Response")

# Reminders
crud("REM", "Reminders", "/v1/farms/{farmId}/reminders", "reminder", "ReminderCreateRequest", "ReminderResponse")
add("REM", "Reminders", "POST", "/v1/farms/{farmId}/reminders/{reminderId}/snooze", "Snooze reminder to a new date.", "Bearer JWT", "ReminderSnoozeRequest", "ReminderResponse", "new date cannot be past", "400, 401, 403, 404, 422, 500")
add("REM", "Reminders", "POST", "/v1/farms/{farmId}/reminders/{reminderId}/complete", "Complete reminder and trigger related business action if applicable.", "Bearer JWT", "ReminderCompleteRequest", "ReminderResponse", "completion action valid for reminder type", "400, 401, 403, 404, 409, 422, 500")
add("REM", "Reminders", "GET", "/v1/farms/{farmId}/reminder-settings", "Get reminder settings.", "Bearer JWT", "None", "SettingsResponse", "farm access", "401, 403, 500")
add("REM", "Reminders", "PATCH", "/v1/farms/{farmId}/reminder-settings", "Update reminder settings.", "Bearer JWT", "SettingsUpdateRequest", "SettingsResponse", "owner/farm manager", "400, 401, 403, 422, 500")

# Accounting
add("ACC", "Accounting", "POST", "/v1/farms/{farmId}/accounting/milk-entry", "Create manual daily milk accounting entry.", "Bearer JWT", "MilkRecordCreateRequest", "MilkRecordResponse", "no future date; duplicate policy; amount formula", "400, 401, 403, 409, 422, 500", "201")
crud("ACC", "Accounting", "/v1/farms/{farmId}/accounting/settlements", "settlement", "SettlementCreateRequest", "SettlementResponse")
crud("ACC", "Accounting", "/v1/farms/{farmId}/accounting/expenses", "expense", "ExpenseCreateRequest", "ExpenseResponse")
add("ACC", "Accounting", "POST", "/v1/farms/{farmId}/accounting/income", "Create non-milk income entry.", "Bearer JWT", "IncomeCreateRequest", "IncomeResponse", "amount positive; category valid", "400, 401, 403, 422, 500", "201")
add("ACC", "Accounting", "GET", "/v1/farms/{farmId}/accounting/profit", "Calculate profit/loss for period.", "Bearer JWT", "Query: dateStart,dateEnd,groupBy", "ProfitResponse", "date range valid", "401, 403, 422, 500")
add("ACC", "Accounting", "GET", "/v1/farms/{farmId}/accounting/dashboard", "Get financial dashboard.", "Bearer JWT", "Query: month", "FinancialDashboardResponse", "farm access", "401, 403, 422, 500")
add("ACC", "Accounting", "GET", "/v1/farms/{farmId}/accounting/payments", "Get dairy payment tracking and outstanding payments.", "Bearer JWT", "Query: status,dateRange", "PaymentListResponse", "farm access", "401, 403, 422, 500")
add("ACC", "Accounting", "GET", "/v1/farms/{farmId}/accounting/reports", "Get accounting report data.", "Bearer JWT", "Query: reportType,dateRange", "ReportDataResponse", "farm access", "401, 403, 422, 500")

# OCR
add("OCR", "OCR", "POST", "/v1/farms/{farmId}/ocr/uploads", "Create slip upload job and signed upload URL.", "Bearer JWT", "OCRUploadRequest", "OCRUploadResponse", "file type/size/slip_type valid", "400, 401, 403, 413, 422, 500", "201")
add("OCR", "OCR", "GET", "/v1/farms/{farmId}/ocr/uploads/{uploadId}", "Get upload status and metadata.", "Bearer JWT", "None", "OCRUploadResponse", "farm access", "401, 403, 404, 500")
add("OCR", "OCR", "POST", "/v1/farms/{farmId}/ocr/uploads/{uploadId}/process", "Run OCR processing.", "Bearer JWT", "OCRProcessRequest", "OCRExtractionResponse", "upload exists; status processable", "400, 401, 403, 404, 409, 422, 500")
add("OCR", "OCR", "POST", "/v1/farms/{farmId}/ocr/uploads/{uploadId}/extract", "Run AI extraction from OCR text.", "Bearer JWT", "OCRExtractRequest", "OCRExtractionResponse", "OCR text exists", "400, 401, 403, 404, 422, 500")
add("OCR", "OCR", "POST", "/v1/farms/{farmId}/ocr/extractions/{extractionId}/validate", "Validate extracted slip data.", "Bearer JWT", "OCRValidationRequest", "OCRValidationResponse", "financial formulas and confidence thresholds", "400, 401, 403, 404, 422, 500")
add("OCR", "OCR", "PATCH", "/v1/farms/{farmId}/ocr/extractions/{extractionId}/review", "Save manual corrections/review decision.", "Bearer JWT", "OCRReviewRequest", "OCRExtractionResponse", "review status valid; no unconfirmed financial fields", "400, 401, 403, 404, 409, 422, 500")
add("OCR", "OCR", "POST", "/v1/farms/{farmId}/ocr/extractions/{extractionId}/save", "Save reviewed OCR result to milk or settlement records.", "Bearer JWT", "OCRSaveRequest", "OCRSaveResponse", "accepted/corrected extraction; transaction-safe", "400, 401, 403, 404, 409, 422, 500")
add("OCR", "OCR", "POST", "/v1/farms/{farmId}/ocr/uploads/{uploadId}/retry", "Retry OCR/AI extraction with fallback strategy.", "Bearer JWT", "OCRRetryRequest", "OCRExtractionResponse", "retry limit; status failed/warning", "400, 401, 403, 404, 409, 429, 500")

# AI
add("AI", "AI Assistant", "POST", "/v1/farms/{farmId}/ai/chats", "Create AI chat session.", "Bearer JWT", "AIChatCreateRequest", "AIChatResponse", "AI enabled; language mr/en", "400, 401, 403, 422, 500", "201")
add("AI", "AI Assistant", "POST", "/v1/farms/{farmId}/ai/chats/{chatId}/messages", "Send AI message and receive assistant response.", "Bearer JWT", "AIMessageRequest", "AIMessageResponse", "AI enabled; data permissions; rate limits", "400, 401, 403, 404, 422, 429, 500")
add("AI", "AI Assistant", "GET", "/v1/farms/{farmId}/ai/chats/{chatId}", "Get conversation.", "Bearer JWT", "None", "AIChatDetailResponse", "own chat/farm access", "401, 403, 404, 500")
add("AI", "AI Assistant", "DELETE", "/v1/farms/{farmId}/ai/chats/{chatId}", "Delete/archive conversation.", "Bearer JWT", "None", "MessageResponse", "own chat; retention policy", "401, 403, 404, 500")
add("AI", "AI Assistant", "GET", "/v1/farms/{farmId}/ai/chats", "List chat history.", "Bearer JWT", "Query: page,limit,search", "AIChatListResponse", "farm/user access", "401, 403, 500")
add("AI", "AI Assistant", "GET", "/v1/farms/{farmId}/ai/settings", "Get AI settings and permissions.", "Bearer JWT", "None", "AISettingsResponse", "farm/user access", "401, 403, 500")
add("AI", "AI Assistant", "PATCH", "/v1/farms/{farmId}/ai/settings", "Update AI settings and data permissions.", "Bearer JWT", "AISettingsUpdateRequest", "AISettingsResponse", "valid response style and permissions", "400, 401, 403, 422, 500")
add("AI", "AI Assistant", "POST", "/v1/farms/{farmId}/ai/messages/{messageId}/feedback", "Submit AI feedback.", "Bearer JWT", "AIFeedbackRequest", "MessageResponse", "feedback useful/not_useful", "400, 401, 403, 404, 422, 500")

# Reports
for report in ["milk", "income", "expenses", "profit", "annual", "cow-performance", "vaccinations"]:
    add("REP", "Reports", "GET", f"/v1/farms/{{farmId}}/reports/{report}", f"Get {report.replace('-', ' ')} report data.", "Bearer JWT", "Query: dateStart,dateEnd,filters", "ReportDataResponse", "date range and filters valid", "401, 403, 422, 500")
add("REP", "Reports", "POST", "/v1/farms/{farmId}/reports/export", "Queue PDF/Excel/CSV/JSON export.", "Bearer JWT", "ReportExportRequest", "ReportJobResponse", "format and report type valid", "400, 401, 403, 422, 500", "202")
add("REP", "Reports", "GET", "/v1/farms/{farmId}/reports/{reportId}/download", "Get signed download URL for generated report.", "Bearer JWT", "None", "DownloadUrlResponse", "farm access; report completed", "401, 403, 404, 409, 500")

# Notifications
add("NOTIF", "Notifications", "GET", "/v1/notifications", "Get current user's notifications.", "Bearer JWT", "Query: unread,type,page,limit", "NotificationListResponse", "pagination", "401, 422, 500", roles="Authenticated user")
add("NOTIF", "Notifications", "POST", "/v1/notifications/{notificationId}/read", "Mark notification as read.", "Bearer JWT", "None", "NotificationResponse", "recipient ownership", "401, 403, 404, 500", roles="Authenticated user")
add("NOTIF", "Notifications", "POST", "/v1/notifications/read-all", "Mark all notifications as read.", "Bearer JWT", "NotificationBulkRequest", "MessageResponse", "recipient ownership", "401, 500", roles="Authenticated user")
add("NOTIF", "Notifications", "DELETE", "/v1/notifications/{notificationId}", "Archive/delete notification for user.", "Bearer JWT", "None", "MessageResponse", "protected notifications may not delete", "401, 403, 404, 409, 500", roles="Authenticated user")
add("NOTIF", "Notifications", "GET", "/v1/notification-settings", "Get notification preferences.", "Bearer JWT", "None", "NotificationSettingsResponse", "own settings", "401, 500", roles="Authenticated user")
add("NOTIF", "Notifications", "PATCH", "/v1/notification-settings", "Update notification preferences.", "Bearer JWT", "NotificationSettingsUpdateRequest", "NotificationSettingsResponse", "valid categories/channels/quiet hours", "400, 401, 422, 500", roles="Authenticated user")
add("NOTIF", "Notifications", "POST", "/v1/push/subscriptions", "Register push subscription/device.", "Bearer JWT", "PushSubscriptionRequest", "MessageResponse", "endpoint and keys valid", "400, 401, 409, 422, 500", roles="Authenticated user")

# Settings
for name, schema in [
    ("profile", "ProfileSettings"),
    ("security", "SecuritySettings"),
    ("language", "LanguageSettings"),
    ("theme", "ThemeSettings"),
    ("ai", "AISettings"),
    ("backup", "BackupSettings"),
    ("appearance", "AppearanceSettings"),
]:
    add("SET", "Settings", "GET", f"/v1/settings/{name}", f"Get {name} settings.", "Bearer JWT", "None", f"{schema}Response", "own/farm access", "401, 403, 500", roles="Authenticated user")
    add("SET", "Settings", "PATCH", f"/v1/settings/{name}", f"Update {name} settings.", "Bearer JWT", f"{schema}UpdateRequest", f"{schema}Response", "setting keys and values valid", "400, 401, 403, 422, 500", roles="Authenticated user")

# Support
crud("SUP", "Support", "/v1/support/tickets", "support ticket", "SupportTicketCreateRequest", "SupportTicketResponse", roles="Authenticated user")
add("SUP", "Support", "POST", "/v1/support/tickets/{ticketId}/messages", "Reply to support ticket.", "Bearer JWT", "SupportMessageCreateRequest", "SupportMessageResponse", "ticket access; message required", "400, 401, 403, 404, 422, 500", roles="Ticket participant/support")
add("SUP", "Support", "POST", "/v1/support/tickets/{ticketId}/close", "Close support ticket.", "Bearer JWT", "TicketCloseRequest", "SupportTicketResponse", "ticket owner/support; closure status valid", "400, 401, 403, 404, 409, 500", roles="Ticket owner/support")
add("SUP", "Support", "POST", "/v1/support/attachments", "Upload support attachment metadata/signed URL.", "Bearer JWT", "AttachmentUploadRequest", "AttachmentUploadResponse", "file type/size allowed", "400, 401, 413, 422, 500", "201", "Authenticated user")
add("SUP", "Support", "GET", "/v1/support/faq", "Search FAQ and help articles.", "Bearer JWT", "Query: q,category,language", "FAQListResponse", "language mr/en", "401, 422, 500", roles="Authenticated user")

# Achievements
add("ACH", "Achievements", "GET", "/v1/farms/{farmId}/achievements", "Get achievement catalog and unlocked status.", "Bearer JWT", "Query: category,status", "AchievementListResponse", "farm access", "401, 403, 500")
add("ACH", "Achievements", "GET", "/v1/farms/{farmId}/achievements/progress", "Get achievement progress.", "Bearer JWT", "None", "AchievementProgressResponse", "farm access", "401, 403, 500")
add("ACH", "Achievements", "GET", "/v1/leaderboard", "Get leaderboard rankings.", "Bearer JWT", "Query: metric,scope,period,taluka,district", "LeaderboardResponse", "metric/scope valid; privacy rules", "401, 422, 500")
add("ACH", "Achievements", "GET", "/v1/farms/{farmId}/rankings", "Get farm ranking summary.", "Bearer JWT", "Query: metric,period", "RankingSummaryResponse", "farm access", "401, 403, 422, 500")

# Admin
add("ADMIN", "Admin", "GET", "/v1/admin/dashboard", "Get admin platform dashboard.", "Bearer JWT", "Query: dateRange", "AdminDashboardResponse", "admin role", "401, 403, 422, 500", roles="Admin/Super Admin")
for resource in ["users", "farms", "notifications", "subscriptions", "support/tickets", "audit-logs"]:
    add("ADMIN", "Admin", "GET", f"/v1/admin/{resource}", f"List admin {resource}.", "Bearer JWT", "Query: page,limit,filters", "AdminListResponse", "admin role; pagination", "401, 403, 422, 500", roles="Admin/Super Admin")
add("ADMIN", "Admin", "GET", "/v1/admin/farms/{farmId}", "Get complete farm monitoring dashboard.", "Bearer JWT", "None", "AdminFarmDetailResponse", "admin role; audit read", "401, 403, 404, 500", roles="Admin/Super Admin")
add("ADMIN", "Admin", "PATCH", "/v1/admin/farms/{farmId}/subscription", "Fully control farm subscription/trial.", "Bearer JWT", "AdminSubscriptionUpdateRequest", "SubscriptionResponse", "admin role; confirmation and reason required", "400, 401, 403, 404, 422, 500", roles="Admin/Super Admin")
add("ADMIN", "Admin", "POST", "/v1/admin/notifications/send", "Send targeted admin notification.", "Bearer JWT", "AdminNotificationSendRequest", "NotificationSendResponse", "audience and message valid", "400, 401, 403, 422, 500", "202", "Admin/Super Admin")
add("ADMIN", "Admin", "GET", "/v1/admin/analytics", "Get platform analytics.", "Bearer JWT", "Query: metric,dateRange", "AdminAnalyticsResponse", "admin role", "401, 403, 422, 500", roles="Admin/Super Admin")
add("ADMIN", "Admin", "POST", "/v1/admin/support/tickets/{ticketId}/assign", "Assign support ticket.", "Bearer JWT", "TicketAssignRequest", "SupportTicketResponse", "support/admin role", "400, 401, 403, 404, 422, 500", roles="Support/Admin")
add("ADMIN", "Admin", "POST", "/v1/admin/farms/{farmId}/actions/{action}", "Run protected farm action: activate, suspend, export, delete, impersonate.", "Bearer JWT", "AdminProtectedActionRequest", "AdminActionResponse", "action allowed; confirmation/reason required", "400, 401, 403, 404, 409, 422, 500", roles="Admin/Super Admin")


schemas = [
    ("StandardResponse", "success, data, meta, message", "All successful responses use common envelope unless file download."),
    ("ErrorResponse", "success=false, error.code, error.message, error.details, requestId", "All errors use stable code and localized message."),
    ("PaginationMeta", "page, limit, total, hasNext", "Collection endpoints."),
    ("SignupRequest", "name, email?, phone?, password, language?", "email or phone required; language mr/en."),
    ("AuthResponse", "userId, accessToken, refreshToken, expiresAt, profile, farms", "Returned after auth success."),
    ("FarmResponse", "id, farmCode, name, owner, location, status, subscription", "Farm tenant payload."),
    ("CowResponse", "id, name, tagNumber, breed, status, reproductiveStatus, importantDates", "Cow payload."),
    ("CalfResponse", "id, name, gender, birthDate, status, motherCowId, reminders", "Calf payload."),
    ("MilkRecordResponse", "id, date, morningLiters, eveningLiters, totalLiters, fat, snf, rate, amount, source", "Milk record."),
    ("SettlementResponse", "id, periodStart, periodEnd, morningTotal, eveningTotal, totalIncome, feedDeduction, netAmount, items", "15-day settlement."),
    ("ExpenseResponse", "id, date, category, amount, source, accountingMonth", "Expense record."),
    ("OCRExtractionResponse", "id, uploadId, rawText, extractedJson, confidence, warnings, validationErrors, status", "OCR/AI extraction."),
    ("AIMessageResponse", "chatId, messageId, answer, toolCalls, dataSources, tokens, latencyMs", "AI response."),
    ("ReportJobResponse", "reportId, status, format, downloadUrl?, expiresAt", "Report export job."),
    ("NotificationResponse", "id, title, message, type, priority, readAt, actionUrl", "Notification."),
    ("SupportTicketResponse", "id, ticketNo, subject, status, priority, assignedTo, updatedAt", "Support ticket."),
    ("AchievementListResponse", "achievements[], progress, score, rank", "Achievement data."),
    ("AdminFarmDetailResponse", "overview, subscription, healthScore, statistics, analytics, alerts, users, devices, timeline", "Admin farm dashboard."),
]

error_codes = [
    ("400", "BAD_REQUEST", "Malformed request or invalid JSON."),
    ("401", "AUTH_REQUIRED", "Missing or expired authentication."),
    ("403", "ACCESS_DENIED", "User lacks required role/farm access."),
    ("404", "NOT_FOUND", "Resource not found or inaccessible."),
    ("409", "CONFLICT", "Duplicate record or protected state conflict."),
    ("422", "VALIDATION_FAILED", "Business or field validation failed."),
    ("429", "RATE_LIMITED", "Too many requests."),
    ("500", "INTERNAL_ERROR", "Unexpected server/provider failure."),
]

events = [
    ("cow.created", "Cow created", "farmId, cowId, userId, timestamp"),
    ("milk_record.added", "Milk record added", "farmId, recordId, date, totalLiters"),
    ("goal.achieved", "Goal achieved", "farmId, goalId, goalType, progress"),
    ("reminder.completed", "Reminder completed", "farmId, reminderId, type"),
    ("ocr.completed", "OCR processing completed", "farmId, uploadId, extractionId, confidence"),
    ("settlement.saved", "Settlement saved", "farmId, settlementId, periodStart, periodEnd"),
    ("notification.sent", "Notification sent", "notificationId, targetCount, channels"),
    ("support.ticket.created", "Support ticket created", "ticketId, farmId, priority"),
]


def endpoints_by_tag():
    tags = {}
    for e in endpoints:
        tags.setdefault(e["tag"], []).append(e)
    return tags


def endpoint_table(rows):
    return md_table(
        ["API ID", "Method", "Endpoint", "Purpose", "Auth", "Request", "Response", "Validation", "Errors"],
        [(e["id"], e["method"], e["path"], e["purpose"], e["auth"], e["request"], e["response"], e["validation"], e["errors"]) for e in rows],
    )


def api_spec_md():
    text = f"""# Majhi Dairy API Specification

**Document Version:** 1.0  
**Date:** {DATE}  
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

{md_table(['Principle','Standard'], [
('Tenant safety','Every farm-owned request contains or resolves farmId and is validated by RLS/server role checks.'),
('No silent financial automation','OCR/AI extracted financial data is never saved without explicit user confirmation.'),
('Stable contracts','All endpoints use versioned /v1 paths and stable DTO names.'),
('Localized user messages','API returns stable error codes and optional localized messages for Marathi/English.'),
('Pagination by default','All list endpoints support page, limit and deterministic sorting.'),
('Idempotency where needed','Financial saves, retries and uploads should support Idempotency-Key.'),
('Auditability','High-risk actions create audit logs.'),
])}
### 1.2 Naming Conventions

- Paths use kebab-case nouns: `/v1/farms/{{farmId}}/milk-records`.
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
{{
  "success": true,
  "data": {{}},
  "meta": {{
    "requestId": "req_123",
    "page": 1,
    "limit": 20,
    "total": 100
  }},
  "message": "Saved successfully"
}}
```

### 1.5 Standard Error Envelope

```json
{{
  "success": false,
  "error": {{
    "code": "VALIDATION_FAILED",
    "message": "Please check required fields.",
    "localizedMessage": {{
      "mr": "कृपया आवश्यक माहिती तपासा.",
      "en": "Please check required fields."
    }},
    "details": {{}},
    "fieldErrors": [
      {{ "field": "amount", "code": "MUST_BE_POSITIVE", "message": "Amount must be positive." }}
    ]
  }},
  "requestId": "req_123"
}}
```

## 2. Endpoint Inventory

"""
    for tag, rows in endpoints_by_tag().items():
        text += f"### {tag}\n\n" + endpoint_table(rows) + "\n"
    text += f"""## 17. Request/Response Schemas

{md_table(['Schema','Fields','Notes'], schemas)}

## 18. Error Handling Standard

{md_table(['HTTP Status','Code','Meaning'], error_codes)}

## 19. Webhooks and Events

Events may be delivered internally through database triggers/jobs and externally through future webhooks.

{md_table(['Event','Description','Payload Fields'], events)}

## 20. Integration Specification Summary

{md_table(['Integration','Authentication','Retry','Failure Handling'], [
('Supabase','JWT anon key for client; service role server-only','Client retry for idempotent reads; server retry for jobs','RLS blocks unauthorized access; server logs failures'),
('OpenAI','Server-side API key','Retry transient 5xx/timeout with backoff','Return AI_UNAVAILABLE and preserve chat state'),
('OCR Provider','Server-side API key','Retry provider errors; fallback/direct GPT where policy allows','Mark upload failed; never save financial records automatically'),
('Push Notifications','VAPID/server push keys','Retry transient failures; deactivate invalid endpoints','Keep in-app notification as fallback'),
('Supabase Storage','Signed URLs/private buckets','Retry uploads with offline queue','Keep upload job pending/failed with retry option'),
('Analytics','Server-side event pipeline','Buffered retry','Drop non-critical analytics after retention buffer'),
])}

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

{md_table(['Test Type','Scope'], [
('Unit tests','Validation, DTO parsing, formula/calculation rules, error mapper'),
('Integration tests','Supabase RLS, RPC transactions, OCR save, admin actions'),
('Contract tests','OpenAPI request/response compatibility for frontend/backend'),
('Performance tests','Dashboard, reports, admin farm details, AI/OCR queues'),
('Security tests','Cross-farm access, role bypass, rate limits, file access, admin action protection'),
('Regression tests','Accounting source-of-truth, reminders, i18n, offline sync, push notifications'),
])}
"""
    return text


def integration_md():
    return f"""# Majhi Dairy Integration Specification

**Document Version:** 1.0  
**Date:** {DATE}

## 1. Integration Overview

Majhi Dairy integrates with Supabase, OpenAI, OCR provider, web push, Supabase Storage and analytics/monitoring services. All provider keys are server-side only.

## 2. Integration Matrix

{md_table(['Integration','Purpose','Authentication','Data Flow','Retry Logic','Failure Handling','Rate Limits'], [
('Supabase Auth','Identity and sessions','Supabase client/session JWT','Client signs in; server validates JWT; profile loaded from users','Provider-managed refresh; client retries safe reads','AUTH_REQUIRED or SESSION_EXPIRED; redirect to login','Auth provider limits plus app login throttling'),
('Supabase PostgreSQL','Tenant data store','Anon key with RLS; service role server-only','Client/RPC/API reads and writes farm-scoped data','Retry idempotent reads; no blind retry for financial writes','Rollback transactions; audit failures','Connection pooling and query limits'),
('Supabase Storage','Private file storage','Signed URLs and RLS storage policies','Upload slip/images/reports/backups through signed URLs','Retry resumable/offline uploads','Mark job failed/pending; no orphan business save','File size/type limits per bucket'),
('OpenAI','AI assistant and optional OCR fallback','Server-side API key','Server builds tool-safe prompt, executes typed tools, stores chat messages','Retry transient 429/5xx with backoff and budget cap','AI_UNAVAILABLE; no fake data; preserve user question','Per-user/farm AI quotas'),
('OCR Provider','Extract text from slip images','Server-side API key','Server sends compressed image, receives OCR text, validates, calls AI structuring','Retry provider timeout/5xx; fallback per policy','OCR_FAILED; user can retry/rescan/manual entry','Per-farm OCR quotas and provider limits'),
('Push Notification Service','Mobile/browser push','VAPID/private server keys','Server sends to stored subscriptions; logs delivery','Retry transient failures 3 times','Invalid endpoint deactivated; in-app remains','Per-user notification throttling'),
('Analytics/Monitoring','Usage, performance and error monitoring','Server-side token','Server emits non-sensitive events and metrics','Buffered retry','Drop non-critical analytics after buffer expires','Batch limits'),
])}

## 3. Supabase Data Flow

```text
Frontend -> Supabase Auth -> JWT
Frontend -> Supabase PostgREST/RPC with anon key
RLS -> farm_members/users policies
PostgreSQL -> response
Server APIs -> service role only for trusted jobs
```

## 4. OpenAI Integration Contract

- AI requests are accepted only when AI is enabled in settings.
- Tool execution is server-controlled; GPT never receives raw SQL access.
- Data permissions determine whether tools can use milk, slip, analytics or animal data.
- Store `tokens_input`, `tokens_output`, `latency_ms`, `tool_calls` and `data_sources`.
- AI responses must be in selected language unless user explicitly asks otherwise.

## 5. OCR Integration Contract

- Client compresses image where needed before upload.
- Server sends image/OCR text to provider; provider credentials remain secret.
- Extraction output must be strict JSON and validated before preview.
- Summary totals on settlement slips are authoritative for reports.
- If OCR/AI values conflict with validation rules, save is blocked until manual review.

## 6. Push Notification Contract

- Browser/device registers push subscription through `/v1/push/subscriptions`.
- Server stores endpoint hash and encrypted keys where applicable.
- Admin/reminder/goal events create in-app notification first.
- Push delivery is best effort; in-app notification is source of truth.

## 7. Failure and Recovery Standards

{md_table(['Failure','Recovery'], [
('Provider timeout','Retry with exponential backoff if idempotent'),
('Invalid API key','Disable provider path, alert admin, return service unavailable'),
('Rate limit','Return RATE_LIMITED with retryAfter'),
('Partial transaction failure','Rollback and write server error log'),
('Offline client','Queue local action where safe; financial conflicts require review'),
])}
"""


def frontend_md():
    return f"""# Frontend–Backend Contract

**Document Version:** 1.0  
**Date:** {DATE}

## 1. Frontend Data Models

```ts
export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'AUTH_REQUIRED'
  | 'ACCESS_DENIED'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'VALIDATION_FAILED'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR';

export interface ApiEnvelope<T> {{
  success: true;
  data: T;
  meta?: PaginationMeta & {{ requestId?: string }};
  message?: string;
}}

export interface ApiErrorEnvelope {{
  success: false;
  error: {{
    code: ApiErrorCode | string;
    message: string;
    localizedMessage?: {{ mr?: string; en?: string }};
    fieldErrors?: Array<{{ field: string; code: string; message: string }}>;
    details?: Record<string, unknown>;
  }};
  requestId?: string;
}}

export interface PaginationMeta {{
  page: number;
  limit: number;
  total?: number;
  hasNext?: boolean;
}}
```

## 2. React Query Key Standards

{md_table(['Domain','Query Key Pattern','Invalidated By'], [
('Farm','[\"farm\", farmId]','farm update, membership change'),
('Cows','[\"cows\", farmId, filters]','cow create/update/delete, calving conversion'),
('Calves','[\"calves\", farmId, filters]','calf create/update/delete/convert'),
('Milk','[\"milkRecords\", farmId, dateRange, filters]','milk save/delete, OCR daily save, settlement matching'),
('Settlement','[\"settlements\", farmId, dateRange]','settlement save/delete'),
('Expenses','[\"expenses\", farmId, month, filters]','expense save/delete, settlement feed deduction'),
('Dashboard','[\"dashboard\", farmId, date]','milk/expense/reminder/settlement changes'),
('Reminders','[\"reminders\", farmId, scope, status]','reminder complete/snooze/create'),
('AI','[\"aiChats\", farmId, userId]','chat create/delete/message'),
('Notifications','[\"notifications\", userId, filters]','mark read/delete/new notification'),
])}

## 3. Caching Strategy

- Dashboard summary: 30-120 seconds stale time, refetch on app focus.
- Lists: 60 seconds stale time, pagination cache retained.
- Detail pages: 5 minutes stale time unless mutation occurs.
- AI and OCR job status: poll every 2-5 seconds while processing, stop on terminal status.
- Reports/download URLs: refetch only on user action or job status change.

## 4. Mutation Rules

- Use optimistic UI only for non-financial low-risk actions such as mark notification read.
- Do not optimistic-save financial/OCR/settlement records.
- All financial mutations must show saving modal/progress and wait for server confirmation.
- Mutations must handle `fieldErrors` and map them to form controls.

## 5. Offline Handling

{md_table(['Action','Offline Behavior'], [
('Slip capture','Store image locally and upload/process when online'),
('Manual milk record','Queue locally but check duplicate on sync'),
('Financial settlement','Allow draft only; final save requires online validation'),
('Reminder complete','Queue action and reconcile by reminder id'),
('AI chat','Disable or show online required unless local help content exists'),
('Reports/export','Online required'),
])}

## 6. Error Handling Strategy

- If `AUTH_REQUIRED`, redirect to login.
- If `ACCESS_DENIED`, show permission page and do not retry automatically.
- If `VALIDATION_FAILED`, show field-level errors.
- If `CONFLICT`, show conflict resolution UI.
- If `RATE_LIMITED`, show retry-after countdown.
- If provider errors occur in OCR/AI, keep draft state and allow retry.

## 7. Localization Contract

- Frontend owns UI labels through i18n keys.
- API returns stable error codes and optional localized messages.
- User-generated content remains as entered.
- Reports and exports include language parameter and must render headers in selected language.

## 8. File Upload Contract

```text
1. Request signed upload URL.
2. Upload file directly to Supabase Storage.
3. Confirm upload/job status through API.
4. Poll status until uploaded/extracted/failed.
5. Review extracted values before save.
```

## 9. Frontend Security Rules

- Never store service role key or provider keys in frontend.
- Do not trust client-side role checks for protected actions.
- Do not expose raw OCR images through public URLs.
- Clear sensitive local queues after sync or logout.
"""


def yaml_scalar(value):
    text = str(value).replace('"', '\\"')
    return f'"{text}"'


def parameters_for(path):
    params = []
    for name in re.findall(r"{([^}]+)}", path):
        params.append(
            f"""        - name: {name}
          in: path
          required: true
          schema:
            type: string
            format: uuid"""
        )
    if any(word in path for word in ["reports", "records", "cows", "calves", "reminders", "notifications", "admin"]):
        params.append(
            """        - name: page
          in: query
          required: false
          schema:
            type: integer
            minimum: 1
            default: 1"""
        )
        params.append(
            """        - name: limit
          in: query
          required: false
          schema:
            type: integer
            minimum: 1
            maximum: 100
            default: 20"""
        )
    return "\n".join(params)


def openapi_yaml():
    grouped = {}
    for e in endpoints:
        grouped.setdefault(e["path"], []).append(e)
    y = f"""openapi: 3.1.0
info:
  title: Majhi Dairy API
  version: 1.0.0
  description: API contract for Majhi Dairy frontend, Supabase backend, AI, OCR and admin integrations.
servers:
  - url: https://api.majhidairy.app
    description: Production API base
  - url: http://localhost:3000
    description: Local Next.js API base
security:
  - bearerAuth: []
tags:
"""
    for tag in sorted(endpoints_by_tag()):
        y += f"  - name: {tag}\n"
    y += "paths:\n"
    for path, ops in grouped.items():
        y += f"  {yaml_scalar(path)}:\n"
        for e in ops:
            method = e["method"].lower()
            y += f"""    {method}:
      tags:
        - {e['tag']}
      operationId: {e['id'].replace('-', '_')}
      summary: {yaml_scalar(e['purpose'])}
      description: {yaml_scalar(e['validation'])}
"""
            if e["auth"].lower().startswith("public"):
                y += "      security: []\n"
            params = parameters_for(path)
            if params:
                y += "      parameters:\n" + params + "\n"
            if method in ["post", "patch", "put"] and e["request"] != "None":
                y += f"""      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/GenericRequest'
"""
            y += f"""      responses:
        "{e['success']}":
          description: Success
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/StandardResponse'
        "400":
          $ref: '#/components/responses/BadRequest'
        "401":
          $ref: '#/components/responses/Unauthorized'
        "403":
          $ref: '#/components/responses/Forbidden'
        "404":
          $ref: '#/components/responses/NotFound'
        "409":
          $ref: '#/components/responses/Conflict'
        "422":
          $ref: '#/components/responses/ValidationFailed'
        "429":
          $ref: '#/components/responses/RateLimited'
        "500":
          $ref: '#/components/responses/InternalError'
"""
    y += """components:
  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT
  schemas:
    StandardResponse:
      type: object
      required: [success, data]
      properties:
        success:
          type: boolean
          const: true
        data:
          type: object
          additionalProperties: true
        meta:
          $ref: '#/components/schemas/PaginationMeta'
        message:
          type: string
    ErrorResponse:
      type: object
      required: [success, error]
      properties:
        success:
          type: boolean
          const: false
        error:
          type: object
          required: [code, message]
          properties:
            code:
              type: string
            message:
              type: string
            localizedMessage:
              type: object
              properties:
                mr:
                  type: string
                en:
                  type: string
            fieldErrors:
              type: array
              items:
                type: object
                properties:
                  field:
                    type: string
                  code:
                    type: string
                  message:
                    type: string
            details:
              type: object
              additionalProperties: true
        requestId:
          type: string
    PaginationMeta:
      type: object
      properties:
        page:
          type: integer
        limit:
          type: integer
        total:
          type: integer
        hasNext:
          type: boolean
        requestId:
          type: string
    GenericRequest:
      type: object
      additionalProperties: true
    Farm:
      type: object
      properties:
        id: { type: string, format: uuid }
        name: { type: string }
        farmCode: { type: string }
        status: { type: string }
    Cow:
      type: object
      properties:
        id: { type: string, format: uuid }
        farmId: { type: string, format: uuid }
        name: { type: string }
        status: { type: string }
    Calf:
      type: object
      properties:
        id: { type: string, format: uuid }
        farmId: { type: string, format: uuid }
        name: { type: string }
        gender: { type: string }
    MilkRecord:
      type: object
      properties:
        id: { type: string, format: uuid }
        recordDate: { type: string, format: date }
        morningLiters: { type: number }
        eveningLiters: { type: number }
        totalLiters: { type: number }
        amount: { type: number }
    Settlement:
      type: object
      properties:
        id: { type: string, format: uuid }
        periodStart: { type: string, format: date }
        periodEnd: { type: string, format: date }
        totalIncome: { type: number }
        feedDeduction: { type: number }
        netAmount: { type: number }
  responses:
    BadRequest:
      description: Bad request
      content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
    Unauthorized:
      description: Authentication required
      content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
    Forbidden:
      description: Access denied
      content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
    NotFound:
      description: Resource not found
      content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
    Conflict:
      description: Conflict
      content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
    ValidationFailed:
      description: Validation failed
      content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
    RateLimited:
      description: Rate limited
      content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
    InternalError:
      description: Internal server error
      content: { application/json: { schema: { $ref: '#/components/schemas/ErrorResponse' } } }
"""
    return y


def clean_inline(s: str) -> str:
    s = re.sub(r"\*\*(.*?)\*\*", r"\1", s.strip())
    s = re.sub(r"`([^`]*)`", r"\1", s)
    return s.replace("<br>", "; ")


def p_xml(text, style=None):
    text = clean_inline(text)
    if not text:
        return "<w:p/>"
    ppr = f'<w:pPr><w:pStyle w:val="{style}"/></w:pPr>' if style else ""
    return f'<w:p>{ppr}<w:r><w:t xml:space="preserve">{escape(text)}</w:t></w:r></w:p>'


def table_xml(rows):
    cols = max(len(r) for r in rows)
    body = ['<w:tbl><w:tblPr><w:tblStyle w:val="TableGrid"/></w:tblPr>']
    for r in rows:
        body.append("<w:tr>")
        for c in r + [""] * (cols - len(r)):
            body.append("<w:tc>" + p_xml(c) + "</w:tc>")
        body.append("</w:tr>")
    body.append("</w:tbl>")
    return "".join(body)


def md_to_docx(md, path):
    lines = md.splitlines()
    body, i, code, codebuf = [], 0, False, []
    while i < len(lines):
        s = lines[i].strip()
        if s.startswith("```"):
            if not code:
                code, codebuf = True, []
            else:
                body.append(p_xml("\n".join(codebuf), "Code"))
                code = False
            i += 1
            continue
        if code:
            codebuf.append(lines[i])
            i += 1
            continue
        if not s:
            i += 1
            continue
        if s.startswith("|"):
            rows = []
            while i < len(lines) and lines[i].strip().startswith("|"):
                cells = [clean_inline(x) for x in lines[i].strip().strip("|").split("|")]
                if not all(re.fullmatch(r"[-:\s]+", x or "") for x in cells):
                    rows.append(cells)
                i += 1
            body.append(table_xml(rows))
            continue
        h = re.match(r"^(#{1,6})\s+(.*)$", s)
        if h:
            style = {1: "Heading1", 2: "Heading2", 3: "Heading3"}.get(min(len(h.group(1)), 3), "Heading3")
            body.append(p_xml(h.group(2), style))
            i += 1
            continue
        if s.startswith("- "):
            body.append(p_xml("• " + s[2:]))
            i += 1
            continue
        body.append(p_xml(s))
        i += 1
    document = f'<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>{"".join(body)}<w:sectPr/></w:body></w:document>'
    styles = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:rPr><w:b/><w:sz w:val="34"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:rPr><w:b/><w:sz w:val="28"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading3"><w:name w:val="heading 3"/><w:rPr><w:b/><w:sz w:val="24"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Code"><w:name w:val="Code"/><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:sz w:val="18"/></w:rPr></w:style><w:style w:type="table" w:styleId="TableGrid"><w:name w:val="Table Grid"/></w:style></w:styles>'''
    ct = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>'''
    rels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>'''
    docrels = '''<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>'''
    with ZipFile(path, "w", ZIP_DEFLATED) as z:
        z.writestr("[Content_Types].xml", ct)
        z.writestr("_rels/.rels", rels)
        z.writestr("word/document.xml", document)
        z.writestr("word/_rels/document.xml.rels", docrels)
        z.writestr("word/styles.xml", styles)


def write_all():
    api = api_spec_md()
    (OUT / "Majhi_Dairy_API_Specification.md").write_text(api, encoding="utf-8")
    md_to_docx(api, OUT / "Majhi_Dairy_API_Specification.docx")
    (OUT / "OpenAPI_Specification.yaml").write_text(openapi_yaml(), encoding="utf-8")
    (OUT / "Integration_Specification.md").write_text(integration_md(), encoding="utf-8")
    (OUT / "Frontend_Backend_Contract.md").write_text(frontend_md(), encoding="utf-8")
    (OUT / "api_catalog.json").write_text(json.dumps({"endpoints": endpoints, "schemas": schemas, "errors": error_codes, "events": events}, indent=2), encoding="utf-8")


if __name__ == "__main__":
    write_all()
    print(json.dumps({"endpoints": len(endpoints), "schemas": len(schemas), "out": str(OUT)}, indent=2))
