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
 *   3. Shallow shape check on `messages` (full Zod lands in Phase 6)
 *   4. getOrCreateVisitor() — may mint a new visitor + conversation
 *   5. If `body.conversationId` is supplied, require it to belong to this
 *      visitor — else 404. No silent fall-through to the visitor's latest
 *      conversation (Phase 7 fix, enforced here from day one).
 *   6. INSERT user row, INSERT canned assistant row
 *   7. Respond 200 JSON with `x-conversation-id` header + any Set-Cookie
 *
 * Phase II will add: streaming via `streamText().toUIMessageStreamResponse`,
 * tool guards, prompt sanitization, rate limits, spend-cap reservations.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { sql } from '@/lib/db/client';
import { getOrCreateVisitor } from '@/lib/visitor';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_BODY_BYTES = 262_144; // 256KB
const CANNED_REPLY =
  "Hi \u2014 the chatbot is in beta. Leave a note and we'll follow up.";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
}

interface ChatBody {
  messages: ChatMessage[];
  conversationId?: string;
}

function validateBody(raw: unknown): { ok: true; data: ChatBody } | { ok: false; message: string; field?: string } {
  if (!raw || typeof raw !== 'object') {
    return { ok: false, message: 'Invalid request body.' };
  }
  const b = raw as Record<string, unknown>;

  if (!Array.isArray(b.messages) || b.messages.length === 0) {
    return { ok: false, field: 'messages', message: 'messages must be a non-empty array.' };
  }

  const messages: ChatMessage[] = [];
  for (const m of b.messages) {
    if (!m || typeof m !== 'object') {
      return { ok: false, field: 'messages', message: 'Each message must be an object.' };
    }
    const mm = m as Record<string, unknown>;
    if (mm.role !== 'user' && mm.role !== 'assistant' && mm.role !== 'system' && mm.role !== 'tool') {
      return { ok: false, field: 'messages.role', message: 'Invalid role.' };
    }
    if (typeof mm.content !== 'string') {
      return { ok: false, field: 'messages.content', message: 'content must be a string.' };
    }
    messages.push({ role: mm.role, content: mm.content });
  }

  let conversationId: string | undefined;
  if (b.conversationId !== undefined && b.conversationId !== null) {
    if (typeof b.conversationId !== 'string' || !UUID_RE.test(b.conversationId)) {
      return { ok: false, field: 'conversationId', message: 'Invalid conversationId.' };
    }
    conversationId = b.conversationId;
  }

  return { ok: true, data: { messages, conversationId } };
}

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

  // 3. Shape check
  const parsed = validateBody(raw);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: 'validation', field: parsed.field, message: parsed.message },
      { status: 400 }
    );
  }

  // Find the last user message — this is what we "respond" to.
  const lastUser = [...parsed.data.messages].reverse().find((m) => m.role === 'user');
  if (!lastUser) {
    return NextResponse.json(
      { error: 'validation', field: 'messages', message: 'No user message found.' },
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

  // 6. Persist user + canned assistant message.
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

  // 7. Respond.
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
