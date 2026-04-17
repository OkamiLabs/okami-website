# Booking Flow Polish — Round 2

Changes made to `/book` checkout flow based on user testing feedback.

## What changed

1. **Role field now optional** — no longer blocks form submission
2. **"Intake" renamed to "Details"** in step indicator labels
3. **Order summary removed from booking/details steps** — only appears during payment
4. **Description removed from order summary** — just shows service name, slot, price
5. **Fixed misleading payment copy** — removed "session begins after payment" language
6. **Full-screen checkout** — nav and footer hidden on all `/book` routes, replaced with minimal top bar (logo + "Exit" link)
7. **Auto-advance on slot select** — clicking a time slot goes straight to details (no "Continue" button)
8. **Card-only payments** — disabled Klarna, Affirm, and other BNPL methods via `payment_method_types: ['card']`
9. **Stripe typography fix** — labels and tab text switched from JetBrains Mono to Outfit for legibility; card number input stays monospace

## Files modified

- `components/book/BookFlow.tsx` — step labels, auto-advance, conditional summary
- `components/book/BookingStep.tsx` — removed onContinue prop and CTA
- `components/book/IntakeStep.tsx` — role marked optional
- `components/book/OrderSummary.tsx` — removed description paragraph
- `components/book/PaymentStep.tsx` — copy fix, Stripe appearance typography
- `components/book/BookTopBar.tsx` — new minimal top bar component
- `components/Navigation.tsx` — returns null on /book routes
- `components/Footer.tsx` — converted to client component, returns null on /book routes
- `app/book/page.tsx` — added BookTopBar
- `app/book/confirmed/page.tsx` — added BookTopBar
- `app/book/cancelled/page.tsx` — added BookTopBar
- `app/api/payment-intent/route.ts` — role optional, card-only payment methods
