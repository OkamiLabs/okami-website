import { NextRequest, NextResponse } from 'next/server';
import { isRateLimited, getClientIp } from '@/lib/rate-limit';

/**
 * Newsletter subscription via Beehiiv — "The Silent Brief"
 *
 * Required env vars:
 *   BEEHIIV_API_KEY        — API key from Beehiiv dashboard (Settings → Integrations)
 *   BEEHIIV_PUBLICATION_ID — Publication ID (visible in Beehiiv dashboard URL or API settings)
 */

const BEEHIIV_API_KEY = process.env.BEEHIIV_API_KEY || '';
const BEEHIIV_PUBLICATION_ID = process.env.BEEHIIV_PUBLICATION_ID || '';

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
      send_welcome_email: false,
      utm_source: 'okamilabs.com',
      utm_medium: 'website',
    }),
  });

  if (res.status === 200 || res.status === 201) {
    return { ok: true, message: 'Check your inbox for The Operator\'s Blueprint.' };
  }

  if (res.status === 409) {
    return { ok: true, message: "You're already subscribed to The Silent Brief." };
  }

  const data = await res.json().catch(() => ({}));
  console.error('Beehiiv API error:', res.status, data);
  return { ok: false, message: 'Subscription failed. Please try again later.' };
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    if (isRateLimited(ip, { max: 5, windowMs: 60 * 1000 })) {
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

    if (!BEEHIIV_API_KEY || !BEEHIIV_PUBLICATION_ID) {
      console.warn('[newsletter] Beehiiv not configured — subscriber email discarded:', email);
      return NextResponse.json(
        { message: 'Newsletter is not available right now. Please try again later.' },
        { status: 503 }
      );
    }

    const result = await subscribeViaBeehiiv(email);

    if (result.ok) {
      return NextResponse.json({ message: result.message }, { status: 200 });
    }

    return NextResponse.json({ message: result.message }, { status: 500 });
  } catch (error) {
    console.error('Newsletter subscription error:', error);
    return NextResponse.json(
      { message: 'Something went wrong. Please try again.' },
      { status: 500 },
    );
  }
}
