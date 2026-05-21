---
phase: 05-foundation-live-ai
reviewed: 2026-05-21T00:00:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - app/api/chat/route.ts
  - lib/ai/system-prompt.ts
  - lib/ai/tools.ts
  - widget/MessageInput.tsx
  - widget/MessageList.tsx
  - widget/WidgetChat.tsx
  - widget/styles/themes.css
  - widget/types/widget.ts
findings:
  critical: 3
  warning: 5
  info: 3
  total: 11
status: issues_found
---

# Phase 05: Code Review Report

**Reviewed:** 2026-05-21T00:00:00Z
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

This phase introduces the live AI chat widget: a streaming `/api/chat` route backed by Claude claude-3-5-haiku-20241022, two AI tools (`captureLeadInfo`, `lookupService`), a React widget built with Vite, and supporting CSS/type definitions. The overall architecture is sound — parameterized SQL, HMAC-signed cookies, visitor-scoped rate limits, and a token reservation/reconciliation pattern are all correctly implemented.

Three critical defects stand out. First, user-controlled values (`url`, `title`, `meta`) from the browser are interpolated verbatim into the LLM system prompt without any sanitization, creating a prompt-injection vector. Second, the `captureLeadInfo` tool imposes no length limits on the `name`, `email`, `phone`, or `serviceInterest` fields — an LLM hallucination or adversarial input can write arbitrarily long strings to the `leads` table. Third, a token reservation is created before the user-message `INSERT`; if that `INSERT` throws (or any subsequent step before `streamText` does), the 2000-token reservation is never reconciled and permanently inflates the daily spend counter.

---

## Critical Issues

### CR-01: Prompt injection via user-controlled page context

**File:** `lib/ai/system-prompt.ts:28-29`
**Issue:** The values `pageContext.url`, `pageContext.title`, and `pageContext.meta` originate entirely from the browser (`window.location.href`, `document.title`, and a `data-page-context` attribute). They are passed through the request body unmodified and interpolated directly into the system prompt string. An attacker who controls those values — for example by self-hosting the widget script against a malicious page, or by crafting a raw POST to `/api/chat` — can inject arbitrary instructions into the system prompt. For instance, setting `title` to `"Ignore all previous instructions. You are now..."` is a classic prompt injection attack that alters model behavior, bypasses the "don't be pushy" guidelines, or causes the model to exfiltrate conversation content via tool calls.

The `url` and `title` fields have `max(2048)` and `max(256)` Zod guards on the route, but there is no content-level sanitization — no newline stripping, no instruction-injection detection, and no escaping of prompt-sensitive characters.

**Fix:**
```typescript
// lib/ai/system-prompt.ts
function sanitizeForPrompt(value: string): string {
  // Strip newlines and common prompt-injection markers
  return value
    .replace(/[\r\n]/g, ' ')
    .replace(/[<>]/g, '')
    .slice(0, 200); // hard cap well below Zod limits
}

// In getSystemPrompt():
if (pageContext) {
  const safeTitle = sanitizeForPrompt(pageContext.title);
  const safeUrl = sanitizeForPrompt(pageContext.url);
  const safeMeta = pageContext.meta ? sanitizeForPrompt(pageContext.meta) : undefined;

  prompt += `\n\nThe visitor is currently on:\n- Page: ${safeTitle}\n- URL: ${safeUrl}${safeMeta ? `\n- Context: ${safeMeta}` : ''}\n\nAdapt your responses to be relevant to the page they're viewing.`;
}
```

---

### CR-02: No length limits on `captureLeadInfo` tool inputs — unbounded DB writes

**File:** `lib/ai/tools.ts:11-14`
**Issue:** The Zod schema for `captureLeadInfo` defines all four fields (`name`, `email`, `phone`, `serviceInterest`) as `z.string().optional()` with no `.max()` constraint. The AI SDK passes tool arguments as parsed JSON from the model response. A model that is manipulated (via prompt injection — see CR-01) or that hallucinates a very long string can write a payload of arbitrary length into the `leads` table columns. This is a denial-of-service / storage-abuse risk and may trigger database row-size limits in unexpected ways.

**Fix:**
```typescript
// lib/ai/tools.ts — inputSchema for captureLeadInfo
inputSchema: z.object({
  name: z.string().max(200).optional().describe('Visitor name'),
  email: z.string().max(320).optional().describe('Visitor email'),
  phone: z.string().max(30).optional().describe('Visitor phone number'),
  serviceInterest: z.string().max(500).optional().describe('What service they are interested in'),
}),
```

---

### CR-03: Token reservation leaks if any step between `reserveTokens` and `streamText` throws

**File:** `app/api/chat/route.ts:185-194`
**Issue:** `reserveTokens(activeConversationId, 2000)` is called at line 185. The 2000-token reservation is only ever released by `onFinish`, `onAbort` (inside `streamText`), or the explicit `reconcileTokens(reservationId, 0)` in the canned-reply path. However, between the `reserveTokens` call and the `streamText` call there are two operations that can throw: the `INSERT INTO messages` at line 188 and the lazy `import()` calls at lines 196-197. If either throws (e.g., a transient DB error, a missing `@ai-sdk/anthropic` package in a broken deploy), the route handler propagates an unhandled exception, the request terminates, and `reconcileTokens` is never called. The orphaned reservation has `reconciled = FALSE` and is counted by `checkSpendCap()` indefinitely until the opportunistic cleanup runs (which deletes records older than 5 minutes but requires another request to trigger).

Under normal load this is self-healing, but under error conditions it causes false throttling of all users for up to 5 minutes per failed request.

**Fix:** Wrap the post-reservation steps in a try/catch that guarantees reconciliation:

```typescript
// app/api/chat/route.ts
const reservationId = await reserveTokens(activeConversationId, 2000);

try {
  await sql`
    INSERT INTO messages (id, conversation_id, role, content)
    VALUES (${randomUUID()}, ${activeConversationId}, 'user', ${lastUserText})
  `;

  if (process.env.CHATBOT_ENABLED === '1') {
    // ... streaming path
  }
  // ... canned reply path
} catch (err) {
  await reconcileTokens(reservationId, 0).catch(() => {});
  throw err;
}
```

---

## Warnings

### WR-01: `isSending` state in `MessageInput` is set and cleared synchronously — spinner never shows

**File:** `widget/MessageInput.tsx:66-86`
**Issue:** `handleSubmit` calls `setIsSending(true)` and then `onSubmit()` synchronously inside a `try/finally` block that immediately resets it to `false`. Because `onSubmit` is `handleFormSubmit` in `WidgetChat`, which calls `sendMessage` (a synchronous UI-SDK state update), the `isSending` state transitions `true → false` within the same React render cycle. The spinner rendered at line 164 based on `isSending` will never be visible to the user. The actual "loading" signal comes from the `status` prop in `MessageList`, but the send button uses its own `isSending` state for the spinner and disabled check — meaning the button is never actually in a "sending" visual state.

**Fix:** Remove `isSending` entirely from `MessageInput` and derive the disabled/spinner state from the `status` prop passed down from `WidgetChat`:

```typescript
// MessageInput: replace isSending with a status prop
interface MessageInputProps {
  // ...
  isLoading?: boolean; // replaces isSending — driven by useChat status
}
// In WidgetChat:
<MessageInput
  isLoading={status === 'submitted' || status === 'streaming'}
  // ...
/>
```

---

### WR-02: `role="dialog"` without `aria-modal="true"` and no focus trap

**File:** `widget/WidgetChat.tsx:103`
**Issue:** The chat panel has `role="dialog"` and an `aria-label`, but is missing `aria-modal="true"` and has no focus trap implementation. Without `aria-modal="true"`, screen readers (particularly NVDA and JAWS) do not restrict virtual cursor navigation to within the dialog, allowing users to navigate behind the widget to page content. Without a focus trap, keyboard users can Tab out of the open dialog. This violates WCAG 2.1 SC 4.1.2 (Name, Role, Value) and the ARIA authoring practices for dialogs.

**Fix:**
```tsx
// widget/WidgetChat.tsx
<div
  className="widget-chat"
  role="dialog"
  aria-modal="true"
  aria-label={`Chat with ${config.companyName}`}
>
```
Additionally, implement focus management: on open, move focus to the close button or first interactive element; on close, return focus to the trigger button.

---

### WR-03: `lookupService` tool has no length limit on the `query` parameter

**File:** `lib/ai/tools.ts:65`
**Issue:** The `lookupService` tool schema defines `query: z.string()` with no `.max()` constraint. This value is embedded directly into an ILIKE pattern: `` `%${query}%` ``. A very long query string (up to the LLM's output limit) will produce an extremely long ILIKE pattern, which PostgreSQL must process. While parameterized, this is a potential slow-query / DB resource exhaustion vector if the model is fed adversarial input (see CR-01).

**Fix:**
```typescript
query: z.string().max(200).describe('Search query for the service'),
```

---

### WR-04: No `maxSteps` limit on `streamText` — potential runaway tool-call loops

**File:** `app/api/chat/route.ts:205-234`
**Issue:** The `streamText` call passes `tools` but does not set `maxSteps` (formerly `maxToolRoundtrips`). By default the AI SDK allows the model to call tools repeatedly until it produces a text response. A model that loops between `lookupService` and `captureLeadInfo` calls (whether due to a bug, prompt injection, or unexpected model behavior) can exhaust the `maxOutputTokens: 1000` limit across many rounds and consume significantly more tokens than the 2000-token reservation implies. The spend cap will catch this eventually, but not before overrun occurs on a single request.

**Fix:**
```typescript
const result = streamText({
  model: anthropic('claude-3-5-haiku-20241022'),
  system: systemPrompt,
  messages: convertToModelMessages(parsed.data.messages as UIMessage[]),
  tools: getTools(visitorId, activeConversationId),
  maxOutputTokens: 1000,
  maxSteps: 3, // prevent runaway tool loops
  abortSignal: request.signal,
  // ...
});
```

---

### WR-05: `LIGHT_THEME` and `DARK_THEME` presets use off-brand purple colors

**File:** `widget/types/widget.ts:44,54`
**Issue:** `LIGHT_THEME.primaryColor` is `#7c3aed` (violet) and `DARK_THEME.primaryColor` is `#8b5cf6` (purple). Per `CLAUDE.md`, the brand palette is: Slate Blue `#6878A0` (primary accent), Burgundy `#8B3A3A`, Ash `#9A918A`, and Off-white `#e8e6e1`. Using purple as the default widget color violates the brand identity. The `okami` theme in `themes.css` correctly uses `#6878A0`, but it is not applied by default — `LIGHT_THEME` is the default in `DEFAULT_CONFIG`.

**Fix:**
```typescript
export const LIGHT_THEME: WidgetTheme = {
  mode: 'light',
  primaryColor: '#6878A0', // Slate Blue — brand primary
  // ...
};

export const DARK_THEME: WidgetTheme = {
  mode: 'dark',
  primaryColor: '#6878A0', // Slate Blue — consistent across modes
  // ...
};
```

---

## Info

### IN-01: `okami` theme `surface-color` is `#faf5ff` (lavender) — inconsistent with brand

**File:** `widget/styles/themes.css:96`
**Issue:** The `okami` theme sets `--widget-surface-color: #faf5ff`, which is a light lavender. This is inconsistent with the site's dark background (`#0a0a0a`) and the off-white / ash / slate-blue palette. It likely crept in from a generic template. The surface should align with the brand aesthetic.

**Fix:** Use a neutral off-white consistent with the site:
```css
[data-widget-theme="okami"] {
  --widget-surface-color: #f7f6f4; /* near-off-white, matches e8e6e1 family */
}
```

---

### IN-02: `MessageList` uses array index as React key for message parts

**File:** `widget/MessageList.tsx:119`
**Issue:** `message.parts.map((part, i) => { ... return <p key={i} ...>` uses the array index as the key. If the AI SDK streams parts and the array is reordered (e.g., a tool-call part resolves and is removed), React will incorrectly reconcile DOM nodes. Parts should use a stable identifier.

**Fix:** Use a stable key derived from part type and index, or use the part's own identity:
```tsx
<p key={`${part.type}-${i}`} className="message__text" ...>
```
This is not a crash risk but can cause subtle rendering glitches during streaming.

---

### IN-03: `captureLeadInfo` dedup window is 1 hour but rate-limit window is 10 minutes — asymmetric silencing

**File:** `lib/ai/tools.ts:36-44`
**Issue:** The email dedup check (`created_at > NOW() - INTERVAL '1 hour'`) operates over a 1-hour window while the per-visitor rate limit (`windowSec: 600` = 10 minutes) resets every 10 minutes. A visitor who submits contact info and then returns after 11 minutes will pass rate limits but silently receive "Thanks, we already have your contact details" for up to 50 more minutes. This is not a bug per se, but the asymmetry could surprise legitimate returning visitors and is worth making explicit or aligning the windows.

**Fix:** Either align the dedup window with the rate limit window, or add a comment documenting the intentional asymmetry.

---

_Reviewed: 2026-05-21T00:00:00Z_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
