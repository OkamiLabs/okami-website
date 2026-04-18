/**
 * POST /api/chat
 *
 * Widget chat endpoint. Phase I is a **stub** — `CHATBOT_ENABLED=0` by
 * default and this handler NEVER imports `@ai-sdk/anthropic` or
 * `@ai-sdk/openai`. It returns a canned assistant reply and persists both
 * the user turn and the canned assistant turn so the admin dashboard and
 * history endpoint have data to show.
 *
 * Pipeline:
 *   1. Body size gate (content-length > 256KB → 413)
 *   2. Safe JSON parse (→ 400)
 *   3. Zod validation on body (Phase 6)
 *   4. getOrCreateVisitor() — HMAC-verified, may mint a new visitor
 *   5. Visitor + IP rate-limit + spend-cap gate (Phase 8 — cheap rejects)
 *   6. If `body.conversationId` is supplied, require ownership → else 404
 *   7. Persist page_context on first chat per conversation
 *   8. reserveTokens(0) — Phase I stub; exercises the reservation path
 *   9. INSERT user row, INSERT canned assistant row
 *  10. reconcileTokens(reservationId, 0)
 *  11. Respond 200 JSON with `x-conversation-id` header + any Set-Cookie
 *
 * Phase II will add: streaming via `streamText().toUIMessageStreamResponse`,
 * tool guards, prompt sanitization, real token reservations/reconciliation.
 *
 * Phase II invariant: `@ai-sdk/*` MUST be imported lazily inside the
 * `CHATBOT_ENABLED === '1'` branch via `await import(...)` — never at the
 * top of this file. A top-level import pulls the SDK into the serverless
 * bundle unconditionally and breaks the "code absence = off" guarantee.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { ipAddress } from '@vercel/functions';
import { z } from 'zod';
import { sql } from '@/lib/db/client';
import { getOrCreateVisitor } from '@/lib/visitor';
import { checkChatRateLimit, opportunisticCleanup } from '@/lib/rate-limit-chat';
import { checkSpendCap, reconcileTokens, reserveTokens } from '@/lib/spend-cap';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_BODY_BYTES = 262_144; // 256KB
const CANNED_REPLY =
  "Hi \u2014 the chatbot is in beta. Leave a note and we'll follow up.";

const messageSchema = z.object({
  role: z.enum(['user', 'assistant', 'system', 'tool']),
  content: z.string().max(4000),
});

const chatBodySchema = z.object({
  messages: z.array(messageSchema).min(1).max(50),
  conversationId: z.string().uuid().optional(),
  url: z.string().url().max(2048).optional(),
  title: z.string().max(256).optional(),
  meta: z.string().max(256).optional(),
});

export async function POST(request: NextRequest) {
  // Fire-and-forget cleanup of expired buckets + stale reservations (~10%).
  void opportunisticCleanup();

  // 1. Body size gate
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: 'payload_too_large', message: 'Request body exceeds 256KB limit.' },
      { status: 413 }
    );
  }

  // 2. Parse JSON safely
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'bad_json', message: 'Request body must be valid JSON.' },
      { status: 400 }
    );
  }

  // 3. Zod validation
  const parsed = chatBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'validation',
        message: parsed.error.issues[0]?.message ?? 'Invalid request body.',
      },
      { status: 400 }
    );
  }

  // Find the last user message — this is what we "respond" to.
  const lastUser = [...parsed.data.messages].reverse().find((m) => m.role === 'user');
  if (!lastUser) {
    return NextResponse.json(
      { error: 'validation', message: 'No user message found.' },
      { status: 400 }
    );
  }

  // 4. Visitor + conversation (HMAC-verified cookie).
  const { visitorId, conversationId, setCookieHeaders } = await getOrCreateVisitor();

  // 5. Rate limits (visitor + IP) + spend cap. Cheap rejects before DB work.
  const ip = ipAddress(request) ?? 'unknown';

  const visitorLimit = await checkChatRateLimit('visitor', visitorId, {
    max: 20,
    windowSec: 600,
  });
  if (!visitorLimit.allowed) {
    return NextResponse.json(
      { error: 'rate_limit', message: 'Too many chats. Try again soon.' },
      {
        status: 429,
        headers: { 'Retry-After': String(visitorLimit.retryAfter ?? 60) },
      }
    );
  }

  const ipLimit = await checkChatRateLimit('ip', ip, { max: 60, windowSec: 600 });
  if (!ipLimit.allowed) {
    return NextResponse.json(
      { error: 'rate_limit', message: 'Too many chats from this network.' },
      {
        status: 429,
        headers: { 'Retry-After': String(ipLimit.retryAfter ?? 60) },
      }
    );
  }

  const cap = await checkSpendCap();
  if (!cap.allowed) {
    return NextResponse.json(
      {
        error: 'capacity',
        message: 'The assistant is at capacity for today. Please try again tomorrow.',
      },
      { status: 429 }
    );
  }

  // 6. Conversation ownership check — no silent fall-through.
  let activeConversationId = conversationId;
  if (parsed.data.conversationId) {
    const owned = (await sql`
      SELECT id FROM conversations
       WHERE id = ${parsed.data.conversationId}
         AND visitor_id = ${visitorId}
    `) as Array<{ id: string }>;
    if (owned.length === 0) {
      return NextResponse.json(
        { error: 'not_found', message: 'Conversation not found.' },
        { status: 404 }
      );
    }
    activeConversationId = owned[0]!.id;
  }

  // 7. Persist page_context on first chat per conversation.
  const pageContext = {
    url: parsed.data.url ?? null,
    title: parsed.data.title ?? null,
    meta: parsed.data.meta ?? null,
  };
  await sql`
    UPDATE conversations
       SET page_context = ${JSON.stringify(pageContext)}::jsonb
     WHERE id = ${activeConversationId} AND page_context IS NULL
  `;

  // 8. Reserve tokens (Phase I: 0 — exercises the reservation code path).
  const reservationId = await reserveTokens(activeConversationId, 0);

  // 9. Persist user + canned assistant message.
  const userId = randomUUID();
  const assistantId = randomUUID();

  await sql`
    INSERT INTO messages (id, conversation_id, role, content)
    VALUES (${userId}, ${activeConversationId}, 'user', ${lastUser.content})
  `;
  await sql`
    INSERT INTO messages (id, conversation_id, role, content)
    VALUES (${assistantId}, ${activeConversationId}, 'assistant', ${CANNED_REPLY})
  `;
  await sql`
    UPDATE conversations SET updated_at = NOW() WHERE id = ${activeConversationId}
  `;

  // 10. Reconcile reservation (Phase I: 0 actual tokens consumed).
  await reconcileTokens(reservationId, 0);

  // 11. Respond.
  const response = NextResponse.json(
    { role: 'assistant', content: CANNED_REPLY },
    { status: 200 }
  );
  response.headers.set('x-conversation-id', activeConversationId);
  for (const cookie of setCookieHeaders) {
    response.headers.append('set-cookie', cookie);
  }
  return response;
}
