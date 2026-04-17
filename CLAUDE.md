# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Okami Labs Website (okamilabs.com)** - A credibility anchor and trust signal for outreach, not a sales funnel. Primary goal: visitors understand what Okami is and book a consultation.

**Tech Stack:**

- Next.js 16 (App Router) on Vercel
- Tailwind CSS v4 (CSS-first config via `@theme` in `globals.css`)
- Stripe for payments (Okami Review checkout)
- Cal.com v2 API for booking creation and availability
- Beehiiv for newsletter (optional, falls back to `/tmp` storage)
- Domain: okamilabs.com

## Development Commands

```bash
npm run dev      # Start dev server (localhost:3000)
npm run build    # Production build
npm run start    # Serve production build locally
npm run lint     # ESLint
```

## Environment Setup

Copy `.env.example` to `.env.local`. Required vars:

| Variable | Purpose |
|----------|---------|
| `CAL_API_KEY` | Cal.com v2 server-side API key (availability + booking creation) |
| `STRIPE_SECRET_KEY` | Stripe server SDK (payment intents) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client SDK (Elements) |
| `NEXT_PUBLIC_SITE_URL` | Used for OG images, sitemap, structured data |

Optional: `BEEHIIV_API_KEY` and `BEEHIIV_PUBLICATION_ID` for newsletter.

In dev, the site boots without Stripe/Cal keys — payment endpoints return 503.

## Code Architecture

### Tailwind v4 (CSS-first)

Colors and font overrides are defined in `app/globals.css` via `@theme`, not in `tailwind.config.ts`. The tailwind config file exists but the CSS `@theme` block is the source of truth for design tokens. Custom utilities use `@utility` directives:

- `font-playfair` — Playfair Display (headings, editorial)
- `font-body` — Outfit (body text, UI)
- `font-mono` — JetBrains Mono (overrides Tailwind's built-in mono)

### Font System

Three fonts loaded via `next/font/google` in `app/layout.tsx`. The CSS variable names use a `-face` suffix to avoid colliding with Tailwind's built-in font variables:

- `--font-playfair-face` → Playfair Display
- `--font-outfit-face` → Outfit
- `--font-jetbrains-face` → JetBrains Mono

### Booking Flow (Stripe + Cal.com)

The `/book` page is a multi-step client flow: select service/slot → intake form → Stripe payment → Cal.com booking.

Key flow:
1. **Client** fetches available slots from `GET /api/availability` (proxies Cal.com v2 slots API)
2. **Client** collects intake form data, creates Stripe PaymentIntent via `POST /api/payment-intent`
3. **Client** confirms payment with Stripe Elements (supports 3D Secure)
4. **Server** creates Cal.com booking via `POST /api/book` after payment succeeds
5. **Client** redirects to `/book/confirmed` with reference number

Recovery: if user returns from 3DS bank redirect before `/api/book` fires, `/book/confirmed` calls `reconcileBookingFromIntent()` in `lib/booking-flow.ts` to create the Cal booking from PaymentIntent metadata.

Booking reference format: `OR-XXXXX` (Okami Review) or `DC-XXXXX` (Discovery Call), derived from Stripe PI ID.

### API Routes

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/availability` | GET | Proxy Cal.com v2 slot availability |
| `/api/payment-intent` | POST | Create Stripe PaymentIntent with booking metadata |
| `/api/book` | POST | Create Cal.com booking after successful payment |
| `/api/newsletter` | POST | Subscribe email to Beehiiv newsletter |

### Shared Components

Barrel-exported from `components/index.ts`. Layout components (`Navigation`, `Footer`) are rendered in the root layout — individual pages don't include them.

Booking-specific components live in `components/book/` and are not barrel-exported.

### Key Libraries

- `lib/stripe.ts` — Server-side Stripe singleton + `toRef()` helper. Never import from client components.
- `lib/cal-bookings.ts` — Cal.com v2 booking creation with `CalBookingError` for structured error handling.
- `lib/booking-flow.ts` — Reconciliation logic shared between the booking API route and the 3DS recovery page.
- `lib/rate-limit.ts` — Rate limiting for API routes.

## Site Structure

Pages:

- **/** — Home. Does 80% of the work. Hero, problem statement, two arms (Consulting + Labs), Okami Review callout.
- **/about** — Founder story, philosophy.
- **/services** — Consulting. The Okami Review as centerpiece.
- **/products** — Labs. Okami Agent Core platform.
- **/building** — Momentum page with business outcomes.
- **/book** — Multi-step booking flow (Stripe + Cal.com). Replaces the old `/contact` page.
- **/book/confirmed** — Post-booking confirmation with reference number.
- **/book/cancelled** — Payment cancellation landing.
- **/privacy**, **/terms** — Legal pages.

`/contact` redirects permanently to `/book` via `next.config.ts`.

## Brand Identity & Design Requirements

### Visual Identity

- **Logo:** Wolf head on black background
- **Fonts:** Playfair Display (headings), Outfit (body), JetBrains Mono (technical/mono)
- **Backgrounds:** Dark (#0a0a0a)
- **No imagery:** No hero photos, stock images, or abstract graphics. Typography and whitespace only.

### Color Palette

| Color | Hex | Role |
|-------|-----|------|
| Slate Blue | `#6878A0` | Primary accent — buttons, links, hover states, Labs identity |
| Burgundy | `#8B3A3A` | Secondary accent — Consulting identity, emphasis moments |
| Ash | `#9A918A` | Body text, secondary labels, ghost buttons, neutral layer |
| Off-white | `#e8e6e1` | Headings, logo, high-emphasis text |

**No gold, teal, or bright/saturated colors.** Color coding: Consulting sections use Burgundy, Labs sections use Slate Blue.

### Design Principles

- Stripped-back aesthetic using typography and whitespace
- Every element earns its place — no carousels, stock photos, or filler
- Minimal animations (hero entrance + FadeIn on scroll, that's it)
- CTA pattern: every page ends with a call to action routing to `/book`

### Voice & Tone

- **Brand voice** throughout (not first person) — "Okami was founded on..." not "I built Okami..."
- Confident statements, not sales pitches
- Frame around business outcomes, not technical details

## Security

`next.config.ts` sets security headers on all routes: CSP, HSTS, X-Frame-Options, etc. When adding new external scripts or frame sources, update the CSP header there.

## Git Commit Guidelines

- Never include references to Claude, AI assistance, or co-authorship in commit messages
- Keep commit messages focused on the change itself, not the tooling used to make it

## Reference Document

Complete design and content decisions are documented in `okami-website-spec_1.md`.
