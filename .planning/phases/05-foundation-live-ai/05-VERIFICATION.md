---
phase: 05-foundation-live-ai
verified: 2026-05-21T16:00:00Z
status: human_needed
score: 4/4 must-haves verified
overrides_applied: 0
human_verification:
  - test: "With CHATBOT_ENABLED=1 and ANTHROPIC_API_KEY set, send a message in the widget. Verify the response streams token by token rather than appearing all at once."
    expected: "Streaming text appears progressively in the MessageBubble. TypingIndicator shows during submitted/streaming states and disappears on ready."
    why_human: "Cannot invoke live Claude API in CI. streamText() call, abortSignal wiring, and toUIMessageStreamResponse() are all present in code — live execution is the only way to confirm end-to-end streaming works."
  - test: "Send two messages in sequence. After the first response, check that subsequent sendMessage calls include the conversationId in the request body (inspect Network tab)."
    expected: "Second message's POST /api/chat body contains conversationId matching the UUID returned in the x-conversation-id header of the first response."
    why_human: "The lazy-capture pattern (conversationId captured inside useCallback at call time) is structurally correct in code but can only be verified behaviorally at runtime."
  - test: "During a streaming response, close the browser tab or navigate away. Verify in the database that the token_reservations table shows the reservation reconciled to 0 (not left at 2000)."
    expected: "onAbort fires, calling reconcileTokens(reservationId, 0). No row in messages table for the aborted assistant response."
    why_human: "Cannot trigger browser close + DB state verification programmatically without a running server and test harness."
---

# Phase 5: Foundation + Live AI Verification Report

**Phase Goal:** Visitors receive real Claude streaming responses in the widget, spend cap is protected against orphaned reservations, and the AI SDK v5 API surface is fully consistent across route and widget
**Verified:** 2026-05-21T16:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths (Roadmap Success Criteria)

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Sending a message in the widget produces a streaming Claude response — not a canned reply | VERIFIED (code) | `app/api/chat/route.ts`: lazy `streamText()` inside `if (CHATBOT_ENABLED === '1')` branch; `toUIMessageStreamResponse()` returns streaming Response. `widget/WidgetChat.tsx`: `DefaultChatTransport` + `sendMessage()`. Human test required for live verification. |
| 2 | Closing the browser mid-stream does not orphan a token reservation (spend cap reconciles correctly via onAbort) | VERIFIED | `abortSignal: request.signal` passed to `streamText()` (line 211); `onAbort: async () => { await reconcileTokens(reservationId, 0) }` present (lines 230–233). `reserveTokens(2000)` before stream (line 185); `reconcileTokens(actual)` in `onFinish` (line 215). All three reconcile callsites present. Human test required to confirm onAbort fires on browser close. |
| 3 | The conversationId is present on every message including message 2+ (not just the first) | VERIFIED | `x-conversation-id` header set on both streaming path (line 242) and canned fallback path (line 268). Widget `WidgetChat.tsx` captures ID via custom `DefaultChatTransport` fetch wrapper (lines 68–73); `conversationId` included in subsequent `sendMessage` body lazily inside `useCallback` (lines 86–87). Human test required to observe network behavior. |
| 4 | Tool card rendering infrastructure is in place — widget uses message.parts (v5), not message.toolInvocations (v4) | VERIFIED | `widget/MessageList.tsx`: imports `UIMessage from 'ai'`; `message.parts.map()` at line 115; `GenericToolCard` renders `state === 'output-available'` tool parts (lines 133–143). All v4 references removed: `toolInvocations=0`, `message.content=0`, `isLoading=0`. |

**Score:** 4/4 truths verified (code-level)

### Deferred Items

None identified.

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `lib/ai/tools.ts` | v5-compatible tool definitions | VERIFIED | `inputSchema:` used in both tools (count=2); `bookDiscoveryCall` removed (count=0); `parameters:` absent (count=0); exports `{ captureLeadInfo, lookupService }` |
| `widget/types/widget.ts` | clean widget types without retired ToolCallDisplay | VERIFIED | `ToolCallDisplay` count=0; `WidgetConfig`, `LIGHT_THEME`, `DARK_THEME`, `DEFAULT_CONFIG` all present |
| `app/api/chat/route.ts` | live Claude streaming endpoint with token reconciliation | VERIFIED | `streamText` present (×2: import + call); `onFinish` + `onAbort` present; `uiMessageSchema` with `parts` array; all guard pipeline steps present |
| `app/api/chat/route.ts` | v5-compatible Zod schema | VERIFIED | `uiMessageSchema` (count=2: definition + usage in `chatBodySchema`); `passthrough()` on part schema; old `messageSchema` absent (count=0) |
| `widget/WidgetChat.tsx` | v5 useChat consumer with DefaultChatTransport | VERIFIED | `DefaultChatTransport` ×2 (import + instantiation); `sendMessage` ×3; `handleFormSubmit` ×2 (definition + JSX); `status={status}` ×1; `x-conversation-id` ×1 (in fetch wrapper) |
| `widget/MessageList.tsx` | message.parts renderer with GenericToolCard | VERIFIED | `GenericToolCard` ×2 (definition + usage); `message.parts` ×2; `startsWith('tool-')` ×1; `status === 'submitted'` ×1; all v4 components removed |
| `widget/MessageInput.tsx` | no-arg onSubmit prop signature | VERIFIED | `onSubmit: () => void` confirmed; `FormEvent` count=0 |
| `widget/styles/themes.css` | correct Okami brand primary color | VERIFIED | `#6878A0` present in `[data-widget-theme="okami"]` block; `#7c3aed` absent (count=0); `#6d28d9` absent; `#ede9fe` absent |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `lib/ai/tools.ts` | `app/api/chat/route.ts` | `getTools(visitorId, activeConversationId)` passed to `streamText({ tools })` | WIRED | `getTools` imported at top (line 34); called at line 209 with `visitorId` and `activeConversationId` |
| `app/api/chat/route.ts` | `lib/spend-cap.ts` | `reserveTokens()` / `reconcileTokens()` in `onFinish` + `onAbort` | WIRED | `reserveTokens(activeConversationId, 2000)` at line 185; `reconcileTokens(reservationId, actual)` in `onFinish`; `reconcileTokens(reservationId, 0)` in `onAbort` and canned fallback |
| `app/api/chat/route.ts` | DB messages table | `INSERT INTO messages` in `onFinish` callback | WIRED | INSERT in `onFinish` at lines 217–225 (with `token_usage`); INSERT for user message at lines 188–191; canned fallback INSERT at lines 256–258 |
| `widget/WidgetChat.tsx` | `POST /api/chat` | `DefaultChatTransport` fetch wrapper captures `x-conversation-id` header | WIRED | Custom `fetch` in `DefaultChatTransport` reads `response.headers.get('x-conversation-id')` and calls `setConversationId(id)` |
| `widget/WidgetChat.tsx` | `widget/MessageList.tsx` | `status` prop passed (replaces `isLoading`) | WIRED | `<MessageList messages={messages} status={status} config={config} />` at lines 139–143 |
| `widget/WidgetChat.tsx` | `widget/MessageInput.tsx` | `onSubmit={handleFormSubmit}` — no-arg signature | WIRED | `<MessageInput onSubmit={handleFormSubmit} ...>` at line 149; `handleFormSubmit` is `() => void` |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `widget/MessageList.tsx` | `messages` (UIMessage[]) | `useChat()` in `WidgetChat.tsx` via `DefaultChatTransport` → `POST /api/chat` → Claude streaming | Yes (when `CHATBOT_ENABLED=1`; canned reply when `=0`) | FLOWING (conditional on env var by design) |
| `widget/MessageList.tsx` | `status` | `useChat()` returns `'submitted' \| 'streaming' \| 'ready' \| 'error'` | Yes — SDK-managed state | FLOWING |
| `app/api/chat/route.ts` | token usage | `totalUsage.inputTokens + totalUsage.outputTokens` from `streamText onFinish` | Yes — actual SDK usage | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| `streamText` present in route | `grep -c 'streamText' app/api/chat/route.ts` | 2 (import + call — comment-free lines) | PASS |
| `onAbort` wired with `abortSignal` | `grep -c 'abortSignal' app/api/chat/route.ts` | 1 | PASS |
| Canned fallback still functional | `grep -c "CHATBOT_ENABLED === '1'" app/api/chat/route.ts` | 1 (conditional branch exists) | PASS |
| TypeScript compiles clean | `npx tsc --noEmit 2>&1 \| wc -l` | 0 lines of output (zero errors) | PASS |
| Widget build (Vite) | `npm run build:widget` (reported in summary) | Succeeds | PASS (per summary) |
| Next.js Turbopack build | `npm run build` | FAILS — 2 errors | FAIL (pre-existing — see below) |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| CONV-01 | 05-01, 05-02, 05-03 | Visitor receives a real AI-generated streaming response in the widget (not a canned reply) | SATISFIED (code) | `streamText()` wired in route; widget consumes v5 stream via `DefaultChatTransport`; `message.parts` rendering in place. Live execution requires human verification. |

**Note on REQUIREMENTS.md cross-reference:** `CONV-01` does not appear in `.planning/REQUIREMENTS.md` — that file covers v1.0 Codebase Health requirements (OBS-*, PAY-*, INF-*, SEC-*, AI-*, TEST-*, HYG-*). CONV-01 is a v2.0 AI Chatbot requirement referenced in ROADMAP.md and the phase research file. This is expected — no orphaned or missing requirement IDs.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `lib/ai/tools.ts` | 3–4 | `.js` extension imports (`../db/client.js`, `../notifications.js`) that Turbopack cannot resolve | Warning | `npm run build` fails with 2 Module not found errors. Pre-existing since Phase 03 commit `b6313c2`. Turbopack-specific issue; TypeScript (`tsc --noEmit`) and widget Vite build both pass. Logged in `deferred-items.md`. |
| `widget/types/widget.ts` | 43, 52 | `LIGHT_THEME.primaryColor: '#7c3aed'` and `DARK_THEME.primaryColor: '#8b5cf6'` remain as purple placeholders | Info | Plan noted these are informational TypeScript constants not used at runtime — the actual CSS variable in `themes.css` was correctly updated to `#6878A0`. No user-visible impact. |

### Human Verification Required

#### 1. End-to-end Streaming Verification

**Test:** Set `CHATBOT_ENABLED=1` and a valid `ANTHROPIC_API_KEY` in `.env.local`, start `npm run dev`, open the widget, send a message (e.g., "What services does Okami offer?").

**Expected:** Response text appears progressively token by token. The TypingIndicator shows briefly while `status === 'submitted'`, then disappears once streaming begins. The StreamingCursor appears on the last assistant message while `status === 'streaming'`. After completion, `status` returns to `'ready'`.

**Why human:** Live API call to Anthropic required. `streamText()`, `DefaultChatTransport`, `toUIMessageStreamResponse()` are all wired correctly in code but only a running session confirms the streaming protocol handshake works end-to-end.

#### 2. ConversationId Persistence Across Multiple Messages

**Test:** In the same session as above, send a second message after the first response completes (e.g., "Tell me about the Okami Review pricing"). In browser DevTools Network tab, inspect the second POST /api/chat request body.

**Expected:** The request body contains `conversationId` set to the UUID received in the `x-conversation-id` header of the first response. The server-side ownership check passes (no 404). The assistant responds in context.

**Why human:** The lazy-capture pattern in `handleFormSubmit` is structurally correct (conversationId in `useCallback` dependency array) but requires a live multi-turn session to observe whether the closure captures the updated value on message 2+.

#### 3. onAbort Token Reconciliation on Browser Close

**Test:** With `CHATBOT_ENABLED=1`, send a message and immediately close the browser tab (or navigate away) while the response is streaming. Then check the DB: `SELECT actual_tokens, reconciled_at FROM token_reservations WHERE conversation_id = '<id>' ORDER BY created_at DESC LIMIT 1`.

**Expected:** `actual_tokens = 0` (reconciled via onAbort, not charged). No assistant message row in the `messages` table for that conversation turn.

**Why human:** Cannot trigger a browser close event and inspect DB state without a running server + test harness. The `abortSignal: request.signal` and `onAbort` code paths are present and correct but this scenario requires real browser behavior.

### Gaps Summary

No blocking code gaps were found. All four roadmap success criteria are satisfied at the code level:

1. `streamText()` lazy-imported inside `CHATBOT_ENABLED === '1'` branch, returning `toUIMessageStreamResponse()` with `x-conversation-id` header — SC1 code satisfied.
2. `abortSignal: request.signal` + `onAbort: async () => reconcileTokens(reservationId, 0)` — SC2 code satisfied.
3. `x-conversation-id` set on both response paths; `conversationId` captured lazily in widget via `DefaultChatTransport` custom fetch + `useCallback` — SC3 code satisfied.
4. `message.parts.map()` in `MessageBubble`; `GenericToolCard` for `state === 'output-available'` tool parts; all v4 surface removed — SC4 fully satisfied.

**Pre-existing build issue (not a Phase 5 gap):** `npm run build` fails due to Turbopack's inability to resolve `.js`-extension imports in `lib/ai/tools.ts`. This was introduced in Phase 03 (`b6313c2`) and logged in `deferred-items.md`. TypeScript compiles clean (`tsc --noEmit` = 0 errors). This corresponds to requirement `AI-01` which remains `Pending` in `REQUIREMENTS.md` — it was not in Phase 5's scope.

Three human verification items are required before the phase can be marked fully passed. All three involve live runtime behavior that cannot be verified by static analysis.

---

_Verified: 2026-05-21T16:00:00Z_
_Verifier: Claude (gsd-verifier)_
