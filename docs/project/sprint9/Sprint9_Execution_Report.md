# Majhi Dairy Sprint 9 Execution Report

**Date:** 2026-06-07  
**Sprint:** Sprint 9 - AI Assistant  
**Slice Executed:** AI Assistant settings, permissions and widget behavior audit  
**Status:** Manual QA smoke completed and initial fixes applied

## 1. Scope Executed

Sprint 9 started after Sprint 8 OCR manual QA smoke. This slice focused on AI Assistant correctness because the assistant must answer from real farm data only and must obey user settings.

- AI Assistant chat API review.
- AI settings API review.
- AI settings page review.
- Assistant widget enable/disable behavior review.
- Response style prompt wiring review.
- Data permission to tool mapping review.
- AI history and feedback route review.

## 2. Issues Found

| Severity | Issue | Risk |
| --- | --- | --- |
| Medium | Global `majhi-open-ai-assistant` events could still open the AI widget even after the user disabled AI in settings. | Home quick questions or custom triggers could make the disabled assistant appear available. |
| Low | AI settings monthly stats used server-local month start instead of India date context. | Month-boundary stats could be off around midnight on non-India hosting regions. |

## 3. Fixes Implemented

| Area | Fix |
| --- | --- |
| AI disabled guard | Added widget-level guard in `askAssistant`, `openAssistant` and global event handler paths. |
| AI disabled UX | Disabled assistant now stays closed and shows the existing Marathi disabled guidance instead of opening from background events. |
| AI stats | `monthStartISO()` now derives the month from India date context. |

## 4. Existing Controls Verified

| Area | Verification |
| --- | --- |
| AI enable/disable | `/api/ai-assistant` rejects requests when AI is disabled in user preferences. |
| Widget visibility | AI widget reads cached/server settings, hides when disabled and closes if disabled while open. |
| Suggested questions | Widget hides suggested question chips when the setting is off. |
| Response style | API passes `short`, `detailed` or `expert` response style into assistant instructions. |
| Data permissions | Tool execution checks milk/slip/analytics/animal permissions before reading database data. |
| Hallucination control | Assistant instructions require tool calls for dairy analytics and forbid invented numbers. |
| History | AI history is farm/user scoped and supports soft delete. |
| Feedback | Useful/not useful feedback is farm/user scoped and best-effort in the widget. |

## 5. Files Updated

| File | Purpose |
| --- | --- |
| `components/ai/AIAssistantWidget.js` | Enforce AI disabled state across direct, button and global-event assistant open paths. |
| `app/api/settings/ai/route.js` | Use India month boundary for AI usage stats. |
| `docs/project/sprint9/Sprint9_Execution_Report.md` | Sprint 9 execution tracking. |

## 6. Validation Results

| Check | Command / Method | Result |
| --- | --- | --- |
| AI settings API review | Code review of GET/PATCH preferences, stats and history loading | Passed. |
| AI assistant API review | Code review of enabled guard, tool calls, logging and error handling | Passed. |
| Permission mapping review | Code review of `getToolPermissionError` and tool handlers | Passed. |
| Widget behavior review | Code review of cached settings, open/close, overlay and back-button handling | Passed. |
| Disabled event path | Code review of `majhi-open-ai-assistant` listener and open callbacks | Passed after widget guard fix. |
| AI usage month boundary | Code review of `/api/settings/ai` stats query | Passed after India date fix. |
| Whitespace check | `git diff --check` on Sprint 9/10 modified files | Passed. |
| ESLint | `npm run lint` | Passed. No ESLint warnings or errors. |
| Production build | `npm run build` | Passed. Next.js compiled successfully and generated 79 static pages. |

## 7. Remaining Manual QA

These require an authenticated farm with AI settings tables migrated.

1. Turn AI off in Settings > AI and verify widget disappears.
2. Try POST `/api/ai-assistant` while AI is off and verify Marathi 403 message.
3. Trigger `majhi-open-ai-assistant` from the home AI card while AI is off and verify the widget stays closed.
4. Turn suggested questions off and verify chips disappear.
5. Set response style to short/detailed/expert and verify answer length changes.
6. Disable milk records permission and ask today's milk; verify permission message.
7. Disable analytics and ask profit/expense; verify permission message.
8. Ask a follow-up question like "त्या दिवशी फॅट किती होते?" after highest milk day.
9. Delete one history item and verify it disappears after refresh.
10. Delete all history and verify stats/history refresh.
11. Save useful/not useful feedback and verify it persists.

## 8. Sprint 9 Open Items

1. Add automated API tests for AI enabled/disabled and permission-denied paths.
2. Add response-style snapshot tests with deterministic mocked tool outputs.
3. Add token/cost tracking if detailed billing analytics are required.
4. Continue with deeper browser QA for response-style visual behavior once disposable farm data is available.

## 9. Exit Criteria Progress

| Exit Criteria | Status |
| --- | --- |
| AI settings route reviewed | Pass |
| AI widget settings behavior reviewed | Pass |
| AI tool permission mapping reviewed | Pass |
| AI response style prompt wiring reviewed | Pass |
| Lint passes | Pass |
| Build passes | Pass |
| Full DB/browser role QA complete | Pending disposable-farm QA |
| Sprint 9 manual QA smoke complete | Pass |
