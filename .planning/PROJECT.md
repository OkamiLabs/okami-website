# Okami Labs Website — AI Chatbot

## What This Is

The okamilabs.com website — a credibility anchor, booking funnel, and live product demo. Visitors understand what Okami is, can book a consultation through a multi-step Stripe + Cal.com flow, and can experience Okami's AI capability firsthand through a Claude-powered chat assistant that guides them from question to booked call.

## Core Value

The chatbot converts visitors and convinces them Okami can build AI for them — by being an excellent AI product itself.

## Current Milestone: v2.0 AI Chatbot

**Goal:** Replace the canned-reply widget with a Claude-powered chatbot that handles the full booking journey and demonstrates what Okami builds.

**Target features:**
- Live Claude AI in the chat widget (replace canned reply)
- Knowledge-rich system prompt — services + pricing, founder story, booking logistics, Labs/Agent Core
- AI tools for booking flow: slot availability (Cal.com), intake collection, Stripe Payment Link generation
- Free-form conversation with guided structure for the booking journey

## Requirements

### Validated

- ✓ Marketing pages (home, about, services, products) — live
- ✓ Multi-step booking flow: slot picker → intake → Stripe payment → Cal.com booking — live
- ✓ 3DS recovery path via reconcileBookingFromIntent — live
- ✓ Discovery Call (free booking, no payment) — live
- ✓ Chat widget (IIFE, canned reply, rate-limited) — live
- ✓ Neon-backed rate limiting for chat routes — live
- ✓ HMAC visitor identity cookie — live
- ✓ Spend cap enforcement — live
- ✓ Security headers (CSP, HSTS, X-Frame-Options) — live
- ✓ Sentry installed, BOOKING_FAILED_POST_CHARGE alerted — Phase 01
- ✓ Neon-backed rate limiter on /api/book and /api/payment-intent — Phase 01
- ✓ Migration path corrected, token table cleanup, timing leak fixed — Phase 02
- ✓ CSP gap documented — Phase 02
- ✓ lib/ai/tools.ts and system-prompt.ts fixed, domain corrected, seed data updated — Phase 03
- ✓ Booking-flow unit tests, cache headers, admin query bounded, packages pinned — Phase 04

### Active

**AI Chatbot**
- [ ] Enable live Claude AI behind CHATBOT_ENABLED in app/api/chat/route.ts
- [ ] System prompt covers: services + pricing, founder story, booking logistics, Labs/Agent Core
- [ ] Chatbot can surface Cal.com slot availability via tool call
- [ ] Chatbot guides visitor through service selection and intake collection in conversation
- [ ] Chatbot generates Stripe Payment Link and presents it when visitor is ready to book
- [ ] Conversation is free-form with guided structure for the booking journey
- [ ] Widget UI handles guided booking steps (slot display, confirmation, payment link CTA)
- [ ] Chatbot is polished and impressive — it is the product demo

### Out of Scope

- Booking retry queue (Vercel Cron + pending_bookings table) — significant infrastructure, deferred
- Full test coverage for widget pipeline and admin auth — deferred; critical path tests sufficient
- x-forwarded-for proxy trust list — Vercel sets this correctly in production
- Inline Stripe Elements in chat — Payment Link popup chosen for simplicity
- Full booking creation inside chat (payment reconciliation stays with existing /api/book flow)

## Context

The codebase hardening (v1.0) is complete. The site processes real payments through the /book flow. The widget UI, AI scaffolding (lib/ai/tools.ts, lib/ai/system-prompt.ts), and chat API route (app/api/chat/route.ts) are all in place from Phase 03. The chatbot work is enabling and building on top of this scaffolding.

The chatbot's quality bar is higher than a typical feature — it is both a conversion tool and a live demonstration of what Okami sells. A mediocre chatbot undermines the pitch.

## Constraints

- **Stack**: Next.js App Router on Vercel — widget compiles separately via Vite; don't add imports between widget/ and app/
- **Widget build isolation**: widget/ compiles separately via Vite — no shared imports with app/
- **Payment**: Stripe Payment Link for chat (not inline Elements) — visitor exits to payment, returns to confirmation
- **No auth changes**: Admin auth (proxy.ts) is settled — don't touch it
- **AI model**: Claude via Anthropic SDK — already scaffolded

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Install Sentry (not just Slack webhook) | Proper exception capture beats one-off webhooks; DSN vars already reserved | ✓ Validated Phase 01 |
| Critical-path tests only (v1.0) | Full booking + widget coverage deferred; payment-failure path is highest risk | ✓ Validated Phase 04 |
| Neon-backed rate limiter for payment routes | lib/rate-limit-chat.ts already existed; reuse over new solution | ✓ Validated Phase 01 |
| Payment Link (not inline Stripe Elements) in chat | Simpler implementation; avoids PCI scope in widget iframe | — Pending |
| Free-form AI + guided flow (not purely scripted) | Matches Okami's sophistication; pure scripts feel cheap given the demo context | — Pending |

---
*Last updated: 2026-05-20 — Milestone v2.0 AI Chatbot started*

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state
