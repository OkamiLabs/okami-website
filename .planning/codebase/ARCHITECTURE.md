<!-- refreshed: 2026-05-18 -->
# Architecture

**Analysis Date:** 2026-05-18

## System Overview

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                        Next.js App Router (Vercel)                          │
├──────────────┬──────────────┬──────────────┬───────────────┬────────────────┤
│  Page Routes │  API Routes  │  Admin Route │  Widget Build │  Sitemap/Meta  │
│  `app/*/     │  `app/api/`  │  `app/admin` │  `widget/`    │  `app/sitemap` │
│  page.tsx`   │  route.ts`   │              │  → public/    │  .ts`          │
└──────┬───────┴──────┬───────┴──────────────┴───────────────┴────────────────┘
       │              │
       ▼              ▼
┌──────────────┬──────────────────────────────────────────────────────────────┐
│  Components  │                      Lib Layer                               │
│  `components/│  `lib/stripe.ts`  `lib/cal-bookings.ts`  `lib/booking-flow`  │
│  *.tsx`      │  `lib/rate-limit.ts`  `lib/visitor.ts`  `lib/spend-cap.ts`   │
│  `components/│  `lib/rate-limit-chat.ts`  `lib/supabase.ts`                 │
│  book/*.tsx` │  `lib/db/client.ts`  `lib/notifications.ts`                  │
└──────────────┴────────┬─────────────────────────────────────────────────────┘
                        │
                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           External Services                                 │
│  Stripe API  │  Cal.com v2 API  │  Beehiiv API  │  Neon (Postgres)  │  Supabase │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| Root Layout | Fonts, Navigation, Footer, OG metadata, schema.org | `app/layout.tsx` |
| Page Routes | RSC page components, metadata exports | `app/*/page.tsx` |
| API Routes | HTTP handlers for external integrations | `app/api/*/route.ts` |
| Shared Components | Reusable UI, barrel-exported | `components/index.ts` |
| Book Components | Multi-step booking flow (client-only) | `components/book/` |
| Lib Layer | Server-side singletons, shared logic, helpers | `lib/` |
| Widget | Standalone IIFE chat widget (separate Vite build) | `widget/` |
| DB Migrations | SQL schema for Neon Postgres (widget backend) | `db/migrations/` |

## Pattern Overview

**Overall:** Next.js App Router with a server-first data model. Most pages are React Server Components (RSC). Client components are isolated to interactive UI (navigation, hero animation, booking flow, widget).

**Key Characteristics:**
- App Router file-based routing — each `page.tsx` is a RSC by default
- `'use client'` directive only where interactivity is needed (Navigation, HeroSection, BookFlow and its sub-components)
- API routes are Edge-compatible Next.js Route Handlers (`NextRequest/NextResponse`)
- `lib/` contains server-only utilities; client components that need lib functionality call them through API routes
- The chat widget (`widget/`) is a completely separate Vite IIFE build, compiled to `public/widget.js`

## Layers

**Page Layer:**
- Purpose: Route-mapped RSC pages, metadata exports, and layout composition
- Location: `app/*/page.tsx`
- Contains: Page components, `metadata` exports, server-side data fetching
- Depends on: `components/`, `lib/` (server pages only)
- Used by: Next.js router

**API Layer:**
- Purpose: HTTP handlers for Stripe, Cal.com, Beehiiv, Neon, and Supabase integrations
- Location: `app/api/*/route.ts`
- Contains: Validation logic, rate limiting calls, external API calls, JSON responses
- Depends on: `lib/stripe.ts`, `lib/cal-bookings.ts`, `lib/rate-limit.ts`, `lib/db/client.ts`, `lib/visitor.ts`, `lib/spend-cap.ts`
- Used by: Client components (BookFlow), Widget (chat)

**Component Layer:**
- Purpose: Shared UI and booking-specific components
- Location: `components/*.tsx`, `components/book/*.tsx`
- Contains: Server-safe shared UI components; booking flow client components
- Depends on: Nothing from `lib/` directly (calls API routes for data mutation)
- Used by: Page layer

**Lib Layer:**
- Purpose: Server-side singletons, shared business logic, helper utilities
- Location: `lib/`
- Contains: Stripe singleton, Cal.com booking creation, rate limiters, visitor/session management, DB client, spend-cap tracker
- Depends on: External SDKs (`stripe`, `@neondatabase/serverless`, `@supabase/supabase-js`)
- Used by: API layer, confirmed page (server component that calls reconcile)

**Widget Layer:**
- Purpose: Embeddable chat widget as an IIFE script
- Location: `widget/`
- Contains: React components compiled separately by Vite; calls `POST /api/chat`
- Depends on: `@ai-sdk/react` (useChat hook), IIFE-bundled standalone
- Used by: External pages (loaded via `<script src="/widget.js">`)

## Data Flow

### Booking — Paid Path (Okami Review)

1. Client calls `GET /api/availability?calLink=okami/okami-review&...` (`app/api/availability/route.ts`)
2. Client renders slot picker using `TimePicker` component
3. Client collects intake form via `IntakeStep` (`components/book/IntakeStep.tsx`)
4. Client calls `POST /api/payment-intent` with intake + slot → receives `clientSecret` (`app/api/payment-intent/route.ts`)
5. Client confirms payment via Stripe Elements (`PaymentStep.tsx` using `stripe.confirmPayment`)
6. Client calls `POST /api/book` with `paymentIntentId` → Cal booking created (`app/api/book/route.ts`)
7. Client redirects to `/book/confirmed?ref=OR-XXXXX&pi=pi_xxx`

### Booking — 3DS Recovery Path

1. Stripe redirects user back to `/book/confirmed?payment_intent=pi_xxx` after bank authentication
2. `ConfirmedPage` server component retrieves PI from Stripe
3. If `pi.metadata.bookingId` missing, calls `reconcileBookingFromIntent(pi)` (`lib/booking-flow.ts`)
4. `reconcileBookingFromIntent` creates Cal booking from PI metadata, updates PI metadata with `bookingId`

### Booking — Free Path (Discovery Call)

1. Same slot selection flow, no payment step
2. Client calls `POST /api/book` with `paymentIntentId: null`
3. Cal booking created directly without Stripe verification
4. Client redirects to `/book/confirmed?ref=DC-XXXXX`

### Widget Chat Pipeline (Phase I)

1. Widget loads on page as embedded IIFE from `/widget.js`
2. `WidgetChat` uses `useChat` from `@ai-sdk/react`, posts to `POST /api/chat`
3. `POST /api/chat` route:
   - Validates body with Zod schema
   - Calls `getOrCreateVisitor()` for HMAC-verified visitor cookie + conversation
   - Checks Neon-backed rate limits (visitor + IP via `lib/rate-limit-chat.ts`)
   - Checks daily spend cap via `lib/spend-cap.ts`
   - Persists user message + canned reply to Neon `messages` table
4. Response carries `x-conversation-id` header + `Set-Cookie` for visitor

**State Management:**
- Booking flow: local React state in `BookFlow.tsx` (no global store)
- Widget: `useChat` hook from `@ai-sdk/react` manages message list; `conversationId` in local state
- Visitor identity: HMAC-signed `visitor_id` HttpOnly cookie (90-day TTL)

## Key Abstractions

**Rate Limiter (In-Memory):**
- Purpose: Per-IP abuse control for booking/newsletter endpoints
- Used by: `app/api/payment-intent/route.ts`, `app/api/book/route.ts`, `app/api/newsletter/route.ts`, `app/api/partial-booking/route.ts`
- Pattern: Module-level `Map` bucket keyed by `ip:windowMs:max`; approximation only (per serverless instance)
- File: `lib/rate-limit.ts`

**Rate Limiter (Neon-Backed):**
- Purpose: Accurate multi-instance rate limiting for chat traffic across Vercel regions
- Used by: `app/api/chat/route.ts`, `app/api/widget-errors/route.ts`
- Pattern: `INSERT ... ON CONFLICT DO UPDATE` atomic increment in `rate_limit_buckets` table
- File: `lib/rate-limit-chat.ts`

**Stripe Singleton:**
- Purpose: Single server-side Stripe client; null when unconfigured (graceful degradation in dev)
- Used by: `app/api/payment-intent/route.ts`, `app/api/book/route.ts`, `app/book/confirmed/page.tsx`
- Pattern: `export const stripe = STRIPE_SECRET_KEY ? new Stripe(...) : null`
- File: `lib/stripe.ts`

**Cal Booking Creator:**
- Purpose: Typed wrapper around Cal.com v2 API with structured `CalBookingError`
- Used by: `app/api/book/route.ts`, `lib/booking-flow.ts`
- Pattern: `async createBooking(args): Promise<CalBookingResult>` — throws on non-2xx
- File: `lib/cal-bookings.ts`

**Booking Reconciler:**
- Purpose: Idempotent booking creation from a succeeded PaymentIntent; shared by `/api/book` and `/book/confirmed` 3DS recovery path
- File: `lib/booking-flow.ts`

**Visitor Identity:**
- Purpose: HMAC-signed HttpOnly cookie scoped to 90 days; mints visitor + conversation rows on first contact
- Used by: `app/api/chat/route.ts`, `app/api/widget-errors/route.ts`
- File: `lib/visitor.ts`

## Entry Points

**Website (Next.js):**
- Location: `app/layout.tsx`
- Triggers: Any HTTP request to okamilabs.com
- Responsibilities: Root HTML shell, font CSS variables, Navigation, Footer, Analytics, SpeedInsights, schema.org JSON-LD

**Widget (IIFE):**
- Location: `widget/main.tsx`
- Triggers: Script tag load on any page that embeds `/widget.js`
- Responsibilities: Creates a DOM container, renders `WidgetEmbed`

**API (Route Handlers):**
- Location: `app/api/*/route.ts`
- Triggers: HTTP requests from client or widget
- Responsibilities: Validate, rate-limit, delegate to lib singletons, return JSON

## Architectural Constraints

- **Threading:** Vercel serverless — each invocation is single-threaded. In-memory rate limiter (`lib/rate-limit.ts`) is per-instance only; not safe for multi-instance chat (use `lib/rate-limit-chat.ts` for that).
- **Global state:** `lib/stripe.ts` exports a module-level `stripe` singleton. `lib/supabase.ts` exports a module-level `supabase` singleton. `lib/rate-limit.ts` has a module-level `buckets` Map and `lastPurge` timestamp.
- **Circular imports:** None detected.
- **Server-only lib files:** `lib/stripe.ts` must never be imported from a client component — it holds the secret key. All client interactions go through API routes.
- **Widget build isolation:** The `widget/` directory is compiled independently by Vite (IIFE format). It has no import paths into `app/` or `lib/`. It communicates only via HTTP to `/api/chat`, `/api/widget-health`, and `/api/widget-errors`.
- **Graceful degradation:** Stripe, Cal.com, Beehiiv, Supabase, and Neon clients all guard on missing env vars. The site boots and serves pages without any configured integrations; API endpoints return 503 with informative messages.

## Anti-Patterns

### Importing `lib/stripe.ts` from a client component

**What happens:** A developer imports `stripe` or `toRef` from `lib/stripe.ts` inside a `'use client'` component.
**Why it's wrong:** `STRIPE_SECRET_KEY` is included in the server module. Importing it from a client component leaks the key to the browser bundle.
**Do this instead:** Client components must call `POST /api/payment-intent` or `POST /api/book`; only route handlers in `app/api/` import from `lib/stripe.ts`.

### Using in-memory rate limiter (`lib/rate-limit.ts`) for chat

**What happens:** `isRateLimited` from `lib/rate-limit.ts` is used in `app/api/chat/route.ts`.
**Why it's wrong:** Chat is multi-region on Vercel; each instance has its own `buckets` Map, so limits don't aggregate across instances.
**Do this instead:** Use `checkChatRateLimit` from `lib/rate-limit-chat.ts` (Neon-backed, atomic) for chat and widget-error routes.

### Importing `@ai-sdk/anthropic` or `@ai-sdk/openai` at the top level of `app/api/chat/route.ts`

**What happens:** AI SDK imported unconditionally.
**Why it's wrong:** Pulls the full SDK into the serverless bundle even when `CHATBOT_ENABLED=0`, breaking the "code absence = off" guarantee.
**Do this instead:** Import lazily inside `if (CHATBOT_ENABLED === '1') { const { ... } = await import('@ai-sdk/anthropic'); }`.

## Error Handling

**Strategy:** Explicit error typing with structured error classes; API routes return JSON error objects with a stable `error` key and human-readable `message`.

**Patterns:**
- `CalBookingError` (`lib/cal-bookings.ts`) — carries `status` and `body` from Cal.com response
- `ReconcileError` (`lib/booking-flow.ts`) — carries a typed `code` enum (`not_configured`, `payment_not_succeeded`, `metadata_missing`, `cal_failure`)
- API routes catch errors and return appropriate HTTP status codes; a `[BOOKING_FAILED_POST_CHARGE]` console log with full JSON payload is emitted on the critical case where Stripe captured but Cal booking failed
- Widget routes use Zod's `safeParse` — never throw on validation; always return 400 with `error: 'validation'`

## Cross-Cutting Concerns

**Logging:** `console.error` / `console.warn` throughout; structured JSON logged to Vercel's log drain. No log library. Widget errors forwarded via `POST /api/widget-errors`.
**Validation:** Manual validation in booking routes (see `validate()` functions in `app/api/payment-intent/route.ts` and `app/api/book/route.ts`); Zod in chat and widget-errors routes.
**Authentication:** No user authentication on the public site. Admin routes (`app/admin/`) exist but are stub-level. Widget visitor identity via HMAC-signed cookie in `lib/visitor.ts`.
**Security headers:** Set globally in `next.config.ts` — CSP, HSTS, X-Frame-Options, Permissions-Policy, Referrer-Policy applied to all routes via `headers()`.

---

*Architecture analysis: 2026-05-18*
