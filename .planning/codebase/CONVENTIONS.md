# Coding Conventions

**Analysis Date:** 2026-05-18

## Naming Patterns

**Files:**
- React components: PascalCase matching the exported component name (`BookFlow.tsx`, `FormField.tsx`, `CTASection.tsx`)
- API route handlers: `route.ts` inside the Next.js App Router directory pattern (`app/api/book/route.ts`)
- Library modules: camelCase (`booking-flow.ts`, `rate-limit.ts`, `cal-bookings.ts`)
- Page files: `page.tsx` per App Router convention

**Functions:**
- Named exports use camelCase for library functions: `isRateLimited`, `getClientIp`, `createBooking`, `reconcileBookingFromIntent`
- React components use PascalCase default exports: `export default function BookFlow()`
- Event handlers in components use `handle` prefix: `handleSlotSelect`, `handleIntakeBack`, `handlePaymentBack`, `handleServiceChange`
- Boolean-returning utilities use `is` prefix: `isStripeConfigured`, `isRateLimited`, `isValidEmail`

**Variables / Constants:**
- Module-level constants use SCREAMING_SNAKE_CASE: `REVIEW_PRICE_CENTS`, `CAL_USERNAME`, `DEFAULT_WINDOW_MS`, `STORAGE_KEY`, `PURGE_INTERVAL_MS`
- Local variables use camelCase
- Redux-style action type strings use SCREAMING_SNAKE_CASE: `'SET_SERVICE'`, `'SELECT_SLOT'`, `'PAYMENT_INIT_START'`

**Types and Interfaces:**
- Interfaces use PascalCase with descriptive `Props` suffix for component props: `ButtonProps`, `BookFlowProps`, `IntakeStepProps`
- Return types use plain PascalCase: `ReconciledBooking`, `CalBookingResult`, `VisitorContext`
- Union string literal types are camelCase strings: `'review' | 'discovery'`, `'booking' | 'intake' | 'payment'`
- Type aliases for variant maps: `ButtonVariant`, `CardAccent`, `RateLimitScope`
- Prefer `interface` for object shapes; `type` for union literals and derived types

## Code Style

**Formatting:**
- No Prettier config detected — formatting is handled by `next lint` (ESLint with Next.js defaults)
- Indentation: 2 spaces throughout
- Trailing commas in function arguments and arrays
- Single quotes for string literals in TypeScript/TSX
- Double quotes in `app/layout.tsx` imports (minor inconsistency from the root layout)

**Linting:**
- ESLint via `next lint` (Next.js built-in config, no explicit `eslint.config.*` or `.eslintrc`)
- TypeScript strict mode enabled in `tsconfig.json` (`"strict": true`)
- No `@ts-ignore` or `@ts-expect-error` suppressions found in the codebase

## TypeScript Usage

**Strictness:**
- `strict: true` in `tsconfig.json` — no implicit `any`, strict null checks
- Explicit return types on exported library functions: `export function isRateLimited(...): boolean`
- Inline type assertions used sparingly when narrowing from `unknown`: `body as Record<string, unknown>`
- `as const` used on object literals to lock variant maps: `const sizeStyles = { ... } as const`
- Optional chaining and nullish coalescing used throughout: `pi.metadata?.bookingId`, `data ?? {}`

**Interface vs Type:**
- Interfaces for component props and data shapes
- Type aliases for union types and mapped object types (e.g., `type Step = 'booking' | 'intake' | 'payment'`)
- Exported from the same file that defines the related component or function

## Import Organization

**Order in API routes:**
1. Next.js framework (`next/server`)
2. Node built-ins (`node:crypto`)
3. Third-party packages (`stripe`, `zod`)
4. Internal library modules via `@/` alias (`@/lib/stripe`, `@/lib/rate-limit`)

**Order in React components:**
1. React and framework hooks (`react`, `next/navigation`)
2. Local sibling components (relative `./` paths)
3. Internal library modules via `@/` alias

**Path Aliases:**
- `@/*` maps to the repo root (configured in `tsconfig.json`)
- All internal imports use `@/` — no deep relative paths crossing directory boundaries
- Book-flow-internal imports use relative paths within `components/book/`

## Error Handling

**API Routes — discriminated error objects:**
All API routes return JSON with a consistent `{ error: string, message: string }` shape on failure. The `error` field is a machine-readable code; `message` is user-facing text.

```typescript
// Pattern used in every route
return NextResponse.json(
  { error: 'rate_limit', message: 'Too many requests. Please wait a minute.' },
  { status: 429 }
);
```

**Custom error classes:**
Domain errors are expressed as typed subclasses of `Error` with extra fields:
- `CalBookingError` (`lib/cal-bookings.ts`): adds `status: number` and `body: unknown`
- `ReconcileError` (`lib/booking-flow.ts`): adds `code` as a discriminated union string

**Try/catch scope:**
- Each distinct failure mode has its own `try/catch` block rather than one large block
- Non-fatal errors (PI metadata updates) are caught, logged with `console.warn`, and execution continues
- Critical failures (Cal booking fails after Stripe charge) are logged with `console.error` using the sentinel tag `[BOOKING_FAILED_POST_CHARGE]` for grep-ability

**Graceful degradation:**
Missing env vars are detected at module load time. Services export a null singleton and a paired `isXConfigured()` guard, rather than throwing at import time in non-production:

```typescript
// lib/stripe.ts
export const stripe = STRIPE_SECRET_KEY ? new Stripe(...) : null;
export function isStripeConfigured(): boolean { return stripe !== null; }
```

**Validation pattern:**
API routes use local `validate()` functions that return discriminated union results — no exceptions thrown for validation:

```typescript
function validate(body: unknown): { ok: true; data: RequestBody } | { ok: false; field?: string; message: string }
```

Zod is used in the chat route (`app/api/chat/route.ts`) for schema validation:

```typescript
const parsed = chatBodySchema.safeParse(raw);
if (!parsed.success) { /* return 400 */ }
```

Both styles coexist: hand-rolled `validate()` for booking routes, Zod for the chat route.

## Logging

**Framework:** `console` (no structured logging library)

**Patterns:**
- Prefix all server-side log messages with a bracketed module tag for grep-ability: `[book]`, `[stripe]`, `[newsletter]`, `[booking-flow]`, `[partial-booking]`
- `console.error` for actionable failures (external API errors, payment failures)
- `console.warn` for non-fatal degradations (missing optional env vars, non-critical metadata updates)
- Never log user PII in plain form; log email only in the `[BOOKING_FAILED_POST_CHARGE]` critical path where it's required for manual recovery
- Use `console.error` with `JSON.stringify({ ... })` for structured context on critical errors:
  ```typescript
  console.error('[BOOKING_FAILED_POST_CHARGE]', JSON.stringify({
    paymentIntentId,
    slotIso,
    email: intake.email,
    calStatus: isCalErr ? err.status : null,
  }));
  ```

## Comments

**When to Comment:**
- File-level JSDoc block at the top of every library module describing purpose, caveats, and cross-references
- Inline comments on non-obvious design decisions ("Idempotency: if a booking was already created…")
- Section dividers using `/* ── Section Name ───────────────────────── */` inside large component files (`BookFlow.tsx`)
- Numbered pipeline steps in complex route handlers match inline comments to the numbering in the file-level JSDoc

**JSDoc/TSDoc:**
- Function-level JSDoc on all exported library functions with intent, caveats, and examples:
  ```typescript
  /**
   * Turn a Stripe PaymentIntent id into a short user-facing reference.
   * Examples:
   *   toRef('pi_3Rxyz...', 'review') → 'OR-ABCDE'
   */
  export function toRef(id: string, serviceId: 'review' | 'discovery'): string
  ```
- Component props use inline TypeScript comments for non-obvious fields: `submitCtaLabel: string; // "Continue to payment" or "Confirm booking"`

## React Component Patterns

**Client vs Server:**
- `'use client'` directive placed as the first line of components that use hooks or browser APIs
- Server Components are the default (no directive needed) — pages and layout are server components
- Never import server-only modules (e.g., `lib/stripe.ts`) from client components

**State management:**
- Complex multi-step flows use `useReducer` with an explicit `Action` union type (`BookFlow.tsx`)
- Simple local state uses `useState`
- `useCallback` wraps all event handlers passed to child components to prevent re-render churn

**Props interface placement:**
- Defined immediately before the component function in the same file
- Exported when consumed by sibling or parent components

**Default exports:**
- All React components use `export default function ComponentName()`
- Library modules use named exports exclusively

## Module Design

**Exports:**
- Library modules (`lib/`) use named exports; no default exports
- React components use a single default export per file
- Shared components are barrel-exported from `components/index.ts`
- `components/book/` components are NOT barrel-exported — imported directly within the booking flow

**Barrel Files:**
- `components/index.ts` is the only barrel file; it re-exports all shared layout and UI components
- Booking-specific sub-components are intentionally excluded from the barrel to keep the bundle focused

---

*Convention analysis: 2026-05-18*
