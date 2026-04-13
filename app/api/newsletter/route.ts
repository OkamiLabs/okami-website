import { NextRequest, NextResponse } from 'next/server';

/**
 * Newsletter subscription via Beehiiv — "The Silent Brief"
 *
 * Required env vars for Beehiiv:
 *   BEEHIIV_API_KEY        — API key from Beehiiv dashboard (Settings → Integrations)
 *   BEEHIIV_PUBLICATION_ID — Publication ID (visible in Beehiiv dashboard URL or API settings)
 *
 * If Beehiiv env vars are not set, falls back to collecting emails
 * in /tmp/newsletter-subscribers.json (works on Vercel for dev/preview).
 */

const BEEHIIV_API_KEY = process.env.BEEHIIV_API_KEY || '';
const BEEHIIV_PUBLICATION_ID = process.env.BEEHIIV_PUBLICATION_ID || '';

/* ── Rate limiting (in-memory, per serverless instance) ────────────── */
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 5; // max 5 per IP per minute
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count++;
  return entry.count > RATE_LIMIT_MAX_REQUESTS;
}

/* ── Email validation ──────────────────────────────────────────────── */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function isValidEmail(email: unknown): email is string {
  return typeof email === 'string' && email.length <= 254 && EMAIL_REGEX.test(email);
}

async function subscribeViaBeehiiv(email: string): Promise<{ ok: boolean; message: string }> {
  const url = `https://api.beehiiv.com/v2/publications/${BEEHIIV_PUBLICATION_ID}/subscriptions`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${BEEHIIV_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      reactivate_existing: true,
      send_welcome_email: true,
      utm_source: 'okamilabs.com',
      utm_medium: 'website',
    }),
  });

  if (res.status === 200 || res.status === 201) {
    return { ok: true, message: 'Welcome to The Silent Brief. Check your inbox.' };
  }

  if (res.status === 409) {
    return { ok: true, message: "You're already subscribed to The Silent Brief." };
  }

  const data = await res.json().catch(() => ({}));
  console.error('Beehiiv API error:', res.status, data);
  return { ok: false, message: 'Subscription failed. Please try again later.' };
}

async function subscribeViaFallback(email: string): Promise<{ ok: boolean; message: string }> {
  const fs = await import('fs/promises');
  const path = '/tmp/newsletter-subscribers.json';

  let subscribers: string[] = [];
  try {
    const existing = await fs.readFile(path, 'utf-8');
    subscribers = JSON.parse(existing);
  } catch {
    // File doesn't exist yet
  }

  if (subscribers.includes(email)) {
    return { ok: true, message: "You're already subscribed." };
  }

  subscribers.push(email);
  await fs.writeFile(path, JSON.stringify(subscribers, null, 2));

  return { ok: true, message: 'Welcome to The Silent Brief.' };
}

export async function POST(request: NextRequest) {
  try {
    // Rate limiting by IP
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { message: 'Too many requests. Please try again in a minute.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    const email = body?.email;

    if (!isValidEmail(email)) {
      return NextResponse.json(
        { message: 'Please provide a valid email address.' },
        { status: 400 }
      );
    }

    const useBeehiiv = BEEHIIV_API_KEY && BEEHIIV_PUBLICATION_ID;
    const result = useBeehiiv
      ? await subscribeViaBeehiiv(email)
      : await subscribeViaFallback(email);

    if (result.ok) {
      return NextResponse.json({ message: result.message }, { status: 200 });
    }

    return NextResponse.json({ message: result.message }, { status: 500 });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
