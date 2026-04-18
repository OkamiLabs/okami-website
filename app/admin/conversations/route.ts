/**
 * GET /admin/conversations
 *
 * Admin HTML dashboard for widget conversations. Ported from
 * okami-widget/server/admin/conversations.ts.
 *
 * Phase I auth: safe default — reject ALL requests with 401 and a
 * `WWW-Authenticate: Basic` challenge. Phase 3 wires real basic auth in
 * `proxy.ts` (HMAC-hashed password, constant-time compare). The full DB
 * query + HTML render logic is preserved below the auth gate so Phase 3
 * can flip the switch with a one-line change.
 *
 * Phase I hardening: returns explicit `frame-ancestors 'none'`,
 * `X-Robots-Tag: noindex`, `Cache-Control: no-store`, `X-Frame-Options: DENY`
 * headers regardless of status code. These override the site-wide CSP set
 * in next.config.ts.
 */

import { NextResponse } from 'next/server';
import { sql } from '@/lib/db/client';

export const runtime = 'nodejs';

interface ConversationRow {
  id: string;
  visitor_id: string;
  page_url: string | null;
  message_count: string;
  last_activity: string;
  created_at: string;
}

interface MessageRow {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  token_usage: number | null;
  tool_calls: string | null;
  created_at: string;
}

// TODO(csp): next.config.ts headers() wins over route-handler CSP + X-Frame-Options
// for /admin/conversations in Next 16 — verified via curl -I. X-Robots-Tag and
// Cache-Control from this handler DO win (next.config.ts doesn't set those).
// Fix options: (a) carve /admin/* out of next.config.ts headers() with a more
// specific matcher, or (b) set admin headers from proxy.ts on the response.
// Low priority — admin is basic-auth'd + noindex'd; frame-ancestors 'self' from
// the site-wide CSP is still safe here.
const SECURITY_HEADERS: Record<string, string> = {
  'Content-Security-Policy': "default-src 'self'; frame-ancestors 'none'",
  'X-Robots-Tag': 'noindex, nofollow',
  'Cache-Control': 'no-store',
  'X-Frame-Options': 'DENY',
};

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function renderMessage(msg: MessageRow): string {
  const roleClass = msg.role === 'user' ? 'msg-user' : 'msg-assistant';
  const roleLabel = msg.role === 'user' ? 'Visitor' : 'Assistant';
  const toolHtml = msg.tool_calls
    ? `<div class="tool-call">Tool: ${escapeHtml(msg.tool_calls)}</div>`
    : '';
  const tokens = msg.token_usage ? ` <span class="tokens">(${msg.token_usage} tokens)</span>` : '';
  return `
    <div class="message ${roleClass}">
      <span class="role">${roleLabel}</span>${tokens}
      <span class="time">${formatDate(msg.created_at)}</span>
      <div class="content">${escapeHtml(msg.content)}</div>
      ${toolHtml}
    </div>`;
}

function renderPage(
  conversations: ConversationRow[],
  allMessages: Map<string, MessageRow[]>,
  page: number,
  totalPages: number,
): string {
  const rows = conversations
    .map((c) => {
      const msgs = allMessages.get(c.id) ?? [];
      const messagesHtml = msgs.map(renderMessage).join('');
      return `
      <tr>
        <td><code>${escapeHtml(c.visitor_id.slice(0, 8))}...</code></td>
        <td>${c.page_url ? escapeHtml(c.page_url) : '<em>unknown</em>'}</td>
        <td>${c.message_count}</td>
        <td>${formatDate(c.last_activity)}</td>
        <td>${formatDate(c.created_at)}</td>
      </tr>
      <tr>
        <td colspan="5">
          <details>
            <summary>${msgs.length} message${msgs.length === 1 ? '' : 's'}</summary>
            <div class="messages">${messagesHtml || '<em>No messages</em>'}</div>
          </details>
        </td>
      </tr>`;
    })
    .join('');

  const pagination =
    totalPages > 1
      ? `<div class="pagination">
          ${page > 1 ? `<a href="?page=${page - 1}">Previous</a>` : '<span>Previous</span>'}
          <span>Page ${page} of ${totalPages}</span>
          ${page < totalPages ? `<a href="?page=${page + 1}">Next</a>` : '<span>Next</span>'}
        </div>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Widget Admin - Conversations</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f5f5; color: #1a1a1a; padding: 24px; max-width: 1100px; margin: 0 auto; }
    h1 { margin-bottom: 16px; font-size: 1.5rem; }
    table { width: 100%; border-collapse: collapse; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    th, td { padding: 10px 14px; text-align: left; border-bottom: 1px solid #eee; font-size: 0.875rem; }
    th { background: #fafafa; font-weight: 600; }
    code { background: #f0f0f0; padding: 2px 6px; border-radius: 3px; font-size: 0.8rem; }
    details { cursor: pointer; }
    summary { padding: 4px 0; color: #666; font-size: 0.8rem; }
    .messages { padding: 8px 0; }
    .message { padding: 6px 0; border-bottom: 1px solid #f0f0f0; }
    .message:last-child { border-bottom: none; }
    .msg-user .role { color: #2563eb; font-weight: 600; }
    .msg-assistant .role { color: #059669; font-weight: 600; }
    .role { font-size: 0.75rem; text-transform: uppercase; }
    .time { font-size: 0.7rem; color: #999; margin-left: 8px; }
    .tokens { font-size: 0.7rem; color: #999; }
    .content { margin-top: 4px; white-space: pre-wrap; word-break: break-word; line-height: 1.4; }
    .tool-call { margin-top: 4px; padding: 4px 8px; background: #fef3c7; border-radius: 4px; font-size: 0.8rem; font-family: monospace; }
    .pagination { margin-top: 16px; display: flex; justify-content: center; gap: 16px; align-items: center; font-size: 0.875rem; }
    .pagination a { color: #2563eb; text-decoration: none; }
    .pagination a:hover { text-decoration: underline; }
    em { color: #999; }
  </style>
</head>
<body>
  <h1>Conversations</h1>
  <table>
    <thead>
      <tr>
        <th>Visitor</th>
        <th>Page</th>
        <th>Messages</th>
        <th>Last Activity</th>
        <th>Created</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="5"><em>No conversations yet</em></td></tr>'}
    </tbody>
  </table>
  ${pagination}
</body>
</html>`;
}

// Auth is enforced upstream in proxy.ts (HMAC-hashed basic auth, constant-time
// compare). Requests that reach this handler are already authenticated.
async function renderDashboard(request: Request): Promise<NextResponse> {
  const url = new URL(request.url);
  const page = Math.max(1, parseInt(url.searchParams.get('page') ?? '1', 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(url.searchParams.get('limit') ?? '20', 10) || 20));
  const offset = (page - 1) * limit;

  const countRows = (await sql`SELECT COUNT(*)::text AS count FROM conversations`) as Array<{ count: string }>;
  const total = parseInt(countRows[0]?.count ?? '0', 10);
  const totalPages = Math.max(1, Math.ceil(total / limit));

  const convRows = (await sql`
    SELECT
      c.id,
      c.visitor_id,
      c.page_context->>'url' AS page_url,
      COUNT(m.id)::text AS message_count,
      COALESCE(MAX(m.created_at), c.created_at)::text AS last_activity,
      c.created_at::text
    FROM conversations c
    LEFT JOIN messages m ON m.conversation_id = c.id
    GROUP BY c.id
    ORDER BY COALESCE(MAX(m.created_at), c.created_at) DESC
    LIMIT ${limit} OFFSET ${offset}
  `) as ConversationRow[];

  const conversationIds = convRows.map((c) => c.id);
  const messagesMap = new Map<string, MessageRow[]>();

  if (conversationIds.length > 0) {
    const msgRows = (await sql`
      SELECT id, conversation_id, role, content, token_usage, tool_calls::text, created_at::text
        FROM messages
       WHERE conversation_id = ANY(${conversationIds}::uuid[])
       ORDER BY created_at ASC
    `) as MessageRow[];
    for (const msg of msgRows) {
      const existing = messagesMap.get(msg.conversation_id);
      if (existing) existing.push(msg);
      else messagesMap.set(msg.conversation_id, [msg]);
    }
  }

  const html = renderPage(convRows, messagesMap, page, totalPages);
  return new NextResponse(html, {
    status: 200,
    headers: {
      ...SECURITY_HEADERS,
      'Content-Type': 'text/html; charset=utf-8',
    },
  });
}

export async function GET(request: Request) {
  return renderDashboard(request);
}

