# External Integrations

**Analysis Date:** 2026-05-18

## APIs & External Services

**Payment Processing:**
- Stripe — Payment intents for `/book` checkout; 3D Secure support
  - Server SDK: `stripe` ^22.0.1 (`lib/stripe.ts`)
  - Client SDK: `@stripe/react-stripe-js`, `@stripe/stripe-js`
  - Auth: `STRIPE_SECRET_KEY` (server), `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` (client)
  - API version: `2026-03-25.dahlia`
  - CSP: `js.stripe.com` and `hooks.stripe.com` whitelisted in `next.config.ts`

**Scheduling:**
- Cal.com v2 — Slot availability and confirmed booking creation
  - Client: raw `fetch` (no SDK); `lib/cal-bookings.ts`, `app/api/availability/route.ts`
  - Auth: `CAL_API_KEY` (server-side only; Bearer token in `Authorization` header)
  - API base: `https://api.cal.com/v2`
  - Availability version: `2024-09-04`; Booking creation version: `2024-08-13`
  - Error type: `CalBookingError` (`lib/cal-bookings.ts`) for structured handling

**Newsletter:**
- Beehiiv — "The Silent Brief" newsletter subscriptions
  - Client: raw `fetch` in `app/api/newsletter/route.ts`
  - Auth: `BEEHIIV_API_KEY` (Bearer), `BEEHIIV_PUBLICATION_ID`
  - API base: `https://api.beehiiv.com/v2`
  - Optional: gracefully disabled (returns 503) if env vars unset

**AI / LLM (Phase II — stubbed):**
- Anthropic Claude — Widget chatbot; NOT active in production yet
  - SDK: `@ai-sdk/anthropic` ^2.0.0 (lazy import behind `CHATBOT_ENABLED=1` gate)
  - Auth: `ANTHROPIC_API_KEY`
  - Model: configurable via `AI_MODEL` env var (default `claude-haiku-4-5`)

**Notifications (optional):**
- Slack — Lead capture and booking notifications via incoming webhooks
  - Client: raw `fetch` in `lib/notifications.ts`
  - Auth: `SLACK_WEBHOOK_URL`
  - Optional: fails silently if unset

**Monitoring (Phase 9 — provisioned, not confirmed active):**
- Sentry — Error tracking
  - Auth: `SENTRY_DSN`, `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`

## Data Storage

**Databases:**
- Neon Serverless Postgres — Widget chat data (visitors, conversations, messages, leads, bookings, services, rate limits, token reservations)
  - Runtime connection: `DATABASE_URL` (pooled, `-pooler.neon.tech` hostname)
  - Migration connection: `DATABASE_URL_UNPOOLED` (direct, no pooler)
  - Client: `@neondatabase/serverless` HTTP driver; singleton `sql` tagged template in `lib/db/client.ts`
  - Migrations: `node-pg-migrate` running SQL files in `db/migrations/`
  - Schema: 8 tables — `visitors`, `conversations`, `messages`, `leads`, `bookings`, `services`, `rate_limit_buckets` (migration 003), `token_reservations` (migration 003)

- Supabase (Postgres) — Partial booking tracking only (email/intent capture before payment completes)
  - Client: `@supabase/supabase-js` ^2.103.3; singleton in `lib/supabase.ts` (service role key, no session persistence)
  - Auth: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`
  - Optional: gracefully disabled if unset; provisioned via Vercel Marketplace or manually

**File Storage:**
- Local filesystem fallback only — newsletter endpoint notes `/tmp` storage fallback in comments if Beehiiv unset; no persistent file storage

**Caching:**
- Cal.com availability slots: Next.js `fetch` cache with `revalidate: 60` (1-minute TTL) in `app/api/availability/route.ts`
- Rate limiting: in-memory `Map` in `lib/rate-limit.ts` (per serverless instance, approximate)
- Chat rate limiting: Neon-backed persistent buckets in `lib/rate-limit-chat.ts`

## Authentication & Identity

**Visitor Identity (widget):**
- Custom HMAC-SHA256 signed cookies
  - Implementation: `lib/visitor.ts`
  - Cookie name: `visitor_id`
  - Value format: `<uuid>.<base64url(hmac_sha256)>`
  - Secret: `COOKIE_SECRET` env var (min 32 chars, required in prod)
  - TTL: 90 days; HttpOnly, SameSite=Lax; Secure in production

**Admin Auth:**
- HTTP Basic Auth with HMAC-SHA256 password hashing
  - `ADMIN_USER`, `ADMIN_PASSWORD_HASH` (hex HMAC-SHA256), `ADMIN_AUTH_PEPPER`
  - Used for `/admin` dashboard routes

**No end-user auth system** — the site is a marketing/booking site; no login/accounts for visitors.

## Analytics & Observability

**Analytics:**
- Vercel Analytics (`@vercel/analytics`) — Page views; `<Analytics />` in `app/layout.tsx`
  - CSP: `va.vercel-scripts.com` whitelisted

**Performance:**
- Vercel Speed Insights (`@vercel/speed-insights`) — Core Web Vitals; `<SpeedInsights />` in `app/layout.tsx`
  - CSP: `vitals.vercel-insights.com` whitelisted

**Error Tracking:**
- Sentry — env vars present in `.env.example` (Phase 9); not confirmed active in code

**Logs:**
- `console.warn` / `console.error` throughout — no structured logging library

## CI/CD & Deployment

**Hosting:**
- Vercel — primary deployment platform; Vercel-specific packages used (`@vercel/functions`, `@vercel/analytics`, `@vercel/speed-insights`)

**CI Pipeline:**
- Not detected (no `.github/workflows/`, no CI config files found)

## Webhooks & Callbacks

**Incoming:**
- None detected — Stripe payment flow uses client-side confirmation (no Stripe webhooks); Cal.com does not push webhooks to this app

**Outgoing:**
- `POST https://api.beehiiv.com/v2/publications/{id}/subscriptions` — newsletter subscribe
- `POST https://api.cal.com/v2/bookings` — create confirmed booking
- `GET https://api.cal.com/v2/slots` — fetch availability
- `POST https://api.stripe.com` (via SDK) — create/retrieve PaymentIntents
- `POST {SLACK_WEBHOOK_URL}` — lead/booking notifications (optional)

## Environment Configuration

**Required in production:**

| Variable | Purpose |
|----------|---------|
| `CAL_API_KEY` | Cal.com v2 API auth |
| `STRIPE_SECRET_KEY` | Stripe server SDK |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client Elements |
| `NEXT_PUBLIC_SITE_URL` | OG images, sitemap, structured data |
| `DATABASE_URL` | Neon pooled connection (widget backend) |
| `COOKIE_SECRET` | HMAC visitor cookie signing (min 32 chars) |
| `ADMIN_USER` | Admin dashboard basic auth |
| `ADMIN_PASSWORD_HASH` | Admin password hash |
| `ADMIN_AUTH_PEPPER` | Admin HMAC pepper |

**Optional (graceful degradation):**

| Variable | Purpose | Fallback |
|----------|---------|---------|
| `BEEHIIV_API_KEY` | Newsletter subscribe | 503 response |
| `BEEHIIV_PUBLICATION_ID` | Newsletter publication | 503 response |
| `SUPABASE_URL` | Partial booking tracking | Feature disabled |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase auth | Feature disabled |
| `DATABASE_URL_UNPOOLED` | Migration runner only | N/A |
| `SLACK_WEBHOOK_URL` | Lead notifications | Silent skip |
| `ANTHROPIC_API_KEY` | AI chatbot (Phase II) | Canned reply |
| `AI_MODEL` | Anthropic model selection | `claude-haiku-4-5` |
| `CHATBOT_ENABLED` | Enable live AI responses | `0` (canned reply) |
| `WIDGET_DISABLED` | Disable widget entirely | `0` (enabled) |
| `DAILY_TOKEN_BUDGET` | AI spend cap (tokens/day) | `100000` |
| `ALLOWED_ORIGINS` | Widget embed allowlist | All origins |
| `SENTRY_DSN` | Sentry error tracking | Not tracked |

**Secrets location:**
- `.env.local` for local development (gitignored)
- Vercel dashboard environment variables for production

---

*Integration audit: 2026-05-18*
