/**
 * proxy.ts — Next.js 16 request interceptor (renamed from middleware.ts).
 *
 * Order of checks:
 *   1. EU geo-block (all paths, 451)
 *   2. Widget kill-switch (WIDGET_DISABLED=1)
 *   3. Admin basic auth (/admin/*)
 *   4. Origin allowlist for widget APIs (production only)
 *
 * CSP / HSTS / X-Frame-Options etc. stay in next.config.ts — do NOT set them here.
 *
 * Runtime note: Next 16 defaults proxy.ts to Node.js. Do NOT export `runtime` —
 * it throws. Web Crypto (`crypto.subtle`) is available in Node runtime.
 */

import { NextResponse, type NextRequest } from 'next/server';
import { geolocation } from '@vercel/functions';
import { verifyAdminBasicAuth } from '@/lib/admin-auth';

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};

// UK deliberately excluded — keeping UK visitors.
const EU = new Set([
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR', 'DE', 'GR',
  'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL', 'PL', 'PT', 'RO', 'SK',
  'SI', 'ES', 'SE', 'IS', 'LI', 'NO',
]);

const WIDGET_API_PREFIXES = ['/api/chat', '/api/conversations', '/api/widget-errors'];
const WIDGET_HEALTH = '/api/widget-health';

function isWidgetApi(pathname: string): boolean {
  return WIDGET_API_PREFIXES.some((p) => pathname.startsWith(p));
}

function safeParseOrigin(referer: string | null): string | null {
  if (!referer) return null;
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}


export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. EU geo-block (all paths).
  const { country } = geolocation(request);
  if (country && EU.has(country)) {
    return new Response('Okami is not currently available in your region.', { status: 451 });
  }

  // 2. Widget kill-switch.
  if (process.env.WIDGET_DISABLED === '1') {
    if (pathname === '/widget.js') {
      return new Response("console.warn('[okami-widget] disabled');", {
        status: 200,
        headers: {
          'Content-Type': 'application/javascript',
          'Cache-Control': 'no-store',
        },
      });
    }
    // /api/widget-health always bypasses kill-switch.
    if (pathname !== WIDGET_HEALTH && isWidgetApi(pathname)) {
      return new Response(JSON.stringify({ error: 'Widget disabled' }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // 3. Admin basic auth.
  if (pathname.startsWith('/admin')) {
    const ok = await verifyAdminBasicAuth(request);
    if (!ok) {
      return new Response('Authentication required', {
        status: 401,
        headers: { 'WWW-Authenticate': 'Basic realm="admin", charset="UTF-8"' },
      });
    }
  }

  // 4. Origin allowlist for widget APIs — production only.
  if (isWidgetApi(pathname) && pathname !== WIDGET_HEALTH) {
    if (process.env.VERCEL_ENV === 'production') {
      const origin = request.headers.get('origin');
      const referer = request.headers.get('referer');
      const src = origin ?? safeParseOrigin(referer);
      const allowed = (process.env.ALLOWED_ORIGINS ?? '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      if (!src || !allowed.includes(src)) {
        return new Response(JSON.stringify({ error: 'Forbidden origin' }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    }
  }

  return NextResponse.next();
}
