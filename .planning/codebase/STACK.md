# Technology Stack

**Analysis Date:** 2026-05-18

## Languages

**Primary:**
- TypeScript 6.x — All application code (Next.js app, API routes, lib, widget)
- SQL (PostgreSQL dialect) — Database migrations in `db/migrations/`

**Secondary:**
- CSS — Design tokens and animations in `app/globals.css` (Tailwind v4 CSS-first)
- HTML — Widget entry point `widget/index.html`

## Runtime

**Environment:**
- Node.js (LTS) — Server-side Next.js routes, API handlers
- Edge/Serverless — Vercel Functions (`@vercel/functions`) for API routes; `runtime = 'nodejs'` declared explicitly in `app/api/chat/route.ts`

**Package Manager:**
- npm
- Lockfile: `package-lock.json` (present)

## Frameworks

**Core:**
- Next.js ^16.2.2 — App Router; all pages under `app/`; API routes under `app/api/`
- React ^19.2.4 — UI rendering; both main app and embedded widget

**CSS:**
- Tailwind CSS ^4.2.2 — CSS-first config via `@theme` in `app/globals.css`; no `tailwind.config.ts` design tokens — `globals.css` is the source of truth
- PostCSS ^8.5.8 — Required postcss bridge via `@tailwindcss/postcss`

**Widget Build (separate pipeline):**
- Vite ^7.3.2 — Builds `widget/` as IIFE bundle to `public/widget.js`
- `@vitejs/plugin-react` ^5.2.0 — React transform for Vite

**AI SDK (stubbed, Phase II):**
- `ai` ^5.0.0 (Vercel AI SDK) — Wired into `app/api/chat/route.ts` behind `CHATBOT_ENABLED` feature gate; NOT imported at module level
- `@ai-sdk/anthropic` ^2.0.0 — Anthropic provider; also stubbed behind gate
- `@ai-sdk/react` ^3.0.170 — devDependency; client-side streaming hooks for Phase II

## Key Dependencies

**Critical:**
- `stripe` ^22.0.1 — Server SDK; singleton in `lib/stripe.ts`; API version `2026-03-25.dahlia`
- `@stripe/react-stripe-js` ^6.2.0 — Client Elements for payment UI on `/book`
- `@stripe/stripe-js` ^9.2.0 — Stripe.js loader
- `@neondatabase/serverless` ^1.0.0 — HTTP-based Postgres driver; client in `lib/db/client.ts`
- `@supabase/supabase-js` ^2.103.3 — Partial booking tracking; client in `lib/supabase.ts`
- `zod` ^4.0.0 — Request body validation on all API routes
- `@vercel/analytics` ^2.0.1 — Page view analytics injected in `app/layout.tsx`
- `@vercel/speed-insights` ^2.0.0 — Core Web Vitals tracking injected in `app/layout.tsx`
- `@vercel/functions` ^3.0.0 — `ipAddress()` helper for rate limiting in chat route

**Database Dev Tools:**
- `node-pg-migrate` ^8.0.0 — Migration runner (`npm run migrate`); migrations in `db/migrations/`
- `pg` ^8.13.0 — Used only by `node-pg-migrate` for running migrations (not runtime queries)

**Build Tools:**
- `svgo` ^4.0.1 — SVG optimization (devDependency)
- `autoprefixer` ^10.4.27 — PostCSS autoprefixer

## Configuration

**TypeScript:**
- `tsconfig.json` — strict mode, `bundler` module resolution, path alias `@/*` → `./`
- Widget excluded from main `tsconfig.json`; `lib/ai/tools.ts` explicitly excluded (stub)
- Target: ES2017

**Build pipeline:**
- `npm run build` = `npm run build:widget && next build` — widget IIFE must be compiled before Next.js build copies `public/`
- Widget output: `public/widget.js` (IIFE, `es2020` target, no sourcemaps)

**Environment:**
- `.env.example` documents all required variables
- `.env.local` for local dev; `.env.development` also present
- Dev boots without Stripe/Cal keys (endpoints return 503)
- `COOKIE_SECRET` required in production (min 32 chars); fails fast at import in `lib/visitor.ts`
- `DATABASE_URL` required at import time in `lib/db/client.ts` — throws if missing

**Next.js config (`next.config.ts`):**
- `poweredByHeader: false`
- Permanent redirects: `/contact` → `/book`, `/building` → `/products`
- Security headers on all routes: CSP, HSTS, X-Frame-Options, Permissions-Policy, Referrer-Policy

## Font System

Three fonts loaded via `next/font/google` in `app/layout.tsx`. CSS variable names use `-face` suffix to avoid Tailwind collisions:

- `--font-playfair-face` → Playfair Display (headings, `font-playfair` utility)
- `--font-outfit-face` → Outfit (body, `font-body` utility)
- `--font-jetbrains-face` → JetBrains Mono (overrides Tailwind `font-mono`)

## Platform Requirements

**Development:**
- Node.js (LTS)
- `DATABASE_URL` for widget chat backend
- All other keys optional in dev (graceful 503 fallback)

**Production:**
- Vercel (deployment target; `@vercel/functions`, `@vercel/analytics`, `@vercel/speed-insights` all Vercel-specific)
- Neon Postgres for widget chat data (pooled URL for runtime, direct URL for migrations)
- Supabase for partial booking tracking (optional)
- Stripe, Cal.com, Beehiiv keys required for full functionality

---

*Stack analysis: 2026-05-18*
