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
 *   4. getOrCreateVisitor() — may mint a new visitor + conversation
 *   5. If `body.conversationId` is supplied, require it to belong to this
 *      visitor — else 404. No silent fall-through to the visitor's latest
 *      conversation (Phase 7 fix, enforced here from day one).
 *   6. Persist page_context on first chat per conversation (Phase 6)
 *   7. INSERT user row, INSERT canned assistant row
 *   8. Respond 200 JSON with `x-conversation-id` header + any Set-Cookie
 *
 * Phase II will add: streaming via `streamText().toUIMessageStreamResponse`,
 * tool guards, prompt sanitization, rate limits, spend-cap reservations.
 *
 * Phase II invariant: `@ai-sdk/*` MUST be imported lazily inside the
 * `CHATBOT_ENABLED === '1'` branch via `await import(...)` — never at the
 * top of this file. A top-level import pulls the SDK into the serverless
 * bundle unconditionally and breaks the "code absence = off" guarantee.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { sql } from '@/lib/db/client';
import { getOrCreateVisitor } from '@/lib/visitor';

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

  // 4. Visitor + conversation
  const { visitorId, conversationId, setCookieHeaders } = await getOrCreateVisitor();

  // 5. Conversation ownership check — no silent fall-through.
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

  // 6. Persist page_context on first chat per conversation.
  // Only writes when page_context IS NULL, preserving the landing context
  // rather than tracking every page the visitor navigates to.
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

  // 7. Persist user + canned assistant message.
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

  // 8. Respond.
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
