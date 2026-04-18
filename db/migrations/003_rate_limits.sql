-- Up Migration

CREATE TABLE rate_limit_buckets (
  bucket_key   TEXT PRIMARY KEY,
  count        INTEGER NOT NULL DEFAULT 0,
  window_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at   TIMESTAMPTZ NOT NULL
);
CREATE INDEX idx_rate_limit_buckets_expires_at ON rate_limit_buckets(expires_at);

CREATE TABLE token_reservations (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  reserved        INTEGER NOT NULL,
  reserved_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reconciled      BOOLEAN NOT NULL DEFAULT FALSE
);
CREATE INDEX idx_token_reservations_reserved_at ON token_reservations(reserved_at);

-- Down Migration

DROP TABLE IF EXISTS token_reservations;
DROP TABLE IF EXISTS rate_limit_buckets;
