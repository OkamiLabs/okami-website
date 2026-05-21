/**
 * POST /api/chat
 *
 * Widget chat endpoint. When CHATBOT_ENABLED=1 this handler streams a live
 * Claude response via lazy-imported @ai-sdk/anthropic. When disabled it
 * returns a canned assistant reply so the route is always functional.
 *
 * Pipeline:
 *   1. Body size gate (content-length > 256KB → 413)
 *   2. Safe JSON parse (→ 400)
 *   3. Zod validation (v5 UIMessage format: id, role, parts[])
 *   4. getOrCreateVisitor() — HMAC-verified, may mint a new visitor
 *   5. Visitor + IP rate-limit + spend-cap gate (cheap rejects before DB work)
 *   6. If body.conversationId is supplied, require ownership → else 404
 *   7. Persist page_context on first chat per conversation
 *   8. reserveTokens(2000) — reconciled to actual in onFinish / onAbort
 *   9. INSERT user message row (both paths)
 *  10a. CHATBOT_ENABLED=1: lazy-import SDK, call Claude, stream response
 *  10b. CHATBOT_ENABLED=0: insert canned reply, return JSON 200
 *
 * Phase II invariant: @ai-sdk/* MUST be imported lazily inside the
 * CHATBOT_ENABLED === '1' branch — never at the top of this file.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { ipAddress } from '@vercel/functions';
import { z } from 'zod';
import { type UIMessage } from 'ai';
import { sql } from '@/lib/db/client';
import { getOrCreateVisitor } from '@/lib/visitor';
import { checkChatRateLimit, opportunisticCleanup } from '@/lib/rate-limit-chat';
import { checkSpendCap, reconcileTokens, reserveTokens } from '@/lib/spend-cap';
import { getTools } from '@/lib/ai/tools';
import { getSystemPrompt } from '@/lib/ai/system-prompt';

export const runtime = 'nodejs';
export const maxDuration = 60;

const MAX_BODY_BYTES = 262_144; // 256KB

const uiMessagePartSchema = z.object({
  type: z.string(),
  text: z.string().max(4000).optional(),
}).passthrough();

const uiMessageSchema = z.object({
  id: z.string(),
  role: z.enum(['user', 'assistant', 'system']),
  parts: z.array(uiMessagePartSchema).min(1),
  metadata: z.unknown().optional(),
});

const chatBodySchema = z.object({
  messages: z.array(uiMessageSchema).min(1).max(50),
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

  // Extract text content from v5 UIMessage parts
  const lastUserText = lastUser.parts
    .filter((p) => p.type === 'text')
    .map((p) => (p as { type: 'text'; text: string }).text)
    .join('') ?? '';

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

  // 8. Reserve tokens (2000 estimated — reconciled to actual in onFinish/onAbort).
  const reservationId = await reserveTokens(activeConversationId, 2000);

  // 9. Persist user message (both paths need this before streaming starts).
  await sql`
    INSERT INTO messages (id, conversation_id, role, content)
    VALUES (${randomUUID()}, ${activeConversationId}, 'user', ${lastUserText})
  `;

  // 10. Live streaming path (CHATBOT_ENABLED=1).
  if (process.env.CHATBOT_ENABLED === '1') {
    // Lazy import — NEVER at top of file per D-08 / Phase II invariant.
    const { anthropic } = await import('@ai-sdk/anthropic');
    const { streamText, convertToModelMessages } = await import('ai');

    const systemPrompt = getSystemPrompt({
      url: parsed.data.url ?? '',
      title: parsed.data.title ?? '',
      meta: parsed.data.meta,
    });

    const result = streamText({
      model: anthropic(process.env.AI_MODEL ?? 'claude-haiku-4-5'),
      system: systemPrompt,
      messages: convertToModelMessages(parsed.data.messages as UIMessage[]),
      tools: getTools(visitorId, activeConversationId),
      maxOutputTokens: 1000,
      abortSignal: request.signal,
      onFinish: async ({ text, totalUsage }) => {
        const actual =
          (totalUsage.inputTokens ?? 0) + (totalUsage.outputTokens ?? 0);
        await reconcileTokens(reservationId, actual);
        await sql`
          INSERT INTO messages (id, conversation_id, role, content, token_usage)
          VALUES (
            ${randomUUID()},
            ${activeConversationId},
            'assistant',
            ${text},
            ${actual}
          )
        `;
        await sql`
          UPDATE conversations SET updated_at = NOW() WHERE id = ${activeConversationId}
        `;
      },
      onAbort: async () => {
        // D-05: free the reservation without charging — no assistant row written.
        await reconcileTokens(reservationId, 0);
      },
    });

    // Build response with cookies + conversation ID header.
    const streamResponse = result.toUIMessageStreamResponse();
    const finalResponse = new Response(streamResponse.body, {
      status: streamResponse.status,
      headers: {
        ...Object.fromEntries(streamResponse.headers.entries()),
        'x-conversation-id': activeConversationId,
      },
    });
    for (const cookie of setCookieHeaders) {
      finalResponse.headers.append('set-cookie', cookie);
    }
    return finalResponse;
  }

  // Fallback: canned reply when CHATBOT_ENABLED !== '1'.
  // Keep this path functional — production stays on 0 through Phase 7.
  const CANNED_REPLY =
    "Hi — the chatbot is in beta. Leave a note and we'll follow up.";
  await sql`
    INSERT INTO messages (id, conversation_id, role, content, token_usage)
    VALUES (${randomUUID()}, ${activeConversationId}, 'assistant', ${CANNED_REPLY}, ${0})
  `;
  await sql`
    UPDATE conversations SET updated_at = NOW() WHERE id = ${activeConversationId}
  `;
  await reconcileTokens(reservationId, 0);

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
