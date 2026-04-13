# Okami Website Specification

> Reference document for okamilabs.com — all design and content decisions captured here.
> Last updated: March 31, 2026

---

## Overview

**Purpose:** Credibility anchor for outreach. Not a sales funnel — a trust signal.
**Primary goal:** Visitor understands what Okami is and books a consultation.
**Domain:** okamilabs.com
**Tech stack:** Next.js on Vercel
**Booking:** Cal.com (embedded on Contact page, linked from CTAs across the site)

---

## Brand Identity

### Philosophy

- **"Silent Business"** — helping businesses fix their operational foundations before implementing AI, scaling quietly through proper structure rather than adding noise
- **"Silent Giant"** — causing massive waves without making noise. Quiet power, understated impact
- Named after the wolf (_Okami_ = wolf in Japanese). Wolves hunt silently

### Visual Identity

- **Logo:** Wolf head on black background
- **Fonts:** JetBrains Mono (technical, monospaced) + Playfair Display (editorial, sophisticated)
- **Backgrounds:** Dark (#0a0a0a or similar)
- **No imagery:** No hero photos, stock images, or abstract AI graphics. Typography and whitespace do the visual work

### Color Palette

| Color      | Hex       | Role                                                         |
| ---------- | --------- | ------------------------------------------------------------ |
| Slate Blue | `#6878A0` | Primary accent — buttons, links, hover states, Labs identity |
| Burgundy   | `#8B3A3A` | Secondary accent — Consulting identity, emphasis moments     |
| Ash        | `#9A918A` | Body text, secondary labels, ghost buttons, neutral layer    |
| Off-white  | `#e8e6e1` | Headings, logo, high-emphasis text                           |

**No gold. No teal. No bright or saturated colors.**

### Design Principles

- Stripped-back aesthetic — typography and whitespace do the visual work, not imagery
- Every element earns its place — no carousels, stock photos, or filler
- Generous whitespace, strong typography hierarchy
- One or two subtle animations at most (fade on scroll)
- Consulting sections use Burgundy accents, Labs sections use Slate Blue

---

## Site Structure

Six pages total:

1. Home
2. About
3. Services (Consulting)
4. Products (Labs)
5. What We're Building
6. Contact

### Global Elements

**Navigation:** Wolf logo (left) + page links (right). JetBrains Mono, small caps or uppercase, tight letter-spacing. Active state in off-white, inactive in Ash.

**Footer:** Minimal — copyright, domain, maybe a single line. Consistent across all pages.

**CTA pattern:** Every page ends with a call to action that routes to booking. Button text and tone vary by page context.

---

## Page-by-Page Content Plan

### Page 1: Home

The most important page. Does 80% of the work. Most visitors won't go deeper.

**Section 1 — Hero**

- Bold headline in Playfair Display capturing the Silent Business philosophy
- Tone: confident statement, not a sales pitch (territory: "Scale silently" / "Structure before speed")
- One-liner underneath in JetBrains Mono
- Two CTAs: "Book a consultation" (Slate Blue fill) + "Learn more" (Ash ghost/border)
- No imagery. Wolf logo lives in nav only. Let the statement breathe

**Section 2 — The Problem**

- 2-3 lines naming the pain of noisy AI adoption
- Most businesses bolt on AI tools without changing how they operate. More noise, not more output
- Sets up Okami's positioning without explicitly saying "we're different"

**Section 3 — Two Arms (Consulting + Labs)**

- Two cards side by side
- Consulting (left, Burgundy tag): one-sentence description + link to Services page
- Labs (right, Slate Blue tag): one-sentence description + link to Products page
- Visitor understands: you advise AND you build

**Section 4 — Operations Diagnostic Callout**

- Brief feature block introducing the diagnostic as the tangible starting point
- "This is how every engagement starts"
- Links to the Services page for detail
- Not a full description — just enough to signal substance

**Section 5 — Credibility Signal**

- Brief, factual background: web development + IT operations + AI systems
- Framed as "we've worked on both sides of the problem"
- 3-4 items laid out horizontally in Ash text
- No resume energy — just proof of range

**Section 6 — Philosophy Anchor**

- One strong line about Silent Business
- Styled as a pull quote: Playfair Display, larger size, centered, generous whitespace
- The moment the brand identity lands

**Section 7 — CTA Footer**

- "Ready to talk?" or similar
- Cal.com booking button
- Simple close

---

### Page 2: About

Where the human story lives. Establishes why Okami exists and why the founder is the right person to run it.

**Voice:** Brand voice throughout — "Okami was founded on..." not "I built Okami because..."

**Section 1 — The Philosophy**

- Silent Business as a concept, not a tagline
- Why quiet matters: businesses drown in tools, dashboards, meetings about meetings
- The best systems disappear into the workflow
- 3-4 sentences, brand voice

**Section 2 — The Name**

- Okami means wolf in Japanese. Wolves hunt silently
- Brand origin story — it actually means something, not a random startup name
- Short but given room to breathe

**Section 3 — The Founder**

- Name, background, no photo
- Dual credibility angle: web dev experience = understands what's being built, IT experience = understands operational reality of the businesses being consulted for
- Most people in AI consulting have one or the other. Okami has both
- Framed as "this is why the approach works" not as a personal bio

**Section 4 — The Structure**

- Why Consulting and Labs are separate
- The company that advises isn't the same arm that builds — by design
- Reinforces trust and intentionality

**Section 5 — CTA**

- "Want to talk?" + booking link

---

### Page 3: Services (Consulting)

Okami Consulting's page. Communicates approach and philosophy without locking into a rigid service menu. Operations Diagnostic is the one concrete feature.

**Section 1 — Consulting Philosophy**

- What makes Okami's consulting different
- Before you adopt tools, understand your operations clearly enough to know where automation helps
- Most businesses skip this step. Okami doesn't
- 3-4 sentences, brand voice

**Section 2 — Operations Diagnostic (Featured)**

- Centerpiece of the page — give it room
- What it is, what a client gets, how it works at a high level
- Framing: "This is where every engagement starts"
- Positions the diagnostic as entry point, not standalone product
- **Visual proof point:** Placeholder for slide deck preview (swap in real diagnostic output when ready)
- Burgundy accent carries this section

**Section 3 — Areas of Focus**

- Short blocks (not bullet lists) describing types of problems Okami helps with:
  - Operational structure
  - Workflow automation readiness
  - AI tool selection and integration strategy
  - Scaling without adding headcount
- Intentionally broad — capability zones, not packaged services

**Section 4 — How It Works**

- Simple three-step flow: Talk → Diagnose → Recommend
- Reduces friction — visitor sees what happens after they click "book"
- No complex process chart

**Section 5 — CTA**

- "Start with a conversation" + booking button

---

### Page 4: Products (Labs)

Okami Labs' page. Shows that Okami doesn't just advise — it ships working systems.

**Section 1 — Labs Philosophy**

- What Labs does and why it exists separately
- The same company that diagnoses also builds — but advisory and build are deliberately separate
- Honest advice first, purpose-built solutions second
- 2-3 sentences, brand voice

**Section 2 — Okami Agent Core (Platform Feature)**

- Centerpiece of the page
- Framed as a platform, not a collection of tools
- Shared base architecture, all agents extend through configuration
- Deployable and repeatable — not custom builds every time
- **Visual element:** Simple architecture diagram showing Agent Core at center with capability areas branching out
- Slate Blue accent carries this section

**Section 3 — Capability Areas**

- Three cards (fourth added when ready):
  - **Internal ops** — status: in development
  - **Sales / lead intake** — status: in development
  - **Retention / customer follow-up** — status: in development
- Each card: title, one-liner description, status indicator
- "Powered by Okami Agent Core" subtle note on each card
- Intelligence / market snapshot added later when ready

**Section 4 — "Powered by Okami Agent Core"**

- Tagline-weight branded statement
- Reinforces platform > products positioning
- Understated, not a full section

**Section 5 — CTA**

- "Let's build something" + booking button
- Slightly different tone — partnership invitation, not consultation offer

---

### Page 5: What We're Building

Makes Okami feel alive. Shows momentum. Framed around business outcomes, not technical details. Agents stay invisible — only the problems they solve are visible.

**Section 1 — Opening Statement**

- Transparent but confident: "We're actively building AI systems that handle the work businesses shouldn't be doing manually"
- Tone: "we show our work" not "we're still figuring it out"
- 2-3 sentences, brand voice

**Section 2 — Business Scenarios**
Three cards, each framed as a business outcome:

1. **Automated operations monitoring**
   - A system that watches business processes, flags breakdowns, and routes fixes without human intervention
   - Status: in development

2. **Automated outreach follow-up**
   - Leads that go cold get re-engaged systematically, not manually
   - Status: in development

3. **Proactive client follow-up**
   - The system reaches out to clients at the right moments, collects feedback, flags churn risk
   - Status: in development

- Each card: title, problem description, status dot + label
- Status indicators: colored dot + text (Slate Blue for "in development", green for "live")
- Subtle "Powered by Okami Agent Core" on each

**Section 3 — Platform Thread**

- One line: "Every scenario above is powered by the same modular platform"
- Links to the Products page
- Reinforces the system story

**Section 4 — CTA**

- Booking button + newsletter placeholder
- "Want to see where this goes?" or similar
- Newsletter: email input + subscribe button (can be non-functional at launch)

---

### Page 6: Contact

The simplest page. One path, no ambiguity.

**Section 1 — Heading**

- Direct and warm: "Let's talk" or "Start a conversation"
- Playfair Display, generous whitespace
- One line underneath setting expectations: "Book a free consultation"

**Section 2 — Cal.com Embed**

- Booking widget, front and center
- Styled to match dark background
- Primary and only conversion path — no contact form, no direct email displayed

**Section 3 — Newsletter Placeholder**

- "Follow the build" with email input and subscribe button
- Doesn't need to be functional at launch
- Infrastructure in place for when updates begin

---

## Key Decisions Log

| Decision                                 | Rationale                                                                                            |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| No standalone portfolio page             | Thin content hurts credibility more than no page. Proof points folded into Services/Products instead |
| "What We're Building" page added         | Shows momentum, keeps site feeling alive, content graduates to case studies over time                |
| Brand voice (not first person)           | "Present but understated" — company feels bigger without pretending                                  |
| No direct email on Contact               | One conversion path. Booking only. Confidence through focus                                          |
| Business scenarios over agent names      | Business owners care about outcomes, not architecture. Technical depth lives on Products page        |
| Operations Diagnostic as entry point     | "Every engagement starts here" — makes one offering feel like the beginning of something bigger      |
| Slide deck placeholder for diagnostic    | Swap in real output when ready — page levels up without structural changes                           |
| Combined palette over single accent      | Three colors with clear roles prevent monotony across six pages                                      |
| Burgundy = Consulting, Slate Blue = Labs | Subtle visual distinction reinforces the two-arm structure without separate branding                 |
