# Codebase Structure

**Analysis Date:** 2026-05-18

## Directory Layout

```
website-v3/
├── app/                    # Next.js App Router — pages + API routes
│   ├── layout.tsx          # Root layout (fonts, Navigation, Footer, metadata)
│   ├── page.tsx            # Home page (/)
│   ├── globals.css         # Tailwind v4 @theme tokens, @utility directives
│   ├── sitemap.ts          # Dynamic sitemap
│   ├── not-found.tsx       # 404 page
│   ├── about/              # /about page
│   ├── services/           # /services page
│   ├── products/           # /products page
│   ├── privacy/            # /privacy page
│   ├── terms/              # /terms page
│   ├── book/               # /book multi-step flow
│   │   ├── page.tsx        # BookFlow entry — passes Stripe key down
│   │   ├── confirmed/      # /book/confirmed — 3DS recovery + reference display
│   │   └── cancelled/      # /book/cancelled
│   ├── admin/              # /admin (stub-level, no auth yet)
│   │   └── conversations/  # Admin conversation list
│   └── api/                # Route handlers
│       ├── availability/   # GET — Cal.com slot proxy
│       ├── book/           # POST — Cal booking creation
│       ├── payment-intent/ # POST — Stripe PaymentIntent creation
│       ├── newsletter/     # POST — Beehiiv subscription
│       ├── partial-booking/# POST — Supabase partial-booking beacon
│       ├── chat/           # POST — Widget chat (Neon-backed, Phase I stub)
│       ├── conversations/  # GET — Widget conversation history
│       │   └── [id]/messages/ # GET — Messages for a conversation
│       ├── widget-health/  # GET — Liveness probe
│       └── widget-errors/  # POST — Client-side widget error sink
│
├── components/             # Shared UI components
│   ├── index.ts            # Barrel export for all shared components
│   ├── Navigation.tsx      # Site navigation (client component)
│   ├── Footer.tsx          # Site footer
│   ├── HeroSection.tsx     # Hero (client — JS entrance animation)
│   ├── CTASection.tsx      # Reusable page-ending CTA block
│   ├── Card.tsx            # Two-arm section card
│   ├── Button.tsx          # Polymorphic button/link
│   ├── Aside.tsx           # Sidebar callout block
│   ├── FadeIn.tsx          # Scroll-triggered fade animation
│   ├── NewsletterForm.tsx  # Newsletter subscribe form
│   ├── StatusDot.tsx       # Availability indicator dot
│   └── TimePicker.tsx      # Time slot picker (used in booking)
│   └── book/               # Booking-flow-specific components (NOT barrel-exported)
│       ├── BookFlow.tsx     # Top-level multi-step state machine
│       ├── BookingStep.tsx  # Slot/service selection step
│       ├── IntakeStep.tsx   # Intake form step
│       ├── PaymentStep.tsx  # Stripe Elements payment step
│       ├── OrderSummary.tsx # Order summary sidebar
│       ├── StepIndicator.tsx# Step progress indicator
│       ├── BookTopBar.tsx   # Minimal top bar for book/confirmed
│       ├── ReferenceReveal.tsx # Animated reference number reveal
│       ├── FormField.tsx   # Reusable form field wrapper
│       └── Select.tsx      # Custom select input
│
├── lib/                    # Server-side utilities and singletons
│   ├── stripe.ts           # Stripe singleton + toRef() helper (server-only)
│   ├── cal-bookings.ts     # Cal.com v2 booking creation + CalBookingError
│   ├── booking-flow.ts     # Booking reconciliation logic (shared by /api/book + /book/confirmed)
│   ├── rate-limit.ts       # In-memory IP rate limiter (booking/newsletter routes)
│   ├── rate-limit-chat.ts  # Neon-backed rate limiter (chat/widget-errors routes)
│   ├── visitor.ts          # HMAC-signed visitor cookie + Neon visitor/conversation provisioning
│   ├── spend-cap.ts        # Daily token spend cap (Neon-backed)
│   ├── supabase.ts         # Supabase singleton (partial-booking tracking)
│   ├── notifications.ts    # Slack webhook notifications
│   ├── track-partial-booking.ts # Client-side sendBeacon helper
│   ├── db/
│   │   ├── client.ts       # Neon serverless Postgres client (sql tagged template)
│   │   ├── system-prompt.ts# AI chat system prompt builder
│   │   └── tools.ts        # AI tool definitions (captureLeadInfo, bookDiscoveryCall, etc.)
│   ├── migrations/         # Supabase migration SQL
│   │   └── 001_partial_bookings.sql
│   └── ai/                 # (alias for lib/db AI files — same directory)
│
├── widget/                 # Standalone chat widget (Vite IIFE build)
│   ├── main.tsx            # Entry point — mounts WidgetEmbed into document.body
│   ├── WidgetEmbed.tsx     # Root component — toggle button + chat panel
│   ├── WidgetChat.tsx      # Chat panel using useChat from @ai-sdk/react
│   ├── WidgetButton.tsx    # Floating toggle button
│   ├── MessageList.tsx     # Chat message list
│   ├── MessageInput.tsx    # Chat input bar
│   ├── ThemeProvider.tsx   # CSS variable theme injector
│   ├── index.html          # Dev HTML harness
│   ├── vite.config.ts      # Vite build config → outputs public/widget.js
│   ├── hooks/              # Custom React hooks for widget
│   ├── styles/             # CSS files (themes, widget layout)
│   └── types/              # TypeScript type definitions
│
├── db/                     # Neon Postgres migrations (widget backend schema)
│   └── migrations/
│       ├── 001_initial.sql      # visitors, conversations, messages, leads, bookings, services
│       ├── 002_seed_services.sql# Seed data for services catalog
│       └── 003_rate_limits.sql  # rate_limit_buckets, token_reservations
│
├── public/                 # Static assets served by Next.js
│   ├── widget.js           # Compiled widget IIFE (output of Vite build)
│   ├── wolf-logo.webp      # Logo image
│   ├── og-image.png        # OpenGraph image
│   ├── favicon.ico         # Favicon
│   └── apple-touch-icon.png
│
├── docs/                   # Internal planning docs (not served)
├── instructions/           # Internal instructions / reference (not served)
├── .planning/              # GSD planning documents
│   └── codebase/           # Codebase map documents
├── .claude/                # Project Claude skills
├── .agents/                # Agent skills
├── next.config.ts          # Next.js config — redirects + security headers
├── tsconfig.json           # TypeScript config with `@/` path alias
├── package.json            # Dependencies
└── CLAUDE.md               # Project instructions for Claude Code
```

## Directory Purposes

**`app/`:**
- Purpose: All Next.js App Router pages and API route handlers
- Contains: RSC page components, client-entry page wrappers, route handlers, CSS, sitemap
- Key files: `app/layout.tsx` (root), `app/globals.css` (design tokens), `app/book/confirmed/page.tsx` (3DS recovery logic)

**`components/`:**
- Purpose: Reusable React components shared across pages
- Contains: Layout shell components (Navigation, Footer), marketing UI components, booking flow components
- Key files: `components/index.ts` (barrel), `components/book/BookFlow.tsx` (booking state machine)

**`lib/`:**
- Purpose: Server-only business logic and external service singletons
- Contains: Stripe, Cal.com, Neon, Supabase, rate limiters, visitor identity, AI utilities
- Key files: `lib/stripe.ts`, `lib/cal-bookings.ts`, `lib/booking-flow.ts`, `lib/db/client.ts`

**`widget/`:**
- Purpose: Independently built embeddable chat widget
- Contains: Vite/React IIFE app with its own build config
- Key files: `widget/main.tsx`, `widget/vite.config.ts`

**`db/migrations/`:**
- Purpose: SQL migration files for the Neon Postgres database used by the widget backend
- Generated: No
- Committed: Yes

**`public/`:**
- Purpose: Static files served directly by Next.js/Vercel
- Contains: Compiled widget JS, images, favicon, OG image
- Key files: `public/widget.js` (generated by `vite build --config widget/vite.config.ts`)

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root HTML shell, global metadata, font loading
- `widget/main.tsx`: Widget IIFE entry point

**Configuration:**
- `next.config.ts`: Redirects (`/contact` → `/book`, `/building` → `/products`) + security headers CSP
- `tsconfig.json`: `@/` path alias pointing to repo root
- `app/globals.css`: Tailwind v4 `@theme` block (color tokens, font CSS variables, custom utilities)

**Core Logic:**
- `lib/booking-flow.ts`: Shared booking reconciliation — used by both `/api/book` and `/book/confirmed`
- `lib/stripe.ts`: Stripe singleton and `toRef()` reference derivation
- `lib/cal-bookings.ts`: Cal.com v2 `createBooking()` with `CalBookingError`
- `lib/visitor.ts`: HMAC cookie signing/verification and visitor/conversation provisioning

**Testing:**
- Not detected — no test files present

## Naming Conventions

**Files:**
- Pages: `page.tsx` (Next.js convention)
- API routes: `route.ts` (Next.js convention)
- React components: PascalCase (e.g., `BookFlow.tsx`, `CTASection.tsx`)
- Lib utilities: kebab-case (e.g., `booking-flow.ts`, `rate-limit-chat.ts`)
- CSS: kebab-case (e.g., `widget.css`, `themes.css`)

**Directories:**
- Route segments: kebab-case matching URL path (e.g., `book/confirmed/`)
- Feature groups: kebab-case (e.g., `components/book/`, `lib/db/`)

**TypeScript:**
- Exported interfaces: PascalCase (e.g., `CreateBookingArgs`, `ReconciledBooking`)
- Exported functions: camelCase (e.g., `createBooking`, `reconcileBookingFromIntent`, `isRateLimited`)
- Exported constants/singletons: camelCase or lowercase (e.g., `stripe`, `supabase`, `sql`)
- Error classes: PascalCase with `Error` suffix (e.g., `CalBookingError`, `ReconcileError`)

## Where to Add New Code

**New Marketing Page:**
- Page component: `app/[slug]/page.tsx`
- Add to sitemap: `app/sitemap.ts`
- No need to update Navigation manually — edit `navLinks` array in `components/Navigation.tsx`

**New API Endpoint:**
- Route handler: `app/api/[feature]/route.ts`
- Add rate limiting: import `isRateLimited` + `getClientIp` from `lib/rate-limit.ts` for booking-type endpoints; `checkChatRateLimit` from `lib/rate-limit-chat.ts` for chat-type endpoints
- If endpoint needs Stripe: import from `lib/stripe.ts` only in the route handler
- If endpoint needs Neon DB: import `sql` from `lib/db/client.ts`

**New Shared UI Component:**
- Implementation: `components/[ComponentName].tsx`
- Export from barrel: add to `components/index.ts`
- Booking-specific components: `components/book/[ComponentName].tsx` (not barrel-exported)

**New Lib Utility (Server-Only):**
- Implementation: `lib/[feature-name].ts`
- If it uses the DB: import `sql` from `lib/db/client.ts`
- If it uses Stripe: import `stripe` from `lib/stripe.ts`
- NEVER import server-only lib files from client components

**New DB Migration:**
- File: `db/migrations/NNN_description.sql` (increment prefix)
- Include both `-- Up Migration` and `-- Down Migration` sections (see existing files)

**New Design Token:**
- Add to `@theme` block in `app/globals.css` — do NOT use `tailwind.config.ts` for color/font tokens

**New External Service Integration:**
- Create singleton in `lib/[service].ts` following the guard pattern:
  ```typescript
  export const client = REQUIRED_ENV_VAR ? new Client(...) : null;
  export function isConfigured(): boolean { return client !== null; }
  ```

## Special Directories

**`.planning/codebase/`:**
- Purpose: GSD codebase map documents
- Generated: Yes (by `/gsd-map-codebase`)
- Committed: Yes

**`.claude/skills/` and `.agents/skills/`:**
- Purpose: Project-specific Claude Code skills (e.g., `neon-postgres`)
- Generated: No
- Committed: Yes

**`_archived/`:**
- Purpose: Archived/deprecated files kept for reference
- Generated: No
- Committed: Yes

**`.next/`:**
- Purpose: Next.js build output
- Generated: Yes
- Committed: No

---

*Structure analysis: 2026-05-18*
