# Majhi Dairy Sprint 8 Execution Report

**Date:** 2026-06-07  
**Sprint:** Sprint 8 - OCR / AI Slip Scanning  
**Slice Started:** Slip upload reliability and OCR save data-integrity hardening  
**Status:** Manual QA smoke completed and initial fixes verified

## 1. Scope Executed

Sprint 8 started after Sprint 7 manual QA smoke was completed. This slice focuses on OCR slip scanning because daily slips and 15-day settlement slips directly affect milk totals, khadya deduction, income and profit/loss.

- Slip upload compression path review for Android/iPhone photos.
- Google Vision + GPT extraction retry/repair path review.
- Daily slip OCR save validation review.
- 15-day settlement OCR save validation review.
- Settlement row merge with trusted daily slips review.
- Preview/manual correction form validation review.
- Build-level regression validation.

## 2. Issues Found

| Severity | Issue | Risk |
| --- | --- | --- |
| High | OCR save route did not revalidate future/invalid daily slip dates. | OCR/user-edited payloads could save wrong-date milk records. |
| High | OCR save route did not bound daily litres, rate, fat and SNF. | OCR mistakes could inflate milk reports and accounting. |
| High | OCR save route allowed daily slip amount mismatch to save as a note only. | A code number or wrong OCR value could become final milk litres. |
| Critical | OCR settlement save route did not enforce full period/date/deduction/net validation. | Wrong 15-day settlement values could corrupt income, khadya expense and profit/loss. |
| Medium | Processed image max size was fixed at 1MB in upload route. | Clear iPhone photos could be rejected as too large after compression. |
| Medium | OCR preview form did not mirror server-side financial/date guards. | Users could only discover invalid OCR values after pressing save. |
| Medium | Editing morning/evening printed totals did not immediately refresh total litres in the preview form. | Farmer could see stale total milk after correcting session totals. |

## 3. Fixes Implemented

| Area | Fix |
| --- | --- |
| Daily OCR save | Added ISO date validation and future-date rejection. |
| Daily OCR save | Added bounds for litres, rate, fat, SNF and CLR before saving. |
| Daily OCR save | Blocks save when printed amount and `litres x rate` differ beyond safe tolerance. |
| Settlement OCR save | Added ISO/future-date checks for period and settlement dates. |
| Settlement OCR save | Added max period length, total litres, income and deduction validation. |
| Settlement OCR save | Blocks deductions greater than milk income and major net-payable mismatches. |
| Upload compression | Raised processed image cap from 1MB to 1.5MB to avoid rejecting clear phone photos. |
| Upload compression | Added 720px/640px fallback attempts only when larger attempts still exceed the cap. |
| Preview form | Added ISO/future-date, period-length, litres/rate/fat/SNF, income and deduction validation before save. |
| Preview form | Added date and number input constraints for daily and settlement OCR fields. |
| Preview form | Morning/evening settlement total edits now refresh the total litres field immediately. |
| Preview form | Period length validation now uses inclusive days, matching manual settlement entry. |
| GPT extraction | Reviewed retry and JSON repair path; existing `parseWithRetry` already retries and repairs broken JSON before failing. |

## 4. Files Updated

| File | Purpose |
| --- | --- |
| `app/api/accounting/slip-scan/save/route.js` | Harden OCR daily and settlement save validation. |
| `app/api/accounting/slip-scan/upload/route.js` | Improve server-side compression reliability for large phone photos. |
| `components/slip-scan/ExtractionForm.js` | Harden OCR preview/manual correction validation. |
| `lib/imageCompression.js` | Improve client-side compression defaults and fallback attempts. |
| `docs/project/sprint7/Sprint7_Execution_Report.md` | Record Sprint 7 manual QA smoke completion. |
| `docs/project/sprint8/Sprint8_Execution_Report.md` | Sprint 8 execution tracking. |

## 5. Validation Results

| Check | Command / Method | Result |
| --- | --- | --- |
| Sprint 7 manual QA smoke | Non-destructive review of accounting APIs/forms | Passed after form validation fixes. |
| OCR save route review | Code review of daily and settlement OCR save paths | Passed after save-time validation hardening. |
| Image compression review | Code review of browser and server compression paths | Passed after 1.5MB cap and fallback attempts. |
| JSON repair review | Code review of GPT extraction parsing path | Passed; retry and repair are already implemented. |
| OCR preview form review | Code review of manual correction and save payload | Passed after preview validation fixes. |
| Whitespace check | `git diff --check` on Sprint 7/8 modified files | Passed. |
| ESLint | `npm run lint` | Passed. No ESLint warnings or errors. |
| Production build | `npm run build` | Passed. Next.js compiled successfully and generated 79 static pages. |

## 6. Remaining Manual QA

These require a disposable authenticated farm and real device photos.

1. Upload a clear iPhone camera photo from the app camera and verify it no longer fails as too large.
2. Upload the same photo from gallery and compare extracted values with app-camera flow.
3. Upload or edit a daily slip where `litres x rate` does not match amount and verify preview blocks save.
4. Upload a valid daily slip and verify milk record recomputes correctly.
5. Upload a 15-day settlement slip and verify summary totals are used for final accounting.
6. Verify `एकूण कपात` maps to final khadya deduction.
7. Verify morning/evening settlement totals are displayed and stored when visible on slip.
8. Verify trusted daily slips override settlement row-level OCR data for matching date/session.
9. Upload a settlement with missing/faded rows and verify missing rows show reason instead of guessed values.
10. Try settlement where deductions exceed income and verify save is blocked.

## 7. Sprint 8 Open Items

1. Add automated OCR-save validation tests once test harness is available.
2. Perform Android/iPhone real camera QA with dairy daily slip and 15-day settlement slip.
3. Add OCR fixture images for regression testing if test storage policy allows it.
4. Add browser-level screenshot QA for the OCR preview screen on small iPhone and Android widths.

## 8. Exit Criteria Progress

| Exit Criteria | Status |
| --- | --- |
| Slip upload path reviewed | Pass |
| Large phone photo rejection reduced | Pass |
| Daily OCR save validation hardened | Pass |
| Settlement OCR save validation hardened | Pass |
| GPT JSON retry/repair reviewed | Pass |
| OCR preview/manual correction reviewed | Pass |
| Lint passes | Pass |
| Build passes | Pass |
| Full device/browser OCR QA complete | Pending real-device QA |
| Sprint 8 manual QA smoke complete | Pass |
