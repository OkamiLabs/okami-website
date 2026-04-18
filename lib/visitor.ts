/**
 * Visitor identity + conversation provisioning for the widget backend.
 *
 * Phase 7: cookie values are signed as `<uuid>.<base64url(hmac_sha256)>`.
 * Tampered or unsigned cookies are ignored and a new visitor is provisioned
 * (no grace period — there are no existing prod visitors).
 *
 * The Fastify cookie-reader/setter pair is replaced with:
 *   - read:  `await cookies()` from `next/headers` (ASYNC in Next 16)
 *   - write: returned as `setCookieHeaders: string[]` so route handlers
 *            can forward them via `response.headers.append('set-cookie', ...)`.
 */

import { createHmac, randomUUID, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { sql } from '@/lib/db/client';

const COOKIE_NAME = 'visitor_id';
const COOKIE_MAX_AGE_SEC = 90 * 24 * 60 * 60; // 90 days
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEV_FALLBACK_SECRET = 'dev-insecure-secret-min-32-chars!!';

// Fail fast in production if secret is missing or too short.
if (
  process.env.VERCEL_ENV === 'production' &&
  (!process.env.COOKIE_SECRET || process.env.COOKIE_SECRET.length < 32)
) {
  throw new Error('COOKIE_SECRET missing or too short (min 32 chars)');
}

function cookieSecret(): string {
  return process.env.COOKIE_SECRET ?? DEV_FALLBACK_SECRET;
}

function signVisitorId(uuid: string): string {
  const mac = createHmac('sha256', cookieSecret()).update(uuid).digest();
  return `${uuid}.${mac.toString('base64url')}`;
}

function verifyVisitorCookie(raw: string): { valid: boolean; uuid: string | null } {
  const dot = raw.indexOf('.');
  if (dot < 0) return { valid: false, uuid: null };
  const uuid = raw.slice(0, dot);
  const sigB64 = raw.slice(dot + 1);
  if (!UUID_RE.test(uuid)) return { valid: false, uuid: null };

  let providedSig: Buffer;
  try {
    providedSig = Buffer.from(sigB64, 'base64url');
  } catch {
    return { valid: false, uuid: null };
  }

  const expectedSig = createHmac('sha256', cookieSecret()).update(uuid).digest();

  if (providedSig.length !== expectedSig.length) return { valid: false, uuid: null };
  try {
    const ok = timingSafeEqual(providedSig, expectedSig);
    return { valid: ok, uuid: ok ? uuid : null };
  } catch {
    return { valid: false, uuid: null };
  }
}

function buildVisitorCookie(uuid: string): string {
  const value = signVisitorId(uuid);
  const isProduction = process.env.VERCEL_ENV === 'production';
  const parts = [
    `${COOKIE_NAME}=${value}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${COOKIE_MAX_AGE_SEC}`,
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

  // HMAC-verify the cookie. Tampered/unsigned → mint a new visitor.
  const verified = rawCookie ? verifyVisitorCookie(rawCookie) : { valid: false, uuid: null };
  const cookieId = verified.valid ? verified.uuid : undefined;

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

  // No cookie, invalid signature, or stale visitor — provision both.
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
 * (history, error reports). Returns null if the cookie is missing,
 * tampered, or the row is absent.
 */
export async function getVerifiedVisitorId(): Promise<string | null> {
  const store = await cookies();
  const rawCookie = store.get(COOKIE_NAME)?.value;
  if (!rawCookie) return null;

  const { valid, uuid } = verifyVisitorCookie(rawCookie);
  if (!valid || !uuid) return null;

  const rows = (await sql`
    SELECT id FROM visitors WHERE id = ${uuid}
  `) as Array<{ id: string }>;

  return rows[0]?.id ?? null;
}
