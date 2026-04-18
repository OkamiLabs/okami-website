/**
 * Daily token spend cap for the widget chatbot.
 *
 * DB-backed counter: sums today's `messages.token_usage` against
 * `DAILY_TOKEN_BUDGET`. Ported from okami-widget/server/lib/spend-cap.ts
 * to Neon's tagged-template HTTP driver.
 *
 * NOTE: TOCTOU hardening + token reservations arrive in Phase 8. This
 * module is not imported in Phase I.
 */

import { sql } from '@/lib/db/client';

const DEFAULT_DAILY_BUDGET = 100_000;

export async function checkSpendCap(): Promise<{ allowed: boolean; remaining: number }> {
  const budget = parseInt(process.env.DAILY_TOKEN_BUDGET ?? '', 10) || DEFAULT_DAILY_BUDGET;

  const rows = await sql`
    SELECT COALESCE(SUM(token_usage), 0)::text AS total
      FROM messages
     WHERE created_at >= CURRENT_DATE
  `;

  const used = parseInt((rows[0] as { total: string } | undefined)?.total ?? '0', 10);
  const remaining = Math.max(0, budget - used);

  return {
    allowed: used < budget,
    remaining,
  };
}
