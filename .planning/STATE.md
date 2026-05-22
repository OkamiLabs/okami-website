---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: AI Chatbot
status: ready_to_plan
last_updated: "2026-05-21T20:23:00.535Z"
last_activity: 2026-05-21 -- Phase 06 execution started
progress:
  total_phases: 3
  completed_phases: 2
  total_plans: 5
  completed_plans: 3
  percent: 67
---

# State — Okami Labs Website: AI Chatbot

## Project Reference

**Core value:** The chatbot converts visitors and convinces them Okami can build AI for them — by being an excellent AI product itself.

**Milestone:** v2.0 AI Chatbot

**Total requirements:** TBD — defined during roadmap

---

## Current Position

Phase: 7
Plan: Not started
Status: Ready to plan
Last activity: 2026-05-22

---

## Phase Status

TBD — roadmap not yet created

---

## Accumulated Context

### Key Decisions

- Sentry chosen over Slack webhook: DSN vars already reserved in .env.example; proper exception capture beats one-off webhooks
- Critical-path tests only (v1.0): payment-failure path is highest risk surface; full widget/admin coverage deferred
- Neon-backed rate limiter for payment routes: lib/rate-limit-chat.ts already exists and works; reuse over new solution
- Payment Link (not inline Stripe Elements) for chat booking: simpler; avoids PCI scope in widget

### Constraints Active

- Widget build isolation must be preserved (widget/ compiles separately via Vite)
- No auth changes (proxy.ts is settled)
- AI model: Claude via Anthropic SDK (already scaffolded)

### Architecture Notes

- CHATBOT_ENABLED flag lives in app/api/chat/route.ts — currently returns canned reply when disabled
- AI scaffolding: lib/ai/tools.ts and lib/ai/system-prompt.ts are in place (fixed Phase 03)
- Widget UI: widget/ directory with WidgetChat.tsx, MessageList.tsx, MessageInput.tsx etc.
- Existing Cal.com API at /api/availability (Cal.com v2 slots)
- Stripe Payment Link creation: needs new API route or tool
- Two migration directories: db/migrations/ (Neon, active) and lib/migrations/ (Supabase, manual)

### Todos

- None

### Blockers

- None

---

## Deferred Items

Items carried forward from v1.0:

| Category | Item | Status |
|----------|------|--------|
| verification_gap | Phase 01: Sentry live-env delivery tests (BOOKING_FAILED_POST_CHARGE, widget errors, cross-instance rate limit) | Deferred — requires SENTRY_DSN in Vercel |

---

## Session Continuity

**Last updated:** 2026-05-20 — Milestone v2.0 started
**Next action:** `/gsd-plan-phase 5` after roadmap is created
