# Phase I — Port Widget to website-v3 + Transport Hardening

> **Target repo**: `/Users/lucas/Projects/website-v3` (Next.js 16 App Router, Vercel Hobby, Tailwind v4).
> **Source repo**: `/Users/lucas/Projects/Okami Labs/okami-widget` (Fastify backend + Vite widget). Retires after port.
> **Audience**: Claude Code. Rationale lives in memory (`project_threat_model.md`, `project_product_model.md`, `feedback_staged_scope.md`).

## Stack (locked)

- **Runtime**: Next.js 16 App Router on Vercel Hobby. Fluid Compute is the default — `maxDuration` up to 300s on Hobby. **No Pro upgrade required for Phase II.**
- **DB**: Neon serverless Postgres via `@neondatabase/serverless` (HTTP driver).
- **LLM (Phase II)**: Claude Haiku 4.5 via `@ai-sdk/anthropic` — **stub-only in Phase I; chatbot off**.
- **Errors**: `@sentry/nextjs` (Phase 9).
- **Domain**: okamilabs.com.
- **Request interception**: `proxy.ts` at repo root (Next 16 renamed `middleware.ts` → `proxy.ts`; same concept).

## Resolved open questions

| # | Question | Answer |
|---|---|---|
| 1 | Target repo | `/Users/lucas/Projects/website-v3` |
| 2 | Vercel plan | Hobby (Phase I + II — 300s `maxDuration` available) |
| 3 | Neon URLs | **User to provision Neon project** → provide pooler + direct URLs before Phase 0 can start |
| 4 | Cookie grace | **Skipped** — no existing prod widget visitors |
| 5 | EU list | `AT,BE,BG,HR,CY,CZ,DK,EE,FI,FR,DE,GR,HU,IE,IT,LV,LT,LU,MT,NL,PL,PT,RO,SK,SI,ES,SE,IS,LI,NO` — **UK excluded** |
| 6 | Sentry | Create Next.js project in Sentry dashboard before Phase 9 |

## Repo integration notes

- **Existing `lib/rate-limit.ts`** is in-memory, IP-only, used by `/book` flow. **Leave untouched.** New chat rate-limit lives in `lib/rate-limit-chat.ts` (Neon-backed).
- **Existing CSP in `next.config.ts`** allows Stripe, Beehiiv, Vercel Analytics. **Source of truth stays there.** `proxy.ts` does NOT set CSP — only per-request logic (origin/geo/kill-switch/admin).
- **Existing `/book` Stripe + Cal.com flow stays as-is.** Phase II's `prepareCheckoutLink` (later) will target `/book`, not an iframe.
- **Widget source** (`widget/` in okami-widget) lands at `website-v3/widget/`. Built output lands at `public/widget.js`.

## Phase order

```
0+1: Port Fastify → App Router routes + Neon driver (single PR)
2:   proxy.ts (origin + geo + extra headers — CSP stays in next.config.ts)
3:   Admin basic auth (in proxy.ts)
4:   Stub /api/chat + CHATBOT_ENABLED gate
5:   Widget kill-switch (in proxy.ts)
6:   Zod caps + page_context persistence
7:   Cookie signing + conversationId fall-through fix   [MUST precede 8]
8:   Neon-backed rate limits + spend-cap TOCTOU
9:   Sentry wizard
10:  Widget build + okami-widget repo cleanup
```

Critical path: **0 → 2 → 7 → 8**. Phases 3, 4, 5, 6, 9 parallelizable after Phase 2.

---

## Phase 0+1 — Port + Neon driver

### Files to create (in `website-v3/`)

```
app/api/chat/route.ts                          # replaces server/routes/chat.ts
app/api/conversations/[id]/messages/route.ts   # replaces server/routes/history.ts
app/api/widget-errors/route.ts                 # replaces server/routes/errors.ts (renamed to avoid confusion)
app/api/widget-health/route.ts                 # new, exempt from origin check
app/admin/conversations/route.ts               # replaces server/admin/conversations.ts
lib/db/client.ts                               # neon() HTTP driver
lib/visitor.ts                                 # HMAC-signed cookie helpers (Phase 7)
lib/rate-limit-chat.ts                         # Phase 8 (NOT lib/rate-limit.ts — that's for /book)
lib/spend-cap.ts                               # Phase 8
lib/ai/system-prompt.ts                        # moved; not imported in Phase I
lib/ai/tools.ts                                # moved; not imported in Phase I
lib/notifications.ts                           # moved; not imported in Phase I
db/migrations/001_initial.sql                  # moved
db/migrations/002_seed_services.sql            # moved
widget/                                        # moved from okami-widget/widget/
```

Note: `/api/health` is namespaced as `/api/widget-health` to avoid colliding with any future health endpoint on the main site. Same for `/api/errors` → `/api/widget-errors`.

### Route handler conventions (Next 16)

```ts
// app/api/chat/route.ts
export const runtime = 'nodejs';
export const maxDuration = 60;  // Phase I stub is fast; Phase II can raise to 300

import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';  // NOTE: now async, must await
import { ipAddress } from '@vercel/functions';

export async function POST(request: NextRequest) {
  // 1. Manual size check (content-length > 262144 → 413)
  // 2. JSON parse in try/catch → 400
  // 3. Zod validate (Phase 6)
  // 4. getOrCreateVisitor(request) → { visitorId, conversationId, setCookieHeaders } (Phase 7)
  // 5. Rate-limit per-visitor + per-IP (Phase 8)
  // 6. Spend-cap reserve (Phase 8; Phase I reserves=0)
  // 7. Conversation ownership check — 404 if mismatch (Phase 7; NO silent fall-through)
  // 8. page_context persistence (Phase 6)
  // 9. Branch on CHATBOT_ENABLED:
  //    '1' (Phase II): streamText({...}).toUIMessageStreamResponse({ originalMessages: messages })
  //    '0' (Phase I):  INSERT user + canned assistant; return 200 JSON
  // 10. Response headers: x-conversation-id + any Set-Cookie from step 4
}
```

**Phase I canned assistant text**: `"Hi — the chatbot is in beta. Leave a note and we'll follow up."`

### `lib/db/client.ts`

```ts
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL missing');
}

export const sql = neon(process.env.DATABASE_URL);
// Tagged-template use only: sql`SELECT ... WHERE id = ${id}`  (parameterized, safe)
// For multi-statement transactions: sql.transaction([sql`...`, sql`...`])  (HTTP batch; no interactive BEGIN/COMMIT)
```

Do NOT export `pg.Pool`. Driver does not auto-detect pooled vs direct URLs — use the pooler URL (`-pooler.neon.tech`) for runtime.

### package.json changes (in website-v3)

**Add**:
- `@neondatabase/serverless`
- `@vercel/functions` (for `geolocation`, `ipAddress` — replaces removed `request.geo`/`request.ip`)
- `zod` (if not already present — check first)
- `ai` + `@ai-sdk/anthropic` (installed but not imported in Phase I)
- `@sentry/nextjs` (Phase 9)

**Add devDeps**:
- `node-pg-migrate`
- `pg` (required by node-pg-migrate; not imported at runtime — grep-verified in Phase 10)

**Nothing to remove** — website-v3 has no Fastify baggage.

### Migration run

Neon gives two URLs when you create a project:

```
DATABASE_URL=<pooler-url>?sslmode=require           # runtime, has "-pooler" in hostname
DATABASE_URL_UNPOOLED=<direct-url>?sslmode=require  # migrations, no "-pooler"

DATABASE_URL=$DATABASE_URL_UNPOOLED npm run migrate
```

`package.json` scripts:
```json
{
  "migrate": "node-pg-migrate -m db/migrations up",
  "migrate:down": "node-pg-migrate -m db/migrations down",
  "migrate:create": "node-pg-migrate -m db/migrations create"
}
```

### Verify

```bash
curl -i http://localhost:3000/api/widget-health
# → 200 {"ok":true}

curl -i -X POST http://localhost:3000/api/chat \
  -H 'Content-Type: application/json' -H 'Origin: http://localhost:3000' \
  -d '{"messages":[{"role":"user","content":"hi"}]}'
# → 200 with canned stub once Phase 4 lands
```

**Rollback**: `git revert` merge PR. Neon schema persists.

---

## Phase 2 — `proxy.ts` (origin + geo + extra headers)

**Next 16 rename**: `middleware.ts` → `proxy.ts`. Export function is `proxy()`, not `middleware()`. No `runtime` export — defaults to Node.js.

File: `website-v3/proxy.ts`

```ts
import { NextResponse, type NextRequest } from 'next/server';
import { geolocation } from '@vercel/functions';

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

// UK deliberately excluded — keeping UK visitors.
const EU = new Set([
  'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR',
  'HU','IE','IT','LV','LT','LU','MT','NL','PL','PT','RO','SK',
  'SI','ES','SE','IS','LI','NO',
]);
const EXEMPT_ORIGIN_CHECK = new Set(['/api/widget-health']);

function safeParseOrigin(referer: string | null): string | null {
  if (!referer) return null;
  try { return new URL(referer).origin; } catch { return null; }
}

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const { country } = geolocation(request);

  // 1. EU geo-block (all paths)
  if (country && EU.has(country)) {
    return new Response('Okami is not currently available in your region.', { status: 451 });
  }

  // 2. Widget kill-switch (Phase 5)
  if (process.env.WIDGET_DISABLED === '1') {
    if (pathname === '/widget.js') {
      return new Response("console.warn('[okami-widget] disabled');", {
        status: 200,
        headers: { 'Content-Type': 'application/javascript', 'Cache-Control': 'no-store' },
      });
    }
    if (pathname.startsWith('/api/') && pathname !== '/api/widget-health') {
      // Skip disable for booking APIs — they're part of the site, not the widget.
      const widgetRoutes = ['/api/chat', '/api/conversations', '/api/widget-errors'];
      if (widgetRoutes.some(r => pathname.startsWith(r))) {
        return new Response(JSON.stringify({ error: 'Widget disabled' }), {
          status: 503, headers: { 'Content-Type': 'application/json' },
        });
      }
    }
  }

  // 3. Admin basic auth (Phase 3)
  if (pathname.startsWith('/admin')) {
    const ok = verifyAdminBasicAuth(request);  // Phase 3
    if (!ok) {
      return new Response('Authentication required', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="admin", charset="UTF-8"' },
      });
    }
  }

  // 4. Origin allowlist for widget /api/* — PRODUCTION ONLY
  // Excludes /api/payment-intent, /api/book, /api/newsletter, /api/availability — those are
  // same-origin fetches from the site UI and already origin-locked by your Next config.
  const widgetApis = ['/api/chat', '/api/conversations', '/api/widget-errors'];
  const isWidgetApi = widgetApis.some(r => pathname.startsWith(r));
  if (isWidgetApi && !EXEMPT_ORIGIN_CHECK.has(pathname)) {
    if (process.env.VERCEL_ENV === 'production') {
      const origin = request.headers.get('origin');
      const referer = request.headers.get('referer');
      const src = origin ?? safeParseOrigin(referer);
      const allowed = (process.env.ALLOWED_ORIGINS ?? '')
        .split(',').map(s => s.trim()).filter(Boolean);
      if (!src || !allowed.includes(src)) {
        return new Response(JSON.stringify({ error: 'Forbidden origin' }), { status: 403 });
      }
    }
  }

  // 5. CSP/HSTS/etc stay in next.config.ts — do NOT set here.
  return NextResponse.next();
}
```

### Admin CSP override

`app/admin/conversations/route.ts` sets its own headers, overriding `next.config.ts`:

```ts
return new Response(html, {
  headers: {
    'Content-Security-Policy': "default-src 'self'; frame-ancestors 'none'",
    'X-Robots-Tag': 'noindex, nofollow',
    'Cache-Control': 'no-store',
    'X-Frame-Options': 'DENY',
  },
});
```

**VERIFY**: `curl -I /admin/conversations | grep -i csp` shows `frame-ancestors 'none'` wins.

### Verify

```bash
# Off-origin → 403 (production only)
curl -i -X POST https://okamilabs.com/api/chat -H 'Origin: https://evil.com' \
  -d '{"messages":[{"role":"user","content":"hi"}]}'
# → 403

# Existing site headers still present (from next.config.ts)
curl -I https://okamilabs.com/ | grep -Ei 'content-security|strict-transport|x-content-type'

# Geo-block (via EU VPN, NOT UK)
curl -I https://okamilabs.com/  # from EU → 451, from UK → 200
```

**Rollback**: delete `proxy.ts`.

---

## Phase 3 — Admin basic auth

`verifyAdminBasicAuth(request)` in proxy.ts, Edge-compatible (Web Crypto, no scrypt):

- Parse `Authorization: Basic <b64>` → `user:password`
- Constant-time compare `user` to `process.env.ADMIN_USER`
- Compute `hex(HMAC-SHA256(ADMIN_AUTH_PEPPER, password))` via `crypto.subtle`
- Byte-compare to `process.env.ADMIN_PASSWORD_HASH`

Hash generation (one-time, local):
```bash
node -e "const c=require('crypto');console.log(c.createHmac('sha256', process.env.ADMIN_AUTH_PEPPER).update(process.env.ADMIN_PASSWORD).digest('hex'))"
```

### Verify

```bash
curl -i https://okamilabs.com/admin/conversations                           # → 401
curl -i -u "$ADMIN_USER:wrong" https://okamilabs.com/admin/conversations    # → 401
curl -i -u "$ADMIN_USER:$ADMIN_PASSWORD" https://okamilabs.com/admin/conversations  # → 200
```

**Rollback**: `git revert`. If rolling back in prod, set `WIDGET_DISABLED=1` first.

---

## Phase 4 — Stub `/api/chat` + `CHATBOT_ENABLED` gate

Implemented inside Phase 0 handler. Key facts:
- Default env: `CHATBOT_ENABLED=0`
- Stub returns non-streaming JSON
- INSERTs user message AND canned assistant message (admin view + history API return data)
- Never imports `@ai-sdk/anthropic` when gate is 0 — use dynamic `import()` only on the `'1'` branch
- Canned text: `"Hi — the chatbot is in beta. Leave a note and we'll follow up."`

### Verify

```bash
CHATBOT_ENABLED=0 npx next dev
curl -i -X POST http://localhost:3000/api/chat \
  -H 'Origin: http://localhost:3000' -H 'Content-Type: application/json' \
  -d '{"messages":[{"role":"user","content":"hello"}]}'
# → 200, x-conversation-id header, canned body

# Confirm no provider call: set ANTHROPIC_API_KEY=invalid — still 200.
```

**Rollback**: edit canned string, redeploy.

---

## Phase 5 — Widget kill-switch

Implemented in proxy.ts (see Phase 2). Env: `WIDGET_DISABLED=0|1`.

- `/widget.js` → `console.warn(...)` stub (200)
- Widget API routes → 503; `/api/widget-health` still 200; booking/newsletter APIs untouched

### Verify

```bash
WIDGET_DISABLED=1 npx next dev
curl -i http://localhost:3000/widget.js              # → 200 stub
curl -i -X POST http://localhost:3000/api/chat       # → 503
curl -i http://localhost:3000/api/widget-health      # → 200
curl -i http://localhost:3000/api/payment-intent ... # → still works (not widget)
```

**Rollback**: Vercel dashboard → env var → `WIDGET_DISABLED=0`.

---

## Phase 6 — Zod caps + page_context persistence + body-size caps

### `app/api/chat/route.ts`

- **Body gate** (before `request.json()`): `content-length > 262144` → 413
- **Zod schema**:
  ```ts
  import { z } from 'zod';
  const messageSchema = z.object({
    role: z.enum(['user','assistant','system','tool']),
    content: z.string().max(4000),
  });
  const chatBodySchema = z.object({
    messages: z.array(messageSchema).min(1).max(50),
    conversationId: z.string().uuid().optional(),
    url: z.string().url().max(2048).optional(),
    title: z.string().max(256).optional(),
    meta: z.string().max(256).optional(),
  });
  ```

### `app/api/widget-errors/route.ts`

Body gate: `content-length > 8192` → 413.

### `page_context` persistence fix

After ownership check, before stub/LLM branch:
```ts
await sql`
  UPDATE conversations
     SET page_context = ${JSON.stringify({ url, title, meta })}::jsonb
   WHERE id = ${activeConversationId} AND page_context IS NULL
`;
```

**DO NOT** sanitize for prompt injection here — that's Phase II (happens at prompt-render time).

### Verify

```bash
# 51 messages → 400
# content >4000 chars → 400
# body >256KB → 413
# After a chat round-trip: SELECT page_context FROM conversations ORDER BY created_at DESC LIMIT 1 → not NULL
```

**Rollback**: `git revert`.

---

## Phase 7 — Cookie signing + `conversationId` fall-through fix

**MUST land before Phase 8** (rate-limit keys off verified `visitor_id`).

### Cookie format

```
visitor_id=<uuid>.<base64url(hmac_sha256(COOKIE_SECRET, uuid))>
Attributes: HttpOnly; Secure (prod only); SameSite=Lax; Path=/; Max-Age=7776000
```

No grace-period re-signing — no prior widget visitors exist.

### `lib/visitor.ts`

```ts
import { cookies } from 'next/headers';  // ASYNC in Next 16 — must await

if (process.env.VERCEL_ENV === 'production'
    && (!process.env.COOKIE_SECRET || process.env.COOKIE_SECRET.length < 32)) {
  throw new Error('COOKIE_SECRET missing or too short');
}

// signVisitorId(uuid): `${uuid}.${base64url(hmac_sha256(COOKIE_SECRET, uuid))}`
// verifyVisitorCookie(raw): { valid, uuid }  — timingSafeEqual on HMAC bytes

export async function getOrCreateVisitor(request) {
  const store = await cookies();
  const raw = store.get('visitor_id')?.value;
  // 1. If signed+valid → use embedded uuid
  // 2. Else → INSERT new visitor row, issue signed cookie
  // Returns { visitorId, conversationId, setCookieHeaders: string[] }
}

export async function getVerifiedVisitorId(request) {
  // Read-only; no fresh provision. Returns visitorId or null.
}
```

### `conversationId` fall-through fix

```ts
if (body.conversationId) {
  const rows = await sql`
    SELECT id FROM conversations
    WHERE id = ${body.conversationId} AND visitor_id = ${visitorId}
  `;
  if (rows.length === 0) {
    return Response.json({ error: 'Conversation not found' }, { status: 404 });
  }
  activeConversationId = rows[0].id;
}
// NO silent fall-through to the visitor's latest conversation.
```

### Consumers

| Route | Helper |
|---|---|
| `/api/chat` | `getOrCreateVisitor` |
| `/api/conversations/[id]/messages` | `getVerifiedVisitorId` |
| `/api/widget-errors` | `getVerifiedVisitorId` → fallback `ipAddress(request)` |

### Verify

```bash
# Missing COOKIE_SECRET in prod → 500 on first request
# Happy path: cookie is <uuid>.<sig>
# Tampered cookie → new visitor
# Forged conversationId → 404 (no fall-through)
```

**Rollback**: `git revert`.

---

## Phase 8 — Neon rate limits + spend-cap TOCTOU

**Requires Phase 7**.

### Migration `db/migrations/003_rate_limit_buckets.sql`

```sql
-- Up Migration
CREATE TABLE rate_limit_buckets (
  bucket_key   TEXT PRIMARY KEY,
  count        INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_rate_limit_buckets_expires_at ON rate_limit_buckets(expires_at);

CREATE TABLE token_reservations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  reserved        INTEGER NOT NULL,
  reserved_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reconciled      BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_token_reservations_reserved_at ON token_reservations(reserved_at);

-- Down Migration
DROP TABLE IF EXISTS token_reservations;
DROP TABLE IF EXISTS rate_limit_buckets;
```

### `lib/rate-limit-chat.ts`

(Filename is `rate-limit-chat.ts`, not `rate-limit.ts`, to avoid colliding with the existing in-memory limiter used by `/book`.)

```ts
import { sql } from '@/lib/db/client';

export async function checkChatRateLimit(scope: 'visitor' | 'ip', id: string, opts: { max: number; windowSec: number }) {
  const windowMs = opts.windowSec * 1000;
  const windowStartEpoch = Math.floor(Date.now() / windowMs) * windowMs;
  const bucketKey = `${scope}:${id}:${windowStartEpoch}`;
  const expiresAt = new Date(windowStartEpoch + windowMs * 2);

  const [{ count }] = await sql`
    INSERT INTO rate_limit_buckets (bucket_key, count, expires_at)
    VALUES (${bucketKey}, 1, ${expiresAt})
    ON CONFLICT (bucket_key) DO UPDATE SET count = rate_limit_buckets.count + 1
    RETURNING count
  `;
  if (count > opts.max) {
    return {
      allowed: false,
      retryAfter: Math.ceil((windowStartEpoch + windowMs - Date.now()) / 1000),
    };
  }
  return { allowed: true };
}
```

**Cleanup (opportunistic)**: every ~1/10 requests, fire-and-forget:
```sql
DELETE FROM rate_limit_buckets WHERE expires_at < NOW();
DELETE FROM token_reservations WHERE reserved_at < NOW() - INTERVAL '5 minutes' AND NOT reconciled;
```

### Rate-limit calls

| Endpoint | Key | Limit |
|---|---|---|
| `/api/chat` | `('visitor', visitorId)` | 20 / 10 min |
| `/api/chat` | `('ip', ip)` | 60 / 10 min |
| `/api/widget-errors` | `('ip', visitorId ?? ip)` | 30 / 10 min |

On `{allowed: false}` → 429 with `Retry-After` header. IP pulled via `ipAddress(request)` from `@vercel/functions`.

### Spend cap (`lib/spend-cap.ts`)

```ts
// reserveTokens(conversationId, estimated) → reservationId (INSERT into token_reservations)
// reconcileTokens(reservationId, actual) → void (UPDATE SET reserved=actual, reconciled=true)
// checkSpendCap() → { allowed, today, budget }
//   today = SUM messages.token_usage WHERE created_at::date = CURRENT_DATE
//         + SUM unreconciled token_reservations
```

Phase I: `estimated=0` (stub), still runs reserve/reconcile to exercise code path.

### Verify

```bash
npm run migrate

# Per-visitor 20/10min
for i in $(seq 1 25); do curl -s -b cookies.txt -X POST .../api/chat \
  -H 'Origin: https://okamilabs.com' -d '{"messages":[{"role":"user","content":"hi"}]}' \
  -o /dev/null -w "%{http_code}\n"; done
# → 20× 200, then 429

# TOCTOU: DAILY_TOKEN_BUDGET=2000, fire 2 concurrent, both reserve 1024 → one 429
```

**Rollback**: `git revert` + `npm run migrate:down`.

---

## Phase 9 — Sentry wizard

**Prerequisite**: Sentry account + Next.js project created in dashboard.

```bash
cd /Users/lucas/Projects/website-v3
npx @sentry/wizard@latest -i nextjs
```

Wizard on Next.js 16 creates:
- `instrumentation.ts` (server/edge registration hub)
- `sentry.server.config.ts`, `sentry.edge.config.ts`
- `instrumentation-client.ts` (**not** the old `sentry.client.config.ts`) — must export `onRouterTransitionStart = Sentry.captureRouterTransitionStart` for App Router nav instrumentation
- `app/global-error.tsx` (requires `'use client'` at top)
- Wraps `next.config.ts` with `withSentryConfig`

### Manual follow-up

- `app/api/widget-errors/route.ts`: after `console.error`, add `Sentry.captureMessage('widget_client_error', { extra: parsed.data })`
- Confirm `app/global-error.tsx` has `'use client'` and forwards to Sentry
- Confirm `instrumentation-client.ts` exports `onRouterTransitionStart`

### Verify

```bash
curl -i -X POST https://okamilabs.com/api/chat -H 'Origin: https://okamilabs.com' -d 'not-json'
# → 400, check Sentry dashboard for captured event

curl -i -X POST https://okamilabs.com/api/widget-errors -H 'Origin: https://okamilabs.com' \
  -H 'Content-Type: application/json' -d '{"message":"test","stack":"..."}'
# → 200, Sentry event tagged widget_client_error
```

**Rollback**: `git revert` + `npm uninstall @sentry/nextjs`.

---

## Phase 10 — Widget build + okami-widget cleanup

### Widget build integration

`website-v3/package.json`:
```json
{
  "scripts": {
    "build:widget": "vite build --config widget/vite.config.ts",
    "build": "npm run build:widget && next build"
  }
}
```

Keep Vite as a devDep.

### `widget/vite.config.ts` (must set)

- `build.outDir: '../public'`
- `build.emptyOutDir: false` ← **CRITICAL, otherwise wipes all of `public/`**
- `build.rollupOptions.output.entryFileNames: 'widget.js'` (single-file, no hashed chunks)
- Widget source at `website-v3/widget/`

### Final cleanup

In `website-v3/`:
- `grep -r "from 'pg'\|require('pg')" app/ lib/ proxy.ts` → zero hits at runtime (pg is devDep only)

In `okami-widget/`:
- Delete `server/`, `ecosystem.config.cjs`, `tsconfig.server.json`, `vite.config.ts`
- Retire the repo (archive on GitHub)

### Dev workflow

```bash
vercel link              # one-time, links to Vercel project
vercel env pull .env.local
npx next dev             # full dev stack including /widget.js from public/
npm run build:widget     # rebuild widget during iteration
DATABASE_URL=$DATABASE_URL_UNPOOLED npm run migrate
git push origin main     # deploy
```

**Rollback**: revert cleanup PR; route handlers from Phase 0 remain functional.

---

## `.env.example` additions (on top of existing vars)

```
# --- Neon (Phase 0/1) ---
DATABASE_URL=                # pooler URL, runtime (-pooler in hostname)
DATABASE_URL_UNPOOLED=       # direct URL, migrations

# --- Origin allowlist (Phase 2) ---
ALLOWED_ORIGINS=https://okamilabs.com,https://www.okamilabs.com

# --- Admin auth (Phase 3) ---
ADMIN_USER=
ADMIN_PASSWORD_HASH=         # hex(HMAC-SHA256(ADMIN_AUTH_PEPPER, password))
ADMIN_AUTH_PEPPER=           # openssl rand -base64 48

# --- Chatbot gate (Phase 4) ---
CHATBOT_ENABLED=0

# --- Widget kill-switch (Phase 5) ---
WIDGET_DISABLED=0

# --- Cookie secret (Phase 7) ---
COOKIE_SECRET=               # openssl rand -base64 48 — REQUIRED in prod

# --- Spend cap (Phase 8) ---
DAILY_TOKEN_BUDGET=100000

# --- Sentry (Phase 9, wizard-populated) ---
SENTRY_DSN=
NEXT_PUBLIC_SENTRY_DSN=
SENTRY_AUTH_TOKEN=

# --- Phase II (stubbed) ---
ANTHROPIC_API_KEY=
AI_MODEL=claude-haiku-4-5
SLACK_WEBHOOK_URL=
```

---

## Success criteria (Phase I launch gate)

- [ ] Port merged into website-v3; okami-widget retired
- [ ] `npm run migrate` applies 001, 002, 003 against Neon
- [ ] `/api/widget-health` → 200 on preview + production
- [ ] `/api/chat` with `Origin: https://evil.com` → 403 in production; with `Origin: https://okamilabs.com` → 200 (stub)
- [ ] Stub canned message returned; `x-conversation-id` header present; user + assistant messages in Neon
- [ ] Forged `conversationId` → 404 (no fall-through)
- [ ] `visitor_id` cookies signed; tampered cookie → new visitor
- [ ] Rate limits: per-visitor 20/10min, per-IP 60/10min
- [ ] Spend-cap enforces `DAILY_TOKEN_BUDGET` across concurrent reservations
- [ ] `curl -I /` still shows existing CSP from `next.config.ts` (Stripe/Beehiiv allowed)
- [ ] `curl -I /admin/conversations` with creds shows `frame-ancestors 'none'` + `X-Robots-Tag: noindex`
- [ ] Body >256KB → 413; messages >50 → 400; content >4000 → 400
- [ ] `page_context` column populated after first chat POST (not NULL)
- [ ] `/api/widget-errors` 8KB cap; forwarded to Sentry
- [ ] `WIDGET_DISABLED=1` → `/widget.js` stub + widget APIs 503; booking APIs unaffected
- [ ] `CHATBOT_ENABLED=0` — no Anthropic calls in logs
- [ ] EU geo-block returns 451 from EU IPs; UK IPs return 200
- [ ] Sentry captures seeded test error in production
- [ ] `pg` present as devDep only; no runtime imports
- [ ] Existing `/book` flow (Stripe + Cal.com) still works end-to-end — untouched regression check

---

## Handoff to Phase II

Before starting Phase II:

1. **Re-run planner** against `CHATBOT_HARDENING_PLAN.md` — product model says bot is info+funnel guide, not booking authority.
2. **Verify Phase I state**:
   - `CHATBOT_ENABLED=0` in prod
   - Signed cookies, Neon rate limits, origin + geo + admin auth live
   - `page_context` persisted but NOT sanitized in prompt
   - `lib/ai/tools.ts`, `lib/ai/system-prompt.ts`, `lib/notifications.ts` untouched
3. **Provision** `ANTHROPIC_API_KEY` in Vercel env vars.
4. **AI SDK v5 note**: Phase II uses `toUIMessageStreamResponse({ originalMessages: messages })`, NOT the old `toDataStreamResponse()`. `convertToModelMessages` replaces `convertToCoreMessages`.

Phase II adds: tool guards, prompt sanitization, first-message anchor drop, output moderation, Cal.com `checkAvailability`, HMAC-signed `prepareCheckoutLink` targeting the existing `/book` flow (no iframe), per-tool rate limits, flip `CHATBOT_ENABLED=1`.
