/**
 * Daily token spend cap for the widget chatbot.
 *
 * Counts today's `messages.token_usage` PLUS currently-held
 * `token_reservations.reserved` (unreconciled) against
 * `DAILY_TOKEN_BUDGET`. The reservation pattern closes the TOCTOU gap
 * between "check cap" and "actually consume tokens" that a pure
 * post-hoc counter leaves open under concurrent load.
 *
 * Phase I note: the chat route reserves 0 tokens (no LLM yet) purely to
 * exercise the code path; reconciliation is a no-op of 0 → 0.
 */

import { sql } from '@/lib/db/client';

const DEFAULT_BUDGET = 100_000;

export async function reserveTokens(conversationId: string, estimated: number): Promise<string> {
  const rows = (await sql`
    INSERT INTO token_reservations (conversation_id, reserved)
    VALUES (${conversationId}, ${estimated})
    RETURNING id
  `) as Array<{ id: string }>;
  return rows[0]!.id;
}

export async function reconcileTokens(reservationId: string, actual: number): Promise<void> {
  await sql`
    UPDATE token_reservations
       SET reserved = ${actual}, reconciled = TRUE
     WHERE id = ${reservationId}
  `;
}

export async function checkSpendCap(): Promise<{ allowed: boolean; today: number; budget: number }> {
  const budget = parseInt(process.env.DAILY_TOKEN_BUDGET ?? String(DEFAULT_BUDGET), 10);

  const [usage] = (await sql`
    SELECT
      COALESCE((SELECT SUM(token_usage) FROM messages
                 WHERE created_at::date = CURRENT_DATE), 0)::int
      + COALESCE((SELECT SUM(reserved) FROM token_reservations
                   WHERE NOT reconciled), 0)::int
      AS today
  `) as Array<{ today: number }>;

  return {
    allowed: (usage?.today ?? 0) < budget,
    today: usage?.today ?? 0,
    budget,
  };
}
