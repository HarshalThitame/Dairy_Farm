# Frontend–Backend Contract

**Document Version:** 1.0  
**Date:** 2026-06-07

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

export interface ApiEnvelope<T> {
  success: true;
  data: T;
  meta?: PaginationMeta & { requestId?: string };
  message?: string;
}

export interface ApiErrorEnvelope {
  success: false;
  error: {
    code: ApiErrorCode | string;
    message: string;
    localizedMessage?: { mr?: string; en?: string };
    fieldErrors?: Array<{ field: string; code: string; message: string }>;
    details?: Record<string, unknown>;
  };
  requestId?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total?: number;
  hasNext?: boolean;
}
```

## 2. React Query Key Standards

| Domain | Query Key Pattern | Invalidated By |
| --- | --- | --- |
| Farm | ["farm", farmId] | farm update, membership change |
| Cows | ["cows", farmId, filters] | cow create/update/delete, calving conversion |
| Calves | ["calves", farmId, filters] | calf create/update/delete/convert |
| Milk | ["milkRecords", farmId, dateRange, filters] | milk save/delete, OCR daily save, settlement matching |
| Settlement | ["settlements", farmId, dateRange] | settlement save/delete |
| Expenses | ["expenses", farmId, month, filters] | expense save/delete, settlement feed deduction |
| Dashboard | ["dashboard", farmId, date] | milk/expense/reminder/settlement changes |
| Reminders | ["reminders", farmId, scope, status] | reminder complete/snooze/create |
| AI | ["aiChats", farmId, userId] | chat create/delete/message |
| Notifications | ["notifications", userId, filters] | mark read/delete/new notification |


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

| Action | Offline Behavior |
| --- | --- |
| Slip capture | Store image locally and upload/process when online |
| Manual milk record | Queue locally but check duplicate on sync |
| Financial settlement | Allow draft only; final save requires online validation |
| Reminder complete | Queue action and reconcile by reminder id |
| AI chat | Disable or show online required unless local help content exists |
| Reports/export | Online required |


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
