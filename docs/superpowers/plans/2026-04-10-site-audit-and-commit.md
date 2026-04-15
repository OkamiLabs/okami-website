# Site Audit & Commit — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Review all in-session page drafts against website-copy.md, fix brand color violations and copy discrepancies, then commit everything in logical chunks.

**Architecture:** All six pages, ten components, one API route, and global CSS exist as uncommitted drafts. The hero redesign plan (`2026-04-07-homepage-hero.md`) has been implemented. This plan audits everything, fixes issues, and commits.

**Tech Stack:** Next.js 16, Tailwind CSS v4, TypeScript

---

## Current State

The site builds clean (`npm run build` passes). All pages render. But everything is uncommitted — `.gitignore`, `globals.css`, `layout.tsx`, `page.tsx` are modified, and all other files are untracked.

### Issues Found During Audit

| # | Issue | File(s) | Severity |
|---|-------|---------|----------|
| 1 | Nav active-link underline uses `bg-slate-blue` — brand-level element, should not use division color | `components/Navigation.tsx:58` | High |
| 2 | Nav logo text says "Okami Labs" — spec says "Okami" | `components/Navigation.tsx:42` | Medium |
| 3 | 404 page uses `bg-slate-blue` button — brand-level, not Labs | `app/not-found.tsx:21` | High |
| 4 | CTASection uses `Button variant="primary"` which is always slate-blue — Consulting pages need burgundy CTAs | `components/CTASection.tsx:31` | High |
| 5 | Homepage newsletter copy says "Okami sends" — spec says "Okami Labs sends" | `app/page.tsx:203` | Low |
| 6 | Contact newsletter copy says "Okami sends" — spec says "Okami Labs sends" | `app/contact/page.tsx:92` | Low |
| 7 | Building page hero has colored `<span>` in headline — copy doc shows plain text, no color split | `app/building/page.tsx:27` | Low |
| 8 | CalEmbed uses `cal.com/placeholder` URL and hardcodes slate-blue brand color | `components/CalEmbed.tsx:13,31` | Note (placeholder is intentional for now) |

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `components/Navigation.tsx` | Modify | Fix active underline color + logo text |
| `components/CTASection.tsx` | Modify | Add `variant` prop pass-through for context-aware button color |
| `app/not-found.tsx` | Modify | Replace slate-blue button with neutral/ash styling |
| `app/page.tsx` | Modify | Fix newsletter copy ("Okami" → "Okami Labs") |
| `app/contact/page.tsx` | Modify | Fix newsletter copy ("Okami" → "Okami Labs") |
| `app/services/page.tsx` | Modify | Pass burgundy variant to CTASection |
| `app/about/page.tsx` | Modify | Pass burgundy variant to CTASection |
| `app/building/page.tsx` | Modify | Remove colored span from hero headline |

---

## Task 1: Fix Navigation Brand Color Violation

The nav underline on active/hover links uses `bg-slate-blue`. Slate-blue is Labs-only per brand rules. Navigation is a brand-level element — it should use `bg-off-white` instead.

Also fix logo text: "Okami Labs" → "Okami" (per website-copy.md Global Elements section).

**Files:**
- Modify: `components/Navigation.tsx:42,58`

- [ ] **Step 1: Fix the active underline color**

In `components/Navigation.tsx`, change the underline span:

```tsx
// FROM:
className={`absolute -bottom-1 left-0 h-px bg-slate-blue transition-all duration-300 ${
  isActive(link.href) ? 'w-full' : 'w-0 group-hover:w-full'
}`}

// TO:
className={`absolute -bottom-1 left-0 h-px bg-off-white/50 transition-all duration-300 ${
  isActive(link.href) ? 'w-full' : 'w-0 group-hover:w-full'
}`}
```

- [ ] **Step 2: Fix logo text**

```tsx
// FROM:
<span className="font-mono text-sm tracking-wider uppercase text-off-white">
  Okami Labs
</span>

// TO:
<span className="font-mono text-sm tracking-wider uppercase text-off-white">
  Okami
</span>
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -10
```

Expected: clean build, no errors.

- [ ] **Step 4: Commit**

```bash
git add components/Navigation.tsx
git commit -m "fix nav: use brand-neutral underline color, correct logo text to Okami"
```

---

## Task 2: Make CTASection Button Variant Configurable

CTASection always renders `variant="primary"` (slate-blue). But on Consulting/About pages, the CTA should use burgundy. Add a `buttonVariant` prop.

**Files:**
- Modify: `components/CTASection.tsx`

- [ ] **Step 1: Add buttonVariant prop**

Replace the full CTASection component:

```tsx
import Button from './Button';

interface CTASectionProps {
  headline: string;
  subheadline?: string;
  buttonText?: string;
  buttonHref?: string;
  buttonVariant?: 'primary' | 'secondary' | 'ghost';
  className?: string;
}

export default function CTASection({
  headline,
  subheadline,
  buttonText = 'Book a Consultation',
  buttonHref = '/contact',
  buttonVariant = 'primary',
  className = '',
}: CTASectionProps) {
  return (
    <section
      className={`py-24 md:py-32 border-t border-ash/10 ${className}`}
    >
      <div className="max-w-4xl mx-auto px-6 lg:px-8 text-center">
        <h2 className="font-playfair text-4xl md:text-5xl lg:text-6xl text-off-white mb-6 leading-tight">
          {headline}
        </h2>
        {subheadline && (
          <p className="font-body text-base md:text-lg text-ash mb-12 max-w-2xl mx-auto leading-relaxed">
            {subheadline}
          </p>
        )}
        <Button href={buttonHref} variant={buttonVariant}>
          {buttonText}
        </Button>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Update Services page CTA to use burgundy**

In `app/services/page.tsx`, the final CTASection call:

```tsx
// FROM:
<CTASection
  headline="Start with the diagnostic."
  subheadline="Every engagement begins with understanding the operational reality. Book a consultation to talk through your workflows and see if The Okami Review is the right starting point."
  buttonText="Book Your Consultation"
  buttonHref="/contact"
/>

// TO:
<CTASection
  headline="Start with the diagnostic."
  subheadline="Every engagement begins with understanding the operational reality. Book a consultation to talk through your workflows and see if The Okami Review is the right starting point."
  buttonText="Book Your Consultation"
  buttonHref="/contact"
  buttonVariant="secondary"
/>
```

- [ ] **Step 3: Update About page CTA to use burgundy**

In `app/about/page.tsx`, the final CTASection call:

```tsx
// FROM:
<CTASection
  headline="Start with The Okami Review."
  subheadline="A 45-minute conversation that produces a full picture of how your business runs, where it breaks, and what to fix first."
  buttonText="Request Your Okami Review"
  buttonHref="/contact"
/>

// TO:
<CTASection
  headline="Start with The Okami Review."
  subheadline="A 45-minute conversation that produces a full picture of how your business runs, where it breaks, and what to fix first."
  buttonText="Request Your Okami Review"
  buttonHref="/contact"
  buttonVariant="secondary"
/>
```

Note: Homepage CTA stays `primary` (slate-blue) — it's a brand-level page, but the CTA there says "Book Your Consultation" which is a general action, and the default primary works. The Building page CTA also stays `primary` since it's a Labs page.

- [ ] **Step 4: Verify build**

```bash
npm run build 2>&1 | tail -10
```

Expected: clean build.

- [ ] **Step 5: Commit**

```bash
git add components/CTASection.tsx app/services/page.tsx app/about/page.tsx
git commit -m "add buttonVariant to CTASection, use burgundy on consulting/about pages"
```

---

## Task 3: Fix 404 Page Brand Color

The 404 page uses a `bg-slate-blue` button. This is a brand-level page, not a Labs page. Use a ghost/neutral style instead.

**Files:**
- Modify: `app/not-found.tsx`

- [ ] **Step 1: Replace the slate-blue button with ghost styling**

In `app/not-found.tsx`, change the Link element:

```tsx
// FROM:
<Link
  href="/"
  className="inline-block px-8 py-4 bg-slate-blue text-off-white font-mono text-sm font-bold uppercase tracking-wider hover:bg-slate-blue/90 transition-colors"
>
  Go Home
</Link>

// TO:
<Link
  href="/"
  className="inline-block px-8 py-4 border border-ash text-ash font-mono text-sm uppercase tracking-wider hover:border-off-white hover:text-off-white transition-colors"
>
  Go Home
</Link>
```

- [ ] **Step 2: Also change the 404 number color from slate-blue to ash**

```tsx
// FROM:
<span className="font-mono text-8xl md:text-9xl text-slate-blue/10 block leading-none mb-8">

// TO:
<span className="font-mono text-8xl md:text-9xl text-ash/10 block leading-none mb-8">
```

- [ ] **Step 3: Verify build**

```bash
npm run build 2>&1 | tail -10
```

- [ ] **Step 4: Commit**

```bash
git add app/not-found.tsx
git commit -m "fix 404 page: use neutral colors instead of Labs slate-blue"
```

---

## Task 4: Fix Copy Discrepancies

Three minor copy issues found during audit.

**Files:**
- Modify: `app/page.tsx:203`
- Modify: `app/contact/page.tsx:92`
- Modify: `app/building/page.tsx:27`

- [ ] **Step 1: Fix homepage newsletter copy**

In `app/page.tsx`, line 203:

```tsx
// FROM:
Okami sends quarterly updates on new capabilities, deployment milestones, and

// TO:
Okami Labs sends quarterly updates on new capabilities, deployment milestones, and
```

- [ ] **Step 2: Fix contact newsletter copy**

In `app/contact/page.tsx`, line 92:

```tsx
// FROM:
Okami sends quarterly updates on new capabilities, deployment milestones, and

// TO:
Okami Labs sends quarterly updates on new capabilities, deployment milestones, and
```

- [ ] **Step 3: Fix building page hero headline**

In `app/building/page.tsx`, remove the colored span — the copy doc shows this as plain text:

```tsx
// FROM:
<h1 className="font-playfair text-5xl md:text-7xl lg:text-8xl leading-[1.05] text-off-white">
  Business outcomes,
  <br />
  <span className="text-slate-blue">not technical details.</span>
</h1>

// TO:
<h1 className="font-playfair text-5xl md:text-7xl lg:text-8xl leading-[1.05] text-off-white">
  Business outcomes, not technical details.
</h1>
```

- [ ] **Step 4: Verify build**

```bash
npm run build 2>&1 | tail -10
```

- [ ] **Step 5: Commit**

```bash
git add app/page.tsx app/contact/page.tsx app/building/page.tsx
git commit -m "fix copy: align newsletter text and building headline with spec"
```

---

## Task 5: Commit All Remaining Untracked Files

Everything else is clean against the spec. Commit the full site in logical chunks.

**Files:**
- All untracked files from git status

- [ ] **Step 1: Commit global styles and layout**

```bash
git add app/globals.css app/layout.tsx
git commit -m "add design system: custom fonts, color tokens, hero animations"
```

- [ ] **Step 2: Commit all components**

```bash
git add components/
git commit -m "add component library: Navigation, Footer, Button, Card, CTASection, HeroSection, FadeIn, CalEmbed, NewsletterForm, StatusDot"
```

- [ ] **Step 3: Commit homepage**

```bash
git add app/page.tsx
git commit -m "build homepage: hero, problem section, two arms, diagnostic callout, credibility, philosophy, newsletter, CTA"
```

- [ ] **Step 4: Commit inner pages**

```bash
git add app/about/page.tsx app/services/page.tsx app/building/page.tsx app/contact/page.tsx app/products/page.tsx app/not-found.tsx
git commit -m "add inner pages: about, services, building, contact, products redirect, 404"
```

- [ ] **Step 5: Commit API route**

```bash
git add app/api/newsletter/route.ts
git commit -m "add newsletter API placeholder (501 not implemented)"
```

- [ ] **Step 6: Commit gitignore updates**

```bash
git add .gitignore
git commit -m "update gitignore"
```

- [ ] **Step 7: Final build verification**

```bash
npm run build 2>&1 | tail -15
```

Expected: clean build, all 7 routes rendered.

---

## Self-Review

**Spec coverage:**
- ✅ All 6 pages exist with correct content from website-copy.md
- ✅ Navigation: wolf logo + "Okami" + page links, JetBrains Mono uppercase
- ✅ Footer: copyright + domain, minimal
- ✅ Color coding: Consulting = burgundy, Labs = slate-blue, brand = neutral
- ✅ Products redirects to /building (archived per spec)
- ✅ Cal.com embed on contact (placeholder URL — needs real link later)
- ✅ Newsletter placeholder (501 API)
- ✅ Hero animation (covered by separate plan, implemented)
- ✅ Typography: Playfair Display headings, JetBrains Mono UI/nav, Outfit body
- ✅ CTA on every page routing to booking

**Placeholder scan:** No TBD/TODO in plan steps. All code blocks complete.

**Type consistency:** `buttonVariant` prop uses same `'primary' | 'secondary' | 'ghost'` union as `Button`'s `ButtonVariant` type. ✓

**Not in scope (deliberate):**
- Real Cal.com URL (needs user's actual booking link)
- Newsletter integration (spec says placeholder at launch)
- Slide deck preview on Services page (spec says placeholder for real output)
- Docs/archived files — not part of the site, no commit needed
