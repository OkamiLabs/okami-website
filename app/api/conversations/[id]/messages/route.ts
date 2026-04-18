/**
 * GET /api/conversations/[id]/messages
 *
 * Returns the messages for a conversation, scoped to the visitor cookie.
 * Never mints a new visitor — absent cookie → 401. Missing or
 * cross-visitor conversation → 404.
 *
 * Ported from okami-widget/server/routes/history.ts.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { sql } from '@/lib/db/client';
import { getVerifiedVisitorId } from '@/lib/visitor';

export const runtime = 'nodejs';

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  if (!UUID_RE.test(id)) {
    return NextResponse.json(
      { error: 'validation', field: 'id', message: 'Invalid conversation ID format.' },
      { status: 400 }
    );
  }

  const visitorId = await getVerifiedVisitorId();
  if (!visitorId) {
    return NextResponse.json(
      { error: 'no_session', message: 'No visitor session.' },
      { status: 401 }
    );
  }

  const conv = (await sql`
    SELECT id FROM conversations
     WHERE id = ${id} AND visitor_id = ${visitorId}
  `) as Array<{ id: string }>;

  if (conv.length === 0) {
    return NextResponse.json(
      { error: 'not_found', message: 'Conversation not found.' },
      { status: 404 }
    );
  }

  const messages = (await sql`
    SELECT id, role, content, created_at
      FROM messages
     WHERE conversation_id = ${id}
     ORDER BY created_at ASC
     LIMIT 50
  `) as Array<{ id: string; role: string; content: string; created_at: string }>;

  return NextResponse.json({ messages });
}
