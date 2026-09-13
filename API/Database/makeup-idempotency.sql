-- Apply once on environments that already contain makeup_bookings.
-- The nullable unique index permits normal requests without a key while
-- making retries for keyed mutations deterministic per tenant.
ALTER TABLE makeup_bookings
    ADD COLUMN idempotency_key VARCHAR(255) NULL;

CREATE UNIQUE INDEX uq_makeup_booking_idempotency
    ON makeup_bookings (institute_id, idempotency_key);
