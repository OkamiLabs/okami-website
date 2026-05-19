# Testing Patterns

**Analysis Date:** 2026-05-18

## Test Framework

**Runner:** None detected.

No test framework is installed. Neither `jest`, `vitest`, `@testing-library/*`, nor any test runner appears in `package.json` (dependencies or devDependencies). No `jest.config.*` or `vitest.config.*` file exists. No `*.test.*` or `*.spec.*` files exist anywhere in the repository.

**Run Commands:**
```bash
# No test commands configured
npm run lint    # The closest quality gate — ESLint via next lint
npm run build   # TypeScript type-check happens as part of next build
```

## Test File Organization

**Location:** None. No test files exist.

**Naming:** No established pattern.

## What Exists Instead of Tests

### TypeScript as a Correctness Layer

Strict TypeScript (`"strict": true` in `tsconfig.json`) provides compile-time correctness for:
- Discriminated union types on action objects (`type Action = { type: 'SET_SERVICE'; id: ... } | ...` in `components/book/BookFlow.tsx`)
- Return type guarantees on library functions (`lib/stripe.ts`, `lib/cal-bookings.ts`, `lib/booking-flow.ts`)
- Null safety enforced through strict null checks (e.g., `stripe !== null` guards before use)

### Validation Functions as Behavioral Contracts

Hand-rolled `validate()` functions in API routes encode the expected input contract and are used as a form of specification:
- `app/api/book/route.ts` — validates `RequestBody` shape, field lengths, email format, conditional fields per `serviceId`
- `app/api/payment-intent/route.ts` — validates identical fields for the payment step
- Zod schemas in `app/api/chat/route.ts` — `chatBodySchema` documents the expected chat payload shape

### Manual Verification Surface

The booking flow's state machine in `components/book/BookFlow.tsx` and the reconciliation logic in `lib/booking-flow.ts` represent the highest-risk untested code paths. These handle the Stripe payment capture → Cal.com booking creation sequence where failure mid-flow requires manual recovery.

## Coverage

**Requirements:** None enforced.

**Coverage report:** Not available — no test runner configured.

**Untested areas (all of them):**
- `lib/rate-limit.ts` — in-memory rate limiter logic
- `lib/cal-bookings.ts` — Cal.com API client, error handling
- `lib/booking-flow.ts` — reconciliation logic (highest risk: post-charge failure path)
- `lib/stripe.ts` — `toRef()` helper and singleton configuration
- `lib/visitor.ts` — HMAC cookie signing and verification
- `lib/spend-cap.ts` — token reservation and cap checking
- `lib/rate-limit-chat.ts` — DB-backed rate limiter
- All API routes (`app/api/*/route.ts`)
- All React components

## Testing Gaps and Risk Assessment

### Critical Gaps

**`lib/booking-flow.ts` — `reconcileBookingFromIntent()`**
- Risk: **High**. This function runs on the post-3DS return path when Stripe has already captured payment. A bug here means a customer is charged but not booked, requiring manual recovery.
- No tests for: the idempotency branch (`pi.metadata.bookingId` already set), the `metadata_missing` error branch, the PI update failure (non-fatal) path.

**`lib/visitor.ts` — `verifyVisitorCookie()`**
- Risk: **Medium**. HMAC signature verification logic using `timingSafeEqual`. Subtle bugs here could allow session hijacking.
- No tests for: tampered cookie rejection, length mismatch guard, malformed base64url handling.

**`lib/rate-limit.ts` — `isRateLimited()`**
- Risk: **Medium**. In-memory rate limiter with purge logic. Concurrency behavior is untested.

**`lib/stripe.ts` — `toRef()`**
- Risk: **Low**. Pure function — easiest to test. Takes a Stripe PI ID, returns a formatted reference string.
- Example: `toRef('pi_3Rxyz12345abcde', 'review')` → `'OR-ABCDE'`

### Validation Logic Gaps

The `validate()` functions in `app/api/book/route.ts` and `app/api/payment-intent/route.ts` are untested. These functions encode the API contract — field length bounds, email format, conditional required fields per `serviceId`. Bugs here would either reject valid input or accept malformed input.

## Recommended Testing Setup

If tests are added, the following setup aligns with the existing stack:

**Framework:** Vitest (already used for the widget build via `widget/vite.config.ts`)

```bash
npm install -D vitest @vitest/coverage-v8
```

**Config placement:** `vitest.config.ts` at repo root.

**Test file location:** Co-located with source, `*.test.ts` suffix (e.g., `lib/stripe.test.ts`, `lib/booking-flow.test.ts`).

**Priority order for first tests:**
1. `lib/stripe.ts` — `toRef()` (pure function, trivial to test)
2. `lib/visitor.ts` — `verifyVisitorCookie()` (security-critical, pure logic)
3. `lib/booking-flow.ts` — `reconcileBookingFromIntent()` with mocked Stripe + Cal (highest business risk)
4. `lib/rate-limit.ts` — `isRateLimited()` (pure logic with time dependency)
5. `app/api/book/route.ts` — `validate()` function (API contract verification)

**Mocking pattern for external services:**
The codebase uses module-level singletons for Stripe and Cal.com (HTTP via `fetch`). Tests should mock:
- `lib/stripe.ts` — mock `stripe` singleton with `vi.mock`
- `lib/cal-bookings.ts` — mock `fetch` globally or use `vi.mock`
- `lib/db/client.ts` — mock `sql` tag for database-backed modules

---

*Testing analysis: 2026-05-18*
