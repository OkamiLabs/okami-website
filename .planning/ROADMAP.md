# Roadmap — Okami Labs Website: Codebase Health

## Overview

4 phases | 15 requirements | Harden the live site so no payment is lost silently and the codebase is Phase II-ready.

## Phases

- [ ] **Phase 1: Revenue Protection** - Sentry installed, BOOKING_FAILED_POST_CHARGE alerted, payment rate limits are instance-safe
- [ ] **Phase 2: Infrastructure & Security** - Migration path corrected, token table cleaned, timing leak fixed, CSP gap documented
- [ ] **Phase 3: AI Scaffolding Cleanup** - Dead imports fixed, domain corrected, seed data matches live offerings
- [ ] **Phase 4: Tests & Hygiene** - Booking-flow unit tests written, cache headers set, admin query bounded, packages pinned, CLAUDE.md accurate

## Phase Details

### Phase 1: Revenue Protection
**Goal:** Every Stripe charge that fails to produce a Cal.com booking fires a Sentry exception, and payment route rate limits are enforced across all Vercel instances.
**Depends on:** Nothing
**Requirements:** OBS-01, OBS-02, OBS-03, PAY-01
**Success criteria:**
1. A simulated BOOKING_FAILED_POST_CHARGE event (e.g. Cal.com returning 500 in a test) produces a Sentry issue visible in the Sentry dashboard — not just a Vercel log line.
2. Client-side widget errors POSTed to /api/widget-errors are forwarded to Sentry and appear as issues, not only in console.error output.
3. Rapid repeated POST requests to /api/book or /api/payment-intent from the same IP hit the rate limit consistently even when two serverless instances handle the requests (Neon-backed enforcement, not per-instance Map).
**Plans:** 3 plans

Plans:
- [x] 01-01-PLAN.md — Install @sentry/nextjs and configure server/client Sentry init + wrap next.config.ts
- [x] 01-02-PLAN.md — Add Sentry.captureException at BOOKING_FAILED_POST_CHARGE sites (api/book, lib/booking-flow) and forward widget errors
- [x] 01-03-PLAN.md — Swap in-memory rate limiter on /api/book and /api/payment-intent to Neon-backed checkChatRateLimit
**UI hint**: no

### Phase 2: Infrastructure & Security
**Goal:** The partial_bookings migration runs with the standard migrate script, reconciled token rows are cleaned up, the admin timing side-channel is patched, and the CSP frame-ancestors gap is clearly documented.
**Depends on:** Phase 1
**Requirements:** INF-01, INF-02, SEC-01, SEC-02
**Success criteria:**
1. Running `npm run migrate` on a fresh database applies the partial_bookings table and upsert_partial_booking function without any manual SQL step.
2. The token_reservations table does not grow unboundedly: reconciled rows older than 7 days are deleted during the opportunistic cleanup pass.
3. The constant-time comparison in proxy.ts pads both inputs to equal length (or uses timingSafeEqual) before comparing — length alone reveals nothing.
4. A code comment adjacent to the CSP frame-ancestors configuration in next.config.ts explains the admin route gap and the basic-auth mitigation, so the next developer does not accidentally "fix" it without understanding the tradeoff.
**Plans:** 2 plans

Plans:
- [x] 02-01-PLAN.md — Move partial_bookings migration to db/migrations/004 and switch /api/partial-booking route to Neon sql tagged template (INF-01)
- [x] 02-02-PLAN.md — Add reconciled-row cleanup to opportunisticCleanup, replace proxy.ts username compare with timingSafeEqual, and document CSP frame-ancestors admin override (INF-02 + SEC-01 + SEC-02)
**UI hint**: no

### Phase 3: AI Scaffolding Cleanup
**Goal:** lib/ai/tools.ts and lib/ai/system-prompt.ts are import-correct and domain-accurate, and the services seed data matches the live offerings, so Phase II can be enabled without fixing broken plumbing on day one.
**Depends on:** Phase 2
**Requirements:** AI-01, AI-02, AI-03
**Success criteria:**
1. Importing lib/ai/tools.ts in a Node REPL (or a test) does not throw module-not-found — all import paths resolve against the actual codebase.
2. The system prompt returned by lib/ai/system-prompt.ts contains "okamilabs.com" and does not contain "okami.com".
3. Running the services seed migration inserts exactly two rows: Okami Review at $299 and Discovery Call at $0 — no stale entries (AI Strategy, Custom AI Development, WhatsApp Automation) remain.
**Plans:** 2 plans

Plans:
- [x] 03-01-PLAN.md — Fix lib/ai/tools.ts broken imports and rewrite all db.query() calls to Neon sql tagged template (AI-01)
- [x] 03-02-PLAN.md — Replace okami.com with okamilabs.com in system-prompt.ts and rewrite 002_seed_services.sql for the two live offerings (AI-02 + AI-03)
**UI hint**: no

### Phase 4: Tests & Hygiene
**Goal:** The booking-flow critical path has automated tests, the availability endpoint is browser-cacheable, the admin query is bounded, AI SDK packages are pinned, and CLAUDE.md accurately describes the newsletter fallback behavior.
**Depends on:** Phase 3
**Requirements:** TEST-01, HYG-01, HYG-02, HYG-03, HYG-04
**Success criteria:**
1. `npm test` (or equivalent) runs and passes unit tests covering: reconcileBookingFromIntent happy path, BOOKING_FAILED_POST_CHARGE path, and all ReconcileError codes — with no real Stripe or Cal.com network calls.
2. A browser dev-tools network trace of the booking flow shows /api/availability responses carrying `Cache-Control: public, max-age=60, stale-while-revalidate=30` — a second request within 60 seconds is served from cache.
3. The admin conversations query includes a LIMIT clause on the messages sub-query; loading the admin page with a large conversation history does not fetch unbounded rows.
4. package.json pins @ai-sdk/anthropic and ai to exact versions (no ^ or ~ prefix), and CLAUDE.md describes the newsletter 503 behavior without mentioning a /tmp fallback.
**Plans:** TBD
**UI hint**: no

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Revenue Protection | 0/3 | Not started | - |
| 2. Infrastructure & Security | 0/2 | Not started | - |
| 3. AI Scaffolding Cleanup | 0/? | Not started | - |
| 4. Tests & Hygiene | 0/? | Not started | - |

## Requirement Traceability

| REQ-ID | Requirement | Phase |
|--------|-------------|-------|
| OBS-01 | Install @sentry/nextjs and configure DSN | 1 |
| OBS-02 | Capture exceptions at both BOOKING_FAILED_POST_CHARGE sites (api/book, lib/booking-flow.ts) | 1 |
| OBS-03 | Forward widget errors from /api/widget-errors to Sentry | 1 |
| PAY-01 | Swap in-memory rate limiter on /api/book and /api/payment-intent to Neon-backed lib/rate-limit-chat.ts | 1 |
| INF-01 | Move lib/migrations/001_partial_bookings.sql to db/migrations/004_partial_bookings.sql (or add separate migrate:supabase script) | 2 |
| INF-02 | Add reconciled-row cleanup to token_reservations in lib/rate-limit-chat.ts | 2 |
| SEC-01 | Fix constant-time comparison length leak in proxy.ts (pad both sides before XOR, or use timingSafeEqual) | 2 |
| SEC-02 | Document CSP frame-ancestors override (admin is basic-auth protected — note the gap clearly) | 2 |
| AI-01 | Fix lib/ai/tools.ts broken imports (db path, notifications path) | 3 |
| AI-02 | Fix lib/ai/system-prompt.ts domain — change okami.com to okamilabs.com | 3 |
| AI-03 | Update db/migrations/002_seed_services.sql to match current offerings (Okami Review $299, Discovery Call free) | 3 |
| TEST-01 | Unit tests for lib/booking-flow.ts: reconcileBookingFromIntent happy path, BOOKING_FAILED_POST_CHARGE path, ReconcileError codes | 4 |
| HYG-01 | Update CLAUDE.md to accurately describe newsletter 503 behavior (remove /tmp fallback claim) | 4 |
| HYG-02 | Add Cache-Control: public, max-age=60, stale-while-revalidate=30 on /api/availability response | 4 |
| HYG-03 | Add LIMIT on admin conversations message sub-query in app/admin/conversations/route.ts | 4 |
| HYG-04 | Pin @ai-sdk/anthropic and ai to exact versions in package.json | 4 |
