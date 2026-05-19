# Codebase Concerns

**Analysis Date:** 2026-05-18

## Tech Debt

**Chatbot is a stub — real AI never fires:**
- Issue: `CHATBOT_ENABLED` is hardcoded `0` in `.env.example`. The `/api/chat` route always returns a canned reply (`"Hi — the chatbot is in beta."`). The AI SDK (`@ai-sdk/anthropic`, `ai`) is bundled as a production dependency but never imported at runtime. The chat route explicitly documents Phase II as future work.
- Files: `app/api/chat/route.ts`, `lib/ai/tools.ts`, `lib/ai/system-prompt.ts`
- Impact: The widget renders but delivers zero AI value. Users see a canned message on every chat message. All the rate-limiting, spend-cap, and DB infrastructure runs per request with zero LLM output.
- Fix approach: Implement Phase II — add `CHATBOT_ENABLED === '1'` branch inside the POST handler, lazy-import `@ai-sdk/anthropic` via `await import(...)`, wire `streamText().toUIMessageStreamResponse`, and set actual token reservations/reconciliation.

**`lib/ai/tools.ts` has broken import paths and uses a stale DB client:**
- Issue: `lib/ai/tools.ts` imports `db from '../db/client.js'` (a pg-pool client that does not exist at that path) and `{ sendSlackNotification } from '../lib/notifications.js'` (wrong relative path — `notifications.ts` is at `lib/notifications.ts`, not `lib/lib/notifications.ts`). This file is not imported anywhere in the active codebase and would throw at runtime if it were.
- Files: `lib/ai/tools.ts`
- Impact: When Phase II lands and tools are wired in, this file will throw module-not-found errors immediately. The tool definitions also assume a `bookings` table with `requested_date`/`requested_time` columns and a `services` table — both exist in the schema but are not used by the active booking flow (which goes through Cal.com, not DB rows).
- Fix approach: Rewrite imports to use `@/lib/db/client` (the Neon `sql` tagged template, not a pg-pool client), fix the notifications path to `@/lib/notifications`, and align tool SQL to actual Neon column conventions.

**In-memory rate limiter is used for payment-critical routes:**
- Issue: `lib/rate-limit.ts` uses a module-level `Map` for rate limiting. Vercel spins up multiple serverless instances per region, and each instance has its own map, so the effective limit is `max * N_instances` per window.
- Files: `lib/rate-limit.ts`, `app/api/book/route.ts` (line 134), `app/api/payment-intent/route.ts` (line 111)
- Impact: The 10-requests-per-minute limit on `/api/book` and `/api/payment-intent` offers only advisory protection — a determined attacker with moderate traffic can exceed it. The widget's `/api/chat` correctly uses the Neon-backed `lib/rate-limit-chat.ts`, but payment routes do not.
- Fix approach: Migrate `/api/book` and `/api/payment-intent` to use `lib/rate-limit-chat.ts` (the Neon-backed, cross-instance-safe limiter) or add an `x-ratelimit-*` header approach via Vercel Edge Config.

**CLAUDE.md documents a `/tmp` newsletter fallback that no longer exists:**
- Issue: `CLAUDE.md` states "Beehiiv for newsletter (optional, falls back to `/tmp` storage)". The actual `app/api/newsletter/route.ts` returns HTTP 503 when Beehiiv keys are absent — no `/tmp` write occurs. This is misleading documentation.
- Files: `CLAUDE.md` (line 15), `app/api/newsletter/route.ts` (line 73)
- Impact: Low — no operational impact. Developer confusion about what happens when `BEEHIIV_API_KEY` is unset.
- Fix approach: Update `CLAUDE.md` to accurately describe the 503 fallback.

**`partial_bookings` migration lives outside the migration runner's path:**
- Issue: `lib/migrations/001_partial_bookings.sql` is in `lib/migrations/`, but `npm run migrate` targets `db/migrations/`. The migration runner will never pick it up automatically.
- Files: `lib/migrations/001_partial_bookings.sql`, `package.json` (line 11)
- Impact: If this migration was not applied manually to the Supabase database, the `upsert_partial_booking` RPC call in `app/api/partial-booking/route.ts` will silently fail (error is caught and logged, not surfaced).
- Fix approach: Either move the file to `db/migrations/` (renumbering as `004_partial_bookings.sql`) or add a separate `migrate:supabase` script.

**`lib/ai/system-prompt.ts` references `okami.com` instead of `okamilabs.com`:**
- Issue: The system prompt hardcodes `"You are Okami's website assistant on okami.com."` (line 8). The actual domain is `okamilabs.com`.
- Files: `lib/ai/system-prompt.ts` (line 8)
- Impact: When Phase II enables the chatbot, the AI will tell users the wrong domain.
- Fix approach: Change to `okamilabs.com` and consider reading `NEXT_PUBLIC_SITE_URL` env var dynamically.

## Known Bugs

**`services` seed data is stale and inconsistent with actual offerings:**
- Symptoms: `db/migrations/002_seed_services.sql` seeds four services (AI Strategy Consultation $500, Custom AI Development from $5k, WhatsApp Automation $2k/mo, Discovery Call free). The live site offers "Okami Review" ($299) and "Discovery Call" (free). The seed data has no Okami Review entry.
- Files: `db/migrations/002_seed_services.sql`, `app/api/book/route.ts`
- Trigger: Fires if the `lookupService` tool in `lib/ai/tools.ts` is ever called — it queries the `services` table and will return outdated pricing.
- Workaround: The tool is not yet called (chatbot is disabled).

**CSP `frame-ancestors 'self'` in `next.config.ts` overrides the stricter `frame-ancestors 'none'` set in `/admin/conversations`:**
- Symptoms: The admin dashboard route sets `frame-ancestors 'none'` in its response headers, but Next.js 16 route-handler headers are overridden by the site-wide CSP header set in `next.config.ts` (which uses `frame-ancestors 'self'`). This is documented in a TODO comment but not fixed.
- Files: `app/admin/conversations/route.ts` (lines 43–49), `next.config.ts` (line 38)
- Trigger: Any attempt to iframe `/admin/conversations` from the same origin would succeed, against intent.
- Workaround: Admin route is basic-auth protected. Risk is limited but the intended security posture is not enforced.

## Security Considerations

**`BOOKING_FAILED_POST_CHARGE` failures go to `console.error` only — no alerting:**
- Risk: When a Stripe payment succeeds but the Cal.com booking creation fails, the error is logged with `[BOOKING_FAILED_POST_CHARGE]` to `console.error`. There is no Sentry integration (Sentry DSN vars exist in `.env.example` but the SDK is not installed or imported). Operators must manually scrape Vercel logs to detect payment-without-booking incidents.
- Files: `app/api/book/route.ts` (line 268), `lib/booking-flow.ts` (line 141), `.env.example` (Sentry vars)
- Current mitigation: The user receives a reference number and a message saying "we've been notified." The notification is not real.
- Recommendations: Install `@sentry/nextjs` and add `Sentry.captureException` at both `[BOOKING_FAILED_POST_CHARGE]` sites. At minimum, wire `SLACK_WEBHOOK_URL` to fire on booking failures.

**Widget error reports are logged to console, never forwarded to Sentry:**
- Risk: Client-side widget errors (caught and POSTed to `/api/widget-errors`) are logged via `console.error` only. The route's docstring explicitly marks Sentry forwarding as "Phase 9."
- Files: `app/api/widget-errors/route.ts` (line 8–9, line 75)
- Current mitigation: Rate-limited to 30/10 min per visitor/IP.
- Recommendations: Install Sentry and add forwarding when Phase II chatbot ships.

**`x-forwarded-for` IP extraction is not validated against a trusted proxy list:**
- Risk: `lib/rate-limit.ts` (`getClientIp`) reads the first value of `x-forwarded-for` without validating that it came from a trusted proxy. On Vercel this is generally safe (Vercel sets the header), but the in-memory rate limiter would be trivially bypassed by spoofing the header in local/preview deployments.
- Files: `lib/rate-limit.ts` (line 47–52)
- Current mitigation: Production is on Vercel where the header is trustworthy.

**`ADMIN_USER` constant-time comparison leaks length:**
- Risk: `proxy.ts` (line 66–70) compares the submitted username length to `expectedUser.length` before the constant-time XOR loop. A length mismatch is an early return, leaking the length of `ADMIN_USER` via timing.
- Files: `proxy.ts` (lines 66–72)
- Current mitigation: Usernames are short and this is a timing side-channel of very low exploitability in HTTP context.
- Recommendations: Pad both sides to a fixed length before comparing, or use `timingSafeEqual` with fixed-width buffers.

## Performance Bottlenecks

**Admin dashboard loads all messages for all conversations on every page load:**
- Problem: `app/admin/conversations/route.ts` (line 212–220) fetches ALL messages for every conversation on the current page (up to 50 conversations × unlimited messages). There is no `LIMIT` on the messages sub-query for any individual conversation.
- Files: `app/admin/conversations/route.ts` (line 212)
- Cause: A single `SELECT ... WHERE conversation_id = ANY(...)` pulls unbounded rows per conversation, then groups in application code.
- Improvement path: Add `LIMIT 20` per conversation in the query or use a lateral join with `LIMIT`.

**Cal.com availability has a 60-second server-side cache but no client-side cache:**
- Problem: `app/api/availability/route.ts` uses `next: { revalidate: 60 }` on the Cal.com fetch, but clients that re-open the booking flow or change service types will fire multiple requests within 60 seconds, each hitting the cached edge response but still counting as edge invocations.
- Files: `app/api/availability/route.ts` (line 73)
- Cause: No `Cache-Control` header is set on the `/api/availability` response to allow browser or CDN caching.
- Improvement path: Add `Cache-Control: public, max-age=60, stale-while-revalidate=30` on the API response.

## Fragile Areas

**Booking flow has a payment-without-booking gap with no automated recovery:**
- Files: `app/api/book/route.ts` (lines 261–290), `lib/booking-flow.ts`, `app/book/confirmed/page.tsx`
- Why fragile: If Stripe captures payment but Cal.com is down or returns an error, the user lands on a "payment confirmed, booking failed" state. Recovery depends on:
  1. Operator manually reading Vercel logs for `[BOOKING_FAILED_POST_CHARGE]` events
  2. Operator manually creating the Cal.com booking
  3. No retry mechanism exists
- Safe modification: Add a retry queue (e.g., Vercel Cron + a `pending_bookings` table) before enabling high booking volume.
- Test coverage: Zero automated tests exist for any booking path.

**Two separate migration directories with no unified runner:**
- Files: `db/migrations/` (Neon, 3 files), `lib/migrations/` (Supabase, 1 file), `package.json`
- Why fragile: `npm run migrate` only runs `db/migrations/`. The `lib/migrations/001_partial_bookings.sql` Supabase migration has no automated runner. If environments are rebuilt, `partial_bookings` table and `upsert_partial_booking` function may be missing silently.
- Safe modification: Document the manual Supabase migration step in `README` or consolidate into a single runner.

**`lib/ai/tools.ts` is a dead file that will break on first import:**
- Files: `lib/ai/tools.ts`
- Why fragile: Two broken imports (`'../db/client.js'` — wrong driver, wrong path; `'../lib/notifications.js'` — path traversal error). Not imported anywhere currently, so no build error. When Phase II wires it in, it will fail at module resolution.
- Safe modification: Do not import this file until both imports are fixed and tested against the Neon SQL client.

## Scaling Limits

**Neon connection pooler (`DATABASE_URL`) shared across all widget API routes:**
- Current capacity: Neon free tier allows ~10 concurrent connections through the pooler.
- Limit: Under load, `lib/rate-limit-chat.ts` fires 1 DB write per request, `lib/spend-cap.ts` fires 2 reads per request, and `lib/visitor.ts` fires 2–4 reads/writes per new visitor. At ~100 concurrent chat requests this saturates the pool.
- Scaling path: Upgrade Neon plan or reduce DB round-trips per request by batching the rate-limit check and spend-cap check into a single SQL function call.

**Token reservations table grows unboundedly:**
- Current capacity: `token_reservations` rows are cleaned up opportunistically (~10% of requests, only for rows older than 5 minutes and unreconciled). There is no cleanup of reconciled rows.
- Limit: With Phase II LLM traffic, the table will accumulate one reconciled row per assistant response forever.
- Scaling path: Add `WHERE reconciled = TRUE AND reserved_at < NOW() - INTERVAL '7 days'` to the opportunistic cleanup in `lib/rate-limit-chat.ts`.

## Dependencies at Risk

**`@ai-sdk/anthropic` v2 and `ai` v5 are very recent major versions:**
- Risk: `@ai-sdk/anthropic@^2.0.0` and `ai@^5.0.0` are newly released (late 2025/early 2026) and their APIs are not yet stable in practice. The Phase II implementation plan hardcodes `streamText().toUIMessageStreamResponse` but the actual API surface may differ from training data.
- Impact: Phase II implementation may require consulting the latest AI SDK docs rather than relying on existing patterns.
- Migration plan: Pin to exact versions (`2.x.x` / `5.x.x`) when Phase II ships and add a lock-file check to CI.

**Two Stripe SDK packages installed:**
- Risk: Both `@stripe/stripe-js` (client) and `stripe` (server) are present. `@stripe/react-stripe-js` depends on `@stripe/stripe-js`. These versions must stay in sync; a mismatch can cause type errors or payment element failures.
- Files: `package.json`, `lib/stripe.ts`, `components/book/PaymentStep.tsx`
- Impact: Currently at stripe@22 / @stripe/stripe-js@9 — compatible. Risk increases on major version bumps.

## Missing Critical Features

**No automated tests of any kind:**
- Problem: Zero `.test.ts`, `.spec.ts`, or `.test.tsx` files exist in the repository.
- Blocks: Confident refactoring of the booking flow, safe Phase II AI integration, regression detection on payment logic.

**No error tracking (Sentry) despite env vars being reserved:**
- Problem: `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, and `SENTRY_AUTH_TOKEN` are in `.env.example` but `@sentry/nextjs` is not in `package.json` and is never imported.
- Blocks: Visibility into production booking failures, widget errors, and runtime exceptions.

**Newsletter subscriber emails are silently discarded when Beehiiv is unconfigured:**
- Problem: Without `BEEHIIV_API_KEY`/`BEEHIIV_PUBLICATION_ID`, the newsletter API returns 503 and discards the email. There is no fallback capture (the CLAUDE.md claim of `/tmp` storage is inaccurate — that code does not exist).
- Files: `app/api/newsletter/route.ts` (lines 71–78)
- Blocks: Lead capture during staging/preview deployments where Beehiiv keys are not set.

## Test Coverage Gaps

**Booking flow (payment → Cal.com) — zero coverage:**
- What's not tested: PaymentIntent creation, 3DS recovery, `reconcileBookingFromIntent`, idempotency on re-entry, `[BOOKING_FAILED_POST_CHARGE]` path.
- Files: `app/api/book/route.ts`, `app/api/payment-intent/route.ts`, `lib/booking-flow.ts`, `app/book/confirmed/page.tsx`
- Risk: Silent regressions on payment logic go undetected. Stripe and Cal.com API changes break the flow without warning.
- Priority: High

**Widget chat pipeline — zero coverage:**
- What's not tested: Visitor provisioning, HMAC cookie verification, rate-limit enforcement, spend cap, Phase II streaming path.
- Files: `lib/visitor.ts`, `lib/rate-limit-chat.ts`, `lib/spend-cap.ts`, `app/api/chat/route.ts`
- Risk: Phase II AI integration ships without a safety net.
- Priority: High

**Admin auth (`proxy.ts`) — zero coverage:**
- What's not tested: Basic auth HMAC verification, constant-time compare, EU geo-block, origin allowlist.
- Files: `proxy.ts`
- Risk: Auth bypass regressions are invisible.
- Priority: Medium

---

*Concerns audit: 2026-05-18*
