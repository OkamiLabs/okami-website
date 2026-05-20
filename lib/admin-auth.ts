/**
 * lib/admin-auth.ts — Shared HTTP Basic Auth verification for admin routes.
 *
 * Used by both `middleware.ts` (via proxy.ts) and `app/admin/conversations/route.ts`
 * so the auth guard runs at two layers: the middleware intercepts before the route
 * handler executes, and the route handler re-checks as a defense-in-depth measure.
 *
 * Runtime: Node.js only. Do NOT import from Edge runtime code.
 */

import { timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';

/**
 * Verify HTTP Basic Auth credentials against env vars:
 *   ADMIN_USER            — expected username (plaintext)
 *   ADMIN_PASSWORD_HASH   — hex(HMAC-SHA256(ADMIN_AUTH_PEPPER, password))
 *   ADMIN_AUTH_PEPPER     — HMAC key (openssl rand -base64 48)
 *
 * Returns true only if username and password both pass constant-time comparison.
 */
export async function verifyAdminBasicAuth(request: NextRequest | Request): Promise<boolean> {
  const headers = request.headers;
  const header = headers.get('authorization');
  if (!header?.startsWith('Basic ')) return false;

  const expectedUser = process.env.ADMIN_USER;
  const expectedHashHex = process.env.ADMIN_PASSWORD_HASH;
  const pepper = process.env.ADMIN_AUTH_PEPPER;
  if (!expectedUser || !expectedHashHex || !pepper) return false;

  let decoded: string;
  try {
    decoded = atob(header.slice(6));
  } catch {
    return false;
  }
  const idx = decoded.indexOf(':');
  if (idx < 0) return false;
  const user = decoded.slice(0, idx);
  const password = decoded.slice(idx + 1);

  // Constant-time username compare using timingSafeEqual.
  // Pad both sides to equal length so length alone reveals nothing; if lengths
  // differ we inject a guaranteed mismatch byte so the compare returns false.
  {
    const userBuf = Buffer.from(user, 'utf8');
    const expectedBuf = Buffer.from(expectedUser, 'utf8');
    const len = Math.max(userBuf.length, expectedBuf.length);
    const a = Buffer.alloc(len, 0);
    const b = Buffer.alloc(len, 0);
    userBuf.copy(a);
    expectedBuf.copy(b);
    // If original lengths differ, force a mismatch byte at position 0 of `a`
    // so timingSafeEqual returns false regardless of contents.
    if (userBuf.length !== expectedBuf.length) {
      a[0] = a[0] ^ 0xff;
    }
    if (!timingSafeEqual(a, b)) return false;
  }

  // HMAC-SHA256(pepper, password) → hex, constant-time compare to expectedHashHex.
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pepper),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const sigBuf = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(password));
  const sigHex = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  if (sigHex.length !== expectedHashHex.length) return false;
  let hashOk = 0;
  for (let i = 0; i < sigHex.length; i++) {
    hashOk |= sigHex.charCodeAt(i) ^ expectedHashHex.charCodeAt(i);
  }
  return hashOk === 0;
}
