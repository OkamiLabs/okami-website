---
plan: 06-02
phase: 06-system-prompt-knowledge
status: complete
wave: 2
type: execute
commit: ea2bc9a
key-files:
  modified:
    - lib/ai/system-prompt.ts
    - lib/ai/tools.ts
---

## Summary

Wrote the user-approved prompt body into `lib/ai/system-prompt.ts` and removed `lookupService` from `lib/ai/tools.ts`. Both files committed together in a single commit (`ea2bc9a`).

### lib/ai/system-prompt.ts

Replaced the thin placeholder (~300 tokens, no real knowledge) with a knowledge-complete system prompt using a maintainable constants + sections structure:

- Named constants at the top (`REVIEW_PRICE`, `REVIEW_PRICE_REGULAR`, `REVIEW_DURATION`, `REPORT_TURNAROUND`, `BOOKING_URL`) — update one constant, it propagates everywhere
- Ten named section strings (`IDENTITY`, `ENGAGE`, `SERVICES`, `QUALIFICATION`, `COMPANY`, `LABS`, `BOOKING`, `BEHAVIOR`, `TOOLS_INSTRUCTION`, `DO_NOT`) — add, remove, or reorder with one array edit
- `PageContext` interface and `getSystemPrompt(pageContext?: PageContext): string` signature preserved byte-for-byte
- `if (pageContext)` append block preserved (D-05)

### lib/ai/tools.ts

Removed the entire `lookupService: tool({...})` block (lines 62–93 of the original). `getTools()` now returns only `{ captureLeadInfo }`. All four imports (`tool`, `z`, `sql`, `sendSlackNotification`) remain — all still used by `captureLeadInfo`.

The `app/api/chat/route.ts` calling convention was not modified — removing `lookupService` from the return value auto-propagates.

## Self-Check: PASSED

- ✅ `npx tsc --noEmit` exits 0 — no type errors
- ✅ `interface PageContext` present (1 match)
- ✅ `getSystemPrompt(pageContext?: PageContext): string` signature preserved
- ✅ `okamilabs.com/book` present in system-prompt.ts
- ✅ `lookupService` — 0 matches in system-prompt.ts, 0 matches in tools.ts
- ✅ `$299` present (REVIEW_PRICE constant)
- ✅ `captureLeadInfo: tool(` — 1 match in tools.ts
- ✅ `FROM services` — 0 matches (stale DB query gone)
- ✅ All four imports intact in tools.ts
- ✅ Commit `ea2bc9a` includes exactly system-prompt.ts and tools.ts (plus ROADMAP.md from phase tracking)
- ✅ No reference to Claude, AI, or co-authorship in commit message
