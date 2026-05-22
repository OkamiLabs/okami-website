# Plan 07-03 Summary: UAT Script, Test Pass, Production Launch

## Status
complete

## What Was Built

**Task 1 — 07-UAT.md authored (15 scenarios)**
Structured QA script created with 8 scenarios carried verbatim from Phase 6 UAT plus 7 new scenarios: English booking journey (3-turn multi-step, ROADMAP SC-1), Portuguese/Spanish opener, adversarial jailbreak, multi-turn context retention, rate-limit error display, spend-cap error display, generic/network error display.

**Task 2 — Manual test pass on uat/chatbot preview (CHATBOT_ENABLED=1)**
All 15 scenarios tested. Results: 14 pass, 1 skip (scenario 14 spend cap — untriggerable on preview, code path verified via Plan 02 review). Zero functional failures.

Six bugs found and fixed during the UAT pass:
- Widget button not viewport-fixed: `all: initial` clobbered `position: fixed` — moved `all: initial` to top of rule
- Widget disappeared on send: `React.Fragment` used without importing React — replaced with `<>` shorthand
- Links in chat not clickable: added `renderTextWithLinks()` URL parser in MessageList.tsx
- Text not selectable in chat: added `user-select: text` on `.message__text` to override widget-wide `user-select: none`
- Auto-scroll broken: replaced `scrollIntoView` with `containerRef.scrollTop = scrollHeight`
- Language not matched on off-topic redirects: removed hardcoded English phrases from system-prompt.ts BEHAVIOR section; rewrote as intent instructions with explicit language-match rule
- CSP blocking Vercel preview toolbar: added `worker-src blob:` and preview-conditional `https://vercel.live` allowlists in next.config.ts

**Task 3 — Production flip**
- `uat/chatbot` merged to `main`
- `git push origin main` completed
- `CHATBOT_ENABLED=1` set in Vercel production environment via CLI
- Production deployment triggered and completed: `dpl_BaLzXvJvQJ7eztz4gzbtALZrABfv`
- Aliased live at: https://www.okamilabs.com

## Key Files

- `.planning/phases/07-qa-launch-prep/07-UAT.md` — completed UAT script (status: complete)
- `widget/MessageList.tsx` — renderTextWithLinks, text selection fix, auto-scroll fix
- `widget/styles/widget.css` — all:initial positioning fix
- `lib/ai/system-prompt.ts` — language-match rule, removed hardcoded English redirect phrases
- `next.config.ts` — worker-src blob:, Vercel preview toolbar CSP allowlist
- `app/layout.tsx` — widget.js injection

## Self-Check: PASSED

- 07-UAT.md exists with 15 scenarios ✓
- All functional scenarios (1–12 + 15) pass ✓
- English booking journey (scenario 9, ROADMAP SC-1) passes ✓
- CHATBOT_ENABLED=1 live in production ✓
- Production deployment completed and aliased to okamilabs.com ✓
