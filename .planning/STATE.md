---
gsd_state_version: 1.0
milestone: v1.0
milestone_name: milestone
status: ready_to_plan
last_updated: "2026-05-20T01:25:40.159Z"
progress:
  total_phases: 4
  completed_phases: 3
  total_plans: 7
  completed_plans: 5
  percent: 75
---

# State — Okami Labs Website: Codebase Health

## Project Reference

**Core value:** No payment is lost silently — every Stripe charge that fails to produce a Cal.com booking is immediately visible and actionable.

**Milestone:** Codebase hardening (pre-Phase II chatbot)

**Total requirements:** 15 across 4 phases

---

## Current Position

Phase: 03 (ai-scaffolding-cleanup) — EXECUTING
Plan: 1 of 2
**Phase:** 4
**Plan:** Not started
**Status:** Ready to plan

```
Progress: [ ] Phase 1  [ ] Phase 2  [ ] Phase 3  [ ] Phase 4
          0 of 4 phases complete
```

---

## Phase Status

| Phase | Name | Requirements | Status | Completed |
|-------|------|--------------|--------|-----------|
| 1 | Revenue Protection | OBS-01, OBS-02, OBS-03, PAY-01 | Not started | - |
| 2 | Infrastructure & Security | INF-01, INF-02, SEC-01, SEC-02 | Not started | - |
| 3 | AI Scaffolding Cleanup | AI-01, AI-02, AI-03 | Not started | - |
| 4 | Tests & Hygiene | TEST-01, HYG-01, HYG-02, HYG-03, HYG-04 | Not started | - |

---

## Accumulated Context

### Key Decisions

- Sentry chosen over Slack webhook: DSN vars already reserved in .env.example; proper exception capture beats one-off webhooks
- Critical-path tests only: payment-failure path is highest risk surface; full widget/admin coverage deferred
- Neon-backed rate limiter for payment routes: lib/rate-limit-chat.ts already exists and works; reuse over new solution

### Constraints Active

- No new runtime dependencies beyond @sentry/nextjs and a test runner
- No auth changes beyond the minimal timing-leak fix in proxy.ts
- Widget build isolation must be preserved (widget/ compiles separately via Vite)
- No chatbot work (CHATBOT_ENABLED enablement is explicitly deferred)

### Architecture Notes

- In-memory rate limiter (lib/rate-limit.ts) is safe for non-payment routes; only /api/book and /api/payment-intent need migration to Neon-backed
- lib/ai/tools.ts is not imported anywhere in the active codebase — changes are safe with no live risk
- Two migration directories exist: db/migrations/ (Neon, runs via npm run migrate) and lib/migrations/ (Supabase, manual only)
- BOOKING_FAILED_POST_CHARGE log sites: app/api/book/route.ts line 268 and lib/booking-flow.ts line 141

### Todos

- None yet

### Blockers

- None

---

## Session Continuity

**Last updated:** 2026-05-18 — Roadmap initialized
**Next action:** Begin Phase 1 planning with `/gsd-plan-phase 1`
