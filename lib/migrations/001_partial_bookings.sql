-- Partial booking tracking: captures emails and intent from users who
-- start but don't complete the booking flow. Analytics only, no follow-ups.

CREATE TABLE partial_bookings (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  email       text NOT NULL,
  service_id  text NOT NULL CHECK (service_id IN ('review', 'discovery')),
  slot_iso    text,
  step        text NOT NULL CHECK (step IN ('booking', 'intake', 'payment')),
  intake      jsonb DEFAULT '{}'::jsonb,
  converted   boolean DEFAULT false,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX idx_partial_bookings_dedup
  ON partial_bookings (email, service_id, COALESCE(slot_iso, '__no_slot__'));

CREATE INDEX idx_partial_bookings_unconverted
  ON partial_bookings (created_at DESC) WHERE converted = false;

-- Upsert function: advances step (never regresses), merges intake JSONB,
-- latches converted to true once set.
CREATE OR REPLACE FUNCTION upsert_partial_booking(
  p_email text,
  p_service_id text,
  p_slot_iso text,
  p_step text,
  p_step_order int,
  p_intake jsonb,
  p_converted boolean
) RETURNS void AS $$
BEGIN
  INSERT INTO partial_bookings (email, service_id, slot_iso, step, intake, converted, updated_at)
  VALUES (p_email, p_service_id, p_slot_iso, p_step, p_intake, p_converted, now())
  ON CONFLICT (email, service_id, COALESCE(slot_iso, '__no_slot__'))
  DO UPDATE SET
    step = CASE
      WHEN (CASE partial_bookings.step
              WHEN 'booking' THEN 0
              WHEN 'intake' THEN 1
              WHEN 'payment' THEN 2
              ELSE 0
            END) < p_step_order
      THEN p_step
      ELSE partial_bookings.step
    END,
    intake = partial_bookings.intake || p_intake,
    converted = partial_bookings.converted OR p_converted,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;
