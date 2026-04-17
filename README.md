# Okami Labs Website

Marketing site for [okamilabs.com](https://okamilabs.com) — the credibility anchor for Okami Consulting and Okami Labs. Built to help visitors understand what Okami is and book a consultation.

## Stack

- Next.js 16 (App Router) on Vercel
- Tailwind CSS v4 (CSS-first config in `app/globals.css`)
- Stripe — payments for the Okami Review checkout
- Cal.com v2 — booking creation and availability
- Supabase — partial booking tracking
- Beehiiv — newsletter (optional)

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in keys
npm run dev                  # http://localhost:3000
```

The site boots without Stripe/Cal keys — payment endpoints return 503 in that state.

## Scripts

```bash
npm run dev      # dev server
npm run build    # production build
npm run start    # serve production build locally
npm run lint     # eslint
```

## Environment

See `.env.example` for the full list. The essentials:

| Variable | Purpose |
|----------|---------|
| `CAL_API_KEY` | Cal.com v2 API key (availability + booking creation) |
| `STRIPE_SECRET_KEY` | Stripe server SDK |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe client SDK |
| `NEXT_PUBLIC_SITE_URL` | Used for OG images, sitemap, structured data |
| `BEEHIIV_API_KEY` / `BEEHIIV_PUBLICATION_ID` | Newsletter (optional) |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Partial booking tracking |

## Structure

- `app/` — routes (App Router)
- `app/api/` — server routes (availability, payment-intent, book, newsletter, partial-booking)
- `components/` — shared UI, barrel-exported via `components/index.ts`
- `components/book/` — booking flow steps
- `lib/` — server utilities (Stripe, Cal, Supabase, booking reconciliation, rate limiting)
- `docs/` — internal specs and plans

## Booking flow

The `/book` page is a multi-step client flow:

1. Select service + slot (`GET /api/availability`)
2. Intake form + Stripe PaymentIntent (`POST /api/payment-intent`)
3. Confirm payment via Stripe Elements (supports 3D Secure)
4. Server creates Cal.com booking (`POST /api/book`)
5. Redirect to `/book/confirmed`

If a user returns from a 3DS bank redirect before `/api/book` fires, `/book/confirmed` reconciles the booking from PaymentIntent metadata via `lib/booking-flow.ts`.

Booking references are `OR-XXXXX` (Okami Review) or `DC-XXXXX` (Discovery Call).

## Deployment

Auto-deploys to Vercel from `main`. See `CLAUDE.md` for detailed architecture notes and conventions.
