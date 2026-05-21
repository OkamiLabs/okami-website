# Okami Labs Website — Codebase Health

## What This Is

A codebase hardening milestone for the live okamilabs.com site. The site already works — booking flow, chat widget, and payment processing are all shipping. This project addresses known concerns from the codebase audit: broken AI scaffolding, unprotected payment failure paths, missing observability, infrastructure rough edges, and zero test coverage on the payment flow.

## Core Value

No payment is lost silently — every Stripe charge that fails to produce a Cal.com booking is immediately visible and actionable.

## Requirements

### Validated

- ✓ Marketing pages (home, about, services, products) — live
- ✓ Multi-step booking flow: slot picker → intake → Stripe payment → Cal.com booking — live
- ✓ 3DS recovery path via reconcileBookingFromIntent — live
- ✓ Discovery Call (free booking, no payment) — live
- ✓ Chat widget (IIFE, canned reply, rate-limited) — live
- ✓ Neon-backed rate limiting for chat routes — live
- ✓ HMAC visitor identity cookie — live
- ✓ Spend cap enforcement — live
- ✓ Security headers (CSP, HSTS, X-Frame-Options) — live

### Active

**AI Scaffolding (Section 1 — pre-chatbot)**
- ✓ Fix lib/ai/tools.ts broken imports and db.query → sql tagged template — Validated in Phase 03: ai-scaffolding-cleanup
- ✓ Fix lib/ai/system-prompt.ts domain — okami.com → okamilabs.com — Validated in Phase 03: ai-scaffolding-cleanup
- ✓ Update db/migrations/002_seed_services.sql — Okami Review $299, Discovery Call Free — Validated in Phase 03: ai-scaffolding-cleanup

**Observability**
- ✓ Install @sentry/nextjs and configure DSN — Validated in Phase 01: revenue-protection
- ✓ Capture exceptions at both BOOKING_FAILED_POST_CHARGE sites (api/book, lib/booking-flow.ts) — Validated in Phase 01: revenue-protection
- ✓ Forward widget errors from /api/widget-errors to Sentry — Validated in Phase 01: revenue-protection

**Payment Route Hardening**
- ✓ Swap in-memory rate limiter on /api/book and /api/payment-intent to Neon-backed lib/rate-limit-chat.ts — Validated in Phase 01: revenue-protection

**Database & Infrastructure**
- ✓ Move lib/migrations/001_partial_bookings.sql to db/migrations/004_partial_bookings.sql — Validated in Phase 02: infrastructure-security
- ✓ Add reconciled-row cleanup to token_reservations in lib/rate-limit-chat.ts — Validated in Phase 02: infrastructure-security

**Security**
- ✓ Fix constant-time comparison length leak in proxy.ts (timingSafeEqual over padded buffers) — Validated in Phase 02: infrastructure-security
- ✓ Document CSP frame-ancestors override (admin is basic-auth protected — note the gap clearly) — Validated in Phase 02: infrastructure-security

**Code Hygiene**
- ✓ Update CLAUDE.md to accurately describe newsletter 503 behavior (remove /tmp fallback claim) — Validated in Phase 04: tests-hygiene
- ✓ Add Cache-Control: public, max-age=60, stale-while-revalidate=30 on /api/availability response — Validated in Phase 04: tests-hygiene
- ✓ Add LIMIT on admin conversations message sub-query in app/admin/conversations/route.ts — Validated in Phase 04: tests-hygiene
- ✓ Pin @ai-sdk/anthropic and ai to exact versions in package.json — Validated in Phase 04: tests-hygiene

**Tests — Critical Path**
- ✓ Unit tests for lib/booking-flow.ts: reconcileBookingFromIntent happy path, BOOKING_FAILED_POST_CHARGE path, ReconcileError codes — Validated in Phase 04: tests-hygiene

### Out of Scope

- Chatbot Phase II (CHATBOT_ENABLED implementation) — separate project
- Booking retry queue (Vercel Cron + pending_bookings table) — significant infrastructure, deferred
- Full test coverage for widget pipeline and admin auth — deferred; critical path tests are the priority
- x-forwarded-for proxy trust list — Vercel sets this correctly in production, mitigation is adequate

## Context

The codebase audit (2026-05-18) produced CONCERNS.md with 8 sections ordered by impact on the Phase II chatbot. This project works through concerns 1–3 and 5–8 (everything before the chatbot stub item). The chatbot concern (#4 in Section 1) is a separate project.

The booking flow is live and processing real payments. The BOOKING_FAILED_POST_CHARGE path (Stripe charged, Cal.com failed) currently sends no alert — it only logs to console.error. Sentry is the top priority because it protects revenue that's already flowing.

## Constraints

- **Stack**: Next.js App Router on Vercel — no new runtime dependencies beyond @sentry/nextjs and a test runner
- **No auth changes**: Admin auth (proxy.ts) changes must be minimal — only fix the timing leak, don't restructure
- **Preserve widget build isolation**: widget/ compiles separately via Vite; don't add imports between widget/ and app/
- **No chatbot work**: Any AI SDK enablement is explicitly deferred

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Install Sentry (not just Slack webhook) | Proper exception capture beats one-off webhooks; Sentry DSN vars were already reserved in .env.example | Validated Phase 01 |
| Critical-path tests only | Full booking + widget coverage is significant work; the payment-failure path is the highest risk surface | Validated Phase 04 — 6 unit tests covering all reconcile paths |
| Neon-backed rate limiter for payment routes | lib/rate-limit-chat.ts already exists and works; reuse over introducing a new solution | Validated Phase 01 |

---
*Last updated: 2026-05-21 — Milestone v1.0 complete — all 4 phases executed and verified*

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state
