# Requirements — Okami Labs Website: Codebase Health

## Active Requirements

### Phase 1: Revenue Protection

| REQ-ID | Requirement | Status |
|--------|-------------|--------|
| OBS-01 | Install @sentry/nextjs and configure DSN | Pending |
| OBS-02 | Capture exceptions at both BOOKING_FAILED_POST_CHARGE sites (api/book, lib/booking-flow.ts) | Pending |
| OBS-03 | Forward widget errors from /api/widget-errors to Sentry | Pending |
| PAY-01 | Swap in-memory rate limiter on /api/book and /api/payment-intent to Neon-backed lib/rate-limit-chat.ts | Pending |

### Phase 2: Infrastructure & Security

| REQ-ID | Requirement | Status |
|--------|-------------|--------|
| INF-01 | Move lib/migrations/001_partial_bookings.sql to db/migrations/004_partial_bookings.sql (or add separate migrate:supabase script) | Pending |
| INF-02 | Add reconciled-row cleanup to token_reservations in lib/rate-limit-chat.ts | Pending |
| SEC-01 | Fix constant-time comparison length leak in proxy.ts (pad both sides before XOR, or use timingSafeEqual) | Pending |
| SEC-02 | Document CSP frame-ancestors override (admin is basic-auth protected — note the gap clearly) | Pending |

### Phase 3: AI Scaffolding Cleanup

| REQ-ID | Requirement | Status |
|--------|-------------|--------|
| AI-01 | Fix lib/ai/tools.ts broken imports (db path, notifications path) | Pending |
| AI-02 | Fix lib/ai/system-prompt.ts domain — change okami.com to okamilabs.com | Pending |
| AI-03 | Update db/migrations/002_seed_services.sql to match current offerings (Okami Review $299, Discovery Call free) | Pending |

### Phase 4: Tests & Hygiene

| REQ-ID | Requirement | Status |
|--------|-------------|--------|
| TEST-01 | Unit tests for lib/booking-flow.ts: reconcileBookingFromIntent happy path, BOOKING_FAILED_POST_CHARGE path, ReconcileError codes | Complete |
| HYG-01 | Update CLAUDE.md to accurately describe newsletter 503 behavior (remove /tmp fallback claim) | Complete |
| HYG-02 | Add Cache-Control: public, max-age=60, stale-while-revalidate=30 on /api/availability response | Complete |
| HYG-03 | Add LIMIT on admin conversations message sub-query in app/admin/conversations/route.ts | Complete |
| HYG-04 | Pin @ai-sdk/anthropic and ai to exact versions in package.json | Complete |

## Traceability

| REQ-ID | Requirement | Phase | Status |
|--------|-------------|-------|--------|
| OBS-01 | Install @sentry/nextjs and configure DSN | Phase 1 | Pending |
| OBS-02 | Capture exceptions at both BOOKING_FAILED_POST_CHARGE sites | Phase 1 | Pending |
| OBS-03 | Forward widget errors from /api/widget-errors to Sentry | Phase 1 | Pending |
| PAY-01 | Swap in-memory rate limiter on payment routes to Neon-backed | Phase 1 | Pending |
| INF-01 | Move partial_bookings migration to db/migrations/ | Phase 2 | Pending |
| INF-02 | Add reconciled-row cleanup to token_reservations | Phase 2 | Pending |
| SEC-01 | Fix constant-time comparison length leak in proxy.ts | Phase 2 | Pending |
| SEC-02 | Document CSP frame-ancestors override | Phase 2 | Pending |
| AI-01 | Fix lib/ai/tools.ts broken imports | Phase 3 | Pending |
| AI-02 | Fix lib/ai/system-prompt.ts domain | Phase 3 | Pending |
| AI-03 | Update db/migrations/002_seed_services.sql | Phase 3 | Pending |
| TEST-01 | Unit tests for lib/booking-flow.ts | Phase 4 | Pending |
| HYG-01 | Update CLAUDE.md newsletter 503 description | Phase 4 | Pending |
| HYG-02 | Add Cache-Control on /api/availability | Phase 4 | Pending |
| HYG-03 | Add LIMIT on admin conversations message sub-query | Phase 4 | Pending |
| HYG-04 | Pin @ai-sdk/anthropic and ai to exact versions | Phase 4 | Pending |

## Out of Scope

- Chatbot Phase II (CHATBOT_ENABLED implementation)
- Booking retry queue (Vercel Cron + pending_bookings table)
- Full test coverage for widget pipeline and admin auth
- x-forwarded-for proxy trust list
