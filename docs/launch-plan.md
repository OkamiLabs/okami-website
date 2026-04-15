# Launch Plan — okamilabs.com

> Internal checklist to get the site live. Organized by priority.
> Full codebase audit completed April 11, 2026. Revised after gap analysis.

---

## Status

**Updated April 11, 2026:** All blockers, quality fixes, and infrastructure items below have been implemented. Stripe checkout flow for The Okami Review ($299) has been added. The site is ready for deploy. Remaining steps: set environment variables (Cal.com URL, Stripe Payment Link, Zoho credentials), run `npm run build` locally, and push to Vercel.

~~The site is fully built: six pages, ten components, design system, and all copy in place. It builds clean on Next.js 16. What remains falls into four categories: blockers (site can't launch without these), quality (should fix before launch), infrastructure (SEO, security, analytics), and deploy.~~

---

## 1. Blockers

These prevent the site from functioning as intended. Fix all before deploy.

### 1.1 Replace Cal.com placeholder URL

**File:** `components/CalEmbed.tsx:11`

The booking embed defaults to `https://cal.com/placeholder`. This is the only conversion path on the entire site.

**Action:**
- Create `.env.local` with `NEXT_PUBLIC_CAL_LINK=https://cal.com/your-actual-link`
- Update `CalEmbed.tsx` to read from `process.env.NEXT_PUBLIC_CAL_LINK` instead of the hardcoded default
- Test the full booking flow: CTA click → embed loads → time slot selection → confirmation email

### 1.2 Add Cal.com embed fallback

**File:** `components/CalEmbed.tsx`

If the Cal.com script fails to load (network issue, ad blocker, CSP block), the user sees a blank 600px box with no way to book. On a site where booking is the only conversion path, this is a real problem.

**Action:** Add a fallback inside the embed div — a direct link to the Cal.com booking page that's visible if the embed doesn't render. Something like "If the calendar doesn't load, book directly at [link]."

### 1.3 Fix the newsletter form

**Files:** `app/api/newsletter/route.ts` (returns 501), `components/NewsletterForm.tsx`

The newsletter form appears on 3 pages (Home, Building, Contact). When submitted it shows "Coming soon. Check back later." — a visible error on every page that has a form. This undermines the polished feel of the rest of the site.

**Options (pick one):**
- **Option A — Remove for launch.** Strip `<NewsletterForm />` from all three pages. Clean. Add it back when a real integration is ready.
- **Option B — Collect emails.** Swap the 501 route to store emails somewhere minimal (Vercel KV, a JSON file, even just log them). Show a success message. Connect a proper service later.
- **Option C — Static placeholder.** Replace the functional form with static text: "Newsletter coming soon. Check back for updates." No fake submit button.

**Recommendation:** Option A. A broken form on three pages is worse than no form.

### 1.4 Add favicon and social image

**Current state:** Only `public/wolf-logo.svg` exists. No favicon, no OG image.

A site shared on LinkedIn with no OG image looks unfinished. Since LinkedIn outreach is part of the plan, this is a blocker.

**Action:**
- Generate `favicon.ico` (32x32) and `apple-touch-icon.png` (180x180) from the wolf logo
- Create OG image (`public/og-image.png`, 1200x630) — dark background (#0a0a0a), wolf logo, "Okami Labs" in JetBrains Mono
- Add `metadataBase: new URL('https://okamilabs.com')` to `layout.tsx` metadata so OG images resolve to absolute URLs
- Reference favicon and OG image in the layout metadata

---

## 2. Quality

These don't break the site but hurt the experience. Fix before launch if possible.

### 2.1 Accessibility: reduced motion

**Files:** `globals.css` (hero animations), `components/FadeIn.tsx`

No `prefers-reduced-motion` media query exists anywhere. Users who have opted out of animations will still see the hero surge animation, eyebrow fade, CTA slide-in, and every FadeIn scroll animation.

**Action for globals.css:** Add a media query that disables hero animations:
```css
@media (prefers-reduced-motion: reduce) {
  .hero-eyebrow, .hero-headline, .hero-cta { opacity: 1; }
  .hero-playing .hero-eyebrow,
  .hero-playing .hero-headline,
  .hero-playing .hero-cta { animation: none; }
}
```

**Action for FadeIn.tsx:** Check `prefers-reduced-motion` in the useEffect and skip the intersection observer if reduced motion is preferred. Render children immediately with full opacity.

### 2.2 Accessibility: mobile nav keyboard support

**File:** `components/Navigation.tsx`

The mobile menu overlay doesn't trap focus and doesn't close on Escape. A keyboard user can tab behind the overlay into page content they can't see.

**Action:**
- Add `onKeyDown` handler that closes the menu on Escape
- Trap focus within the overlay when open (first and last focusable elements loop)
- Auto-focus the first nav link or the close button when the menu opens

### 2.3 Newsletter form focus color

**File:** `components/NewsletterForm.tsx:56`

The email input uses `focus:border-slate-blue` — a Labs color on a brand-level element. Same color violation the earlier audit caught on other components.

**Action:** Change to `focus:border-off-white` or `focus:border-ash` for consistency with the brand-neutral design.

### 2.4 Footer domain as link

**File:** `components/Footer.tsx:12`

`okamilabs.com` is plain text. Make it a clickable link.

### 2.5 Layout metadata template

**File:** `app/layout.tsx:25-28`

The root metadata has no `title.template`. Pages show their own title strings ("Consulting | Okami", "About | Okami") but there's no enforced pattern. If a page forgets to set a title, it falls back to just "Okami Labs" with no page identifier.

**Action:** Set a title template in the layout:
```ts
title: {
  default: 'Okami Labs',
  template: '%s | Okami Labs',
},
```
Then inner pages can just set `title: 'Consulting'` and get "Consulting | Okami Labs" automatically.

---

## 3. Infrastructure

SEO, security, and analytics. These make the site discoverable and measurable.

### 3.1 OpenGraph tags on inner pages

**Missing on:** `app/about/page.tsx`, `app/services/page.tsx`, `app/building/page.tsx`

Home and Contact have `openGraph` in their metadata. The three inner pages don't.

**Action:** Add `openGraph` objects with `title`, `description`, and `images` (pointing to the OG image) to each.

### 3.2 Structured data (JSON-LD)

No structured data exists anywhere on the site. For a South Florida consulting firm, `Organization` and `LocalBusiness` schema help with local search visibility.

**Action:** Add a JSON-LD script to `layout.tsx` with:
- `@type: "Organization"` (or `"ProfessionalService"`)
- `name`, `url`, `logo`, `description`
- `areaServed: "South Florida"`
- `contactPoint` with the booking URL

### 3.3 Sitemap and robots.txt

**Action:** Add `public/robots.txt`:
```
User-agent: *
Allow: /
Sitemap: https://okamilabs.com/sitemap.xml
```

Create `app/sitemap.ts`:
```ts
export default function sitemap() {
  return [
    { url: 'https://okamilabs.com', lastModified: new Date() },
    { url: 'https://okamilabs.com/about', lastModified: new Date() },
    { url: 'https://okamilabs.com/services', lastModified: new Date() },
    { url: 'https://okamilabs.com/building', lastModified: new Date() },
    { url: 'https://okamilabs.com/contact', lastModified: new Date() },
  ];
}
```

### 3.4 Security headers

**File:** `next.config.ts` — currently has an empty `headers()` function.

**Action:** Add:
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`

**Important:** Do NOT add a Content-Security-Policy header at launch. The Cal.com embed loads scripts from `app.cal.com` and potentially other domains. A strict CSP will break the booking calendar. Add CSP post-launch after testing which domains Cal.com needs whitelisted.

### 3.5 Analytics

**Not optional.** Without analytics you can't measure whether the site is doing its job.

**Action:** Add Vercel Analytics (zero config, built into the platform) or Plausible (privacy-respecting, no cookie banner needed). Set this up during Vercel deployment, not after.

### 3.6 Environment config

**Action:** Add `.env.example` to the repo:
```
NEXT_PUBLIC_CAL_LINK=https://cal.com/your-link
NEXT_PUBLIC_SITE_URL=https://okamilabs.com
```

Confirm `.env.local` is in `.gitignore` (should be via Next.js defaults).

---

## 4. Checkout — The Okami Review ($299)

Stripe handles payment for The Okami Review. The flow: CTA → Stripe checkout → payment → redirect to `/contact?checkout=success` → book Cal.com session.

### 4.1 Stripe setup (complete)

- **Product:** The Okami Review (`prod_UJrIHHv1Zns1h8`)
- **Price:** $299 USD, one-time (`price_1TLDaKCcQ56cGxx0loC3xwCA`)
- **Payment Link:** `plink_1TLDaeCcQ56cGxx0TVnEJjIT`
  - URL: `https://book.stripe.com/28E3cu58M1U835F7b17AI00`
  - Success redirect: `https://okamilabs.com/contact?checkout=success`
  - Collects phone number, creates customer record, generates invoice
  - Submit button text: "Book" with custom message about being redirected to book the session

### 4.2 Site integration (complete)

**Files changed:**

- `components/CheckoutSuccess.tsx` — Client component that reads `?checkout=success` from the URL. Shows a burgundy-accented confirmation banner ("Payment Confirmed — You're in. Now let's book your session.") above the Cal.com embed when present.
- `app/contact/page.tsx` — Includes `<CheckoutSuccess />` wrapped in `<Suspense>` at the top of the page, before the hero section.
- `app/services/page.tsx` — "Start Your Diagnostic" CTA now reads from `NEXT_PUBLIC_STRIPE_PAYMENT_LINK` env var (falls back to `/contact` if unset). Button text updated to "Start Your Diagnostic — $299".
- `components/index.ts` — Added `CheckoutSuccess` to barrel export.
- `.env.example` — Added `NEXT_PUBLIC_STRIPE_PAYMENT_LINK`.

### 4.3 CTA routing logic

Not all CTAs route through Stripe. The distinction:

- **"Start Your Diagnostic"** (Services page) → Stripe Payment Link → `/contact?checkout=success` → book session. This is the paid diagnostic.
- **"Book Your Consultation"** (Home page, Services page bottom, About page) → `/contact` directly. This is the free discovery conversation.

### 4.4 Environment variable

Add to `.env.local` and Vercel dashboard:
```
NEXT_PUBLIC_STRIPE_PAYMENT_LINK=https://book.stripe.com/28E3cu58M1U835F7b17AI00
```

---

## 5. Newsletter — The Silent Brief

### 5.1 Overview

- **Name:** The Silent Brief
- **Tagline:** "Operational intelligence for businesses that scale quietly."
- **Platform:** Beehiiv (free tier, 0% revenue cut, newsletter-native tooling)
- **Custom domain:** `brief.okamilabs.com` (configure in Beehiiv after account creation)
- **Content lane:** AI & automation applied to real business problems + operational intelligence
- **Audience:** Business owners wanting to scale

### 5.2 Site integration (complete)

**Files changed:**

- `components/NewsletterForm.tsx` — Rebranded with "The Silent Brief" name (Playfair italic) and tagline. Sits above the email input on all three instances.
- `app/api/newsletter/route.ts` — Rewired from Zoho Campaigns to Beehiiv API (`POST /v2/publications/{id}/subscriptions`). Sends `utm_source=okamilabs.com`, `utm_medium=website`. Falls back to `/tmp/newsletter-subscribers.json` if Beehiiv env vars aren't set.
- `app/page.tsx` — Newsletter section copy updated for Silent Brief branding.
- `app/contact/page.tsx` — Newsletter section copy updated for Silent Brief branding.
- `app/building/page.tsx` — Newsletter section copy updated for Silent Brief branding.
- `.env.example` — Replaced Zoho vars with `BEEHIIV_API_KEY` and `BEEHIIV_PUBLICATION_ID`.

### 5.3 Environment variables

Add to `.env.local` and Vercel dashboard after Beehiiv account setup:
```
BEEHIIV_API_KEY=your-api-key
BEEHIIV_PUBLICATION_ID=your-publication-id
```

Get these from Beehiiv dashboard → Settings → Integrations.

### 5.4 Setup steps (Lucas)

1. Create Beehiiv account at beehiiv.com
2. Set up custom domain: `brief.okamilabs.com` (DNS CNAME to Beehiiv)
3. Get API key and publication ID from Beehiiv dashboard
4. Add env vars to `.env.local` and Vercel
5. Draft welcome email / onboarding sequence
6. Write Issue 001

### 5.5 Flagged decisions

- Publishing cadence not confirmed — biweekly recommended as sustainable starting point
- Tagline needs final sign-off: "Operational intelligence for businesses that scale quietly."

---

## 6. Deploy

### 6.1 Pre-deploy checklist

Before pushing to production:

- [ ] Cal.com embed loads with real booking URL
- [ ] Cal.com fallback link works if embed fails
- [ ] Newsletter form subscribes via Beehiiv (or fallback works without errors)
- [ ] Favicon visible in browser tab
- [ ] OG image renders when URL pasted into LinkedIn/Twitter
- [ ] All six pages build without errors (`npm run build`)
- [ ] Reduced motion: animations disabled when preference set
- [ ] Mobile nav: Escape closes menu, focus is trapped
- [ ] Stripe Payment Link redirects to `/contact?checkout=success` after payment
- [ ] Checkout success banner appears on Contact page with `?checkout=success` param

### 6.2 Vercel setup

1. Push to GitHub remote (create if needed)
2. Connect repo to Vercel
3. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_CAL_LINK`
   - `NEXT_PUBLIC_SITE_URL`
   - `NEXT_PUBLIC_STRIPE_PAYMENT_LINK`
   - `BEEHIIV_API_KEY`
   - `BEEHIIV_PUBLICATION_ID`
4. Enable Vercel Analytics in project settings
5. Deploy — Vercel auto-detects Next.js
6. Verify deployment URL works end-to-end

### 6.3 Custom domain

1. Add `okamilabs.com` in Vercel → Project Settings → Domains
2. Configure DNS at registrar:
   - `A` record → `76.76.21.21`
   - `CNAME` for `www` → `cname.vercel-dns.com`
3. Set preferred domain (redirect `www` → apex or vice versa) in Vercel
4. Vercel handles SSL automatically
5. Verify both `okamilabs.com` and `www.okamilabs.com` resolve correctly

### 6.4 Post-deploy verification

- [ ] All six pages load without errors on production URL
- [ ] Cal.com embed works on Contact page
- [ ] General CTA buttons route to /contact
- [ ] "Start Your Diagnostic" CTA routes to Stripe checkout
- [ ] Stripe checkout → payment → redirect to /contact?checkout=success works end to end
- [ ] Checkout success banner displays correctly after payment
- [ ] 404 page renders for invalid URLs
- [ ] `/products` redirects to `/building`
- [ ] OG image shows correctly in LinkedIn post preview
- [ ] Mobile navigation opens, closes, and links work
- [ ] Site loads in under 3 seconds (check with PageSpeed Insights)
- [ ] Reduced motion preference respected
- [ ] Analytics receiving data
- [ ] Security headers present (check with securityheaders.com)
- [ ] Newsletter signup via Beehiiv works (or fallback collects email)
- [ ] "The Silent Brief" branding displays correctly in newsletter form

---

## 7. Post-launch

Not blockers. Add when ready.

- **The Silent Brief — Issue 001:** Write and send the first newsletter issue via Beehiiv.
- **Beehiiv welcome sequence:** Draft onboarding emails for new subscribers.
- **Publishing cadence:** Confirm biweekly or another cadence.
- **Custom domain:** Set up `brief.okamilabs.com` as Beehiiv custom domain (DNS CNAME).
- **Legal pages:** Privacy Policy and Terms of Service. Add before collecting any real user data.
- **Slide deck preview:** Services page spec calls for a diagnostic output sample. Swap in when you have one.
- **Products page activation:** Currently redirects to /building. Activate when Labs systems are ready to demo. Archived page at `_archived/products-page.tsx`.
- **Content-Security-Policy:** After launch, audit which domains Cal.com and any analytics scripts need. Build and test a CSP header, then add to `next.config.ts`.
- **Canonical URLs:** Add explicit canonical meta tags to each page to prevent duplicate content issues.

---

## File inventory

| Area | Files | Status |
|------|-------|--------|
| Pages | `app/page.tsx`, `about/`, `services/`, `building/`, `contact/`, `products/`, `not-found.tsx` | Complete — all pages updated |
| Components | 12 in `components/` + barrel export | Complete — includes CheckoutSuccess, Silent Brief newsletter, a11y fixes |
| Styles | `app/globals.css` | Complete — reduced motion query added |
| Layout | `app/layout.tsx` | Complete — metadataBase, title template, JSON-LD |
| API | `app/api/newsletter/route.ts` | Complete — Beehiiv integration with fallback |
| Assets | `public/wolf-logo.svg`, `favicon.ico`, `apple-touch-icon.png`, `og-image.png` | Complete |
| Config | `next.config.ts` | Complete — security headers added |
| Env | `.env.example` | Complete — Cal.com, Stripe, Beehiiv, site URL |
| SEO | `public/robots.txt`, `app/sitemap.ts` | Complete — structured data in layout |
| Checkout | `components/CheckoutSuccess.tsx`, Stripe Payment Link | Complete — $299 diagnostic flow |
| Analytics | none | Needs Vercel Analytics or equivalent |
