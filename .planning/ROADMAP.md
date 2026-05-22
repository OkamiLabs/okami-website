# Roadmap — Okami Labs Website

## Milestones

- ✅ **v1.0 Codebase Health** — Phases 1–4 (shipped 2026-05-20)
- [ ] **v2.0 AI Chatbot** — Phases 5–7 (in progress)

## Phases

<details>
<summary>✅ v1.0 Codebase Health (Phases 1–4) — SHIPPED 2026-05-20</summary>

- [x] **Phase 1: Revenue Protection** — Sentry installed, BOOKING_FAILED_POST_CHARGE alerted, payment rate limits instance-safe (completed 2026-05-19)
- [x] **Phase 2: Infrastructure & Security** — Migration path corrected, token table cleaned, timing leak fixed, CSP gap documented (completed 2026-05-20)
- [x] **Phase 3: AI Scaffolding Cleanup** — Dead imports fixed, domain corrected, seed data matches live offerings (completed 2026-05-20)
- [x] **Phase 4: Tests & Hygiene** — Booking-flow unit tests, cache headers, admin query bounded, packages pinned, CLAUDE.md accurate (completed 2026-05-21)

Full details: `.planning/milestones/v1.0-ROADMAP.md`

</details>

### v2.0 AI Chatbot

- [ ] **Phase 5: Foundation + Live AI** — Fix v4→v5 API drift, enable streamText with correct token reconciliation, retire bookDiscoveryCall
- [ ] **Phase 6: System Prompt + Knowledge** — Build rich knowledge-complete system prompt, wire all conversational behaviors, direct visitors to /book
- [ ] **Phase 7: QA & Launch Prep** — Structured test pass, adversarial and multilingual coverage, polish before enabling CHATBOT_ENABLED in production

## Phase Details

### Phase 5: Foundation + Live AI
**Goal**: Visitors receive real Claude streaming responses in the widget, spend cap is protected against orphaned reservations, and the AI SDK v5 API surface is fully consistent across route and widget
**Depends on**: Phase 4 (v1.0 complete)
**Requirements**: CONV-01
**Success Criteria** (what must be TRUE):
  1. Sending a message in the widget produces a streaming Claude response — not a canned reply
  2. Closing the browser mid-stream does not orphan a token reservation (spend cap reconciles correctly via onAbort)
  3. The conversationId is present on every message including message 2+ (not just the first)
  4. Tool card rendering infrastructure is in place — the widget uses message.parts (v5), not message.toolInvocations (v4)
**Plans**: 3 plans
Plans:
- [x] 05-01-PLAN.md — Remove bookDiscoveryCall, rename parameters: to inputSchema: in tools.ts, remove ToolCallDisplay from widget types
- [x] 05-02-PLAN.md — Replace canned-reply stub with live streamText(), update Zod schemas for v5 UIMessage format, wire token reconciliation
- [x] 05-03-PLAN.md — Migrate widget to v5 (DefaultChatTransport, message.parts, GenericToolCard, status-based TypingIndicator, Slate Blue theme)
**UI hint**: yes

### Phase 6: System Prompt + Knowledge
**Goal**: The chatbot accurately represents Okami across all knowledge domains — services, pricing, founder story, booking logistics, Labs/Agent Core — in the brand voice, and guides visitors toward /book when they express booking intent
**Depends on**: Phase 5
**Requirements**: CONV-02, CONV-03, CONV-04, CONV-05, CONV-06, CONV-07, QA-01
**Success Criteria** (what must be TRUE):
  1. A visitor asking "what does the Okami Review cost and what do I get?" receives an accurate, confident answer ($299, deliverables) without hedging or hallucination
  2. A visitor asking about the founder or company philosophy gets a response consistent with the About page — brand voice, not first person
  3. A visitor asking how booking works gets a clear walkthrough of the /book flow and what to expect after payment
  4. A visitor asking about "Agent Core" or "what do you build?" gets an accurate Labs/Agent Core answer
  5. A visitor asking an off-topic or adversarial question (e.g., "write me a poem") is redirected gracefully without breaking character, and a visitor expressing any booking intent is directed to /book
**Plans**: 2 plans
Plans:
- [x] 06-01-PLAN.md — Draft knowledge-complete system prompt from website sources; present for user review (D-04 approval gate)
- [x] 06-02-PLAN.md — Write approved prompt into system-prompt.ts, remove lookupService from tools.ts, commit
**UI hint**: no

### Phase 7: QA & Launch Prep
**Goal**: The chatbot passes a structured quality bar across normal, edge-case, and adversarial scenarios before CHATBOT_ENABLED is set in production
**Depends on**: Phase 6
**Requirements**: QA-02
**Success Criteria** (what must be TRUE):
  1. A structured test pass covering at minimum: English booking journey, Portuguese or Spanish conversation opener, adversarial prompt (jailbreak attempt), off-topic deflection, and multi-turn context retention — all pass without failures
  2. The widget handles error states gracefully — rate limit hit, spend cap exhausted, and API timeout each surface as a readable message rather than a blank or broken widget
  3. The chatbot is subjectively impressive when reviewed against the "excellent AI product" bar — confident, brand-consistent, and useful on the first message
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Milestone | Plans | Status | Completed |
|-------|-----------|-------|--------|-----------|
| 1. Revenue Protection | v1.0 | 3/3 | Complete | 2026-05-19 |
| 2. Infrastructure & Security | v1.0 | 2/2 | Complete | 2026-05-20 |
| 3. AI Scaffolding Cleanup | v1.0 | 2/2 | Complete | 2026-05-20 |
| 4. Tests & Hygiene | v1.0 | 2/2 | Complete | 2026-05-21 |
| 5. Foundation + Live AI | v2.0 | 0/3 | Not started | - |
| 6. System Prompt + Knowledge | v2.0 | 0/2 | Not started | - |
| 7. QA & Launch Prep | v2.0 | 0/? | Not started | - |
