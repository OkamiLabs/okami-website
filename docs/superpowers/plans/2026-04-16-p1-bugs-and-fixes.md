# P1 Bugs & Fixes — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix all actionable P1 bugs and issues from the task list, plus the P2 cancellation policy.

**Architecture:** Independent bug fixes across the booking flow, hero section, newsletter, and copy. Each task touches 1-2 files. No shared state between tasks — safe to parallelize.

**Tech Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, Stripe Elements, Cal.com v2 API

**Verification:** No test framework is configured. Verification is `npm run build` + `npm run lint` + visual browser check.

---

## Triage Summary

### Included in this plan (code-fixable):
1. Fix 3DS recovery bug — role check blocks reconciliation (CRITICAL)
2. Fix hero section alignment on desktop
3. Fix payment page copy — OrderSummary service name
4. Fix newsletter double-submit bug
5. Fix booking page viewport — fill full screen
6. Add cancellation policy to booking flow
7. Build + lint verification

### Already resolved (skip):
- **Rename "Contact" in nav to "Book"** — `components/Navigation.tsx:14` already shows `{ href: '/book', label: 'Book' }`
- **"Start Your Diagnostic" CTA** — this text no longer exists in any page; CTAs now read "Book Your Consultation" / "Request Your Okami Review"
- **Button styling standardization** — all pages already use the `Button` component from `@/components` consistently. Inline arrow links (home page "See How It Works", "Read the Full Story") are intentional text-link patterns, not buttons.

### Needs user input (not in this plan):
- **Fix sketchy-looking payment screen** — needs visual inspection and direction on what looks wrong
- **Update booking confirmation email address** — needs the new email address
- **Rewrite Okami Review copy** — content/editorial decision (Deep Work)
- **Validate company intake in Cal.com** — requires testing the live Cal.com integration; the code correctly sends `company` in `bookingFieldsResponses` but whether Cal.com stores it depends on the event type's custom field configuration
- **Security review** — separate workflow (`/security-review`)
- **Preserve booking progress** — sessionStorage already persists state across navigations; slot + intake data survive refresh. The only gap is cross-tab (localStorage would be needed). Needs scope clarification.

---

## Task 1: Fix 3DS recovery — optional role blocks reconciliation

**CRITICAL** — Users who leave the optional "Role" field blank cannot complete 3DS bank redirect recovery. The reconciliation code requires `role` in the metadata check, but role is optional and stored as `''` (empty string, which is falsy).

**Files:**
- Modify: `lib/booking-flow.ts:86`

- [ ] **Step 1: Fix the metadata check**

In `lib/booking-flow.ts`, the metadata validation on line 86 includes `!role` in the required-field check. Role is optional in the intake form and stored as `''` in PI metadata when not provided. Empty string is falsy, so this check blocks all users who skipped the optional role field.

Change line 86 from:

```typescript
if (!slotIso || !name || !email || !role || !challenge) {
```

to:

```typescript
if (!slotIso || !name || !email || !challenge) {
```

- [ ] **Step 2: Verify the fix doesn't break the booking fields**

Confirm that the `bookingFields` construction on lines 98-101 still works correctly when `role` is `undefined` or `''`. The `cleanedResponses` logic in `cal-bookings.ts:61-66` already strips empty strings, so an empty role just won't be sent to Cal.com. No additional changes needed.

- [ ] **Step 3: Verify build passes**

Run: `npm run build`
Expected: Clean build, no type errors.

- [ ] **Step 4: Commit**

```bash
git add lib/booking-flow.ts
git commit -m "fix 3DS recovery: remove role from required metadata check"
```

---

## Task 2: Fix hero section alignment on desktop

**Problem:** The hero uses `min-h-screen` + `pt-20` but sits below an 80px nav spacer. The content center is ~40px below the visible center of the viewport. On desktop this makes the hero feel bottom-heavy.

**Root cause:**
- Navigation renders a fixed nav (`h-20`) + an `h-20` spacer div
- Hero starts after the spacer (80px from viewport top)
- Hero is `min-h-screen` (100vh) tall — extends 80px below the viewport
- `pt-20` pushes content further down within the hero
- `items-center` centers in the full 100vh, not the visible 920px portion

**Files:**
- Modify: `components/HeroSection.tsx:17`

- [ ] **Step 1: Fix the hero height and padding**

Change line 17 from:

```tsx
className="min-h-screen flex items-center justify-center px-6 lg:px-8 pt-20 relative overflow-hidden"
```

to:

```tsx
className="min-h-[calc(100vh-5rem)] flex items-center justify-center px-6 lg:px-8 relative overflow-hidden"
```

This makes the hero exactly fill the viewport minus the nav height (5rem = 80px = h-20). Removing `pt-20` lets `items-center` center the content at the true visual midpoint.

- [ ] **Step 2: Start dev server and verify**

Run: `npm run dev`

Open `http://localhost:3000` in a browser at desktop width (1280px+).

Verify:
- Headline "The Silent Giant Behind Modern Business" is vertically centered in the visible viewport area below the nav
- No content overlaps the navigation bar
- The CTA button is visible above the fold
- The hero background effects (radial gradient, grain) still cover the full section

Also check mobile (375px width): the headline should still be centered and readable.

- [ ] **Step 3: Commit**

```bash
git add components/HeroSection.tsx
git commit -m "fix hero vertical centering on desktop"
```

---

## Task 3: Fix OrderSummary service name copy

**Problem:** The order summary shows "Review Service by Okami" which is awkward. Every other reference on the site uses "The Okami Review". The task list references "Okami Review between Okami and Okami" — that phrasing likely comes from a Cal.com event title template, not the code. But the code-side fix is to align the summary name with the brand name used everywhere else.

**Files:**
- Modify: `components/book/BookFlow.tsx:36`

- [ ] **Step 1: Update the review service summary name**

In `components/book/BookFlow.tsx`, change line 36 from:

```typescript
name: 'Review Service by Okami',
```

to:

```typescript
name: 'The Okami Review',
```

- [ ] **Step 2: Verify in browser**

Run dev server. Navigate to `/book`, select a review slot, fill out intake, advance to payment step.

Verify:
- Desktop sidebar shows "The Okami Review" as the order title
- Mobile accordion header shows "The Okami Review"
- The "Pay $299" button text is unchanged

- [ ] **Step 3: Commit**

```bash
git add components/book/BookFlow.tsx
git commit -m "fix order summary: use 'The Okami Review' consistently"
```

---

## Task 4: Fix newsletter double-submit bug

**Problem:** The newsletter form's submit button isn't disabled during the loading state. Double-clicking sends two API requests. Both return 200 (Beehiiv with `reactivate_existing: true`), and both try to set success state — the second is a React no-op, but the duplicate request hits the API unnecessarily. In a race condition, the UI could flicker.

**Files:**
- Modify: `components/NewsletterForm.tsx:85-92`

- [ ] **Step 1: Add disabled prop to the submit button**

In `components/NewsletterForm.tsx`, change lines 85-92 from:

```tsx
<Button
  type="submit"
  variant="ghost"
  className="w-full"
  onClick={undefined}
>
  {status === 'loading' ? 'Subscribing...' : 'Get The Operator\'s Blueprint'}
</Button>
```

to:

```tsx
<Button
  type="submit"
  variant="ghost"
  className="w-full"
  disabled={status === 'loading'}
>
  {status === 'loading' ? 'Subscribing...' : 'Get The Operator\'s Blueprint'}
</Button>
```

- [ ] **Step 2: Remove the unused onClick prop**

The `onClick={undefined}` is unnecessary. It was removed in step 1.

- [ ] **Step 3: Verify in browser**

Navigate to the home page newsletter section. Type an email and click submit rapidly.

Verify:
- Button shows "Subscribing..." and becomes visually disabled (opacity reduced, no pointer events)
- Only one network request is sent (check browser DevTools → Network tab)
- Success state shows after the single request completes
- The "Get The Operator's Blueprint" text returns if the page is refreshed

- [ ] **Step 4: Commit**

```bash
git add components/NewsletterForm.tsx
git commit -m "fix newsletter: disable submit button during loading"
```

---

## Task 5: Fix booking page viewport — fill full screen

**Problem:** The booking flow page doesn't always fill the viewport vertically. When the booking step shows minimal content (e.g., before a time slot is selected, or on smaller screens with fewer calendar dates), the page ends abruptly with dark space below instead of the content area stretching to the viewport bottom.

**Files:**
- Modify: `app/book/page.tsx:27-30`

- [ ] **Step 1: Make the layout fill the viewport**

Change lines 27-30 from:

```tsx
<main className="min-h-screen bg-dark">
  <BookTopBar />
  <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 md:py-24">
```

to:

```tsx
<main className="min-h-screen bg-dark flex flex-col">
  <BookTopBar />
  <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 md:py-24 flex-1 w-full">
```

The `flex flex-col` on main + `flex-1` on the content div ensures the content area stretches to fill remaining viewport space after the BookTopBar.

- [ ] **Step 2: Verify in browser**

Navigate to `/book`. Check at various viewport heights (short: 600px, normal: 900px, tall: 1200px).

Verify:
- The booking content area always extends to the bottom of the viewport
- No visible gap between the content area and the viewport bottom
- The dark background fills the entire screen
- BookTopBar stays at the top (not fixed, scrolls naturally)
- Content layout is unchanged on normal-height viewports

- [ ] **Step 3: Commit**

```bash
git add app/book/page.tsx
git commit -m "fix booking page: fill full viewport height"
```

---

## Task 6: Add cancellation policy to booking flow

**Problem:** The booking flow lacks a visible cancellation policy. The OrderSummary has a brief footnote ("Reschedule up to 24 hours before. Cancellation fees apply after.") but users need to see the policy before committing to payment.

**Files:**
- Modify: `components/book/PaymentStep.tsx:336-339`

- [ ] **Step 1: Add the cancellation policy disclosure**

In `components/book/PaymentStep.tsx`, after the security line (line 336-339), add a cancellation policy block. Change from:

```tsx
{/* Quiet security line — the one concession to reassurance */}
<p className="font-mono text-[10px] tracking-[0.18em] text-ash/40 mt-6 max-w-md">
  Payments processed by Stripe. Okami never stores card details.
</p>
```

to:

```tsx
{/* Quiet security line — the one concession to reassurance */}
<p className="font-mono text-[10px] tracking-[0.18em] text-ash/40 mt-6 max-w-md">
  Payments processed by Stripe. Okami never stores card details.
</p>

<div className="mt-6 pt-6 border-t border-ash/10 max-w-md">
  <p className="font-mono text-[10px] tracking-[0.18em] text-ash/40 leading-[1.8]">
    Reschedule free of charge up to 24 hours before your session.
    Cancellations within 24 hours are non-refundable.
    No-shows are treated as completed sessions.
    Questions? Email{' '}
    <a
      href="mailto:hello@okamilabs.com"
      className="text-ash/60 underline underline-offset-2 hover:text-ash transition-colors"
    >
      hello@okamilabs.com
    </a>
  </p>
</div>
```

- [ ] **Step 2: Verify in browser**

Navigate through the booking flow to the payment step.

Verify:
- The cancellation policy appears below the Stripe security line
- Text is subtle (ash/40, 10px) — informational, not alarming
- The email link works and opens a mail client
- On mobile, the text wraps cleanly within the viewport
- The policy doesn't push the payment form off-screen

- [ ] **Step 3: Commit**

```bash
git add components/book/PaymentStep.tsx
git commit -m "add cancellation policy to payment step"
```

---

## Task 7: Final build verification

- [ ] **Step 1: Run lint**

Run: `npm run lint`
Expected: No errors. Warnings are acceptable.

- [ ] **Step 2: Run production build**

Run: `npm run build`
Expected: Clean build with no errors. All pages compile successfully.

- [ ] **Step 3: Commit all changes (if not already committed per-task)**

If tasks were implemented without individual commits, create a single commit:

```bash
git add -A
git commit -m "fix P1 bugs: hero alignment, order summary copy, newsletter double-submit, booking viewport, cancellation policy, 3DS recovery"
```

---

## Notes for follow-up

These items require user input or external changes before they can be implemented:

1. **"Okami Review between Okami and Okami" in Cal.com** — The code-side service name is fixed (Task 3), but if this text also appears in Cal.com event titles or confirmation emails, it needs to be changed in the Cal.com dashboard under the event type settings for "okami-review".

2. **Payment screen polish** — The Stripe Elements styling (`okamiAppearance` in PaymentStep.tsx) is well-configured. If the payment screen still "looks sketchy," the issue may be Stripe-side (statement descriptor, business name in Stripe dashboard) or about adding trust signals (e.g., showing the Okami logo on the payment page).

3. **Booking confirmation email address** — The site currently references `hello@okamilabs.com` as the support email. If this needs to change, update it in: `PaymentStep.tsx`, `cancelled/page.tsx`, `confirmed/page.tsx`, and the new cancellation policy.

4. **Validate Cal.com receives company data** — The code sends `company` in `bookingFieldsResponses`. Verify in Cal.com dashboard that the "okami-review" event type has a custom booking field named "company" configured. If not, the field is silently dropped by Cal.com.

5. **Preserve booking progress (Deep Work)** — sessionStorage already persists across same-tab navigations. For cross-tab/cross-session persistence, would need to switch to localStorage. This is a design decision.
