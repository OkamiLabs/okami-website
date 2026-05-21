---
phase: 05-foundation-live-ai
plan: 02
subsystem: api
tags: [ai-sdk, streaming, chat, token-reconciliation, security]

# Dependency graph
requires: [05-01]
provides:
  - "app/api/chat/route.ts: live Claude streaming endpoint with onFinish/onAbort token reconciliation"
  - "app/api/chat/route.ts: v5-compatible Zod schema (uiMessageSchema with parts array)"
affects: [05-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "AI SDK v5: lazy import @ai-sdk/anthropic and streamText inside CHATBOT_ENABLED branch"
    - "AI SDK v5: convertToModelMessages(messages as UIMessage[]) for type bridge from Zod to SDK"
    - "AI SDK v5: streamText onFinish receives { text, totalUsage } for token accounting"
    - "AI SDK v5: abortSignal: request.signal enables onAbort to fire on browser close"

key-files:
  created: []
  modified:
    - app/api/chat/route.ts

key-decisions:
  - "UIMessage cast: parsed.data.messages as UIMessage[] bridges Zod-inferred type to SDK's UIMessage for convertToModelMessages"
  - "type UIMessage import from 'ai' at top level is type-only — no bundle impact (erased at compile time)"
  - "Token reservation changed from 0 to 2000 estimated tokens; reconciled to actual in onFinish"

patterns-established:
  - "onAbort reconciles to 0 — reservation freed without charging, no assistant DB row written"
  - "User message persisted before CHATBOT_ENABLED branch so both paths have user row in DB"

requirements-completed: [CONV-01]

# Metrics
duration: ~4min
completed: 2026-05-21
---

# Phase 5 Plan 02: Live Claude Streaming Chat Route Summary

**Replaced canned-reply stub with lazy streamText() + onFinish/onAbort token reconciliation, accepting v5 UIMessage format with parts array throughout**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-05-21T14:33:34Z
- **Completed:** 2026-05-21T14:37:13Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments

- Updated Zod schemas from v4 `messageSchema` (role + content string) to v5 `uiMessageSchema` (id, role, parts array with passthrough) and `uiMessagePartSchema`
- Replaced `lastUser.content` access with `lastUserText` extracted from `parts[].text` filter/map
- Added `getTools` and `getSystemPrompt` imports at top level
- Changed token reservation from 0 (stub) to 2000 estimated tokens
- Replaced the canned-reply block with a `CHATBOT_ENABLED === '1'` branch that:
  - Lazy-imports `@ai-sdk/anthropic` and `streamText/convertToModelMessages` from `'ai'`
  - Calls `streamText()` with `claude-3-5-haiku-20241022`, tools, system prompt, and `abortSignal: request.signal`
  - `onFinish`: reconciles actual tokens, inserts assistant message with `token_usage`
  - `onAbort`: reconciles to 0, no assistant row written
  - Returns `toUIMessageStreamResponse()` with `x-conversation-id` header + cookies
- Canned fallback preserved and functional (still returns JSON 200 with `x-conversation-id`)
- All 10 guard pipeline steps (rate limit, spend cap, visitor, ownership, page context) unchanged
- TypeScript compiles clean (zero errors) — required `as UIMessage[]` cast for `convertToModelMessages` parameter type

## Task Commits

Each task was committed atomically:

1. **Task 1: Update Zod schemas and last-user-message extraction for v5 UIMessage format** — `411aa8e` (feat)
2. **Task 2: Replace canned-reply stub with live streamText() and token reconciliation** — `d5b3137` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `app/api/chat/route.ts` — v5 Zod schemas, lazy streamText with onFinish/onAbort reconciliation, canned fallback, all guards preserved

## Decisions Made

- **UIMessage type cast**: `parsed.data.messages as UIMessage[]` is needed because the Zod-inferred type (with passthrough on parts) does not structurally satisfy SDK's `UIMessage.parts: Array<UIMessagePart<...>>` union. The cast is safe — Zod validated the messages already; this is a TypeScript-only bridge.
- **type-only import of UIMessage**: importing `{ type UIMessage } from 'ai'` at the top of the file is a TypeScript type import, erased at compile time — it does not pull the SDK into the cold bundle and does not violate the lazy-import invariant.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript type error: Zod-inferred messages not assignable to UIMessage[]**
- **Found during:** Task 2 TypeScript verification
- **Issue:** `convertToModelMessages` expects `Array<Omit<UIMessage, 'id'>>` where `UIMessage.parts` is a complex SDK union type. The Zod-inferred type (with `.passthrough()`) doesn't satisfy this structurally.
- **Fix:** Added `import { type UIMessage } from 'ai'` (type-only, no bundle impact) and cast `parsed.data.messages as UIMessage[]` at the call site. The cast is safe because Zod has already validated the structure.
- **Files modified:** `app/api/chat/route.ts`
- **Commit:** `d5b3137`

## Issues Encountered

None beyond the TypeScript type deviation above, which was auto-fixed inline.

## User Setup Required

None. The route continues to function with `CHATBOT_ENABLED=0` (canned reply). To enable live Claude streaming, set `CHATBOT_ENABLED=1` and `ANTHROPIC_API_KEY` in the environment.

## Next Phase Readiness

- `app/api/chat/route.ts` now accepts v5 UIMessage format (Widget Wave 3 migration prerequisite)
- Live streaming path wired and TypeScript-clean
- `x-conversation-id` header present on both streaming and canned responses
- Token reconciliation covers onFinish and onAbort (no orphaned reservations)
- No blockers for Wave 3 (widget UI migration)

---

## Self-Check: PASSED

- `app/api/chat/route.ts` exists and contains `streamText`, `onFinish`, `onAbort`
- Commits `411aa8e` and `d5b3137` present in git log
- TypeScript: zero errors

---
*Phase: 05-foundation-live-ai*
*Completed: 2026-05-21*
