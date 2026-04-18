/**
 * Visitor identity + conversation provisioning for the widget backend.
 *
 * Ported from okami-widget/server/lib/visitor.ts. The Fastify
 * cookie-reader/setter pair is replaced with:
 *   - read:  `await cookies()` from `next/headers` (ASYNC in Next 16)
 *   - write: returned as `setCookieHeaders: string[]` so route handlers
 *            can forward them via `response.headers.append('set-cookie', ...)`.
 *
 * Why not set the cookie here? Next's `cookies()` store is read-only in
 * route handlers unless you return the response from a server action;
 * letting the caller attach Set-Cookie headers keeps this helper portable.
 *
 * Phase I status:
 *   - Cookies are plain UUIDs (no HMAC yet).
 *   - TODO (Phase 7): sign the cookie value — `<uuid>.<base64url(hmac)>`,
 *     verify with timingSafeEqual, reject tampered cookies.
 */

import { randomUUID } from 'node:crypto';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db/client';

const COOKIE_NAME = 'visitor_id';
const ONE_YEAR_SEC = 365 * 24 * 60 * 60;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function buildVisitorCookie(value: string): string {
  const isProduction = process.env.VERCEL_ENV === 'production';
  const parts = [
    `${COOKIE_NAME}=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${ONE_YEAR_SEC}`,
  ];
  if (isProduction) parts.push('Secure');
  return parts.join('; ');
}

export interface VisitorContext {
  visitorId: string;
  conversationId: string;
  setCookieHeaders: string[];
}

/**
 * Resolve the visitor from the cookie if present; otherwise mint a new
 * visitor + conversation and return the Set-Cookie header the caller
 * should attach.
 */
export async function getOrCreateVisitor(): Promise<VisitorContext> {
  const store = await cookies();
  const rawCookie = store.get(COOKIE_NAME)?.value;
  // Reject malformed cookie values without a DB round-trip. Prevents cheap
  // probing of the visitors table with adversarial cookie payloads.
  const cookieId = rawCookie && UUID_RE.test(rawCookie) ? rawCookie : undefined;

  if (cookieId) {
    const existing = (await sql`
      SELECT id FROM visitors WHERE id = ${cookieId}
    `) as Array<{ id: string }>;

    if (existing[0]) {
      // Existing visitor — find or create their latest conversation.
      const conv = (await sql`
        SELECT id FROM conversations
         WHERE visitor_id = ${cookieId}
         ORDER BY created_at DESC
         LIMIT 1
      `) as Array<{ id: string }>;

      if (conv[0]) {
        return {
          visitorId: cookieId,
          conversationId: conv[0].id,
          setCookieHeaders: [],
        };
      }

      const newConvId = randomUUID();
      await sql`
        INSERT INTO conversations (id, visitor_id)
        VALUES (${newConvId}, ${cookieId})
      `;
      return {
        visitorId: cookieId,
        conversationId: newConvId,
        setCookieHeaders: [],
      };
    }
  }

  // No cookie or stale cookie — provision both.
  const visitorId = randomUUID();
  const conversationId = randomUUID();

  await sql`INSERT INTO visitors (id) VALUES (${visitorId})`;
  await sql`
    INSERT INTO conversations (id, visitor_id)
    VALUES (${conversationId}, ${visitorId})
  `;

  return {
    visitorId,
    conversationId,
    setCookieHeaders: [buildVisitorCookie(visitorId)],
  };
}

/**
 * Read-only visitor lookup for endpoints that must NOT mint new visitors
 * (history, error reports). Returns null if the cookie is missing or the
 * row is absent.
 *
 * TODO (Phase 7): verify HMAC signature before DB lookup.
 */
export async function getVerifiedVisitorId(): Promise<string | null> {
  const store = await cookies();
  const rawCookie = store.get(COOKIE_NAME)?.value;
  if (!rawCookie || !UUID_RE.test(rawCookie)) return null;

  const rows = (await sql`
    SELECT id FROM visitors WHERE id = ${rawCookie}
  `) as Array<{ id: string }>;

  return rows[0]?.id ?? null;
}
