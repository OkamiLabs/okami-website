/**
 * Neon serverless Postgres client for the widget backend.
 *
 * Uses the Neon HTTP driver (`@neondatabase/serverless`). Tagged-template
 * SQL is automatically parameterized. For multi-statement transactions,
 * use `sql.transaction([sql\`...\`, sql\`...\`])` — the HTTP driver does
 * NOT support interactive BEGIN/COMMIT.
 *
 * The driver does not auto-detect pooler vs direct URLs; the caller
 * (Vercel env / local .env.local) picks which to use. Runtime uses the
 * pooled URL (`-pooler.neon.tech`); migrations use `DATABASE_URL_UNPOOLED`.
 *
 * Fails fast at import time if `DATABASE_URL` is missing — no `process.exit`,
 * just throws so Next's dev overlay surfaces it.
 */

import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL missing');
}

export const sql = neon(process.env.DATABASE_URL);
