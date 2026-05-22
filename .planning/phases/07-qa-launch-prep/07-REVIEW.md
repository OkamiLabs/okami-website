---
phase: 07-qa-launch-prep
reviewed: 2026-05-22T00:00:00Z
depth: standard
files_reviewed: 8
files_reviewed_list:
  - app/layout.tsx
  - lib/ai/system-prompt.ts
  - next.config.ts
  - widget/MessageList.tsx
  - widget/styles/themes.css
  - widget/styles/widget.css
  - widget/types/widget.ts
  - widget/WidgetChat.tsx
findings:
  critical: 1
  warning: 4
  info: 2
  total: 7
status: issues_found
---

# Phase 07: Code Review Report

**Reviewed:** 2026-05-22
**Depth:** standard
**Files Reviewed:** 8
**Status:** issues_found

## Summary

Reviewed the widget frontend, layout, system prompt, and CSP configuration that make up the Phase 07 QA/launch-prep deliverable. The code is generally well-structured with good accessibility and error-handling patterns. One critical issue was found: the widget script is loaded on every page of the main site without any CSP allowance for the domains the widget calls, and the widget itself renders user-controlled `data-page-context` attribute content into the AI request body without sanitization. Four warnings cover undefined CSS custom properties that silently degrade the UI, a missing `aria-modal` on the chat dialog, a stale closure risk in the conversation-ID capture, and the unconditional script injection in layout.tsx. Two info items round out unused features and a magic-number placement.

---

## Critical Issues

### CR-01: `data-page-context` attribute injected into AI request body without sanitization

**File:** `widget/WidgetChat.tsx:24-27`

**Issue:** `getPageContext()` reads `data-page-context` from a `<script>` element in the DOM and passes its raw value straight into the `body` of every `sendMessage` call as `meta`. Any content in that attribute — injected by a browser extension, a third-party script, or a misconfigured page — reaches the server-side AI route verbatim. The system-prompt already strips newlines from `pageContext.meta` on the server (`system-prompt.ts:153`), but length is unbounded and no other sanitization occurs on the widget side. A malicious page or extension can stuff thousands of tokens or inject prompt-injection payloads into every user message with no user awareness and no widget-side limit.

**Fix:** Apply a length cap and strip HTML on the widget side before including the attribute value:

```ts
// widget/WidgetChat.tsx
const MAX_META_LENGTH = 500;

function getPageContext(): { url: string; title: string; meta?: string } {
  const ctx: { url: string; title: string; meta?: string } = {
    url: window.location.href.slice(0, 2000),
    title: document.title.slice(0, 200),
  };

  const scriptEl = document.querySelector('script[data-page-context]');
  if (scriptEl) {
    const raw = scriptEl.getAttribute('data-page-context');
    if (raw) {
      // Strip tags, collapse whitespace, enforce length cap
      ctx.meta = raw.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().slice(0, MAX_META_LENGTH);
    }
  }

  return ctx;
}
```

The server-side `system-prompt.ts` `.replace(/[\r\n]/g, ' ')` alone is not sufficient defence — it only handles newlines.

---

## Warnings

### WR-01: Five CSS custom properties referenced but never defined — silent visual breakage

**File:** `widget/styles/widget.css:85,114,318,326,489`

**Issue:** The following CSS variables are used but not declared in `themes.css` or anywhere else in the widget stylesheet:

| Line | Variable | Where used |
|------|----------|------------|
| 85   | `--widget-primary-light` | `.widget-button:focus-visible` outline |
| 114  | `--widget-font-weight-bold` | `.widget-button__badge` font-weight |
| 318  | `--widget-warning-color` | `.message__status--sending` text color |
| 326  | `--widget-success-color` | `.message__status--delivered` text color |
| 489  | `--widget-warning-color` | `.widget-offline` background |

Browsers silently treat unresolved CSS custom properties as `unset`, so the focus ring on the widget button is invisible (accessibility regression), the badge font-weight collapses to the inherited value, and the offline/warning states render with no background color (invisible text on transparent).

**Fix:** Add the missing tokens to `themes.css` under `:root`:

```css
/* themes.css — add to :root */
--widget-primary-light: #8a9bbf;        /* lighter tint of slate-blue */
--widget-font-weight-bold: 700;
--widget-warning-color: #b07d2a;        /* amber — adjust to brand preference */
--widget-success-color: #3a7a4a;        /* muted green */
```

---

### WR-02: Chat dialog missing `aria-modal="true"` — screen readers escape the dialog

**File:** `widget/WidgetChat.tsx:133`

**Issue:** The chat container has `role="dialog"` but lacks `aria-modal="true"`. Without it, screen readers (NVDA, JAWS, VoiceOver) do not trap focus to the dialog and will continue reading the underlying page content behind the widget. This breaks the accessibility contract for dialogs and means keyboard-only users can tab out into the obscured page.

**Fix:**

```tsx
<div
  className="widget-chat"
  role="dialog"
  aria-modal="true"
  aria-label={`Chat with ${config.companyName}`}
>
```

---

### WR-03: Conversation ID captured in a `fetch` callback but used from a potentially stale state closure

**File:** `widget/WidgetChat.tsx:98-103, 109-121`

**Issue:** `setConversationId(id)` is called inside the custom `fetch` wrapper passed to `DefaultChatTransport`. The `handleFormSubmit` callback captures `conversationId` from the closure at the time `useCallback` memoizes it. The dependency array includes `conversationId`, so the callback re-creates on each ID change — but there is a race: if `setConversationId` triggers a React re-render that races with a rapid second send (e.g., user hits Enter twice quickly), the second `sendMessage` may still carry the previous (or empty) ID. More concretely, the `fetch` wrapper is constructed once at `useChat` initialization, closing over the `setConversationId` setter (stable) — that part is fine. The risk is that the `conversationId` read inside `handleFormSubmit` lags by one render when the state update from the first response and the second send overlap.

**Fix:** Use a ref to hold the latest conversation ID so reads in the submit handler are always current:

```ts
const conversationIdRef = useRef<string | undefined>();
const [conversationId, setConversationId] = useState<string | undefined>();

// In the fetch wrapper:
if (id) {
  conversationIdRef.current = id;
  setConversationId(id); // keep state for any display needs
}

// In handleFormSubmit:
const handleFormSubmit = useCallback(() => {
  if (!input.trim()) return;
  const cid = conversationIdRef.current;
  sendMessage(
    { text: input },
    { body: { ...getPageContext(), ...(cid ? { conversationId: cid } : {}) } },
  );
  setInput('');
}, [input, sendMessage]); // conversationId removed from deps — ref is always current
```

---

### WR-04: Widget script injected unconditionally on every page including `/api/*` routes

**File:** `app/layout.tsx:99`

**Issue:** `<script src="/widget.js" />` is placed in the root layout body, which means it loads on every page of the marketing site — including the `/book`, `/book/confirmed`, `/book/cancelled`, and legal pages. The booking flow uses Stripe Elements, and loading an additional chat widget script on the same page introduces unnecessary surface area and can trigger CSP violations if `widget.js` makes requests to origins not listed in `connect-src` (e.g., `/api/chat`). The widget also calls `window.location.href` and `document.title` from the DOM — on the booking confirmation page this means the AI can observe sensitive booking reference numbers in the page title or URL and include them in AI context.

Additionally, the `next.config.ts` CSP `connect-src` does not include the site's own origin for the widget's `/api/chat` calls — `'self'` is present and covers same-origin fetches, so this specific call is fine, but it is worth confirming no widget CDN or external AI proxy is ever introduced without updating the CSP.

**Fix (minimum viable):** Add a `suppressWidget` metadata convention or simply move the widget script to only the pages where it should appear (home, about, services, products). If it must live in the root layout, at minimum prevent it from loading on `/book/*`:

```tsx
// If a quick fix is needed, remove from layout.tsx and add only to the pages
// where the widget should appear. Long-term: a client component that checks
// the pathname and conditionally injects the script.
```

---

## Info

### IN-01: `messagesEndRef` created but never used for scrolling

**File:** `widget/MessageList.tsx:199, 260`

**Issue:** `messagesEndRef` is attached to a `<div>` at the bottom of the message list but `scrollToBottom()` uses `containerRef.current.scrollTop = containerRef.current.scrollHeight` directly — it never calls `messagesEndRef.current?.scrollIntoView()`. The ref and its `<div>` are dead code.

**Fix:** Remove the unused ref and its attached element, or switch the scroll implementation to use it:

```tsx
// Option A — remove entirely (the containerRef approach already works):
// Delete: const messagesEndRef = useRef<HTMLDivElement>(null);
// Delete: <div ref={messagesEndRef} className="widget-sr-only" aria-hidden="true" />

// Option B — use it for scrolling (simpler):
messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
```

---

### IN-02: `WidgetTheme.mode` accepts `'light'` and `'auto'` but the widget is declared dark-only

**File:** `widget/types/widget.ts:13`, `widget/styles/themes.css:6`

**Issue:** `WidgetTheme.mode` is typed as `'light' | 'dark' | 'auto'`, and `DEFAULT_CONFIG` sets `mode: 'dark'`. The CSS comment at the top of `themes.css` explicitly says "Dark-Only Theme (Phase 7)" and there are no light-mode or `prefers-color-scheme` overrides. Callers who pass `mode: 'light'` or `mode: 'auto'` get dark styling regardless — the type is misleading and will cause confusion when the widget is configured externally.

**Fix:** Until light/auto modes are implemented, narrow the type to prevent false expectations:

```ts
export interface WidgetTheme {
  mode: 'dark'; // light and auto reserved for future phases
  // ...
}
```

Or add a TODO comment in the type file documenting the current limitation.

---

_Reviewed: 2026-05-22_
_Reviewer: Claude (gsd-code-reviewer)_
_Depth: standard_
